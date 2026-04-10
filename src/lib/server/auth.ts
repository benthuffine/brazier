import "server-only";

import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSessionToken, hashSessionToken, verifyPassword } from "@/lib/server/auth-crypto";
import { getDatabase, parseJson } from "@/lib/server/database";
import { AuthUser, UserProfile } from "@/lib/types";

export const SESSION_COOKIE_NAME = "migrately_session";
const SESSION_DURATION_DAYS = 14;

interface UserRow {
  id: string;
  email: string;
  role: AuthUser["role"];
  tier: AuthUser["tier"];
  seed_key: AuthUser["seedKey"] | null;
  profile_json: string;
}

function mapUserRow(row: UserRow): AuthUser {
  const profile = parseJson<UserProfile>(row.profile_json);

  return {
    id: row.id,
    email: row.email,
    fullName: profile.fullName,
    role: row.role,
    tier: row.tier,
    seedKey: row.seed_key ?? undefined,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function deleteExpiredSessions() {
  const database = await getDatabase();
  await database.run("DELETE FROM sessions WHERE expires_at <= ?", [
    new Date().toISOString(),
  ]);
}

async function findUserByEmail(email: string) {
  const database = await getDatabase();

  return database.one<UserRow & { password_hash: string }>(
    `
      SELECT id, email, role, tier, seed_key, profile_json, password_hash
      FROM users
      WHERE email = ? AND is_active = 1
    `,
    [normalizeEmail(email)]
  );
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.password_hash)) {
    return null;
  }

  return mapUserRow(user);
}

export async function createSession(userId: string) {
  await deleteExpiredSessions();

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);
  const database = await getDatabase();

  await database.run(
    `
      INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    [randomUUID(), userId, tokenHash, expiresAt.toISOString(), new Date().toISOString()]
  );

  return {
    token,
    expiresAt,
  };
}

export async function invalidateSession(token: string | undefined) {
  if (!token) {
    return;
  }

  const database = await getDatabase();
  await database.run("DELETE FROM sessions WHERE token_hash = ?", [
    hashSessionToken(token),
  ]);
}

export async function getOptionalSessionUser() {
  await deleteExpiredSessions();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const database = await getDatabase();
  const row = await database.one<UserRow>(
    `
      SELECT users.id, users.email, users.role, users.tier, users.seed_key, users.profile_json
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > ?
        AND users.is_active = 1
    `,
    [hashSessionToken(token), new Date().toISOString()]
  );

  if (!row) {
    return null;
  }

  return mapUserRow(row);
}

export async function requireAuthenticatedUser() {
  const user = await getOptionalSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdminUser() {
  const user = await requireAuthenticatedUser();

  if (user.role !== "admin") {
    redirect("/app");
  }

  return user;
}
