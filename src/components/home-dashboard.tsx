"use client";

import Link from "next/link";

import { PremiumGateCard } from "@/components/premium-gate-card";
import { useAppState } from "@/components/providers/app-state-provider";
import {
  describeRequirementGap,
  formatMoney,
  getCountryByCode,
  getPathwayProgress,
  getProfileCompletion,
  getVisaAssessments,
} from "@/lib/matching";

export function HomeDashboard() {
  const { profile, visas, countries, pathways, tier, startPathway, ready } = useAppState();

  if (!ready) {
    return <div className="panel">Loading Migrately demo state…</div>;
  }

  const assessments = getVisaAssessments(profile, visas);
  const matched = assessments.filter((assessment) => assessment.isEligible);
  const stretch = assessments.filter((assessment) => !assessment.isEligible).slice(0, 2);
  const completion = getProfileCompletion(profile);
  const activeCountries = countries.filter((country) =>
    matched.some((assessment) => assessment.visa.countryCode === country.code)
  );
  const starterPathwayLimitReached = tier === "starter" && pathways.length >= 1;

  return (
    <div className="stack-lg">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Mobile-first MVP</p>
          <h1>Where can {profile.fullName.split(" ")[0]} go next?</h1>
          <p className="muted">
            Cross-platform PWA with onboarding, visa matching, saved pathways,
            and premium gates for deeper guidance.
          </p>
        </div>
        <div className="hero-metrics">
          <div className="metric-card">
            <span className="metric-label">Eligible now</span>
            <strong>{matched.length}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Profile fit</span>
            <strong>{completion}%</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Income</span>
            <strong>{formatMoney(profile.annualIncome)}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Profile readiness</p>
            <h2>Finish the fields that shape eligibility</h2>
          </div>
          <Link className="button secondary" href="/app/profile">
            Edit profile
          </Link>
        </div>
        <div className="progress-meter">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${completion}%` }} />
          </div>
          <span>{completion}% complete</span>
        </div>
        <div className="mini-grid">
          <div className="stat-chip">Residence: {profile.residenceCountry}</div>
          <div className="stat-chip">Education: {profile.educationLevel.replace("_", " ")}</div>
          <div className="stat-chip">Remote work: {profile.canWorkRemotely ? "Yes" : "No"}</div>
          <div className="stat-chip">Savings: {formatMoney(profile.savingsAmount)}</div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Discover visas</p>
            <h2>Matches based on your current profile</h2>
          </div>
          <Link className="button ghost" href="/app/visas">
            Open tracker
          </Link>
        </div>
        {starterPathwayLimitReached ? (
          <PremiumGateCard
            title="Multiple saved pathways"
            description="Starter includes one saved pathway. Premium users can save and compare multiple visa routes at once."
            bullets={[
              "Keep one visa pathway saved on Starter",
              "Compare several active pathways on Premium",
            ]}
          />
        ) : null}
        <div className="scroll-row">
          {assessments.slice(0, 4).map((assessment) => {
            const country = getCountryByCode(countries, assessment.visa.countryCode);
            const pathway = pathways.find((item) => item.visaId === assessment.visa.id);
            const canSavePathway =
              Boolean(pathway) ||
              tier === "premium" ||
              pathways.length === 0;

            return (
              <article key={assessment.visa.id} className="visa-card">
                <div className="visa-card-top">
                  <span className="pill">{assessment.isEligible ? "Eligible" : "Close fit"}</span>
                  <span className="muted">{country?.flag} {country?.name}</span>
                </div>
                <h3>{assessment.visa.name}</h3>
                <p className="muted">{assessment.visa.summary}</p>
                <div className="visa-score">
                  <span>Match strength</span>
                  <strong>{Math.round(assessment.score * 100)}%</strong>
                </div>
                <div className="progress-track compact">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.round(assessment.score * 100)}%` }}
                  />
                </div>
                <ul className="compact-list">
                  {assessment.missingRequirements.length === 0 ? (
                    <li>All core requirements currently pass.</li>
                  ) : tier === "premium" ? (
                    assessment.missingRequirements.slice(0, 2).map((result) => (
                      <li key={result.requirement.id}>
                        {describeRequirementGap(result.requirement)}
                      </li>
                    ))
                  ) : (
                    <li>Premium unlocks the fix-this-to-qualify plan.</li>
                  )}
                </ul>
                <div className="actions-row">
                  {assessment.isEligible ? (
                    <button
                      className="button primary"
                      disabled={!canSavePathway}
                      onClick={() => startPathway(assessment.visa.id)}
                      type="button"
                    >
                      {pathway
                        ? "Saved pathway"
                        : canSavePathway
                          ? "Save pathway"
                          : "Premium: save more"}
                    </button>
                  ) : (
                    <Link className="button primary" href="/app/visas">
                      {tier === "premium" ? "See fix plan" : "Premium fix plan"}
                    </Link>
                  )}
                  <Link className="button secondary" href="/app/profile">
                    Improve fit
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Where can I go?</p>
            <h2>Country discovery</h2>
          </div>
        </div>
        <div className="scroll-row">
          {activeCountries.map((country) => (
            <article
              key={country.code}
              className="country-card"
              style={{
                background: `linear-gradient(135deg, ${country.heroColors[0]}, ${country.heroColors[1]})`,
              }}
            >
              <div className="country-card-top">
                <span>{country.flag}</span>
                <span>{country.region}</span>
              </div>
              <h3>{country.name}</h3>
              <p>{country.headline}</p>
              <div className="tags-row">
                <span className="tag">Cost {country.costOfLivingBand}</span>
                <span className="tag">{country.climate}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="two-up">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Pathways</p>
              <h2>{tier === "premium" ? "Tracked applications" : "Saved pathways"}</h2>
            </div>
          </div>
          <div className="stack-md">
            {pathways.map((pathway) => {
              const visa = visas.find((entry) => entry.id === pathway.visaId);
              if (!visa) {
                return null;
              }

              const progress = getPathwayProgress(visa, pathway);
              return (
                <div key={pathway.id} className="subtle-card">
                  <div className="space-between">
                    <strong>{visa.name}</strong>
                    <span>{tier === "premium" ? `${progress}%` : "Saved"}</span>
                  </div>
                  {tier === "premium" ? (
                    <div className="progress-track compact">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  ) : (
                    <p className="muted">
                      Starter lets you bookmark one pathway. Step and document
                      tracking unlock on Premium.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel premium-panel">
          <p className="eyebrow">Monetization</p>
          <h2>{tier === "premium" ? "Premium unlocked" : "Starter to premium upgrade"}</h2>
          <p className="muted">
            Starter covers profile setup, discovery, eligibility matching, and
            one saved pathway. Premium opens every action layer after that.
          </p>
          <ul className="compact-list">
            <li>Multiple saved pathways instead of one</li>
            <li>Family members, requirement explanations, and visa insights</li>
            <li>Fix-this-to-qualify, document details, and optional boosts</li>
          </ul>
          <Link className="button primary" href="/app/profile">
            {tier === "premium" ? "View plan details" : "View premium boundaries"}
          </Link>
        </article>
      </section>

      {stretch.length > 0 ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Stretch matches</p>
              <h2>Close opportunities</h2>
            </div>
          </div>
          <div className="mini-grid">
            {stretch.map((assessment) => (
              <div key={assessment.visa.id} className="subtle-card">
                <strong>{assessment.visa.name}</strong>
                {tier === "premium" ? (
                  <ul className="compact-list">
                    {assessment.missingRequirements.slice(0, 2).map((result) => (
                      <li key={result.requirement.id}>
                        {describeRequirementGap(result.requirement)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    Premium shows the fix-this-to-qualify actions for close-fit visas.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
