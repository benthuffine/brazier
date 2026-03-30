export type SubscriptionTier = "starter" | "premium";

export type EducationLevel =
  | "high_school"
  | "associate"
  | "bachelor"
  | "master"
  | "phd";

export type LanguageLevel =
  | "basic"
  | "conversational"
  | "fluent"
  | "native";

export type MaritalStatus = "single" | "married" | "partnered" | "divorced";

export type EmploymentStatus =
  | "employed"
  | "self_employed"
  | "founder"
  | "student"
  | "between_roles";

export interface UserProfile {
  fullName: string;
  age: number;
  residenceCountry: string;
  citizenships: string[];
  maritalStatus: MaritalStatus;
  educationLevel: EducationLevel;
  employmentStatus: EmploymentStatus;
  annualIncome: number;
  savingsAmount: number;
  languages: string[];
  englishLevel: LanguageLevel;
  workExperienceYears: number;
  hasCriminalRecord: boolean;
  canWorkRemotely: boolean;
  hasHealthInsurance: boolean;
  hasJobOffer: boolean;
  dependents: number;
  familyMembers: number;
}

export type ProfileField = keyof UserProfile;

export type RequirementOperator =
  | "gte"
  | "lte"
  | "eq"
  | "neq"
  | "includesAny"
  | "isTrue"
  | "isFalse"
  | "atLeastEducation"
  | "atLeastLanguage";

export interface Requirement {
  id: string;
  label: string;
  field: ProfileField;
  operator: RequirementOperator;
  value?: number | string | string[] | boolean;
  detail: string;
  premiumDetail?: string;
}

export interface RequirementGroup {
  id: string;
  label: string;
  description: string;
  requirements: Requirement[];
}

export interface PathwayChecklistItem {
  id: string;
  title: string;
  description: string;
  premium?: boolean;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  headline: string;
  region: string;
  costOfLivingBand: string;
  climate: string;
  heroColors: [string, string];
  highlights: string[];
}

export interface Visa {
  id: string;
  name: string;
  countryCode: string;
  category: string;
  summary: string;
  description: string;
  processingTime: string;
  baseRequirements: Requirement[];
  alternativeGroups: RequirementGroup[];
  optionalBoosts: string[];
  documents: PathwayChecklistItem[];
  steps: PathwayChecklistItem[];
  premiumInsights: string[];
  isActive: boolean;
}

export interface Pathway {
  id: string;
  visaId: string;
  startedAt: string;
  completedStepIds: string[];
  completedDocumentIds: string[];
}

export type NotificationKind = "pathway" | "system" | "eligibility";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  kind: NotificationKind;
  visaId?: string;
}

export interface AppStateData {
  profile: UserProfile;
  tier: SubscriptionTier;
  pathways: Pathway[];
  notifications: AppNotification[];
  countries: Country[];
  visas: Visa[];
}

export interface RequirementResult {
  requirement: Requirement;
  passed: boolean;
}

export interface GroupResult {
  group: RequirementGroup;
  results: RequirementResult[];
  passed: boolean;
}

export interface VisaAssessment {
  visa: Visa;
  requiredResults: RequirementResult[];
  groupResults: GroupResult[];
  activeGroup?: GroupResult;
  missingRequirements: RequirementResult[];
  optionalBoosts: string[];
  score: number;
  isEligible: boolean;
}
