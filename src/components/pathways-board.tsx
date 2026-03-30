"use client";

import { PremiumGateCard } from "@/components/premium-gate-card";
import { useAppState } from "@/components/providers/app-state-provider";
import {
  describeRequirementGap,
  getCountryByCode,
  getPathwayProgress,
  getVisaAssessments,
} from "@/lib/matching";

export function PathwaysBoard() {
  const {
    profile,
    visas,
    countries,
    pathways,
    tier,
    startPathway,
    toggleDocument,
    toggleStep,
    ready,
  } = useAppState();

  if (!ready) {
    return <div className="panel">Loading pathways…</div>;
  }

  const assessments = getVisaAssessments(profile, visas);
  const eligibleRecommendations = assessments.filter(
    (assessment) => assessment.isEligible && !pathways.some((pathway) => pathway.visaId === assessment.visa.id)
  );
  const closeFitRecommendations = assessments.filter(
    (assessment) => !assessment.isEligible && !pathways.some((pathway) => pathway.visaId === assessment.visa.id)
  );
  const starterPathwayLimitReached = tier === "starter" && pathways.length >= 1;

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">In progress</p>
            <h1>Visa pathways</h1>
          </div>
          <span className="pill">{pathways.length} active</span>
        </div>
        <p className="muted">
          Starter can save one pathway and keep browsing. Premium unlocks
          requirement explanations, document detail, optional boosts, insights,
          and step tracking.
        </p>
      </section>

      <div className="stack-lg">
        {pathways.map((pathway) => {
          const visa = visas.find((entry) => entry.id === pathway.visaId);
          if (!visa) {
            return null;
          }

          const assessment = assessments.find((entry) => entry.visa.id === visa.id);
          const country = getCountryByCode(countries, visa.countryCode);
          const progress = getPathwayProgress(visa, pathway);

          return (
            <section key={pathway.id} className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">
                    {country?.flag} {country?.name}
                  </p>
                  <h2>{visa.name}</h2>
                </div>
                <span className="pill">
                  {tier === "premium" ? `${progress}% complete` : "Saved pathway"}
                </span>
              </div>

              {tier === "premium" ? (
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              ) : null}

              <div className="stack-md">
                <details className="accordion" open>
                  <summary>Requirements</summary>
                  <div className="accordion-content">
                    {assessment?.requiredResults.map((result) => (
                      <div key={result.requirement.id} className="check-row">
                        <div>
                          <strong>{result.requirement.label}</strong>
                          {tier === "premium" ? (
                            <p className="muted">{result.requirement.detail}</p>
                          ) : null}
                          {tier === "premium" && result.requirement.premiumDetail ? (
                            <p className="premium-copy">{result.requirement.premiumDetail}</p>
                          ) : null}
                        </div>
                        <span className={`status-dot ${result.passed ? "pass" : "fail"}`} />
                      </div>
                    ))}

                    {tier === "premium" && assessment?.activeGroup ? (
                      <div className="group-note">
                        <strong>{assessment.activeGroup.group.label}</strong>
                        <p className="muted">
                          {assessment.activeGroup.group.description}
                        </p>
                        {assessment.activeGroup.results.map((result) => (
                          <div key={result.requirement.id} className="check-row tight">
                            <span>{result.requirement.label}</span>
                            <span className={`status-dot ${result.passed ? "pass" : "fail"}`} />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {tier === "starter" ? (
                      <PremiumGateCard
                        title="Requirement explanations"
                        description="Starter shows basic pass/fail qualification. Premium explains the logic, conditional route, and what the evidence should look like."
                      />
                    ) : null}
                  </div>
                </details>

                <details className="accordion">
                  <summary>Documents</summary>
                  <div className="accordion-content">
                    {tier === "premium"
                      ? visa.documents.map((document) => {
                          const completed = pathway.completedDocumentIds.includes(document.id);

                          return (
                            <label key={document.id} className="toggle-row">
                              <input
                                checked={completed}
                                onChange={() => toggleDocument(pathway.id, document.id)}
                                type="checkbox"
                              />
                              <div>
                                <strong>{document.title}</strong>
                                <p className="muted">{document.description}</p>
                              </div>
                            </label>
                          );
                        })
                      : (
                        <>
                          <div className="group-note">
                            <strong>Starter includes the document checklist only</strong>
                            <ul className="compact-list">
                              {visa.documents.map((document) => (
                                <li key={document.id}>{document.title}</li>
                              ))}
                            </ul>
                          </div>
                          <PremiumGateCard
                            title="Document details"
                            description="Premium unlocks document descriptions, stronger evidence guidance, and progress tracking."
                          />
                        </>
                      )}
                  </div>
                </details>

                <details className="accordion">
                  <summary>Steps</summary>
                  <div className="accordion-content">
                    {tier === "premium" ? (
                      visa.steps.map((step, index) => {
                        const completed = pathway.completedStepIds.includes(step.id);

                        return (
                          <label key={step.id} className="toggle-row">
                            <input
                              checked={completed}
                              onChange={() => toggleStep(pathway.id, step.id)}
                              type="checkbox"
                            />
                            <div>
                              <strong>
                                {index + 1}. {step.title}
                              </strong>
                              <p className="muted">{step.description}</p>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <PremiumGateCard
                        title="Track application steps"
                        description="Starter can save one pathway. Premium adds ordered step tracking so the saved route turns into an actual application workflow."
                        bullets={[
                          "Check steps off in sequence",
                          "Keep the application moving with real progress",
                        ]}
                      />
                    )}
                  </div>
                </details>

                <details className="accordion">
                  <summary>Strengthen application</summary>
                  <div className="accordion-content">
                    {tier === "premium" ? (
                      <ul className="compact-list">
                        {(assessment?.optionalBoosts ?? []).map((boost) => (
                          <li key={boost}>{boost}</li>
                        ))}
                      </ul>
                    ) : (
                      <PremiumGateCard
                        title="Optional requirements"
                        description="Premium shows the optional boosts that can strengthen the application beyond the bare minimum."
                      />
                    )}
                  </div>
                </details>

                <details className="accordion">
                  <summary>Visa insights</summary>
                  <div className="accordion-content">
                    {tier === "premium" ? (
                      <ul className="compact-list">
                        {visa.premiumInsights.map((insight) => (
                          <li key={insight}>{insight}</li>
                        ))}
                      </ul>
                    ) : (
                      <PremiumGateCard
                        title="Visa insights"
                        description="Premium includes route-specific insights, explanation depth, and guidance on where the application can get stronger."
                      />
                    )}
                  </div>
                </details>
              </div>
            </section>
          );
        })}
      </div>

      {eligibleRecommendations.length > 0 ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Recommended next</p>
              <h2>Eligible visas not yet started</h2>
            </div>
          </div>
          {starterPathwayLimitReached ? (
            <PremiumGateCard
              title="More than one pathway"
              description="Starter users can save a single pathway. Premium users can keep several routes active and compare them side by side."
            />
          ) : null}
          <div className="mini-grid">
            {eligibleRecommendations.slice(0, 3).map((assessment) => (
              <div key={assessment.visa.id} className="subtle-card">
                <strong>{assessment.visa.name}</strong>
                <p className="muted">{assessment.visa.summary}</p>
                <button
                  className="button secondary"
                  disabled={starterPathwayLimitReached}
                  onClick={() => startPathway(assessment.visa.id)}
                  type="button"
                >
                  {starterPathwayLimitReached ? "Premium: save more" : "Start pathway"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {closeFitRecommendations.length > 0 ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Fix-this-to-qualify</p>
              <h2>Close-fit visas</h2>
            </div>
          </div>
          <div className="mini-grid">
            {closeFitRecommendations.slice(0, 3).map((assessment) => (
              <div key={assessment.visa.id} className="subtle-card">
                <strong>{assessment.visa.name}</strong>
                {tier === "premium" ? (
                  <ul className="compact-list">
                    {assessment.missingRequirements.slice(0, 3).map((result) => (
                      <li key={result.requirement.id}>
                        {describeRequirementGap(result.requirement)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <PremiumGateCard
                    title="Fix-this-to-qualify"
                    description="Starter can see that a visa is close. Premium turns that into a concrete action plan."
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
