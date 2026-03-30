import {
  Country,
  GroupResult,
  LanguageLevel,
  Pathway,
  Requirement,
  RequirementResult,
  UserProfile,
  Visa,
  VisaAssessment,
} from "@/lib/types";

const educationRank = {
  high_school: 0,
  associate: 1,
  bachelor: 2,
  master: 3,
  phd: 4,
} as const;

const languageRank: Record<LanguageLevel, number> = {
  basic: 0,
  conversational: 1,
  fluent: 2,
  native: 3,
};

function evaluateRequirement(
  requirement: Requirement,
  profile: UserProfile
): RequirementResult {
  const actual = profile[requirement.field];
  let passed = false;

  switch (requirement.operator) {
    case "gte":
      passed = typeof actual === "number" && typeof requirement.value === "number" && actual >= requirement.value;
      break;
    case "lte":
      passed = typeof actual === "number" && typeof requirement.value === "number" && actual <= requirement.value;
      break;
    case "eq":
      passed = actual === requirement.value;
      break;
    case "neq":
      passed = actual !== requirement.value;
      break;
    case "includesAny":
      passed =
        Array.isArray(actual) &&
        Array.isArray(requirement.value) &&
        requirement.value.some((value) => actual.includes(value));
      break;
    case "isTrue":
      passed = actual === true;
      break;
    case "isFalse":
      passed = actual === false;
      break;
    case "atLeastEducation":
      passed =
        typeof actual === "string" &&
        typeof requirement.value === "string" &&
        educationRank[actual as keyof typeof educationRank] >=
          educationRank[requirement.value as keyof typeof educationRank];
      break;
    case "atLeastLanguage":
      passed =
        typeof actual === "string" &&
        typeof requirement.value === "string" &&
        languageRank[actual as LanguageLevel] >= languageRank[requirement.value as LanguageLevel];
      break;
  }

  return {
    requirement,
    passed,
  };
}

function evaluateGroup(profile: UserProfile, visa: Visa): GroupResult[] {
  return visa.alternativeGroups.map((group) => {
    const results = group.requirements.map((requirement) =>
      evaluateRequirement(requirement, profile)
    );

    return {
      group,
      results,
      passed: results.every((result) => result.passed),
    };
  });
}

export function evaluateVisa(
  profile: UserProfile,
  visa: Visa
): VisaAssessment {
  const requiredResults = visa.baseRequirements.map((requirement) =>
    evaluateRequirement(requirement, profile)
  );
  const groupResults = evaluateGroup(profile, visa);
  const activeGroup = groupResults
    .slice()
    .sort((left, right) => {
      const leftScore = left.results.filter((result) => result.passed).length;
      const rightScore = right.results.filter((result) => result.passed).length;
      return rightScore - leftScore;
    })[0];

  const groupsSatisfied =
    groupResults.length === 0 || groupResults.some((result) => result.passed);
  const requiredSatisfied = requiredResults.every((result) => result.passed);

  const missingRequirements = [
    ...requiredResults.filter((result) => !result.passed),
    ...(!groupsSatisfied && activeGroup
      ? activeGroup.results.filter((result) => !result.passed)
      : []),
  ];

  const totalRequirementCount =
    requiredResults.length +
    (activeGroup?.results.length ?? 0) +
    visa.optionalBoosts.length;

  const passedRequirementCount =
    requiredResults.filter((result) => result.passed).length +
    (activeGroup?.results.filter((result) => result.passed).length ?? 0) +
    Math.min(visa.optionalBoosts.length, 1);

  return {
    visa,
    requiredResults,
    groupResults,
    activeGroup,
    missingRequirements,
    optionalBoosts: visa.optionalBoosts,
    score:
      totalRequirementCount === 0
        ? 1
        : Number((passedRequirementCount / totalRequirementCount).toFixed(2)),
    isEligible: requiredSatisfied && groupsSatisfied,
  };
}

export function getVisaAssessments(
  profile: UserProfile,
  visas: Visa[]
): VisaAssessment[] {
  return visas
    .filter((visa) => visa.isActive)
    .map((visa) => evaluateVisa(profile, visa))
    .sort((left, right) => {
      if (left.isEligible === right.isEligible) {
        return right.score - left.score;
      }
      return left.isEligible ? -1 : 1;
    });
}

export function getProfileCompletion(profile: UserProfile): number {
  const fields = [
    profile.fullName,
    profile.age > 0,
    profile.residenceCountry,
    profile.citizenships.length > 0,
    profile.educationLevel,
    profile.employmentStatus,
    profile.annualIncome > 0,
    profile.savingsAmount >= 0,
    profile.languages.length > 0,
    profile.workExperienceYears >= 0,
    typeof profile.hasCriminalRecord === "boolean",
    typeof profile.canWorkRemotely === "boolean",
    typeof profile.hasHealthInsurance === "boolean",
  ];

  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

export function getPathwayProgress(visa: Visa, pathway: Pathway): number {
  const total = visa.steps.length + visa.documents.length;
  const completed = pathway.completedStepIds.length + pathway.completedDocumentIds.length;

  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

export function getCountryByCode(countries: Country[], code: string) {
  return countries.find((country) => country.code === code);
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
