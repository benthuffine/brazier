"use client";

import { DragEvent, useEffect, useState } from "react";

import { AdminRequirementsEditor } from "@/components/admin-requirements-editor";
import { useAppState } from "@/components/providers/app-state-provider";
import {
  Country,
  PathwayChecklistItem,
  Requirement,
  RequirementGroup,
  Visa,
  VisaSource,
} from "@/lib/types";
import { createPendingVisaSource, getVisaReviewStatusLabel } from "@/lib/visa-source";

const blankTemplateVisaId = "__blank__";
type AdminConsoleTab = "visas" | "requirements" | "documents" | "steps";

interface NewVisaFormState {
  name: string;
  countryCode: string;
  category: string;
  templateVisaId: string;
}

interface NewCountryFormState {
  code: string;
  name: string;
  flag: string;
  region: string;
}

const defaultNewVisaForm: NewVisaFormState = {
  name: "",
  countryCode: "",
  category: "Digital Nomad",
  templateVisaId: blankTemplateVisaId,
};

const defaultNewCountryForm: NewCountryFormState = {
  code: "",
  name: "",
  flag: "",
  region: "",
};

const defaultCountryHeroColors: Country["heroColors"] = ["#8A3DF5", "#18C9DD"];

function makeLocalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildVisaId(countryCode: string, name: string, visas: Visa[]) {
  const base = [countryCode.toLowerCase(), slugify(name) || "new-visa"].join("-");
  const existingIds = new Set(visas.map((visa) => visa.id));

  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;

  while (existingIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

function sanitizeCountryCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
}

function getVisaRequirementCount(visa: Visa) {
  return (
    visa.baseRequirements.length +
    visa.alternativeGroups.reduce(
      (count, group) => count + group.requirements.length,
      0
    )
  );
}

function buildCountryFromForm(form: NewCountryFormState): Country {
  const countryName = form.name.trim();

  return {
    code: sanitizeCountryCode(form.code),
    name: countryName,
    flag: form.flag.trim() || "🌍",
    region: form.region.trim() || "Other",
    headline: `${countryName} visa pathways are being prepared for catalog launch.`,
    costOfLivingBand: "$$",
    climate: "Varies by region",
    heroColors: defaultCountryHeroColors,
    highlights: ["Visa data in progress", "Source review pending"],
  };
}

function cloneRequirements(requirements: Requirement[], prefix: string) {
  return requirements.map((requirement, index) => ({
    ...requirement,
    id: `${prefix}-req-${index + 1}`,
  }));
}

function cloneRequirementGroups(groups: RequirementGroup[], prefix: string) {
  return groups.map((group, groupIndex) => ({
    ...group,
    id: `${prefix}-group-${groupIndex + 1}`,
    requirements: cloneRequirements(
      group.requirements,
      `${prefix}-group-${groupIndex + 1}`
    ),
  }));
}

function cloneChecklistItems(items: PathwayChecklistItem[], prefix: string) {
  return items.map((item, index) => ({
    ...item,
    id: `${prefix}-${index + 1}`,
  }));
}

function createVisaFromTemplate(
  template: Visa,
  form: NewVisaFormState,
  visas: Visa[]
): Visa {
  const visaId = buildVisaId(form.countryCode, form.name, visas);

  return {
    ...template,
    id: visaId,
    name: form.name.trim(),
    countryCode: form.countryCode,
    category: form.category.trim(),
    isActive: true,
    baseRequirements: cloneRequirements(template.baseRequirements, `${visaId}-base`),
    alternativeGroups: cloneRequirementGroups(template.alternativeGroups, visaId),
    documents: cloneChecklistItems(template.documents, `${visaId}-doc`),
    steps: cloneChecklistItems(template.steps, `${visaId}-step`),
    optionalBoosts: [...template.optionalBoosts],
    premiumInsights: [...template.premiumInsights],
    source: createPendingVisaSource(),
  };
}

function createBlankVisa(form: NewVisaFormState, visas: Visa[]): Visa {
  return {
    id: buildVisaId(form.countryCode, form.name, visas),
    name: form.name.trim(),
    countryCode: form.countryCode,
    category: form.category.trim(),
    summary: "",
    description: "",
    processingTime: "",
    baseRequirements: [],
    alternativeGroups: [],
    optionalBoosts: [],
    documents: [],
    steps: [],
    premiumInsights: [],
    source: createPendingVisaSource(),
    isActive: true,
  };
}

export function AdminConsole() {
  const {
    visas,
    countries,
    createCountry,
    createVisa,
    deleteVisa,
    reorderVisas,
    updateVisa,
    ready,
  } = useAppState();
  const [activeTab, setActiveTab] = useState<AdminConsoleTab>("visas");
  const [selectedVisaId, setSelectedVisaId] = useState("");
  const [draft, setDraft] = useState<Visa | null>(null);
  const [newCountryForm, setNewCountryForm] =
    useState<NewCountryFormState>(defaultNewCountryForm);
  const [newVisaForm, setNewVisaForm] = useState<NewVisaFormState>(defaultNewVisaForm);
  const [draggedVisaId, setDraggedVisaId] = useState<string | null>(null);
  const [dropTargetVisaId, setDropTargetVisaId] = useState<string | null>(null);

  useEffect(() => {
    if (!countries.length) {
      return;
    }

    setNewVisaForm((current) => ({
      ...current,
      countryCode: current.countryCode || countries[0]?.code || "",
      templateVisaId:
        current.templateVisaId === blankTemplateVisaId ||
        visas.some((visa) => visa.id === current.templateVisaId)
          ? current.templateVisaId
          : blankTemplateVisaId,
    }));
  }, [countries, visas]);

  useEffect(() => {
    if (!visas.length) {
      setSelectedVisaId("");
      setDraft(null);
      return;
    }

    const selected = selectedVisaId
      ? visas.find((visa) => visa.id === selectedVisaId)
      : undefined;

    if (selected) {
      setDraft(selected);
      return;
    }

    setSelectedVisaId(visas[0].id);
    setDraft(visas[0]);
  }, [selectedVisaId, visas]);

  if (!ready) {
    return <div className="panel">Loading admin console…</div>;
  }

  const selectedCountry = draft
    ? countries.find((country) => country.code === draft.countryCode)
    : null;
  const canCreateVisa =
    newVisaForm.name.trim().length > 0 &&
    newVisaForm.countryCode.length > 0 &&
    newVisaForm.category.trim().length > 0;
  const normalizedCountryCode = sanitizeCountryCode(newCountryForm.code);
  const canCreateCountry =
    normalizedCountryCode.length >= 2 &&
    newCountryForm.name.trim().length > 0 &&
    !countries.some((country) => country.code === normalizedCountryCode);
  const tabs: Array<{
    count: number;
    id: AdminConsoleTab;
    label: string;
  }> = [
    { id: "visas", label: "Visas", count: visas.length },
    {
      id: "requirements",
      label: "Requirements",
      count: draft ? getVisaRequirementCount(draft) : 0,
    },
    {
      id: "documents",
      label: "Documents",
      count: draft?.documents.length ?? 0,
    },
    {
      id: "steps",
      label: "Application steps",
      count: draft?.steps.length ?? 0,
    },
  ];
  const requirementPreview = draft
    ? [
        ...draft.baseRequirements.map((requirement) => requirement.label),
        ...draft.alternativeGroups.flatMap((group) =>
          group.requirements.map((requirement) => requirement.label)
        ),
      ]
        .filter(Boolean)
        .slice(0, 4)
    : [];

  const updateDraftValue = <K extends keyof Visa>(field: K, value: Visa[K]) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const updateSourceValue = <K extends keyof VisaSource>(
    field: K,
    value: VisaSource[K]
  ) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            source: {
              ...current.source,
              [field]: value,
            },
          }
        : current
    );
  };

  const updateStringList = (
    field: "optionalBoosts" | "premiumInsights",
    index: number,
    value: string
  ) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      const nextValues = current[field].map((entry, entryIndex) =>
        entryIndex === index ? value : entry
      );

      return {
        ...current,
        [field]: nextValues,
      };
    });
  };

  const addStringListItem = (field: "optionalBoosts" | "premiumInsights") => {
    setDraft((current) =>
      current
        ? {
            ...current,
            [field]: [...current[field], ""],
          }
        : current
    );
  };

  const removeStringListItem = (
    field: "optionalBoosts" | "premiumInsights",
    index: number
  ) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: current[field].filter((_, entryIndex) => entryIndex !== index),
      };
    });
  };

  const updateChecklistItem = (
    field: "documents" | "steps",
    index: number,
    patch: Partial<PathwayChecklistItem>
  ) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: current[field].map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item
        ),
      };
    });
  };

  const addChecklistItem = (field: "documents" | "steps") => {
    const nextItem: PathwayChecklistItem = {
      id: makeLocalId(field === "documents" ? "doc" : "step"),
      title: "",
      description: "",
    };

    setDraft((current) =>
      current
        ? {
            ...current,
            [field]: [...current[field], nextItem],
          }
        : current
    );
  };

  const removeChecklistItem = (field: "documents" | "steps", index: number) => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleCreateVisa = () => {
    if (!canCreateVisa) {
      return;
    }

    const templateVisa = visas.find((visa) => visa.id === newVisaForm.templateVisaId);
    const nextVisa =
      newVisaForm.templateVisaId === blankTemplateVisaId || !templateVisa
        ? createBlankVisa(newVisaForm, visas)
        : createVisaFromTemplate(templateVisa, newVisaForm, visas);

    createVisa(nextVisa);
    setSelectedVisaId(nextVisa.id);
    setDraft(nextVisa);
    setNewVisaForm((current) => ({
      ...current,
      name: "",
    }));
  };

  const handleCreateCountry = () => {
    if (!canCreateCountry) {
      return;
    }

    const nextCountry = buildCountryFromForm(newCountryForm);

    createCountry(nextCountry);
    setNewVisaForm((current) => ({
      ...current,
      countryCode: nextCountry.code,
    }));
    setNewCountryForm(defaultNewCountryForm);
  };

  const handleArchiveToggle = () => {
    if (!draft) {
      return;
    }

    const nextDraft = {
      ...draft,
      isActive: !draft.isActive,
    };

    setDraft(nextDraft);
    updateVisa(nextDraft.id, nextDraft);
  };

  const handleDeleteSelectedVisa = () => {
    if (!draft) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${draft.name}"? This also removes saved pathways tied to it.`
    );

    if (!shouldDelete) {
      return;
    }

    const currentIndex = visas.findIndex((visa) => visa.id === draft.id);
    const nextSelectedVisa = visas[currentIndex + 1] ?? visas[currentIndex - 1] ?? null;

    setSelectedVisaId(nextSelectedVisa?.id ?? "");
    setDraft(nextSelectedVisa);
    deleteVisa(draft.id);
  };

  const focusVisaEditor = (visaId: string, nextTab: AdminConsoleTab = "visas") => {
    setSelectedVisaId(visaId);
    setActiveTab(nextTab);
  };

  const buildReorderedVisaIds = (sourceId: string, targetId: string) => {
    const orderedIds = visas.map((visa) => visa.id);
    const sourceIndex = orderedIds.indexOf(sourceId);
    const targetIndex = orderedIds.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
      return null;
    }

    const nextIds = [...orderedIds];
    const [movedId] = nextIds.splice(sourceIndex, 1);
    nextIds.splice(targetIndex, 0, movedId);

    return nextIds;
  };

  const handleDragStart = (event: DragEvent<HTMLElement>, visaId: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", visaId);
    setDraggedVisaId(visaId);
  };

  const handleDrop = (targetVisaId: string) => {
    if (!draggedVisaId) {
      return;
    }

    const nextIds = buildReorderedVisaIds(draggedVisaId, targetVisaId);

    setDraggedVisaId(null);
    setDropTargetVisaId(null);

    if (nextIds) {
      reorderVisas(nextIds);
    }
  };

  const renderChecklistPanel = (
    field: "documents" | "steps",
    title: string,
    description: string,
    addLabel: string
  ) => {
    if (!draft) {
      return (
        <section className="admin-surface">
          <div className="group-note">
            Select a visa from the table first, then manage its {field}.
          </div>
        </section>
      );
    }

    return (
      <section className="admin-surface stack-lg">
        <div className="admin-surface-header">
          <div>
            <p className="eyebrow">{title}</p>
            <h2>{draft.name}</h2>
          </div>
          <div className="actions-row">
            <button
              className="button ghost"
              onClick={() => setActiveTab("visas")}
              type="button"
            >
              Back to visas
            </button>
            <button
              className="button primary"
              onClick={() => addChecklistItem(field)}
              type="button"
            >
              {addLabel}
            </button>
          </div>
        </div>
        <p className="muted">{description}</p>
        <div className="admin-list-editor">
          {draft[field].map((item, index) => (
            <article key={item.id} className="admin-list-editor-row">
              <div className="admin-list-editor-fields">
                <label className="field">
                  <span>{title.slice(0, -1)} title</span>
                  <input
                    placeholder={`${title.slice(0, -1)} title`}
                    value={item.title}
                    onChange={(event) =>
                      updateChecklistItem(field, index, {
                        title: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Description</span>
                  <textarea
                    placeholder={`${title.slice(0, -1)} description`}
                    rows={3}
                    value={item.description}
                    onChange={(event) =>
                      updateChecklistItem(field, index, {
                        description: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <button
                className="button ghost"
                onClick={() => removeChecklistItem(field, index)}
                type="button"
              >
                Remove
              </button>
            </article>
          ))}
          {draft[field].length === 0 ? (
            <div className="group-note">
              No {field} yet. Use {addLabel.toLowerCase()} to create the first item.
            </div>
          ) : null}
        </div>
      </section>
    );
  };

  const renderCatalogPanel = () => (
    <div className="stack-lg">
      <section className="admin-surface stack-lg">
        <div className="admin-surface-header">
          <div>
            <p className="eyebrow">Visas</p>
            <h2>Inline catalog editor</h2>
          </div>
          <p className="muted">
            Click any row to edit inline. Drag rows to reorder the catalog.
          </p>
        </div>
        <div className="admin-catalog-layout">
          <div className="admin-table-shell">
            <table className="admin-inline-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Processing</th>
                  <th>Requirements</th>
                  <th>Documents</th>
                  <th>Steps</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {visas.map((visa) => {
                  const isSelected = draft?.id === visa.id;
                  const rowVisa = isSelected && draft ? draft : visa;
                  const rowCountry = countries.find(
                    (country) => country.code === rowVisa.countryCode
                  );

                  return (
                    <tr
                      key={visa.id}
                      className={`admin-table-row${isSelected ? " selected" : ""}${draggedVisaId === visa.id ? " dragging" : ""}${dropTargetVisaId === visa.id ? " drag-target" : ""}`}
                      draggable
                      onClick={() => focusVisaEditor(visa.id)}
                      onDragEnd={() => {
                        setDraggedVisaId(null);
                        setDropTargetVisaId(null);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (draggedVisaId && draggedVisaId !== visa.id) {
                          setDropTargetVisaId(visa.id);
                        }
                      }}
                      onDragStart={(event) => handleDragStart(event, visa.id)}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleDrop(visa.id);
                      }}
                    >
                      <td>
                        {isSelected ? (
                          <select
                            className="admin-cell-select"
                            value={rowVisa.countryCode}
                            onChange={(event) =>
                              updateDraftValue("countryCode", event.target.value)
                            }
                          >
                            {countries.map((country) => (
                              <option key={country.code} value={country.code}>
                                {country.flag} {country.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            className="admin-row-select"
                            onClick={() => focusVisaEditor(visa.id)}
                            type="button"
                          >
                            {rowCountry?.name ?? rowVisa.countryCode}
                          </button>
                        )}
                      </td>
                      <td>
                        {isSelected ? (
                          <input
                            className="admin-cell-input"
                            value={rowVisa.name}
                            onChange={(event) =>
                              updateDraftValue("name", event.target.value)
                            }
                          />
                        ) : (
                          <span className="admin-cell-primary">{rowVisa.name}</span>
                        )}
                      </td>
                      <td>
                        {isSelected ? (
                          <input
                            className="admin-cell-input"
                            value={rowVisa.category}
                            onChange={(event) =>
                              updateDraftValue("category", event.target.value)
                            }
                          />
                        ) : (
                          rowVisa.category
                        )}
                      </td>
                      <td>
                        {isSelected ? (
                          <input
                            className="admin-cell-input"
                            value={rowVisa.processingTime}
                            onChange={(event) =>
                              updateDraftValue("processingTime", event.target.value)
                            }
                          />
                        ) : (
                          rowVisa.processingTime || "TBD"
                        )}
                      </td>
                      <td>
                        <button
                          className="admin-inline-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            focusVisaEditor(visa.id, "requirements");
                          }}
                          type="button"
                        >
                          {getVisaRequirementCount(rowVisa)} rules
                        </button>
                      </td>
                      <td>
                        <button
                          className="admin-inline-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            focusVisaEditor(visa.id, "documents");
                          }}
                          type="button"
                        >
                          {rowVisa.documents.length} items
                        </button>
                      </td>
                      <td>
                        <button
                          className="admin-inline-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            focusVisaEditor(visa.id, "steps");
                          }}
                          type="button"
                        >
                          {rowVisa.steps.length} items
                        </button>
                      </td>
                      <td>
                        {isSelected ? (
                          <label className="admin-inline-toggle">
                            <input
                              checked={rowVisa.isActive}
                              onChange={(event) =>
                                updateDraftValue("isActive", event.target.checked)
                              }
                              type="checkbox"
                            />
                            <span>{rowVisa.isActive ? "Yes" : "No"}</span>
                          </label>
                        ) : (
                          <span>{rowVisa.isActive ? "Yes" : "No"}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <aside className="admin-context-card">
            {draft ? (
              <>
                <div className="stack-sm">
                  <p className="eyebrow">Selected visa</p>
                  <h3>{draft.name}</h3>
                  <p className="muted">
                    {selectedCountry?.flag ?? "🌍"} {selectedCountry?.name ?? "Country"} ·{" "}
                    {draft.category}
                  </p>
                </div>

                <div className="admin-context-stats">
                  <div className="admin-context-stat">
                    <span>Requirements</span>
                    <strong>{getVisaRequirementCount(draft)}</strong>
                  </div>
                  <div className="admin-context-stat">
                    <span>Documents</span>
                    <strong>{draft.documents.length}</strong>
                  </div>
                  <div className="admin-context-stat">
                    <span>Steps</span>
                    <strong>{draft.steps.length}</strong>
                  </div>
                </div>

                <div className="stack-sm">
                  <strong>Requirements preview</strong>
                  <div className="admin-chip-list">
                    {requirementPreview.map((label) => (
                      <span key={label} className="admin-chip">
                        {label}
                      </span>
                    ))}
                    {requirementPreview.length === 0 ? (
                      <span className="muted">No requirements yet.</span>
                    ) : null}
                  </div>
                </div>

                <div className="actions-row">
                  <button
                    className="button ghost"
                    onClick={() => setActiveTab("requirements")}
                    type="button"
                  >
                    Edit requirements
                  </button>
                  <button
                    className="button ghost"
                    onClick={() => setActiveTab("documents")}
                    type="button"
                  >
                    Edit documents
                  </button>
                  <button
                    className="button ghost"
                    onClick={() => setActiveTab("steps")}
                    type="button"
                  >
                    Edit steps
                  </button>
                </div>
              </>
            ) : (
              <div className="group-note">
                Select a visa row to inspect its requirements, documents, and steps.
              </div>
            )}
          </aside>
        </div>
      </section>

      {draft ? (
        <>
          <div className="admin-detail-grid">
            <article className="admin-surface stack-md">
              <div className="space-between">
                <div>
                  <p className="eyebrow">Visa copy</p>
                  <h3>Summary and description</h3>
                </div>
                <span className="pill">{draft.id}</span>
              </div>
              <div className="form-grid">
                <label className="field field-span-2">
                  <span>Summary</span>
                  <textarea
                    value={draft.summary}
                    onChange={(event) => updateDraftValue("summary", event.target.value)}
                    rows={3}
                  />
                </label>
                <label className="field field-span-2">
                  <span>Description</span>
                  <textarea
                    value={draft.description}
                    onChange={(event) =>
                      updateDraftValue("description", event.target.value)
                    }
                    rows={5}
                  />
                </label>
              </div>
            </article>

            <article className="admin-surface stack-md">
              <div className="space-between">
                <strong>Source and review</strong>
                <span className={`tag review-tag review-${draft.source.reviewStatus}`}>
                  {getVisaReviewStatusLabel(draft.source.reviewStatus)}
                </span>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Official authority</span>
                  <input
                    placeholder="Ministry or immigration authority"
                    value={draft.source.authorityName}
                    onChange={(event) =>
                      updateSourceValue("authorityName", event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Review status</span>
                  <select
                    value={draft.source.reviewStatus}
                    onChange={(event) =>
                      updateSourceValue(
                        "reviewStatus",
                        event.target.value as VisaSource["reviewStatus"]
                      )
                    }
                  >
                    <option value="pending_source">Source pending</option>
                    <option value="needs_review">Needs review</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="stale">Review stale</option>
                  </select>
                </label>
                <label className="field field-span-2">
                  <span>Official URL</span>
                  <input
                    placeholder="https://..."
                    value={draft.source.officialUrl}
                    onChange={(event) =>
                      updateSourceValue("officialUrl", event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Last reviewed</span>
                  <input
                    type="date"
                    value={draft.source.lastReviewedAt}
                    onChange={(event) =>
                      updateSourceValue("lastReviewedAt", event.target.value)
                    }
                  />
                </label>
                <label className="field field-span-2">
                  <span>Review notes</span>
                  <textarea
                    placeholder="Internal review notes, update caveats, or research reminders."
                    rows={4}
                    value={draft.source.reviewNotes}
                    onChange={(event) =>
                      updateSourceValue("reviewNotes", event.target.value)
                    }
                  />
                </label>
              </div>
            </article>
          </div>

          <div className="admin-detail-grid">
            <article className="admin-surface stack-md">
              <div className="space-between">
                <strong>Optional boosts</strong>
                <button
                  className="button ghost"
                  onClick={() => addStringListItem("optionalBoosts")}
                  type="button"
                >
                  Add boost
                </button>
              </div>
              {draft.optionalBoosts.map((boost, index) => (
                <div key={`${draft.id}-boost-${index}`} className="stack-sm">
                  <input
                    value={boost}
                    onChange={(event) =>
                      updateStringList("optionalBoosts", index, event.target.value)
                    }
                  />
                  <button
                    className="button ghost"
                    onClick={() => removeStringListItem("optionalBoosts", index)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {draft.optionalBoosts.length === 0 ? (
                <div className="group-note">No boosts added for this visa yet.</div>
              ) : null}
            </article>

            <article className="admin-surface stack-md">
              <div className="space-between">
                <strong>Premium insights</strong>
                <button
                  className="button ghost"
                  onClick={() => addStringListItem("premiumInsights")}
                  type="button"
                >
                  Add insight
                </button>
              </div>
              {draft.premiumInsights.map((insight, index) => (
                <div key={`${draft.id}-insight-${index}`} className="stack-sm">
                  <textarea
                    value={insight}
                    onChange={(event) =>
                      updateStringList("premiumInsights", index, event.target.value)
                    }
                    rows={3}
                  />
                  <button
                    className="button ghost"
                    onClick={() => removeStringListItem("premiumInsights", index)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {draft.premiumInsights.length === 0 ? (
                <div className="group-note">No premium insights added for this visa yet.</div>
              ) : null}
            </article>
          </div>
        </>
      ) : null}
    </div>
  );

  const renderCurrentPanel = () => {
    if (activeTab === "requirements") {
      return draft ? (
        <section className="admin-surface stack-lg">
          <div className="admin-surface-header">
            <div>
              <p className="eyebrow">Requirements</p>
              <h2>{draft.name}</h2>
            </div>
            <div className="actions-row">
              <button
                className="button ghost"
                onClick={() => setActiveTab("visas")}
                type="button"
              >
                Back to visas
              </button>
            </div>
          </div>
          <p className="muted">
            Build base requirements and alternative pathways for the selected visa.
          </p>
          <AdminRequirementsEditor
            alternativeGroups={draft.alternativeGroups}
            baseRequirements={draft.baseRequirements}
            onAlternativeGroupsChange={(groups) =>
              updateDraftValue("alternativeGroups", groups)
            }
            onBaseRequirementsChange={(requirements) =>
              updateDraftValue("baseRequirements", requirements)
            }
          />
        </section>
      ) : (
        <section className="admin-surface">
          <div className="group-note">
            Select a visa from the table first, then manage its requirements.
          </div>
        </section>
      );
    }

    if (activeTab === "documents") {
      return renderChecklistPanel(
        "documents",
        "Documents",
        "Document items stay scoped to the selected visa, but the editor layout mirrors the admin mockup's global workbench.",
        "Add document"
      );
    }

    if (activeTab === "steps") {
      return renderChecklistPanel(
        "steps",
        "Steps",
        "Application steps are edited in a dedicated tab so the main visa table stays compact and fast to scan.",
        "Add step"
      );
    }

    return renderCatalogPanel();
  };

  return (
    <div className="admin-workbench">
      <aside className="admin-rail">
        <div className="admin-rail-brand">
          <p className="eyebrow">Admin</p>
          <strong>Visa catalog</strong>
          <span>
            {visas.length} visas · {countries.length} countries
          </span>
        </div>

        <div className="admin-tab-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-tab-button${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <span>{tab.label}</span>
              <strong>{tab.count}</strong>
            </button>
          ))}
        </div>

        <section className="admin-rail-card stack-md">
          <div>
            <p className="eyebrow">New visa</p>
            <h2>Create visa</h2>
          </div>
          <label className="field">
            <span>Visa name</span>
            <input
              placeholder="Portugal Golden Visa"
              value={newVisaForm.name}
              onChange={(event) =>
                setNewVisaForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Country</span>
            <select
              value={newVisaForm.countryCode}
              onChange={(event) =>
                setNewVisaForm((current) => ({
                  ...current,
                  countryCode: event.target.value,
                }))
              }
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Category</span>
            <input
              value={newVisaForm.category}
              onChange={(event) =>
                setNewVisaForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Starting point</span>
            <select
              value={newVisaForm.templateVisaId}
              onChange={(event) =>
                setNewVisaForm((current) => ({
                  ...current,
                  templateVisaId: event.target.value,
                }))
              }
            >
              <option value={blankTemplateVisaId}>Blank visa</option>
              {visas.map((visa) => (
                <option key={visa.id} value={visa.id}>
                  {visa.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button primary"
            disabled={!canCreateVisa}
            onClick={handleCreateVisa}
            type="button"
          >
            Create and open
          </button>
        </section>

        <section className="admin-rail-card stack-md">
          <div>
            <p className="eyebrow">New country</p>
            <h2>Add destination</h2>
          </div>
          <label className="field">
            <span>Country name</span>
            <input
              placeholder="Japan"
              value={newCountryForm.name}
              onChange={(event) =>
                setNewCountryForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </label>
          <div className="mini-form-grid">
            <label className="field">
              <span>Code</span>
              <input
                placeholder="JP"
                value={newCountryForm.code}
                onChange={(event) =>
                  setNewCountryForm((current) => ({
                    ...current,
                    code: sanitizeCountryCode(event.target.value),
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Flag</span>
              <input
                placeholder="🇯🇵"
                value={newCountryForm.flag}
                onChange={(event) =>
                  setNewCountryForm((current) => ({
                    ...current,
                    flag: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label className="field">
            <span>Region</span>
            <input
              placeholder="Asia"
              value={newCountryForm.region}
              onChange={(event) =>
                setNewCountryForm((current) => ({
                  ...current,
                  region: event.target.value,
                }))
              }
            />
          </label>
          <button
            className="button primary"
            disabled={!canCreateCountry}
            onClick={handleCreateCountry}
            type="button"
          >
            Add country
          </button>
        </section>
      </aside>

      <section className="admin-board">
        <div className="admin-board-header">
          <div>
            <p className="eyebrow">Admin workbench</p>
            <h1>
              {draft ? `${selectedCountry?.flag ?? "🌍"} ${draft.name}` : "Visa content editor"}
            </h1>
            <p className="muted">
              The desktop shell now follows the latest mockup: left tabs, inline
              editing, and focused editors for requirements, documents, and steps.
            </p>
          </div>
          {draft ? (
            <div className="actions-row">
              <button
                className="button primary"
                onClick={() => updateVisa(draft.id, draft)}
                type="button"
              >
                Save changes
              </button>
              <button
                className="button secondary"
                onClick={handleArchiveToggle}
                type="button"
              >
                {draft.isActive ? "Archive visa" : "Restore visa"}
              </button>
              <button
                className="button danger"
                onClick={handleDeleteSelectedVisa}
                type="button"
              >
                Delete visa
              </button>
            </div>
          ) : null}
        </div>

        {renderCurrentPanel()}
      </section>
    </div>
  );
}
