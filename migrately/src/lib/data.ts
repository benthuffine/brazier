import { AppStateData, UserProfile } from "@/lib/types";
import { sampleCountries, sampleProfileDefaults, sampleVisas } from "@/lib/sample-data";

export const defaultProfile: UserProfile = {
  fullName: "Taylor Demo",
  age: 31,
  residenceCountry: "United States",
  citizenships: ["United States"],
  maritalStatus: "single",
  educationLevel: "bachelor",
  employmentStatus: "employed",
  annualIncome: sampleProfileDefaults.annualIncome,
  savingsAmount: sampleProfileDefaults.savingsAmount,
  languages: ["English", "Spanish"],
  englishLevel: sampleProfileDefaults.englishLevel,
  workExperienceYears: 7,
  hasCriminalRecord: sampleProfileDefaults.hasCriminalRecord,
  canWorkRemotely: sampleProfileDefaults.canWorkRemotely,
  hasHealthInsurance: sampleProfileDefaults.hasHealthInsurance,
  hasJobOffer: false,
  dependents: 0,
  familyMembers: sampleProfileDefaults.familyMembers,
};

export const countries = sampleCountries;
export const visas = sampleVisas;

export const initialState: AppStateData = {
  profile: defaultProfile,
  tier: "starter",
  pathways: [
    {
      id: "starter-pathway-1",
      visaId: "VISA_PT_D8",
      startedAt: "2026-03-24T14:00:00.000Z",
      completedStepIds: ["STEP_PT_D8_1"],
      completedDocumentIds: ["DOC001"],
    },
  ],
  notifications: [
    {
      id: "notif-1",
      title: "Portugal pathway started",
      message: "Your Portugal D8 pathway is active. Next up: gather documentation.",
      createdAt: "2026-03-29T15:30:00.000Z",
      read: false,
      kind: "pathway",
      visaId: "VISA_PT_D8",
    },
    {
      id: "notif-2",
      title: "Sample dataset imported",
      message: "The starter catalog now uses the client sample dataset as its base seed.",
      createdAt: "2026-03-28T13:15:00.000Z",
      read: false,
      kind: "system",
    },
  ],
  countries,
  visas,
};
