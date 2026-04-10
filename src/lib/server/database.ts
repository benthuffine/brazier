import "server-only";

import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { Pool, type PoolClient } from "pg";

import { initialState } from "@/lib/data";
import { hashPassword } from "@/lib/server/auth-crypto";
import { demoUsers } from "@/lib/server/demo-users";
import { AppNotification, Pathway, Visa } from "@/lib/types";
import { normalizeVisa } from "@/lib/visa-source";

const DEFAULT_SQLITE_DATABASE_PATH = path.join("storage", "migrately.sqlite");

type DatabaseProvider = "sqlite" | "postgres";
type QueryValue = string | number | null;

interface RunResult {
  changes: number;
}

export interface DatabaseClient {
  readonly dialect: DatabaseProvider;
  one<T>(sql: string, params?: QueryValue[]): Promise<T | undefined>;
  many<T>(sql: string, params?: QueryValue[]): Promise<T[]>;
  run(sql: string, params?: QueryValue[]): Promise<RunResult>;
  exec(sql: string): Promise<void>;
  transaction<T>(callback: (connection: DatabaseClient) => Promise<T>): Promise<T>;
}

let databasePromise: Promise<DatabaseClient> | null = null;

export function serialize(value: unknown) {
  return JSON.stringify(value);
}

export function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

class SqliteConnection implements DatabaseClient {
  readonly dialect = "sqlite" as const;

  constructor(private readonly connection: Database.Database) {}

  async one<T>(sql: string, params: QueryValue[] = []) {
    return this.connection.prepare(sql).get(...params) as T | undefined;
  }

  async many<T>(sql: string, params: QueryValue[] = []) {
    return this.connection.prepare(sql).all(...params) as T[];
  }

  async run(sql: string, params: QueryValue[] = []) {
    const result = this.connection.prepare(sql).run(...params);

    return { changes: result.changes };
  }

  async exec(sql: string) {
    this.connection.exec(sql);
  }

  async transaction<T>(callback: (connection: DatabaseClient) => Promise<T>) {
    this.connection.exec("BEGIN IMMEDIATE");

    try {
      const result = await callback(this);
      this.connection.exec("COMMIT");
      return result;
    } catch (error) {
      this.connection.exec("ROLLBACK");
      throw error;
    }
  }
}

class PostgresConnection implements DatabaseClient {
  readonly dialect = "postgres" as const;

  constructor(
    private readonly pool: Pool,
    private readonly executor: Pool | PoolClient = pool
  ) {}

  async one<T>(sql: string, params: QueryValue[] = []) {
    const result = await this.executor.query(toPostgresSql(sql), params);
    return result.rows[0] as T | undefined;
  }

  async many<T>(sql: string, params: QueryValue[] = []) {
    const result = await this.executor.query(toPostgresSql(sql), params);
    return result.rows as T[];
  }

  async run(sql: string, params: QueryValue[] = []) {
    const result = await this.executor.query(toPostgresSql(sql), params);

    return { changes: result.rowCount ?? 0 };
  }

  async exec(sql: string) {
    await this.executor.query(sql);
  }

  async transaction<T>(callback: (connection: DatabaseClient) => Promise<T>) {
    const client = await this.pool.connect();
    const transaction = new PostgresConnection(this.pool, client);

    try {
      await client.query("BEGIN");
      const result = await callback(transaction);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

function toPostgresSql(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function getDatabaseProvider(): DatabaseProvider {
  const provider = process.env.DATABASE_PROVIDER?.trim().toLowerCase();

  if (!provider) {
    return process.env.DATABASE_URL ? "postgres" : "sqlite";
  }

  if (provider === "sqlite" || provider === "postgres") {
    return provider;
  }

  throw new Error(
    `Unsupported DATABASE_PROVIDER "${process.env.DATABASE_PROVIDER}". Expected "sqlite" or "postgres".`
  );
}

function getSqliteDatabasePath() {
  const configuredPath = process.env.SQLITE_DATABASE_PATH?.trim() || DEFAULT_SQLITE_DATABASE_PATH;

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(process.cwd(), configuredPath);
}

function getPostgresSslConfig() {
  const ssl = process.env.DATABASE_SSL?.trim().toLowerCase();

  if (!ssl) {
    return undefined;
  }

  if (ssl === "false" || ssl === "disable") {
    return false;
  }

  return { rejectUnauthorized: false };
}

async function tableHasColumn(
  connection: DatabaseClient,
  tableName: string,
  columnName: string
) {
  if (connection.dialect !== "sqlite") {
    return true;
  }

  const columns = await connection.many<{ name: string }>(
    `PRAGMA table_info(${tableName})`
  );

  return columns.some((column) => column.name === columnName);
}

async function dropLegacyTables(connection: DatabaseClient) {
  if (connection.dialect !== "sqlite") {
    return;
  }

  const legacyPathways = await connection.one<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pathways'"
  );
  const legacyNotifications = await connection.one<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'notifications'"
  );

  if (legacyPathways && !(await tableHasColumn(connection, "pathways", "user_id"))) {
    await connection.run("DROP TABLE pathways");
  }

  if (
    legacyNotifications &&
    !(await tableHasColumn(connection, "notifications", "user_id"))
  ) {
    await connection.run("DROP TABLE notifications");
  }
}

async function writeCatalog(connection: DatabaseClient) {
  const insertCountry = `
    INSERT INTO countries (code, sort_order, value)
    VALUES (?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET
      sort_order = excluded.sort_order,
      value = excluded.value
  `;
  const insertVisa = `
    INSERT INTO visas (id, sort_order, value)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sort_order = excluded.sort_order,
      value = excluded.value
  `;

  for (const [index, country] of initialState.countries.entries()) {
    await connection.run(insertCountry, [country.code, index, serialize(country)]);
  }

  for (const [index, visa] of initialState.visas.entries()) {
    await connection.run(insertVisa, [visa.id, index, serialize(normalizeVisa(visa))]);
  }
}

async function migrateCatalog(connection: DatabaseClient) {
  const visaRows = await connection.many<{ id: string; value: string }>(
    "SELECT id, value FROM visas"
  );

  for (const row of visaRows) {
    const nextValue = serialize(normalizeVisa(parseJson<Visa>(row.value)));

    if (nextValue !== row.value) {
      await connection.run("UPDATE visas SET value = ? WHERE id = ?", [
        nextValue,
        row.id,
      ]);
    }
  }
}

async function writePathway(
  connection: DatabaseClient,
  userId: string,
  pathway: Pathway
) {
  await connection.run(
    `
      INSERT INTO pathways (id, user_id, visa_id, started_at, value)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        visa_id = excluded.visa_id,
        started_at = excluded.started_at,
        value = excluded.value
    `,
    [pathway.id, userId, pathway.visaId, pathway.startedAt, serialize(pathway)]
  );
}

async function writeNotification(
  connection: DatabaseClient,
  userId: string,
  notification: AppNotification
) {
  await connection.run(
    `
      INSERT INTO notifications (id, user_id, created_at, is_read, value)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        created_at = excluded.created_at,
        is_read = excluded.is_read,
        value = excluded.value
    `,
    [
      notification.id,
      userId,
      notification.createdAt,
      notification.read ? 1 : 0,
      serialize(notification),
    ]
  );
}

async function seedUsers(connection: DatabaseClient) {
  const insertUser =
    connection.dialect === "sqlite"
      ? `
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
      : `
          INSERT INTO users (
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
          ON CONFLICT(id) DO NOTHING
        `;

  for (const user of demoUsers) {
    const result = await connection.run(insertUser, [
      user.id,
      user.email.toLowerCase(),
      hashPassword(user.password),
      user.role,
      user.tier,
      user.seedKey,
      serialize(user.profile),
      new Date().toISOString(),
    ]);

    if (result.changes > 0) {
      for (const pathway of user.pathways) {
        await writePathway(connection, user.id, pathway);
      }

      for (const notification of user.notifications) {
        await writeNotification(connection, user.id, notification);
      }
    }
  }
}

async function initializeDatabase(connection: DatabaseClient) {
  if (connection.dialect === "sqlite") {
    await connection.exec("PRAGMA journal_mode = WAL");
    await connection.exec("PRAGMA foreign_keys = ON");
  }

  await dropLegacyTables(connection);

  await connection.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      value TEXT NOT NULL
    )
  `);
  await connection.exec(`
    CREATE TABLE IF NOT EXISTS visas (
      id TEXT PRIMARY KEY,
      sort_order INTEGER NOT NULL,
      value TEXT NOT NULL
    )
  `);
  await connection.exec(`
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
    )
  `);
  await connection.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  await connection.exec(`
    CREATE TABLE IF NOT EXISTS pathways (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      visa_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      value TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  await connection.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      value TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  const countryCount = await connection.one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM countries"
  );
  const visaCount = await connection.one<{ count: number }>(
    "SELECT COUNT(*) AS count FROM visas"
  );

  if (!countryCount || !visaCount || countryCount.count === 0 || visaCount.count === 0) {
    await writeCatalog(connection);
  }

  await migrateCatalog(connection);
  await seedUsers(connection);
}

async function createDatabase(): Promise<DatabaseClient> {
  if (getDatabaseProvider() === "postgres") {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is required when DATABASE_PROVIDER is set to postgres."
      );
    }

    const pool = new Pool({
      connectionString,
      max: Number(process.env.POSTGRES_POOL_MAX ?? "5"),
      ssl: getPostgresSslConfig(),
    });
    const connection = new PostgresConnection(pool);

    await initializeDatabase(connection);
    return connection;
  }

  const databasePath = getSqliteDatabasePath();
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const connection = new SqliteConnection(new Database(databasePath));
  await initializeDatabase(connection);
  return connection;
}

export function getDatabase(): Promise<DatabaseClient> {
  if (!databasePromise) {
    databasePromise = createDatabase().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

export async function readCatalog(connection: DatabaseClient) {
  const countries = (
    await connection.many<{ value: string }>(
      "SELECT value FROM countries ORDER BY sort_order ASC"
    )
  ).map((row) => parseJson<typeof initialState.countries[number]>(row.value));

  const visas = (
    await connection.many<{ value: string }>(
      "SELECT value FROM visas ORDER BY sort_order ASC"
    )
  ).map((row) => normalizeVisa(parseJson<Visa>(row.value)));

  return { countries, visas };
}
