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

function deleteExpiredSessions() {
  getDatabase()
    .prepare("DELETE FROM sessions WHERE expires_at <= ?")
    .run(new Date().toISOString());
}

function findUserByEmail(email: string) {
  return getDatabase()
    .prepare(
      `
        SELECT id, email, role, tier, seed_key, profile_json, password_hash
        FROM users
        WHERE email = ? AND is_active = 1
      `
    )
    .get(normalizeEmail(email)) as (UserRow & { password_hash: string }) | undefined;
}

export function authenticateUser(email: string, password: string) {
  const user = findUserByEmail(email);

  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.password_hash)) {
    return null;
  }

  return mapUserRow(user);
}

export function createSession(userId: string) {
  deleteExpiredSessions();

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  getDatabase()
    .prepare(
      `
        INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(randomUUID(), userId, tokenHash, expiresAt.toISOString(), new Date().toISOString());

  return {
    token,
    expiresAt,
  };
}

export function invalidateSession(token: string | undefined) {
  if (!token) {
    return;
  }

  getDatabase()
    .prepare("DELETE FROM sessions WHERE token_hash = ?")
    .run(hashSessionToken(token));
}

export async function getOptionalSessionUser() {
  deleteExpiredSessions();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const row = getDatabase()
    .prepare(
      `
        SELECT users.id, users.email, users.role, users.tier, users.seed_key, users.profile_json
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = ?
          AND sessions.expires_at > ?
          AND users.is_active = 1
      `
    )
    .get(hashSessionToken(token), new Date().toISOString()) as UserRow | undefined;

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
