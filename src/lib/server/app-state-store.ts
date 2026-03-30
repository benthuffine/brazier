import "server-only";

import { randomUUID } from "node:crypto";

import { initialState } from "@/lib/data";
import { getDatabase, parseJson, readCatalog, serialize } from "@/lib/server/database";
import { getDemoUserBySeedKey } from "@/lib/server/demo-users";
import {
  AppMutation,
  AppNotification,
  AppStateData,
  AuthUser,
  Pathway,
  UserProfile,
  Visa,
} from "@/lib/types";

function writePathway(connection: ReturnType<typeof getDatabase>, userId: string, pathway: Pathway) {
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
  connection: ReturnType<typeof getDatabase>,
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

function readUserState(connection: ReturnType<typeof getDatabase>, userId: string): AppStateData {
  const userRow = connection
    .prepare("SELECT profile_json, tier FROM users WHERE id = ?")
    .get(userId) as { profile_json: string; tier: AppStateData["tier"] } | undefined;

  if (!userRow) {
    throw new Error("not_found");
  }

  const pathways = (
    connection
      .prepare("SELECT value FROM pathways WHERE user_id = ? ORDER BY started_at DESC")
      .all(userId) as Array<{ value: string }>
  ).map((row) => parseJson<Pathway>(row.value));

  const notifications = (
    connection
      .prepare(
        "SELECT value FROM notifications WHERE user_id = ? ORDER BY created_at DESC"
      )
      .all(userId) as Array<{ value: string }>
  ).map((row) => parseJson<AppNotification>(row.value));

  const { countries, visas } = readCatalog(connection);

  return {
    profile: parseJson<UserProfile>(userRow.profile_json),
    tier: userRow.tier,
    pathways,
    notifications,
    countries,
    visas,
  };
}

function createPathwayNotification(visaName: string, visaId: string): AppNotification {
  return {
    id: `pathway-${randomUUID()}`,
    title: "Pathway started",
    message: `${visaName} was added to your active pathways.`,
    createdAt: new Date().toISOString(),
    read: false,
    kind: "pathway",
    visaId,
  };
}

function resetUserState(connection: ReturnType<typeof getDatabase>, user: AuthUser) {
  const seedUser = user.seedKey ? getDemoUserBySeedKey(user.seedKey) : null;
  const nextProfile = seedUser?.profile ?? initialState.profile;
  const nextTier = seedUser?.tier ?? user.tier;

  connection
    .prepare("UPDATE users SET profile_json = ?, tier = ? WHERE id = ?")
    .run(serialize(nextProfile), nextTier, user.id);

  connection.prepare("DELETE FROM pathways WHERE user_id = ?").run(user.id);
  connection.prepare("DELETE FROM notifications WHERE user_id = ?").run(user.id);

  seedUser?.pathways.forEach((pathway) => writePathway(connection, user.id, pathway));
  seedUser?.notifications.forEach((notification) =>
    writeNotification(connection, user.id, notification)
  );
}

export function getAppState(userId: string) {
  return readUserState(getDatabase(), userId);
}

export function applyMutation(user: AuthUser, mutation: AppMutation) {
  const connection = getDatabase();

  const transaction = connection.transaction(() => {
    const state = readUserState(connection, user.id);

    switch (mutation.type) {
      case "update_profile": {
        const nextProfile = {
          ...state.profile,
          ...mutation.payload,
        };

        if (user.tier !== "premium") {
          nextProfile.dependents = state.profile.dependents;
          nextProfile.familyMembers = state.profile.familyMembers;
        }

        connection
          .prepare("UPDATE users SET profile_json = ? WHERE id = ?")
          .run(serialize(nextProfile), user.id);
        break;
      }
      case "set_tier": {
        if (user.role !== "admin") {
          throw new Error("forbidden");
        }

        connection
          .prepare("UPDATE users SET tier = ? WHERE id = ?")
          .run(mutation.payload.tier, user.id);
        break;
      }
      case "start_pathway": {
        const existing = state.pathways.find(
          (pathway) => pathway.visaId === mutation.payload.visaId
        );

        if (!existing) {
          if (user.tier !== "premium" && state.pathways.length >= 1) {
            throw new Error("pathway_limit");
          }

          const nextPathway: Pathway = {
            id: `pathway-${randomUUID()}`,
            visaId: mutation.payload.visaId,
            startedAt: new Date().toISOString(),
            completedStepIds: [],
            completedDocumentIds: [],
          };
          const visa = state.visas.find((entry) => entry.id === mutation.payload.visaId);

          writePathway(connection, user.id, nextPathway);

          if (visa) {
            writeNotification(
              connection,
              user.id,
              createPathwayNotification(visa.name, visa.id)
            );
          }
        }
        break;
      }
      case "toggle_step": {
        if (user.tier !== "premium") {
          throw new Error("premium_required");
        }

        const pathwayRow = connection
          .prepare("SELECT value FROM pathways WHERE id = ? AND user_id = ?")
          .get(mutation.payload.pathwayId, user.id) as
          | { value: string }
          | undefined;

        if (!pathwayRow) {
          break;
        }

        const pathway = parseJson<Pathway>(pathwayRow.value);
        const exists = pathway.completedStepIds.includes(mutation.payload.stepId);

        writePathway(connection, user.id, {
          ...pathway,
          completedStepIds: exists
            ? pathway.completedStepIds.filter((id) => id !== mutation.payload.stepId)
            : [...pathway.completedStepIds, mutation.payload.stepId],
        });
        break;
      }
      case "toggle_document": {
        if (user.tier !== "premium") {
          throw new Error("premium_required");
        }

        const pathwayRow = connection
          .prepare("SELECT value FROM pathways WHERE id = ? AND user_id = ?")
          .get(mutation.payload.pathwayId, user.id) as
          | { value: string }
          | undefined;

        if (!pathwayRow) {
          break;
        }

        const pathway = parseJson<Pathway>(pathwayRow.value);
        const exists = pathway.completedDocumentIds.includes(
          mutation.payload.documentId
        );

        writePathway(connection, user.id, {
          ...pathway,
          completedDocumentIds: exists
            ? pathway.completedDocumentIds.filter(
                (id) => id !== mutation.payload.documentId
              )
            : [...pathway.completedDocumentIds, mutation.payload.documentId],
        });
        break;
      }
      case "dismiss_notification": {
        connection
          .prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?")
          .run(mutation.payload.notificationId, user.id);
        break;
      }
      case "mark_notification_read": {
        const notificationRow = connection
          .prepare("SELECT value FROM notifications WHERE id = ? AND user_id = ?")
          .get(mutation.payload.notificationId, user.id) as
          | { value: string }
          | undefined;

        if (!notificationRow) {
          break;
        }

        const notification = parseJson<AppNotification>(notificationRow.value);
        writeNotification(connection, user.id, {
          ...notification,
          read: true,
        });
        break;
      }
      case "update_visa": {
        if (user.role !== "admin") {
          throw new Error("forbidden");
        }

        const visaRow = connection
          .prepare("SELECT sort_order, value FROM visas WHERE id = ?")
          .get(mutation.payload.visaId) as
          | { sort_order: number; value: string }
          | undefined;

        if (!visaRow) {
          break;
        }

        const visa = parseJson<Visa>(visaRow.value);
        const nextVisa = {
          ...visa,
          ...mutation.payload.patch,
        };

        connection
          .prepare("UPDATE visas SET value = ?, sort_order = ? WHERE id = ?")
          .run(serialize(nextVisa), visaRow.sort_order, mutation.payload.visaId);
        break;
      }
      case "reset_demo": {
        resetUserState(connection, user);
        break;
      }
      default: {
        const exhaustiveCheck: never = mutation;
        throw new Error(`Unsupported mutation: ${serialize(exhaustiveCheck)}`);
      }
    }

    return readUserState(connection, user.id);
  });

  return transaction();
}
