import "server-only";

import { randomUUID } from "node:crypto";

import { initialState } from "@/lib/data";
import {
  type DatabaseClient,
  getDatabase,
  parseJson,
  readCatalog,
  serialize,
} from "@/lib/server/database";
import { getDemoUserBySeedKey } from "@/lib/server/demo-users";
import {
  AppMutation,
  AppNotification,
  AppStateData,
  AuthUser,
  Country,
  Pathway,
  UserProfile,
  Visa,
} from "@/lib/types";
import { normalizeVisa } from "@/lib/visa-source";

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

async function readUserState(
  connection: DatabaseClient,
  userId: string
): Promise<AppStateData> {
  const userRow = await connection.one<{
    profile_json: string;
    tier: AppStateData["tier"];
  }>("SELECT profile_json, tier FROM users WHERE id = ?", [userId]);

  if (!userRow) {
    throw new Error("not_found");
  }

  const pathways = (
    await connection.many<{ value: string }>(
      "SELECT value FROM pathways WHERE user_id = ? ORDER BY started_at DESC",
      [userId]
    )
  ).map((row) => parseJson<Pathway>(row.value));

  const notifications = (
    await connection.many<{ value: string }>(
      "SELECT value FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    )
  ).map((row) => parseJson<AppNotification>(row.value));

  const { countries, visas } = await readCatalog(connection);

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

async function deleteVisaReferences(connection: DatabaseClient, visaId: string) {
  await connection.run("DELETE FROM pathways WHERE visa_id = ?", [visaId]);
  await connection.run("DELETE FROM notifications WHERE value LIKE ?", [
    `%"visaId":"${visaId}"%`,
  ]);
}

async function reorderCatalogVisas(
  connection: DatabaseClient,
  orderedVisaIds: string[]
) {
  const existingRows = await connection.many<{ id: string; sort_order: number }>(
    "SELECT id, sort_order FROM visas ORDER BY sort_order ASC"
  );
  const existingIds = existingRows.map((row) => row.id);
  const seen = new Set<string>();
  const nextOrder = orderedVisaIds.filter((id) => {
    const include = existingIds.includes(id) && !seen.has(id);
    if (include) {
      seen.add(id);
    }
    return include;
  });
  const remaining = existingIds.filter((id) => !seen.has(id));

  for (const [index, id] of [...nextOrder, ...remaining].entries()) {
    await connection.run("UPDATE visas SET sort_order = ? WHERE id = ?", [index, id]);
  }
}

async function resetUserState(connection: DatabaseClient, user: AuthUser) {
  const seedUser = user.seedKey ? getDemoUserBySeedKey(user.seedKey) : null;
  const nextProfile = seedUser?.profile ?? initialState.profile;
  const nextTier = seedUser?.tier ?? user.tier;

  await connection.run("UPDATE users SET profile_json = ?, tier = ? WHERE id = ?", [
    serialize(nextProfile),
    nextTier,
    user.id,
  ]);

  await connection.run("DELETE FROM pathways WHERE user_id = ?", [user.id]);
  await connection.run("DELETE FROM notifications WHERE user_id = ?", [user.id]);

  for (const pathway of seedUser?.pathways ?? []) {
    await writePathway(connection, user.id, pathway);
  }

  for (const notification of seedUser?.notifications ?? []) {
    await writeNotification(connection, user.id, notification);
  }
}

export async function getAppState(userId: string) {
  return readUserState(await getDatabase(), userId);
}

export async function applyMutation(user: AuthUser, mutation: AppMutation) {
  const connection = await getDatabase();

  return connection.transaction(async (transaction) => {
    const state = await readUserState(transaction, user.id);

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

        await transaction.run("UPDATE users SET profile_json = ? WHERE id = ?", [
          serialize(nextProfile),
          user.id,
        ]);
        break;
      }
      case "set_tier": {
        if (user.role !== "admin") {
          throw new Error("forbidden");
        }

        await transaction.run("UPDATE users SET tier = ? WHERE id = ?", [
          mutation.payload.tier,
          user.id,
        ]);
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

          await writePathway(transaction, user.id, nextPathway);

          if (visa) {
            await writeNotification(
              transaction,
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

        const pathwayRow = await transaction.one<{ value: string }>(
          "SELECT value FROM pathways WHERE id = ? AND user_id = ?",
          [mutation.payload.pathwayId, user.id]
        );

        if (!pathwayRow) {
          break;
        }

        const pathway = parseJson<Pathway>(pathwayRow.value);
        const exists = pathway.completedStepIds.includes(mutation.payload.stepId);

        await writePathway(transaction, user.id, {
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

        const pathwayRow = await transaction.one<{ value: string }>(
          "SELECT value FROM pathways WHERE id = ? AND user_id = ?",
          [mutation.payload.pathwayId, user.id]
        );

        if (!pathwayRow) {
          break;
        }

        const pathway = parseJson<Pathway>(pathwayRow.value);
        const exists = pathway.completedDocumentIds.includes(
          mutation.payload.documentId
        );

        await writePathway(transaction, user.id, {
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
        await transaction.run("DELETE FROM notifications WHERE id = ? AND user_id = ?", [
          mutation.payload.notificationId,
          user.id,
        ]);
        break;
      }
      case "mark_notification_read": {
        const notificationRow = await transaction.one<{ value: string }>(
          "SELECT value FROM notifications WHERE id = ? AND user_id = ?",
          [mutation.payload.notificationId, user.id]
        );

        if (!notificationRow) {
          break;
        }

        const notification = parseJson<AppNotification>(notificationRow.value);
        await writeNotification(transaction, user.id, {
          ...notification,
          read: true,
        });
        break;
      }
      case "create_country": {
        if (user.role !== "admin") {
          throw new Error("forbidden");
        }

        const nextCountry: Country = {
          ...mutation.payload.country,
          code: mutation.payload.country.code.trim().toUpperCase(),
          name: mutation.payload.country.name.trim(),
          flag: mutation.payload.country.flag.trim() || "🌍",
          region: mutation.payload.country.region.trim() || "Other",
          headline: mutation.payload.country.headline.trim(),
          climate: mutation.payload.country.climate.trim() || "Varies",
          costOfLivingBand: mutation.payload.country.costOfLivingBand.trim() || "$$",
          highlights: mutation.payload.country.highlights
            .map((highlight) => highlight.trim())
            .filter(Boolean),
        };
        const existingCountry = await transaction.one<{ code: string }>(
          "SELECT code FROM countries WHERE code = ?",
          [nextCountry.code]
        );

        if (existingCountry) {
          throw new Error("conflict");
        }

        const sortOrderRow = await transaction.one<{ max_sort_order: number }>(
          "SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order FROM countries"
        );

        await transaction.run(
          "INSERT INTO countries (code, sort_order, value) VALUES (?, ?, ?)",
          [
            nextCountry.code,
            (sortOrderRow?.max_sort_order ?? -1) + 1,
            serialize(nextCountry),
          ]
        );
        break;
      }
      case "create_visa": {
        if (user.role !== "admin") {
          throw new Error("forbidden");
        }

        const nextVisa = normalizeVisa(mutation.payload.visa);
        const existingVisa = await transaction.one<{ id: string }>(
          "SELECT id FROM visas WHERE id = ?",
          [nextVisa.id]
        );

        if (existingVisa) {
          throw new Error("conflict");
        }

        const sortOrderRow = await transaction.one<{ max_sort_order: number }>(
          "SELECT COALESCE(MAX(sort_order), -1) AS max_sort_order FROM visas"
        );

        await transaction.run(
          "INSERT INTO visas (id, sort_order, value) VALUES (?, ?, ?)",
          [nextVisa.id, (sortOrderRow?.max_sort_order ?? -1) + 1, serialize(nextVisa)]
        );
        break;
      }
      case "delete_visa": {
        if (user.role !== "admin") {
          throw new Error("forbidden");
        }

        await deleteVisaReferences(transaction, mutation.payload.visaId);
        await transaction.run("DELETE FROM visas WHERE id = ?", [
          mutation.payload.visaId,
        ]);
        break;
      }
      case "reorder_visas": {
        if (user.role !== "admin") {
          throw new Error("forbidden");
        }

        await reorderCatalogVisas(transaction, mutation.payload.orderedVisaIds);
        break;
      }
      case "update_visa": {
        if (user.role !== "admin") {
          throw new Error("forbidden");
        }

        const visaRow = await transaction.one<{ sort_order: number; value: string }>(
          "SELECT sort_order, value FROM visas WHERE id = ?",
          [mutation.payload.visaId]
        );

        if (!visaRow) {
          break;
        }

        const visa = normalizeVisa(parseJson<Visa>(visaRow.value));
        const nextVisa = normalizeVisa({
          ...visa,
          ...mutation.payload.patch,
          source: mutation.payload.patch.source
            ? {
                ...visa.source,
                ...mutation.payload.patch.source,
              }
            : visa.source,
        });

        await transaction.run(
          "UPDATE visas SET value = ?, sort_order = ? WHERE id = ?",
          [serialize(nextVisa), visaRow.sort_order, mutation.payload.visaId]
        );
        break;
      }
      case "reset_demo": {
        await resetUserState(transaction, user);
        break;
      }
      default: {
        const exhaustiveCheck: never = mutation;
        throw new Error(`Unsupported mutation: ${serialize(exhaustiveCheck)}`);
      }
    }

    return readUserState(transaction, user.id);
  });
}
