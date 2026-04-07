"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { LogoutButton } from "@/components/logout-button";
import { useAppState } from "@/components/providers/app-state-provider";
import { UpgradeSheet } from "@/components/upgrade-sheet";
import { getProfileCompletion } from "@/lib/matching";
import { formatTierLabel, getReadinessBucket } from "@/lib/mockup-ui";
import { UserProfile } from "@/lib/types";

type SectionId =
  | "employment"
  | "family"
  | "financial"
  | "history"
  | "personal";

const educationOptions = [
  { value: "high_school", label: "High school" },
  { value: "associate", label: "Associate" },
  { value: "bachelor", label: "Bachelor" },
  { value: "master", label: "Master" },
  { value: "phd", label: "PhD" },
] as const;

const employmentOptions = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self employed" },
  { value: "founder", label: "Founder" },
  { value: "student", label: "Student" },
  { value: "between_roles", label: "Between roles" },
] as const;

const englishOptions = [
  { value: "basic", label: "Basic" },
  { value: "conversational", label: "Conversational" },
  { value: "fluent", label: "Fluent" },
  { value: "native", label: "Native" },
] as const;

export function ProfileWizard({ userEmail }: { userEmail: string }) {
  const { profile, tier, updateProfile, setTier, resetDemo, ready } = useAppState();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [openSection, setOpenSection] = useState<SectionId>("personal");
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  useEffect(() => {
    setDraft(profile);
    setOpenSection(getFirstIncompleteSection(profile));
  }, [profile]);

  const completion = useMemo(() => getProfileCompletion(draft), [draft]);
  const readinessScore = getReadinessBucket(completion);

  if (!ready) {
    return <div className="screen-loading">Loading your profile…</div>;
  }

  const updateDraft = <K extends keyof UserProfile>(
    field: K,
    value: UserProfile[K]
  ) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleNumber =
    (
      field: keyof Pick<
        UserProfile,
        | "age"
        | "annualIncome"
        | "savingsAmount"
        | "workExperienceYears"
        | "dependents"
        | "familyMembers"
      >
    ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      updateDraft(field, Number(event.target.value) as UserProfile[typeof field]);
    };

  const handleArray =
    (field: keyof Pick<UserProfile, "citizenships" | "languages">) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      updateDraft(
        field,
        event.target.value
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean) as UserProfile[typeof field]
      );
    };

  const saveProfile = () => {
    updateProfile(draft);
  };

  function getFirstIncompleteSection(candidate: UserProfile): SectionId {
    const sections: Array<{
      complete: boolean;
      id: SectionId;
    }> = [
      {
        id: "personal",
        complete:
          Boolean(candidate.fullName) &&
          candidate.age > 0 &&
          Boolean(candidate.residenceCountry) &&
          candidate.citizenships.length > 0 &&
          candidate.languages.length > 0 &&
          Boolean(candidate.englishLevel),
      },
      {
        id: "financial",
        complete:
          candidate.annualIncome > 0 &&
          candidate.savingsAmount >= 0 &&
          typeof candidate.hasHealthInsurance === "boolean",
      },
      {
        id: "employment",
        complete:
          Boolean(candidate.employmentStatus) &&
          Boolean(candidate.educationLevel) &&
          candidate.workExperienceYears >= 0 &&
          typeof candidate.canWorkRemotely === "boolean" &&
          typeof candidate.hasJobOffer === "boolean",
      },
      {
        id: "family",
        complete:
          Boolean(candidate.maritalStatus) &&
          candidate.dependents >= 0 &&
          candidate.familyMembers > 0,
      },
      {
        id: "history",
        complete: typeof candidate.hasCriminalRecord === "boolean",
      },
    ];

    return sections.find((section) => !section.complete)?.id ?? "personal";
  }

  return (
    <div className="screen-stack profile-screen">
      <section className="screen-section profile-header-section">
        <div className="profile-hero">
          <div>
            <h1>Your Profile</h1>
            <p>{userEmail}</p>
          </div>
          <div className="profile-avatar-placeholder" aria-hidden="true">
            {draft.fullName.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </section>

      <section className="screen-section profile-score-section">
        <div className="profile-score-card">
          <span className="profile-score-badge">
            {readinessScore}%
            <small>READY</small>
          </span>
          <p>Complete your profile now and start your move abroad!</p>
        </div>
      </section>

      <section className="screen-section profile-personal-section">
        <button
          className="accordion-button"
          onClick={() => setOpenSection("personal")}
          type="button"
        >
          <strong>Personal</strong>
          <span>{openSection === "personal" ? "▾" : "▸"}</span>
        </button>
        {openSection === "personal" ? (
          <article className="settings-card compact-settings-card">
            <div className="settings-grid">
              <label className="field">
                <span>Full name</span>
                <input
                  onChange={(event) => updateDraft("fullName", event.target.value)}
                  value={draft.fullName}
                />
              </label>
              <label className="field">
                <span>Age</span>
                <input
                  onChange={handleNumber("age")}
                  type="number"
                  value={draft.age}
                />
              </label>
              <label className="field">
                <span>Residence country</span>
                <input
                  onChange={(event) =>
                    updateDraft("residenceCountry", event.target.value)
                  }
                  value={draft.residenceCountry}
                />
              </label>
              <label className="field">
                <span>Citizenships</span>
                <input
                  onChange={handleArray("citizenships")}
                  value={draft.citizenships.join(", ")}
                />
              </label>
              <label className="field">
                <span>Languages</span>
                <input
                  onChange={handleArray("languages")}
                  value={draft.languages.join(", ")}
                />
              </label>
              <label className="field">
                <span>English level</span>
                <select
                  onChange={(event) =>
                    updateDraft(
                      "englishLevel",
                      event.target.value as UserProfile["englishLevel"]
                    )
                  }
                  value={draft.englishLevel}
                >
                  {englishOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>
        ) : null}
      </section>

      <section className="screen-section profile-financial-section">
        <button
          className="accordion-button"
          onClick={() => setOpenSection("financial")}
          type="button"
        >
          <strong>Financial</strong>
          <span>{openSection === "financial" ? "▾" : "▸"}</span>
        </button>
        {openSection === "financial" ? (
          <article className="settings-card compact-settings-card">
            <div className="settings-grid">
              <label className="field">
                <span>Annual income</span>
                <input
                  onChange={handleNumber("annualIncome")}
                  type="number"
                  value={draft.annualIncome}
                />
              </label>
              <label className="field">
                <span>Savings</span>
                <input
                  onChange={handleNumber("savingsAmount")}
                  type="number"
                  value={draft.savingsAmount}
                />
              </label>
              <label className="field">
                <span>Dependents</span>
                <input
                  onChange={handleNumber("dependents")}
                  type="number"
                  value={draft.dependents}
                />
              </label>
              <label className="field">
                <span>Family members</span>
                <input
                  onChange={handleNumber("familyMembers")}
                  type="number"
                  value={draft.familyMembers}
                />
              </label>
              <label className="switch-row">
                <input
                  checked={draft.hasHealthInsurance}
                  onChange={(event) =>
                    updateDraft("hasHealthInsurance", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>Has health insurance</span>
              </label>
            </div>
          </article>
        ) : null}
      </section>

      <section className="screen-section profile-employment-section">
        <button
          className="accordion-button"
          onClick={() => setOpenSection("employment")}
          type="button"
        >
          <strong>Employment</strong>
          <span>{openSection === "employment" ? "▾" : "▸"}</span>
        </button>
        {openSection === "employment" ? (
          <article className="settings-card compact-settings-card">
            <div className="settings-grid">
              <label className="field">
                <span>Employment status</span>
                <select
                  onChange={(event) =>
                    updateDraft(
                      "employmentStatus",
                      event.target.value as UserProfile["employmentStatus"]
                    )
                  }
                  value={draft.employmentStatus}
                >
                  {employmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Education level</span>
                <select
                  onChange={(event) =>
                    updateDraft(
                      "educationLevel",
                      event.target.value as UserProfile["educationLevel"]
                    )
                  }
                  value={draft.educationLevel}
                >
                  {educationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Work experience</span>
                <input
                  onChange={handleNumber("workExperienceYears")}
                  type="number"
                  value={draft.workExperienceYears}
                />
              </label>
              <label className="switch-row">
                <input
                  checked={draft.canWorkRemotely}
                  onChange={(event) =>
                    updateDraft("canWorkRemotely", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>Can work remotely</span>
              </label>
              <label className="switch-row">
                <input
                  checked={draft.hasJobOffer}
                  onChange={(event) =>
                    updateDraft("hasJobOffer", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>Has job offer</span>
              </label>
              <label className="switch-row">
                <input
                  checked={draft.hasCriminalRecord}
                  onChange={(event) =>
                    updateDraft("hasCriminalRecord", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>Has criminal record</span>
              </label>
            </div>
          </article>
        ) : null}
      </section>

      <section className="screen-section profile-family-section">
        <button
          className="accordion-button"
          onClick={() => setOpenSection("family")}
          type="button"
        >
          <strong>Family</strong>
          <span>{openSection === "family" ? "▾" : "▸"}</span>
        </button>
        {openSection === "family" ? (
          <article className="settings-card compact-settings-card">
            <div className="settings-grid">
              <label className="field">
                <span>Marital status</span>
                <select
                  onChange={(event) =>
                    updateDraft(
                      "maritalStatus",
                      event.target.value as UserProfile["maritalStatus"]
                    )
                  }
                  value={draft.maritalStatus}
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="partnered">Partnered</option>
                  <option value="divorced">Divorced</option>
                </select>
              </label>
              <label className="field">
                <span>Dependents</span>
                <input
                  onChange={handleNumber("dependents")}
                  type="number"
                  value={draft.dependents}
                />
              </label>
              <label className="field">
                <span>Family members</span>
                <input
                  onChange={handleNumber("familyMembers")}
                  type="number"
                  value={draft.familyMembers}
                />
              </label>
            </div>
          </article>
        ) : null}
      </section>

      <section className="screen-section profile-history-section">
        <button
          className="accordion-button"
          onClick={() => setOpenSection("history")}
          type="button"
        >
          <strong>History</strong>
          <span>{openSection === "history" ? "▾" : "▸"}</span>
        </button>
        {openSection === "history" ? (
          <article className="settings-card compact-settings-card">
            <div className="settings-grid">
              <label className="switch-row">
                <input
                  checked={draft.hasCriminalRecord}
                  onChange={(event) =>
                    updateDraft("hasCriminalRecord", event.target.checked)
                  }
                  type="checkbox"
                />
                <span>Has criminal record</span>
              </label>
            </div>
          </article>
        ) : null}
      </section>

      <section className="screen-section profile-premium-section">
        <div className="premium-cta-card">
          <p>Premium</p>
          {tier === "premium" ? (
            <>
              <strong>Migrately Premium is active</strong>
              <span>
                Visa insights, document assistance, and multi-pathway tracking
                are unlocked.
              </span>
            </>
          ) : (
            <>
              <strong>
                Boost applications with visa insights, documentation assistance,
                and more.
              </strong>
              <button
                className="premium-cta-button"
                onClick={() => setShowUpgradeSheet(true)}
                type="button"
              >
                Get Migrately Premium
              </button>
            </>
          )}
          <small>{formatTierLabel(tier)}</small>
        </div>
      </section>

      <section className="screen-section profile-save-section">
        <button className="button primary wide-button" onClick={saveProfile} type="button">
          Save
        </button>
      </section>

      <section className="screen-section profile-account-section">
        <button className="button light-button wide-button" onClick={resetDemo} type="button">
          Reset demo data
        </button>
        <LogoutButton />
      </section>

      <UpgradeSheet
        description="Use the same premium slider flow here and from pathway nudges."
        onClose={() => setShowUpgradeSheet(false)}
        onUpgrade={() => {
          setTier("premium");
          setShowUpgradeSheet(false);
        }}
        open={showUpgradeSheet}
        title="Get Migrately Premium"
      />
    </div>
  );
}
