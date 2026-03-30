"use client";

import { useEffect, useState } from "react";

import { useAppState } from "@/components/providers/app-state-provider";
import { Visa } from "@/lib/types";

export function AdminConsole() {
  const { visas, countries, updateVisa, ready } = useAppState();
  const [selectedVisaId, setSelectedVisaId] = useState(visas[0]?.id ?? "");
  const [draft, setDraft] = useState<Visa | null>(visas[0] ?? null);

  useEffect(() => {
    const selected = visas.find((visa) => visa.id === selectedVisaId) ?? visas[0] ?? null;
    setDraft(selected);
  }, [selectedVisaId, visas]);

  if (!ready || !draft) {
    return <div className="panel">Loading admin console…</div>;
  }

  const selectedCountry = countries.find((country) => country.code === draft.countryCode);

  return (
    <div className="stack-lg admin-shell">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Admin MVP</p>
            <h1>Visa content editor</h1>
          </div>
          <span className="pill">Desktop-first</span>
        </div>
        <p className="muted">
          This is the lightweight editorial surface for the MVP. It proves the
          data model and editing workflow before wiring in authentication and a
          real database.
        </p>
      </section>

      <div className="admin-grid">
        <aside className="panel">
          <div className="stack-sm">
            {visas.map((visa) => (
              <button
                key={visa.id}
                className={`list-button${selectedVisaId === visa.id ? " active" : ""}`}
                onClick={() => setSelectedVisaId(visa.id)}
                type="button"
              >
                <strong>{visa.name}</strong>
                <span className="muted">
                  {countries.find((country) => country.code === visa.countryCode)?.name}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">
                {selectedCountry?.flag} {selectedCountry?.name}
              </p>
              <h2>{draft.name}</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Summary</span>
              <textarea
                value={draft.summary}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, summary: event.target.value } : current
                  )
                }
                rows={3}
              />
            </label>
            <label className="field">
              <span>Processing time</span>
              <input
                value={draft.processingTime}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, processingTime: event.target.value } : current
                  )
                }
              />
            </label>
            <label className="field field-span-2">
              <span>Description</span>
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, description: event.target.value } : current
                  )
                }
                rows={5}
              />
            </label>
            <label className="field checkbox-field">
              <input
                checked={draft.isActive}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, isActive: event.target.checked } : current
                  )
                }
                type="checkbox"
              />
              <span>Visa active</span>
            </label>
          </div>

          <div className="actions-row">
            <button
              className="button primary"
              onClick={() => updateVisa(draft.id, draft)}
              type="button"
            >
              Save changes
            </button>
          </div>

          <div className="two-up">
            <article className="subtle-card">
              <strong>Requirement groups</strong>
              <ul className="compact-list">
                {draft.baseRequirements.map((requirement) => (
                  <li key={requirement.id}>{requirement.label}</li>
                ))}
                {draft.alternativeGroups.map((group) => (
                  <li key={group.id}>{group.label}</li>
                ))}
              </ul>
            </article>
            <article className="subtle-card">
              <strong>Premium insights</strong>
              <ul className="compact-list">
                {draft.premiumInsights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
