"use client";

import { useAppState } from "@/components/providers/app-state-provider";
import { getCountryByCode, getPathwayProgress, getVisaAssessments } from "@/lib/matching";

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
  const recommendations = assessments.filter(
    (assessment) => assessment.isEligible && !pathways.some((pathway) => pathway.visaId === assessment.visa.id)
  );

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
          This screen models the premium pathway tracker: requirements,
          documents, and ordered steps with gating for richer explanations.
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
                <span className="pill">{progress}% complete</span>
              </div>

              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>

              <div className="stack-md">
                <details className="accordion" open>
                  <summary>Requirements</summary>
                  <div className="accordion-content">
                    {assessment?.requiredResults.map((result) => (
                      <div key={result.requirement.id} className="check-row">
                        <div>
                          <strong>{result.requirement.label}</strong>
                          <p className="muted">{result.requirement.detail}</p>
                          {tier === "premium" && result.requirement.premiumDetail ? (
                            <p className="premium-copy">{result.requirement.premiumDetail}</p>
                          ) : null}
                        </div>
                        <span className={`status-dot ${result.passed ? "pass" : "fail"}`} />
                      </div>
                    ))}

                    {assessment?.activeGroup ? (
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
                      <div className="upgrade-card">
                        Unlock premium to see exact requirement explanations and
                        route-by-route advice.
                      </div>
                    ) : null}
                  </div>
                </details>

                <details className="accordion">
                  <summary>Documents</summary>
                  <div className="accordion-content">
                    {visa.documents.map((document) => {
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
                    })}
                  </div>
                </details>

                <details className="accordion">
                  <summary>Steps</summary>
                  <div className="accordion-content">
                    {visa.steps.map((step, index) => {
                      const completed = pathway.completedStepIds.includes(step.id);
                      const locked = step.premium && tier === "starter";

                      return (
                        <label key={step.id} className={`toggle-row${locked ? " locked" : ""}`}>
                          <input
                            checked={completed}
                            disabled={locked}
                            onChange={() => toggleStep(pathway.id, step.id)}
                            type="checkbox"
                          />
                          <div>
                            <strong>
                              {index + 1}. {step.title}
                            </strong>
                            <p className="muted">{step.description}</p>
                          </div>
                          {locked ? <span className="tag">Premium</span> : null}
                        </label>
                      );
                    })}
                  </div>
                </details>
              </div>
            </section>
          );
        })}
      </div>

      {recommendations.length > 0 ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Recommended next</p>
              <h2>Eligible visas not yet started</h2>
            </div>
          </div>
          <div className="mini-grid">
            {recommendations.slice(0, 3).map((assessment) => (
              <div key={assessment.visa.id} className="subtle-card">
                <strong>{assessment.visa.name}</strong>
                <p className="muted">{assessment.visa.summary}</p>
                <button
                  className="button secondary"
                  onClick={() => startPathway(assessment.visa.id)}
                  type="button"
                >
                  Start pathway
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
