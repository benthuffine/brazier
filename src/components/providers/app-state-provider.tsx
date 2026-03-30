"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { initialState } from "@/lib/data";
import { AppNotification, AppStateData, Pathway, SubscriptionTier, UserProfile, Visa } from "@/lib/types";

const STORAGE_KEY = "migrately-mvp-state-v1";

interface AppStateContextValue extends AppStateData {
  ready: boolean;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setTier: (tier: SubscriptionTier) => void;
  startPathway: (visaId: string) => void;
  toggleStep: (pathwayId: string, stepId: string) => void;
  toggleDocument: (pathwayId: string, documentId: string) => void;
  dismissNotification: (notificationId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  updateVisa: (visaId: string, patch: Partial<Visa>) => void;
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

function createNotification(notification: Omit<AppNotification, "id" | "createdAt" | "read">): AppNotification {
  return {
    ...notification,
    id: `${notification.kind}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppStateData>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppStateData>;
        setState(mergeState(parsed));
      }
    } catch (error) {
      console.error("Failed to restore demo state", error);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      ready,
      updateProfile: (profile) =>
        setState((current) => ({
          ...current,
          profile: {
            ...current.profile,
            ...profile,
          },
        })),
      setTier: (tier) =>
        setState((current) => ({
          ...current,
          tier,
        })),
      startPathway: (visaId) =>
        setState((current) => {
          const existing = current.pathways.find((pathway) => pathway.visaId === visaId);
          if (existing) {
            return current;
          }

          const nextPathway: Pathway = {
            id: `pathway-${Date.now()}`,
            visaId,
            startedAt: new Date().toISOString(),
            completedStepIds: [],
            completedDocumentIds: [],
          };

          const visa = current.visas.find((entry) => entry.id === visaId);

          return {
            ...current,
            pathways: [nextPathway, ...current.pathways],
            notifications: [
              createNotification({
                title: "Pathway started",
                message: visa
                  ? `${visa.name} was added to your active pathways.`
                  : "A new pathway was added to your tracker.",
                kind: "pathway",
                visaId,
              }),
              ...current.notifications,
            ],
          };
        }),
      toggleStep: (pathwayId, stepId) =>
        setState((current) => ({
          ...current,
          pathways: current.pathways.map((pathway) => {
            if (pathway.id !== pathwayId) {
              return pathway;
            }

            const exists = pathway.completedStepIds.includes(stepId);
            return {
              ...pathway,
              completedStepIds: exists
                ? pathway.completedStepIds.filter((id) => id !== stepId)
                : [...pathway.completedStepIds, stepId],
            };
          }),
        })),
      toggleDocument: (pathwayId, documentId) =>
        setState((current) => ({
          ...current,
          pathways: current.pathways.map((pathway) => {
            if (pathway.id !== pathwayId) {
              return pathway;
            }

            const exists = pathway.completedDocumentIds.includes(documentId);
            return {
              ...pathway,
              completedDocumentIds: exists
                ? pathway.completedDocumentIds.filter((id) => id !== documentId)
                : [...pathway.completedDocumentIds, documentId],
            };
          }),
        })),
      dismissNotification: (notificationId) =>
        setState((current) => ({
          ...current,
          notifications: current.notifications.filter(
            (notification) => notification.id !== notificationId
          ),
        })),
      markNotificationRead: (notificationId) =>
        setState((current) => ({
          ...current,
          notifications: current.notifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          ),
        })),
      updateVisa: (visaId, patch) =>
        setState((current) => ({
          ...current,
          visas: current.visas.map((visa) =>
            visa.id === visaId
              ? {
                  ...visa,
                  ...patch,
                }
              : visa
          ),
        })),
      resetDemo: () => setState(initialState),
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
