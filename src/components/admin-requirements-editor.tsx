"use client";

import {
  ProfileField,
  Requirement,
  RequirementGroup,
  RequirementOperator,
} from "@/lib/types";

interface AdminRequirementsEditorProps {
  baseRequirements: Requirement[];
  alternativeGroups: RequirementGroup[];
  onBaseRequirementsChange: (requirements: Requirement[]) => void;
  onAlternativeGroupsChange: (groups: RequirementGroup[]) => void;
}

type FieldKind =
  | "number"
  | "boolean"
  | "array"
  | "education"
  | "language"
  | "enum"
  | "text";

interface Option {
  label: string;
  value: string;
}

interface FieldMeta {
  kind: FieldKind;
  label: string;
  options?: Option[];
}

const educationOptions: Option[] = [
  { value: "high_school", label: "High school" },
  { value: "associate", label: "Associate" },
  { value: "bachelor", label: "Bachelor" },
  { value: "master", label: "Master" },
  { value: "phd", label: "PhD" },
];

const languageOptions: Option[] = [
  { value: "basic", label: "Basic" },
  { value: "conversational", label: "Conversational" },
  { value: "fluent", label: "Fluent" },
  { value: "native", label: "Native" },
];

const maritalStatusOptions: Option[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "partnered", label: "Partnered" },
  { value: "divorced", label: "Divorced" },
];

const employmentOptions: Option[] = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-employed" },
  { value: "founder", label: "Founder" },
  { value: "student", label: "Student" },
  { value: "between_roles", label: "Between roles" },
];

const profileFieldMeta: Record<ProfileField, FieldMeta> = {
  fullName: { label: "Full name", kind: "text" },
  age: { label: "Age", kind: "number" },
  residenceCountry: { label: "Residence country", kind: "text" },
  citizenships: { label: "Citizenships", kind: "array" },
  maritalStatus: { label: "Marital status", kind: "enum", options: maritalStatusOptions },
  educationLevel: { label: "Education level", kind: "education", options: educationOptions },
  employmentStatus: { label: "Employment status", kind: "enum", options: employmentOptions },
  annualIncome: { label: "Annual income", kind: "number" },
  savingsAmount: { label: "Savings amount", kind: "number" },
  languages: { label: "Languages", kind: "array" },
  englishLevel: { label: "English level", kind: "language", options: languageOptions },
  workExperienceYears: { label: "Work experience (years)", kind: "number" },
  hasCriminalRecord: { label: "Has criminal record", kind: "boolean" },
  canWorkRemotely: { label: "Can work remotely", kind: "boolean" },
  hasHealthInsurance: { label: "Has health insurance", kind: "boolean" },
  hasJobOffer: { label: "Has job offer", kind: "boolean" },
  dependents: { label: "Dependents", kind: "number" },
  familyMembers: { label: "Family members", kind: "number" },
};

const operatorLabels: Record<RequirementOperator, string> = {
  gte: "Greater than or equal",
  lte: "Less than or equal",
  eq: "Equals",
  neq: "Does not equal",
  includesAny: "Includes any",
  isTrue: "Is true",
  isFalse: "Is false",
  atLeastEducation: "At least education level",
  atLeastLanguage: "At least language level",
};

const operatorsByKind: Record<FieldKind, RequirementOperator[]> = {
  number: ["gte", "lte", "eq", "neq"],
  boolean: ["isTrue", "isFalse"],
  array: ["includesAny"],
  education: ["atLeastEducation", "eq", "neq"],
  language: ["atLeastLanguage", "eq", "neq"],
  enum: ["eq", "neq"],
  text: ["eq", "neq"],
};

function makeLocalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getAllowedOperators(field: ProfileField) {
  return operatorsByKind[profileFieldMeta[field].kind];
}

function getDefaultValue(
  field: ProfileField,
  operator: RequirementOperator
): Requirement["value"] {
  const meta = profileFieldMeta[field];

  switch (operator) {
    case "gte":
    case "lte":
      return 0;
    case "isTrue":
    case "isFalse":
      return undefined;
    case "includesAny":
      return [];
    case "atLeastEducation":
      return "bachelor";
    case "atLeastLanguage":
      return "fluent";
    case "eq":
    case "neq":
      if (meta.kind === "number") {
        return 0;
      }

      if (meta.kind === "education") {
        return "bachelor";
      }

      if (meta.kind === "language") {
        return "fluent";
      }

      if (meta.kind === "enum") {
        return meta.options?.[0]?.value ?? "";
      }

      return "";
  }
}

function createEmptyRequirement(): Requirement {
  const field: ProfileField = "annualIncome";
  const operator = getAllowedOperators(field)[0];

  return {
    id: makeLocalId("requirement"),
    label: "New requirement",
    field,
    operator,
    value: getDefaultValue(field, operator),
    detail: "",
  };
}

function createEmptyGroup(): RequirementGroup {
  return {
    id: makeLocalId("group"),
    label: "Alternative pathway",
    description: "",
    requirements: [createEmptyRequirement()],
  };
}

function RequirementCard({
  requirement,
  heading,
  onChange,
  onRemove,
}: {
  requirement: Requirement;
  heading: string;
  onChange: (requirement: Requirement) => void;
  onRemove: () => void;
}) {
  const fieldMeta = profileFieldMeta[requirement.field];
  const allowedOperators = getAllowedOperators(requirement.field);

  const renderValueField = () => {
    if (requirement.operator === "isTrue" || requirement.operator === "isFalse") {
      return (
        <div className="field">
          <span>Comparison value</span>
          <div className="rule-note">This operator does not require a comparison value.</div>
        </div>
      );
    }

    if (
      requirement.operator === "gte" ||
      requirement.operator === "lte" ||
      (["eq", "neq"].includes(requirement.operator) && fieldMeta.kind === "number")
    ) {
      return (
        <label className="field">
          <span>Comparison value</span>
          <input
            type="number"
            value={typeof requirement.value === "number" ? requirement.value : 0}
            onChange={(event) =>
              onChange({
                ...requirement,
                value: Number(event.target.value),
              })
            }
          />
        </label>
      );
    }

    if (requirement.operator === "includesAny") {
      return (
        <label className="field">
          <span>Comparison values</span>
          <textarea
            placeholder="English, Spanish"
            rows={3}
            value={Array.isArray(requirement.value) ? requirement.value.join(", ") : ""}
            onChange={(event) =>
              onChange({
                ...requirement,
                value: event.target.value
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean),
              })
            }
          />
          <div className="rule-note">Use a comma-separated list.</div>
        </label>
      );
    }

    if (fieldMeta.kind === "education" || requirement.operator === "atLeastEducation") {
      return (
        <label className="field">
          <span>Comparison value</span>
          <select
            value={typeof requirement.value === "string" ? requirement.value : "bachelor"}
            onChange={(event) =>
              onChange({
                ...requirement,
                value: event.target.value,
              })
            }
          >
            {educationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (fieldMeta.kind === "language" || requirement.operator === "atLeastLanguage") {
      return (
        <label className="field">
          <span>Comparison value</span>
          <select
            value={typeof requirement.value === "string" ? requirement.value : "fluent"}
            onChange={(event) =>
              onChange({
                ...requirement,
                value: event.target.value,
              })
            }
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (fieldMeta.kind === "enum" && fieldMeta.options) {
      return (
        <label className="field">
          <span>Comparison value</span>
          <select
            value={
              typeof requirement.value === "string"
                ? requirement.value
                : fieldMeta.options[0]?.value ?? ""
            }
            onChange={(event) =>
              onChange({
                ...requirement,
                value: event.target.value,
              })
            }
          >
            {fieldMeta.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label className="field">
        <span>Comparison value</span>
        <input
          value={typeof requirement.value === "string" ? requirement.value : ""}
          onChange={(event) =>
            onChange({
              ...requirement,
              value: event.target.value,
            })
          }
        />
      </label>
    );
  };

  return (
    <div className="rule-card stack-md">
      <div className="rule-header">
        <strong>{heading}</strong>
        <button className="button ghost" onClick={onRemove} type="button">
          Remove
        </button>
      </div>

      <div className="rule-grid">
        <label className="field">
          <span>Requirement label</span>
          <input
            value={requirement.label}
            onChange={(event) =>
              onChange({
                ...requirement,
                label: event.target.value,
              })
            }
          />
        </label>

        <label className="field">
          <span>Profile field</span>
          <select
            value={requirement.field}
            onChange={(event) => {
              const nextField = event.target.value as ProfileField;
              const nextOperator = getAllowedOperators(nextField)[0];

              onChange({
                ...requirement,
                field: nextField,
                operator: nextOperator,
                value: getDefaultValue(nextField, nextOperator),
              });
            }}
          >
            {Object.entries(profileFieldMeta).map(([field, meta]) => (
              <option key={field} value={field}>
                {meta.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Operator</span>
          <select
            value={requirement.operator}
            onChange={(event) => {
              const nextOperator = event.target.value as RequirementOperator;

              onChange({
                ...requirement,
                operator: nextOperator,
                value: getDefaultValue(requirement.field, nextOperator),
              });
            }}
          >
            {allowedOperators.map((operator) => (
              <option key={operator} value={operator}>
                {operatorLabels[operator]}
              </option>
            ))}
          </select>
        </label>

        {renderValueField()}

        <label className="field field-span-2">
          <span>Requirement explanation</span>
          <textarea
            rows={3}
            value={requirement.detail}
            onChange={(event) =>
              onChange({
                ...requirement,
                detail: event.target.value,
              })
            }
          />
        </label>

        <label className="field field-span-2">
          <span>Premium explanation</span>
          <textarea
            rows={3}
            value={requirement.premiumDetail ?? ""}
            onChange={(event) =>
              onChange({
                ...requirement,
                premiumDetail: event.target.value,
              })
            }
          />
        </label>
      </div>
    </div>
  );
}

export function AdminRequirementsEditor({
  baseRequirements,
  alternativeGroups,
  onBaseRequirementsChange,
  onAlternativeGroupsChange,
}: AdminRequirementsEditorProps) {
  return (
    <div className="editor-section-grid">
      <section className="subtle-card stack-md">
        <div className="rule-header">
          <div>
            <strong>Base requirements</strong>
            <p className="muted">
              These requirements always apply to the visa.
            </p>
          </div>
          <button
            className="button ghost"
            onClick={() => onBaseRequirementsChange([...baseRequirements, createEmptyRequirement()])}
            type="button"
          >
            Add requirement
          </button>
        </div>

        <div className="rule-list">
          {baseRequirements.length > 0 ? (
            baseRequirements.map((requirement, index) => (
              <RequirementCard
                key={requirement.id}
                heading={`Base requirement ${index + 1}`}
                requirement={requirement}
                onChange={(nextRequirement) =>
                  onBaseRequirementsChange(
                    baseRequirements.map((entry, entryIndex) =>
                      entryIndex === index ? nextRequirement : entry
                    )
                  )
                }
                onRemove={() =>
                  onBaseRequirementsChange(
                    baseRequirements.filter((_, entryIndex) => entryIndex !== index)
                  )
                }
              />
            ))
          ) : (
            <div className="rule-note">No base requirements yet.</div>
          )}
        </div>
      </section>

      <section className="subtle-card stack-md">
        <div className="rule-header">
          <div>
            <strong>Alternative requirement groups</strong>
            <p className="muted">
              Add groups when the applicant can qualify through one of several paths.
            </p>
          </div>
          <button
            className="button ghost"
            onClick={() => onAlternativeGroupsChange([...alternativeGroups, createEmptyGroup()])}
            type="button"
          >
            Add group
          </button>
        </div>

        <div className="rule-list">
          {alternativeGroups.length > 0 ? (
            alternativeGroups.map((group, groupIndex) => (
              <div key={group.id} className="rule-group stack-md">
                <div className="rule-header">
                  <strong>Alternative group {groupIndex + 1}</strong>
                  <button
                    className="button ghost"
                    onClick={() =>
                      onAlternativeGroupsChange(
                        alternativeGroups.filter((_, index) => index !== groupIndex)
                      )
                    }
                    type="button"
                  >
                    Remove group
                  </button>
                </div>

                <div className="rule-grid">
                  <label className="field">
                    <span>Group label</span>
                    <input
                      value={group.label}
                      onChange={(event) =>
                        onAlternativeGroupsChange(
                          alternativeGroups.map((entry, index) =>
                            index === groupIndex
                              ? { ...entry, label: event.target.value }
                              : entry
                          )
                        )
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Group description</span>
                    <input
                      value={group.description}
                      onChange={(event) =>
                        onAlternativeGroupsChange(
                          alternativeGroups.map((entry, index) =>
                            index === groupIndex
                              ? { ...entry, description: event.target.value }
                              : entry
                          )
                        )
                      }
                    />
                  </label>
                </div>

                <div className="rule-header">
                  <strong>Group requirements</strong>
                  <button
                    className="button ghost"
                    onClick={() =>
                      onAlternativeGroupsChange(
                        alternativeGroups.map((entry, index) =>
                          index === groupIndex
                            ? {
                                ...entry,
                                requirements: [...entry.requirements, createEmptyRequirement()],
                              }
                            : entry
                        )
                      )
                    }
                    type="button"
                  >
                    Add requirement
                  </button>
                </div>

                <div className="rule-list">
                  {group.requirements.length > 0 ? (
                    group.requirements.map((requirement, requirementIndex) => (
                      <RequirementCard
                        key={requirement.id}
                        heading={`Group requirement ${requirementIndex + 1}`}
                        requirement={requirement}
                        onChange={(nextRequirement) =>
                          onAlternativeGroupsChange(
                            alternativeGroups.map((entry, index) =>
                              index === groupIndex
                                ? {
                                    ...entry,
                                    requirements: entry.requirements.map(
                                      (groupRequirement, groupRequirementIndex) =>
                                        groupRequirementIndex === requirementIndex
                                          ? nextRequirement
                                          : groupRequirement
                                    ),
                                  }
                                : entry
                            )
                          )
                        }
                        onRemove={() =>
                          onAlternativeGroupsChange(
                            alternativeGroups.map((entry, index) =>
                              index === groupIndex
                                ? {
                                    ...entry,
                                    requirements: entry.requirements.filter(
                                      (_, groupRequirementIndex) =>
                                        groupRequirementIndex !== requirementIndex
                                    ),
                                  }
                                : entry
                            )
                          )
                        }
                      />
                    ))
                  ) : (
                    <div className="rule-note">This group has no requirements yet.</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rule-note">No alternative groups yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
