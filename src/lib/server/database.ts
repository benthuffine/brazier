import "server-only";

import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { initialState } from "@/lib/data";
import { hashPassword } from "@/lib/server/auth-crypto";
import { demoUsers } from "@/lib/server/demo-users";
import { AppNotification, Pathway, Visa } from "@/lib/types";

const STORAGE_DIR = path.join(process.cwd(), "storage");
const DATABASE_PATH = path.join(STORAGE_DIR, "migrately.sqlite");

let database: Database.Database | null = null;

export function serialize(value: unknown) {
  return JSON.stringify(value);
}

export function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function tableHasColumn(connection: Database.Database, tableName: string, columnName: string) {
  const columns = connection
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  return columns.some((column) => column.name === columnName);
}

function dropLegacyTables(connection: Database.Database) {
  const hasLegacyPathways =
    connection
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pathways'"
      )
      .get() && !tableHasColumn(connection, "pathways", "user_id");

  const hasLegacyNotifications =
    connection
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'notifications'"
      )
      .get() && !tableHasColumn(connection, "notifications", "user_id");

  if (hasLegacyPathways) {
    connection.prepare("DROP TABLE pathways").run();
  }

  if (hasLegacyNotifications) {
    connection.prepare("DROP TABLE notifications").run();
  }
}

function writeCatalog(connection: Database.Database) {
  const insertCountry = connection.prepare(
    `
      INSERT INTO countries (code, sort_order, value)
      VALUES (?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        sort_order = excluded.sort_order,
        value = excluded.value
    `
  );
  const insertVisa = connection.prepare(
    `
      INSERT INTO visas (id, sort_order, value)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        sort_order = excluded.sort_order,
        value = excluded.value
    `
  );

  initialState.countries.forEach((country, index) => {
    insertCountry.run(country.code, index, serialize(country));
  });

  initialState.visas.forEach((visa, index) => {
    insertVisa.run(visa.id, index, serialize(visa));
  });
}

function writePathway(
  connection: Database.Database,
  userId: string,
  pathway: Pathway
) {
  connection
    .prepare(
      `
        INSERT INTO pathways (id, user_id, visa_id, started_at, value)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          visa_id = excluded.visa_id,
          started_at = excluded.started_at,
          value = excluded.value
      `
    )
    .run(pathway.id, userId, pathway.visaId, pathway.startedAt, serialize(pathway));
}

function writeNotification(
  connection: Database.Database,
  userId: string,
  notification: AppNotification
) {
  connection
    .prepare(
      `
        INSERT INTO notifications (id, user_id, created_at, is_read, value)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          created_at = excluded.created_at,
          is_read = excluded.is_read,
          value = excluded.value
      `
    )
    .run(
      notification.id,
      userId,
      notification.createdAt,
      notification.read ? 1 : 0,
      serialize(notification)
    );
}

function seedUsers(connection: Database.Database) {
  const insertUser = connection.prepare(
    `
      INSERT OR IGNORE INTO users (
        id,
        email,
        password_hash,
        role,
        tier,
        seed_key,
        profile_json,
        is_active,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `
  );

  demoUsers.forEach((user) => {
    const result = insertUser.run(
      user.id,
      user.email.toLowerCase(),
      hashPassword(user.password),
      user.role,
      user.tier,
      user.seedKey,
      serialize(user.profile),
      new Date().toISOString()
    );

    if (result.changes > 0) {
      user.pathways.forEach((pathway) => writePathway(connection, user.id, pathway));
      user.notifications.forEach((notification) =>
        writeNotification(connection, user.id, notification)
      );
    }
  });
}

function initializeDatabase(connection: Database.Database) {
  connection.pragma("journal_mode = WAL");
  connection.pragma("foreign_keys = ON");
  dropLegacyTables(connection);

  connection.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visas (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      tier TEXT NOT NULL,
      seed_key TEXT,
      profile_json TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pathways (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      visa_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      value TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      value TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  const countryCount = connection
    .prepare("SELECT COUNT(*) AS count FROM countries")
    .get() as { count: number };
  const visaCount = connection
    .prepare("SELECT COUNT(*) AS count FROM visas")
    .get() as { count: number };

  if (countryCount.count === 0 || visaCount.count === 0) {
    writeCatalog(connection);
  }

  seedUsers(connection);
}

export function getDatabase() {
  if (database) {
    return database;
  }

  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  const connection = new Database(DATABASE_PATH);
  initializeDatabase(connection);
  database = connection;

  return connection;
}

export function readCatalog(connection: Database.Database) {
  const countries = (
    connection
      .prepare("SELECT value FROM countries ORDER BY sort_order ASC")
      .all() as Array<{ value: string }>
  ).map((row) => parseJson<typeof initialState.countries[number]>(row.value));

  const visas = (
    connection
      .prepare("SELECT value FROM visas ORDER BY sort_order ASC")
      .all() as Array<{ value: string }>
  ).map((row) => parseJson<Visa>(row.value));

  return { countries, visas };
}
