import sampleDataJson from "../../fixtures/sample_data.json";

import {
  type Country,
  type LanguageLevel,
  type PathwayChecklistItem,
  type Requirement,
  type UserProfile,
  type Visa,
} from "@/lib/types";
import { createPendingVisaSource } from "@/lib/visa-source";

interface SampleRequirement {
  requirement_id: string;
  name: string;
  description: string;
  operator: string;
}

interface SampleDocument {
  document_id: string;
  title: string;
  description: string;
}

interface SampleVisa {
  visa_id: string;
  visa_name: string;
  country: string;
  visa_type: string;
  description: string;
  processing_time_days: number;
}

interface SampleVisaRequirement {
  visa_id: string;
  requirement_id: string;
  value: boolean | number | string | null;
  unit: string | null;
}

interface SampleVisaDocument {
  visa_id: string;
  document_id: string;
  document_type: string;
}

interface SampleVisaStep {
  step_id: string;
  visa_id: string;
  step_type: string;
  order: number;
  title: string;
  description: string;
}

interface SampleData {
  requirements: SampleRequirement[];
  documents: SampleDocument[];
  visas: SampleVisa[];
  visa_requirements: SampleVisaRequirement[];
  visa_documents: SampleVisaDocument[];
  visa_steps: SampleVisaStep[];
}

type CountrySeed = Omit<Country, "name" | "headline" | "highlights">;

const sampleData = sampleDataJson as SampleData;

const countrySeeds: Record<string, CountrySeed> = {
  Portugal: {
    code: "PT",
    flag: "🇵🇹",
    region: "Europe",
    costOfLivingBand: "$$",
    climate: "Mild Atlantic",
    heroColors: ["#A53658", "#2D7DDA"],
  },
  Canada: {
    code: "CA",
    flag: "🇨🇦",
    region: "North America",
    costOfLivingBand: "$$$",
    climate: "Four-season continental",
    heroColors: ["#C43B3B", "#3E6DE0"],
  },
  "United Kingdom": {
    code: "GB",
    flag: "🇬🇧",
    region: "Europe",
    costOfLivingBand: "$$$",
    climate: "Temperate maritime",
    heroColors: ["#244A9A", "#C83C52"],
  },
};

const requirementById = new Map(
  sampleData.requirements.map((requirement) => [requirement.requirement_id, requirement])
);
const documentById = new Map(
  sampleData.documents.map((document) => [document.document_id, document])
);

function getUniqueVisas() {
  const visasById = new Map<string, SampleVisa>();

  sampleData.visas.forEach((visa) => {
    if (!visasById.has(visa.visa_id)) {
      visasById.set(visa.visa_id, visa);
    }
  });

  return [...visasById.values()];
}

function getCountryCategories(countryName: string) {
  return [...new Set(getUniqueVisas().filter((visa) => visa.country === countryName).map((visa) => visa.visa_type))];
}

function buildCountryHeadline(countryName: string) {
  const categories = getCountryCategories(countryName);

  if (categories.length === 0) {
    return `Imported starter dataset for ${countryName} relocation pathways.`;
  }

  if (categories.length === 1) {
    return `Imported starter dataset for ${countryName} ${categories[0].toLowerCase()} pathways.`;
  }

  return `Imported starter dataset for ${countryName} ${categories
    .slice(0, 2)
    .map((category) => category.toLowerCase())
    .join(" and ")} pathways.`;
}

function buildCountryHighlights(countryName: string) {
  return getCountryCategories(countryName).slice(0, 3).map((category) => `${category} routes`);
}

function buildCountries(): Country[] {
  return [...new Set(getUniqueVisas().map((visa) => visa.country))].map((countryName) => {
    const seed = countrySeeds[countryName] ?? {
      code: countryName.slice(0, 2).toUpperCase(),
      flag: "🌍",
      region: "Other",
      costOfLivingBand: "$$",
      climate: "Varies",
      heroColors: ["#245D7A", "#D36F3D"] as Country["heroColors"],
    };

    return {
      ...seed,
      name: countryName,
      headline: buildCountryHeadline(countryName),
      highlights: buildCountryHighlights(countryName),
    };
  });
}

function buildRequirementId(visaId: string, requirementId: string) {
  return `${visaId}-${requirementId}`.toLowerCase();
}

function buildMoneyDetail(requirement: SampleRequirement, value: number, unit: string | null) {
  if (!unit) {
    return `${requirement.description}. Threshold in sample data: ${value}.`;
  }

  return `${requirement.description}. Threshold in sample data: ${value} ${unit}.`;
}

function mapLanguageLevel(value: unknown, unit: string | null): LanguageLevel {
  if (unit === "CLB" && typeof value === "number") {
    return value >= 7 ? "fluent" : "conversational";
  }

  if (unit === "CEFR-B") {
    return "conversational";
  }

  return "conversational";
}

function mapRequirement(
  visaId: string,
  requirement: SampleRequirement,
  visaRequirement: SampleVisaRequirement
): Requirement | null {
  switch (requirement.requirement_id) {
    case "REQ001":
      return {
        id: buildRequirementId(visaId, requirement.requirement_id),
        label: requirement.name,
        field: "hasHealthInsurance",
        operator: "isTrue",
        detail: requirement.description,
      };
    case "REQ002":
      if (typeof visaRequirement.value !== "number") {
        return null;
      }

      return {
        id: buildRequirementId(visaId, requirement.requirement_id),
        label: requirement.name,
        field: "annualIncome",
        operator: "gte",
        value: visaRequirement.unit?.includes("/month")
          ? visaRequirement.value * 12
          : visaRequirement.value,
        detail: buildMoneyDetail(requirement, visaRequirement.value, visaRequirement.unit),
        premiumDetail: visaRequirement.unit?.includes("/month")
          ? "This MVP compares monthly thresholds against annual income by annualizing the sample amount."
          : undefined,
      };
    case "REQ003":
      return {
        id: buildRequirementId(visaId, requirement.requirement_id),
        label: requirement.name,
        field: "hasCriminalRecord",
        operator: "isFalse",
        detail: requirement.description,
      };
    case "REQ005":
      if (typeof visaRequirement.value !== "number") {
        return null;
      }

      return {
        id: buildRequirementId(visaId, requirement.requirement_id),
        label: requirement.name,
        field: "savingsAmount",
        operator: "gte",
        value: visaRequirement.value,
        detail: buildMoneyDetail(requirement, visaRequirement.value, visaRequirement.unit),
      };
    case "REQ006":
      return {
        id: buildRequirementId(visaId, requirement.requirement_id),
        label: requirement.name,
        field: "englishLevel",
        operator: "atLeastLanguage",
        value: mapLanguageLevel(visaRequirement.value, visaRequirement.unit),
        detail: visaRequirement.unit
          ? `${requirement.description}. Sample benchmark: ${visaRequirement.unit}${visaRequirement.value ?? ""}.`
          : requirement.description,
      };
    case "REQ007":
      return {
        id: buildRequirementId(visaId, requirement.requirement_id),
        label: requirement.name,
        field: "canWorkRemotely",
        operator: "isTrue",
        detail: requirement.description,
      };
    case "REQ008":
      return {
        id: buildRequirementId(visaId, requirement.requirement_id),
        label: requirement.name,
        field: "familyMembers",
        operator: "gte",
        value: 1,
        detail: `${requirement.description}. This MVP treats it as having at least one qualifying family member in profile data.`,
      };
    default:
      return null;
  }
}

function buildDocuments(visaId: string): PathwayChecklistItem[] {
  return sampleData.visa_documents
    .filter((document) => document.visa_id === visaId)
    .map((document) => {
      const definition = documentById.get(document.document_id);

      return {
        id: document.document_id,
        title: definition?.title ?? document.document_id,
        description: definition
          ? `${definition.description}. ${document.document_type} in the imported sample data.`
          : document.document_type,
      };
    });
}

function buildSteps(visaId: string): PathwayChecklistItem[] {
  return sampleData.visa_steps
    .filter((step) => step.visa_id === visaId)
    .sort((left, right) => left.order - right.order)
    .map((step) => ({
      id: step.step_id,
      title: step.title,
      description: `${step.description} ${step.step_type} step in the imported sample data.`,
    }));
}

function buildPremiumInsights(
  visa: SampleVisa,
  mappedRequirements: Requirement[],
  skippedRequirementLabels: string[],
  documents: PathwayChecklistItem[],
  steps: PathwayChecklistItem[]
) {
  const insights = [
    `${documents.length} sample documents and ${steps.length} application steps are attached to this route.`,
    `The imported sample dataset targets roughly ${visa.processing_time_days} processing days.`,
  ];

  if (skippedRequirementLabels.length > 0) {
    insights.unshift(
      `Additional sample checks still need richer profile fields before they can be auto-evaluated: ${skippedRequirementLabels.join(
        ", "
      )}.`
    );
  } else if (mappedRequirements.length > 0) {
    insights.unshift(
      `${mappedRequirements.length} imported eligibility checks are currently modeled in the MVP matcher.`
    );
  }

  return insights;
}

function buildOptionalBoosts(visaId: string) {
  return sampleData.visa_documents
    .filter(
      (document) =>
        document.visa_id === visaId &&
        document.document_type.toLowerCase() === "optional"
    )
    .map((document) => {
      const definition = documentById.get(document.document_id);
      return `Optional evidence: ${definition?.title ?? document.document_id}`;
    });
}

function buildVisas(countries: Country[]): Visa[] {
  const countryCodeByName = new Map(countries.map((country) => [country.name, country.code]));

  return getUniqueVisas().map((visa) => {
    const rawRequirements = sampleData.visa_requirements.filter(
      (requirement) => requirement.visa_id === visa.visa_id
    );
    const requirementMappings = rawRequirements.map((visaRequirement) => {
      const definition = requirementById.get(visaRequirement.requirement_id);

      return {
        definition,
        mappedRequirement: definition
          ? mapRequirement(visa.visa_id, definition, visaRequirement)
          : null,
      };
    });
    const mappedRequirements = requirementMappings
      .map((entry) => entry.mappedRequirement)
      .filter((requirement): requirement is Requirement => Boolean(requirement));
    const skippedRequirementLabels = requirementMappings
      .filter(
        (
          entry
        ): entry is {
          definition: SampleRequirement;
          mappedRequirement: null;
        } => Boolean(entry.definition) && entry.mappedRequirement === null
      )
      .map((entry) => entry.definition.name);
    const documents = buildDocuments(visa.visa_id);
    const steps = buildSteps(visa.visa_id);

    return {
      id: visa.visa_id,
      name: visa.visa_name,
      countryCode: countryCodeByName.get(visa.country) ?? visa.country.slice(0, 2).toUpperCase(),
      category: visa.visa_type,
      summary: visa.description,
      description: visa.description,
      processingTime: `~${visa.processing_time_days} days`,
      baseRequirements: mappedRequirements,
      alternativeGroups: [],
      optionalBoosts: buildOptionalBoosts(visa.visa_id),
      documents,
      steps,
      premiumInsights: buildPremiumInsights(
        visa,
        mappedRequirements,
        skippedRequirementLabels,
        documents,
        steps
      ),
      source: createPendingVisaSource(),
      isActive: true,
    };
  });
}

export const sampleCountries = buildCountries();
export const sampleVisas = buildVisas(sampleCountries);

export const sampleProfileDefaults: Pick<
  UserProfile,
  "annualIncome" | "savingsAmount" | "englishLevel" | "hasCriminalRecord" | "canWorkRemotely" | "hasHealthInsurance" | "familyMembers"
> = {
  annualIncome: 52000,
  savingsAmount: 18000,
  englishLevel: "native",
  hasCriminalRecord: false,
  canWorkRemotely: true,
  hasHealthInsurance: true,
  familyMembers: 1,
};
