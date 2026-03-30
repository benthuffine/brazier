import "server-only";

import { AppNotification, Pathway, SubscriptionTier, UserProfile, UserRole, UserSeedKey } from "@/lib/types";

export interface DemoSeedUser {
  id: string;
  seedKey: UserSeedKey;
  email: string;
  password: string;
  role: UserRole;
  tier: SubscriptionTier;
  profile: UserProfile;
  pathways: Pathway[];
  notifications: AppNotification[];
}

const baseNotificationDate = "2026-03-29T15:30:00.000Z";

export const demoUsers: DemoSeedUser[] = [
  {
    id: "demo-admin",
    seedKey: "admin_demo",
    email: "admin@migrately.demo",
    password: "DemoAdmin!23",
    role: "admin",
    tier: "premium",
    profile: {
      fullName: "Avery Admin",
      age: 36,
      residenceCountry: "United States",
      citizenships: ["United States"],
      maritalStatus: "married",
      educationLevel: "master",
      employmentStatus: "founder",
      annualIncome: 98000,
      savingsAmount: 62000,
      languages: ["English", "French"],
      englishLevel: "native",
      workExperienceYears: 11,
      hasCriminalRecord: false,
      canWorkRemotely: true,
      hasHealthInsurance: true,
      hasJobOffer: false,
      dependents: 1,
      familyMembers: 3,
    },
    pathways: [
      {
        id: "admin-pathway-1",
        visaId: "de-opportunity-card",
        startedAt: "2026-03-26T10:00:00.000Z",
        completedStepIds: ["de-step-1"],
        completedDocumentIds: ["de-doc-1"],
      },
    ],
    notifications: [
      {
        id: "admin-notif-1",
        title: "Admin access ready",
        message: "You can edit visa content and inspect the shared catalog.",
        createdAt: baseNotificationDate,
        read: false,
        kind: "system",
      },
    ],
  },
  {
    id: "demo-starter",
    seedKey: "starter_demo",
    email: "starter@migrately.demo",
    password: "DemoStarter!23",
    role: "user",
    tier: "starter",
    profile: {
      fullName: "Sam Starter",
      age: 29,
      residenceCountry: "United States",
      citizenships: ["United States"],
      maritalStatus: "single",
      educationLevel: "bachelor",
      employmentStatus: "employed",
      annualIncome: 41000,
      savingsAmount: 12000,
      languages: ["English"],
      englishLevel: "native",
      workExperienceYears: 6,
      hasCriminalRecord: false,
      canWorkRemotely: true,
      hasHealthInsurance: true,
      hasJobOffer: false,
      dependents: 0,
      familyMembers: 1,
    },
    pathways: [
      {
        id: "starter-pathway-1",
        visaId: "pt-d8",
        startedAt: "2026-03-24T14:00:00.000Z",
        completedStepIds: [],
        completedDocumentIds: [],
      },
    ],
    notifications: [
      {
        id: "starter-notif-1",
        title: "Portugal pathway started",
        message: "Your Portugal D8 pathway is active. Next up: gather income proof.",
        createdAt: baseNotificationDate,
        read: false,
        kind: "pathway",
        visaId: "pt-d8",
      },
    ],
  },
  {
    id: "demo-premium",
    seedKey: "premium_demo",
    email: "premium@migrately.demo",
    password: "DemoPremium!23",
    role: "user",
    tier: "premium",
    profile: {
      fullName: "Priya Premium",
      age: 34,
      residenceCountry: "Canada",
      citizenships: ["Canada"],
      maritalStatus: "partnered",
      educationLevel: "master",
      employmentStatus: "self_employed",
      annualIncome: 76000,
      savingsAmount: 34000,
      languages: ["English", "Spanish"],
      englishLevel: "fluent",
      workExperienceYears: 9,
      hasCriminalRecord: false,
      canWorkRemotely: true,
      hasHealthInsurance: true,
      hasJobOffer: false,
      dependents: 0,
      familyMembers: 2,
    },
    pathways: [
      {
        id: "premium-pathway-1",
        visaId: "es-digital-nomad",
        startedAt: "2026-03-22T11:00:00.000Z",
        completedStepIds: ["es-step-1", "es-step-2"],
        completedDocumentIds: ["es-doc-1"],
      },
    ],
    notifications: [
      {
        id: "premium-notif-1",
        title: "Premium explanations unlocked",
        message: "Spain and UAE now show deeper requirement guidance.",
        createdAt: baseNotificationDate,
        read: false,
        kind: "eligibility",
      },
    ],
  },
];

export function getDemoUserBySeedKey(seedKey: UserSeedKey) {
  return demoUsers.find((user) => user.seedKey === seedKey) ?? null;
}
