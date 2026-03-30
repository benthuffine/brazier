"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { PremiumGateCard } from "@/components/premium-gate-card";
import { useAppState } from "@/components/providers/app-state-provider";
import { getProfileCompletion, getVisaAssessments } from "@/lib/matching";
import { UserProfile } from "@/lib/types";

const wizardSteps = [
  { id: "identity", title: "Personal" },
  { id: "work", title: "Work" },
  { id: "mobility", title: "Mobility" },
  { id: "review", title: "Review" },
];

export function ProfileWizard() {
  const { profile, tier, updateProfile, resetDemo, visas, ready } = useAppState();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<UserProfile>(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const completion = useMemo(() => getProfileCompletion(draft), [draft]);
  const matches = useMemo(
    () => getVisaAssessments(draft, visas).filter((assessment) => assessment.isEligible).slice(0, 3),
    [draft, visas]
  );

  if (!ready) {
    return <div className="panel">Loading profile…</div>;
  }

  const updateDraft = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleNumber =
    (field: keyof Pick<UserProfile, "age" | "annualIncome" | "savingsAmount" | "workExperienceYears" | "dependents" | "familyMembers">) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      updateDraft(field, Number(event.target.value) as UserProfile[typeof field]);
    };

  const handleArray =
    (field: keyof Pick<UserProfile, "citizenships" | "languages">) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      updateDraft(field, value as UserProfile[typeof field]);
    };

  const saveProfile = () => {
    updateProfile(draft);
  };

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Onboarding wizard</p>
            <h1>Profile and subscription</h1>
          </div>
          <span className="pill">{completion}% complete</span>
        </div>
        <div className="stepper">
          {wizardSteps.map((step, index) => (
            <button
              key={step.id}
              className={`step-chip${index === stepIndex ? " active" : ""}`}
              onClick={() => setStepIndex(index)}
              type="button"
            >
              {step.title}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        {stepIndex === 0 ? (
          <div className="form-grid">
            <label className="field">
              <span>Full name</span>
              <input value={draft.fullName} onChange={(event) => updateDraft("fullName", event.target.value)} />
            </label>
            <label className="field">
              <span>Age</span>
              <input type="number" value={draft.age} onChange={handleNumber("age")} />
            </label>
            <label className="field">
              <span>Residence country</span>
              <input value={draft.residenceCountry} onChange={(event) => updateDraft("residenceCountry", event.target.value)} />
            </label>
            <label className="field">
              <span>Citizenships</span>
              <input
                value={draft.citizenships.join(", ")}
                onChange={handleArray("citizenships")}
                placeholder="United States, Canada"
              />
            </label>
            <label className="field">
              <span>Marital status</span>
              <select
                value={draft.maritalStatus}
                onChange={(event) => updateDraft("maritalStatus", event.target.value as UserProfile["maritalStatus"])}
              >
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="partnered">Partnered</option>
                <option value="divorced">Divorced</option>
              </select>
            </label>
            {tier === "premium" ? (
              <label className="field">
                <span>Family members</span>
                <input type="number" value={draft.familyMembers} onChange={handleNumber("familyMembers")} />
              </label>
            ) : (
              <div className="field-span-2">
                <PremiumGateCard
                  title="Family members"
                  description="Starter profiles are individual only. Premium unlocks family-member planning for visa discovery and pathway prep."
                />
              </div>
            )}
          </div>
        ) : null}

        {stepIndex === 1 ? (
          <div className="form-grid">
            <label className="field">
              <span>Employment status</span>
              <select
                value={draft.employmentStatus}
                onChange={(event) => updateDraft("employmentStatus", event.target.value as UserProfile["employmentStatus"])}
              >
                <option value="employed">Employed</option>
                <option value="self_employed">Self-employed</option>
                <option value="founder">Founder</option>
                <option value="student">Student</option>
                <option value="between_roles">Between roles</option>
              </select>
            </label>
            <label className="field">
              <span>Education level</span>
              <select
                value={draft.educationLevel}
                onChange={(event) => updateDraft("educationLevel", event.target.value as UserProfile["educationLevel"])}
              >
                <option value="high_school">High school</option>
                <option value="associate">Associate</option>
                <option value="bachelor">Bachelor</option>
                <option value="master">Master</option>
                <option value="phd">PhD</option>
              </select>
            </label>
            <label className="field">
              <span>Annual income</span>
              <input type="number" value={draft.annualIncome} onChange={handleNumber("annualIncome")} />
            </label>
            <label className="field">
              <span>Savings amount</span>
              <input type="number" value={draft.savingsAmount} onChange={handleNumber("savingsAmount")} />
            </label>
            <label className="field">
              <span>Work experience (years)</span>
              <input type="number" value={draft.workExperienceYears} onChange={handleNumber("workExperienceYears")} />
            </label>
            <label className="field checkbox-field">
              <input
                checked={draft.canWorkRemotely}
                onChange={(event) => updateDraft("canWorkRemotely", event.target.checked)}
                type="checkbox"
              />
              <span>Can work remotely</span>
            </label>
          </div>
        ) : null}

        {stepIndex === 2 ? (
          <div className="form-grid">
            <label className="field">
              <span>Languages</span>
              <input value={draft.languages.join(", ")} onChange={handleArray("languages")} />
            </label>
            <label className="field">
              <span>English level</span>
              <select
                value={draft.englishLevel}
                onChange={(event) => updateDraft("englishLevel", event.target.value as UserProfile["englishLevel"])}
              >
                <option value="basic">Basic</option>
                <option value="conversational">Conversational</option>
                <option value="fluent">Fluent</option>
                <option value="native">Native</option>
              </select>
            </label>
            <label className="field checkbox-field">
              <input
                checked={draft.hasHealthInsurance}
                onChange={(event) => updateDraft("hasHealthInsurance", event.target.checked)}
                type="checkbox"
              />
              <span>Has health insurance</span>
            </label>
            <label className="field checkbox-field">
              <input
                checked={draft.hasJobOffer}
                onChange={(event) => updateDraft("hasJobOffer", event.target.checked)}
                type="checkbox"
              />
              <span>Has job offer</span>
            </label>
            <label className="field checkbox-field">
              <input
                checked={draft.hasCriminalRecord}
                onChange={(event) => updateDraft("hasCriminalRecord", event.target.checked)}
                type="checkbox"
              />
              <span>Has criminal record</span>
            </label>
            {tier === "premium" ? (
              <label className="field">
                <span>Dependents</span>
                <input type="number" value={draft.dependents} onChange={handleNumber("dependents")} />
              </label>
            ) : (
              <div className="field-span-2">
                <PremiumGateCard
                  title="Dependents"
                  description="Starter keeps the profile lean. Premium adds dependent-aware planning so pathways can account for household complexity."
                />
              </div>
            )}
          </div>
        ) : null}

        {stepIndex === 3 ? (
          <div className="stack-md">
            <div className="subtle-card">
              <strong>Current plan</strong>
              <p className="muted">
                You are viewing the <strong>{tier}</strong> experience.
              </p>
              {tier === "starter" ? (
                <ul className="compact-list">
                  <li>Create a profile</li>
                  <li>Explore countries and visas</li>
                  <li>Find eligible visas</li>
                  <li>Save one pathway</li>
                </ul>
              ) : (
                <ul className="compact-list">
                  <li>Save multiple pathways</li>
                  <li>Plan for family members and dependents</li>
                  <li>Unlock insights, explanations, and fix plans</li>
                  <li>Track documents and application steps</li>
                </ul>
              )}
            </div>

            <div className="subtle-card">
              <strong>Best current matches</strong>
              <ul className="compact-list">
                {matches.map((match) => (
                  <li key={match.visa.id}>{match.visa.name}</li>
                ))}
              </ul>
            </div>

            {tier === "starter" ? (
              <PremiumGateCard
                title="Premium boundaries"
                description="Use the premium demo account to see multiple pathways, family planning, document detail, fix-this guidance, and full pathway tracking."
              />
            ) : null}

            <div className="actions-row">
              <button className="button primary" onClick={saveProfile} type="button">
                Save profile
              </button>
              <button className="button ghost" onClick={resetDemo} type="button">
                Reset demo state
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Navigation</p>
            <h2>Wizard controls</h2>
          </div>
        </div>
        <div className="actions-row">
          <button
            className="button ghost"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            type="button"
          >
            Back
          </button>
          <button
            className="button primary"
            disabled={stepIndex === wizardSteps.length - 1}
            onClick={() =>
              setStepIndex((current) => Math.min(wizardSteps.length - 1, current + 1))
            }
            type="button"
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
