"use client";

import {
  createContext,
  ReactNode,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { initialState } from "@/lib/data";
import {
  AppMutation,
  AppStateData,
  SubscriptionTier,
  UserProfile,
  Visa,
  VisaPatch,
} from "@/lib/types";

interface AppStateContextValue extends AppStateData {
  ready: boolean;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setTier: (tier: SubscriptionTier) => void;
  startPathway: (visaId: string) => void;
  toggleStep: (pathwayId: string, stepId: string) => void;
  toggleDocument: (pathwayId: string, documentId: string) => void;
  dismissNotification: (notificationId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  createVisa: (visa: Visa) => void;
  deleteVisa: (visaId: string) => void;
  reorderVisas: (orderedVisaIds: string[]) => void;
  updateVisa: (visaId: string, patch: VisaPatch) => void;
  resetDemo: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function mergeState(candidate: Partial<AppStateData>): AppStateData {
  return {
    ...initialState,
    ...candidate,
    profile: {
      ...initialState.profile,
      ...(candidate.profile ?? {}),
    },
    pathways: candidate.pathways ?? initialState.pathways,
    notifications: candidate.notifications ?? initialState.notifications,
    countries: candidate.countries ?? initialState.countries,
    visas: candidate.visas ?? initialState.visas,
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppStateData>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Failed to load app state (${response.status})`);
        }

        const nextState = (await response.json()) as AppStateData;

        if (!cancelled) {
          startTransition(() => {
            setState(mergeState(nextState));
          });
        }
      } catch (error) {
        console.error("Failed to load SQLite state", error);
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    loadState();

    return () => {
      cancelled = true;
    };
  }, []);

  async function commitMutation(mutation: AppMutation) {
    const response = await fetch("/api/state", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mutation),
    });

    if (!response.ok) {
      throw new Error(`Failed to apply mutation (${response.status})`);
    }

    const nextState = (await response.json()) as AppStateData;

    startTransition(() => {
      setState(mergeState(nextState));
    });
  }

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      ready,
      updateProfile: (profile) => {
        void commitMutation({ type: "update_profile", payload: profile }).catch(
          (error) => {
            console.error("Could not save profile changes", error);
          }
        );
      },
      setTier: (tier) => {
        void commitMutation({ type: "set_tier", payload: { tier } }).catch(
          (error) => {
            console.error("Could not update subscription tier", error);
          }
        );
      },
      startPathway: (visaId) => {
        void commitMutation({ type: "start_pathway", payload: { visaId } }).catch(
          (error) => {
            console.error("Could not start pathway", error);
          }
        );
      },
      toggleStep: (pathwayId, stepId) => {
        void commitMutation({
          type: "toggle_step",
          payload: { pathwayId, stepId },
        }).catch((error) => {
          console.error("Could not update step progress", error);
        });
      },
      toggleDocument: (pathwayId, documentId) => {
        void commitMutation({
          type: "toggle_document",
          payload: { pathwayId, documentId },
        }).catch((error) => {
          console.error("Could not update document progress", error);
        });
      },
      dismissNotification: (notificationId) => {
        void commitMutation({
          type: "dismiss_notification",
          payload: { notificationId },
        }).catch((error) => {
          console.error("Could not dismiss notification", error);
        });
      },
      markNotificationRead: (notificationId) => {
        void commitMutation({
          type: "mark_notification_read",
          payload: { notificationId },
        }).catch((error) => {
          console.error("Could not mark notification as read", error);
        });
      },
      createVisa: (visa) => {
        void commitMutation({
          type: "create_visa",
          payload: { visa },
        }).catch((error) => {
          console.error("Could not create visa", error);
        });
      },
      deleteVisa: (visaId) => {
        void commitMutation({
          type: "delete_visa",
          payload: { visaId },
        }).catch((error) => {
          console.error("Could not delete visa", error);
        });
      },
      reorderVisas: (orderedVisaIds) => {
        void commitMutation({
          type: "reorder_visas",
          payload: { orderedVisaIds },
        }).catch((error) => {
          console.error("Could not reorder visas", error);
        });
      },
      updateVisa: (visaId, patch) => {
        void commitMutation({
          type: "update_visa",
          payload: { visaId, patch },
        }).catch((error) => {
          console.error("Could not save visa changes", error);
        });
      },
      resetDemo: () => {
        void commitMutation({ type: "reset_demo" }).catch((error) => {
          console.error("Could not reset demo data", error);
        });
      },
    }),
    [ready, state]
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);

  if (!value) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return value;
}
