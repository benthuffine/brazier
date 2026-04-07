"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAppState } from "@/components/providers/app-state-provider";
import { UpgradeSheet } from "@/components/upgrade-sheet";
import { getCountrySceneStyle } from "@/lib/mockup-ui";
import {
  Country,
  Pathway,
  Visa,
  VisaAssessment,
} from "@/lib/types";
import {
  describeRequirementGap,
  getCountryByCode,
  getPathwayProgress,
  getProfileCompletion,
  getVisaAssessments,
} from "@/lib/matching";
import { getReadinessBucket } from "@/lib/mockup-ui";

type AppFlowMode = "landing" | "search" | "visas";
type PathwayPanel = "documents" | "requirements" | "steps";

interface SavedPathwayEntry {
  assessment: VisaAssessment;
  country: Country | undefined;
  pathway: Pathway;
  progress: number;
  visa: Visa;
}

interface PathwayPanelSelection {
  panel: PathwayPanel;
  signature: string;
  visaId: string;
}

type SheetState =
  | { kind: "country"; countryCode: string }
  | { kind: "upgrade"; description: string; title: string }
  | { kind: "visa"; visaId: string }
  | null;

function getRequirementSummaryCount(assessment: VisaAssessment) {
  const activeGroupResults = assessment.activeGroup?.results ?? [];

  return {
    passed:
      assessment.requiredResults.filter((result) => result.passed).length +
      activeGroupResults.filter((result) => result.passed).length,
    total: assessment.requiredResults.length + activeGroupResults.length,
  };
}

function getEligibleAssessments(assessments: VisaAssessment[]) {
  const eligible = assessments.filter((assessment) => assessment.isEligible);
  return eligible.length > 0 ? eligible : assessments;
}

function getDiscoverVisaAssessments(assessments: VisaAssessment[]) {
  const eligible = assessments.find((assessment) => assessment.isEligible);
  const explore = assessments.find((assessment) => !assessment.isEligible);
  const ordered = [eligible, explore, ...assessments].filter(
    (assessment, index, list): assessment is VisaAssessment =>
      Boolean(assessment) &&
      list.findIndex((candidate) => candidate?.visa.id === assessment?.visa.id) === index
  );

  return ordered.slice(0, 2);
}

function getFirstIncompletePanel(entry: SavedPathwayEntry) {
  const requirementSummary = getRequirementSummaryCount(entry.assessment);

  if (requirementSummary.passed < requirementSummary.total) {
    return "requirements" as const;
  }

  if (entry.pathway.completedDocumentIds.length < entry.visa.documents.length) {
    return "documents" as const;
  }

  return "steps" as const;
}

function getPathwayPanelSignature(entry: SavedPathwayEntry) {
  const requirementSummary = getRequirementSummaryCount(entry.assessment);

  return [
    entry.visa.id,
    requirementSummary.passed,
    requirementSummary.total,
    entry.pathway.completedDocumentIds.length,
    entry.visa.documents.length,
    entry.pathway.completedStepIds.length,
    entry.visa.steps.length,
  ].join(":");
}

export function AppFlow({ mode }: { mode: AppFlowMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [pathwayPanelSelection, setPathwayPanelSelection] =
    useState<PathwayPanelSelection | null>(null);
  const [sheet, setSheet] = useState<SheetState>(null);
  const {
    profile,
    visas,
    countries,
    pathways,
    tier,
    notifications,
    startPathway,
    setTier,
    toggleDocument,
    toggleStep,
    ready,
  } = useAppState();

  const assessments = useMemo(
    () => getVisaAssessments(profile, visas),
    [profile, visas]
  );
  const completion = useMemo(() => getProfileCompletion(profile), [profile]);

  const savedEntries = useMemo(
    () =>
      pathways
        .map((pathway) => {
          const visa = visas.find((entry) => entry.id === pathway.visaId);
          const assessment = assessments.find(
            (entry) => entry.visa.id === pathway.visaId
          );

          if (!visa || !assessment) {
            return null;
          }

          return {
            assessment,
            country: getCountryByCode(countries, visa.countryCode),
            pathway,
            progress: getPathwayProgress(visa, pathway),
            visa,
          };
        })
        .filter((entry): entry is SavedPathwayEntry => entry !== null),
    [assessments, countries, pathways, visas]
  );

  const eligibleAssessments = useMemo(
    () => getEligibleAssessments(assessments),
    [assessments]
  );
  const discoverVisaAssessments = useMemo(
    () => getDiscoverVisaAssessments(assessments),
    [assessments]
  );
  const discoverCountries = useMemo(() => {
    const matchedCountries = countries.filter((country) =>
      discoverVisaAssessments.some(
        (assessment) => assessment.visa.countryCode === country.code
      )
    );

    return (matchedCountries.length > 0 ? matchedCountries : countries).slice(0, 2);
  }, [countries, discoverVisaAssessments]);

  useEffect(() => {
    if (discoverCountries.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % discoverCountries.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, [discoverCountries.length]);

  useEffect(() => {
    setFeaturedIndex(0);
  }, [discoverCountries.map((country) => country.code).join(",")]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const savedVisaIds = new Set(savedEntries.map((entry) => entry.visa.id));
  const requestedVisaId = searchParams.get("visa");
  const selectedSavedEntry =
    savedEntries.find((entry) => entry.visa.id === requestedVisaId) ??
    savedEntries[0];
  const readinessScore = getReadinessBucket(completion);
  const featuredCountry =
    discoverCountries[featuredIndex % Math.max(discoverCountries.length, 1)] ??
    countries[0];
  const selectedPathwaySignature = selectedSavedEntry
    ? getPathwayPanelSignature(selectedSavedEntry)
    : null;
  const openPathwayPanel: PathwayPanel =
    selectedSavedEntry &&
    pathwayPanelSelection?.visaId === selectedSavedEntry.visa.id &&
    pathwayPanelSelection.signature === selectedPathwaySignature
      ? pathwayPanelSelection.panel
      : selectedSavedEntry
        ? getFirstIncompletePanel(selectedSavedEntry)
        : "requirements";

  if (!ready) {
    return <div className="screen-loading">Loading your application flow…</div>;
  }

  const setActivePathwayPanel = (entry: SavedPathwayEntry, panel: PathwayPanel) => {
    setPathwayPanelSelection({
      panel,
      signature: getPathwayPanelSignature(entry),
      visaId: entry.visa.id,
    });
  };

  const openPathway = (visaId: string, hrefBase: "/app" | "/app/visas") => {
    setSheet(null);
    router.push(`${hrefBase}?visa=${visaId}`);
  };

  const startAndOpenPathway = (
    visaId: string,
    hrefBase: "/app" | "/app/visas"
  ) => {
    if (!savedVisaIds.has(visaId)) {
      if (tier === "starter" && savedEntries.length >= 1) {
        router.push("/app/profile");
        return;
      }

      startPathway(visaId);
    }

    openPathway(visaId, hrefBase);
  };

  const renderSheet = () => {
    if (!sheet) {
      return null;
    }

    if (sheet.kind === "visa") {
      const assessment = assessments.find((entry) => entry.visa.id === sheet.visaId);
      const country = assessment
        ? getCountryByCode(countries, assessment.visa.countryCode)
        : undefined;

      if (!assessment) {
        return null;
      }

      const requirements = getRequirementSummaryCount(assessment);

      return (
        <div className="sheet-overlay" onClick={() => setSheet(null)}>
          <div
            className="bottom-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="sheet-heading">
              <div>
                <p>{country?.name ?? "Country"}</p>
                <h2>{assessment.visa.name}</h2>
                <span>{assessment.visa.summary}</span>
              </div>
              <button
                className="sheet-close"
                onClick={() => setSheet(null)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="sheet-section">
              <strong>Requirements</strong>
              <p>
                {assessment.isEligible
                  ? "You meet all the main requirements"
                  : `${requirements.passed} of ${requirements.total} requirements met`}
              </p>
            </div>
            <div className="sheet-section">
              <strong>Documentation</strong>
              <p>Up to {assessment.visa.documents.length} documents required</p>
            </div>
            <div className="sheet-section">
              <strong>Visa Insights</strong>
              <p>
                There are {assessment.visa.premiumInsights.length} insights
                available
              </p>
            </div>
            {!assessment.isEligible ? (
              <div className="sheet-section sheet-section-stack">
                <strong>Fix this to qualify</strong>
                <div className="sheet-list">
                  {assessment.missingRequirements.slice(0, 2).map((result) => (
                    <span key={result.requirement.id}>
                      {describeRequirementGap(result.requirement)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <button
              className="button primary wide-button"
              onClick={() => {
                if (assessment.isEligible || savedVisaIds.has(assessment.visa.id)) {
                  startAndOpenPathway(assessment.visa.id, "/app");
                  return;
                }

                setSheet({
                  kind: "upgrade",
                  title: "Unlock fix-to-qualify guidance",
                  description:
                    "Premium adds upgrade nudges, visa insights, and detailed steps to improve weak routes.",
                });
              }}
              type="button"
            >
              {savedVisaIds.has(assessment.visa.id)
                ? "Open pathway"
                : assessment.isEligible
                  ? "Start"
                  : "Fix this to qualify"}
            </button>
          </div>
        </div>
      );
    }

    if (sheet.kind === "upgrade") {
      return (
        <UpgradeSheet
          description={sheet.description}
          onClose={() => setSheet(null)}
          onUpgrade={() => {
            setTier("premium");
            setSheet(null);
          }}
          open
          title={sheet.title}
        />
      );
    }

    const country = countries.find((entry) => entry.code === sheet.countryCode);

    if (!country) {
      return null;
    }

    const countryAssessments = eligibleAssessments.filter(
      (assessment) => assessment.visa.countryCode === country.code
    );

    return (
      <div className="sheet-overlay" onClick={() => setSheet(null)}>
        <div
          className="bottom-sheet"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="sheet-handle" />
          <div className="sheet-heading">
            <div>
              <p>{country.region}</p>
              <h2>{country.name}</h2>
              <span>
                {countryAssessments.length || 1} visa option
                {countryAssessments.length === 1 ? "" : "s"}
              </span>
            </div>
            <button
              className="sheet-close"
              onClick={() => setSheet(null)}
              type="button"
            >
              Close
            </button>
          </div>
          <p className="sheet-copy">{country.headline}</p>
          <div className="mobile-card-stack">
            {countryAssessments.map((assessment) => (
              <div key={assessment.visa.id} className="sheet-row">
                <div>
                  <strong>{assessment.visa.name}</strong>
                  <p>{assessment.visa.summary}</p>
                </div>
                <button
                  className={`cta-pill${
                    assessment.isEligible ? " eligible" : ""
                  }`}
                  onClick={() =>
                    setSheet({ kind: "visa", visaId: assessment.visa.id })
                  }
                  type="button"
                >
                  {assessment.isEligible ? "Eligible" : "Explore"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSearchScreen = () => (
    <div className="screen-stack search-screen">
      <section className="screen-section hero-section">
        <div
          className="destination-hero"
          style={getCountrySceneStyle(featuredCountry)}
        >
          <div className="destination-hero-copy">
            <span className="destination-hero-label">
              {featuredCountry?.name ?? "Portugal"}
            </span>
          </div>
        </div>
      </section>

      <section className="screen-section profile-section">
        <div className="section-heading">
          <h2>Profile</h2>
          <Link className="section-arrow" href="/app/profile">
            →
          </Link>
        </div>

        <Link className="completion-card" href="/app/profile">
          <div className="completion-bubble">
            <strong>{readinessScore}%</strong>
          </div>
          <div className="completion-copy">
            <strong>Complete your profile now</strong>
            <p>to start your move abroad!</p>
          </div>
          <span className="completion-edit" aria-hidden="true">
            ✎
          </span>
        </Link>
      </section>

      <section className="screen-section visa-section">
        <div className="section-heading">
          <h2>Discover Visas</h2>
          <button
            className="section-arrow"
            onClick={() =>
              discoverVisaAssessments[0]
                ? setSheet({
                    kind: "visa",
                    visaId: discoverVisaAssessments[0].visa.id,
                  })
                : undefined
            }
            type="button"
          >
            →
          </button>
        </div>
        <div className="mobile-card-stack">
          {discoverVisaAssessments.map((assessment) => {
            const country = getCountryByCode(countries, assessment.visa.countryCode);

            return (
              <button
                key={assessment.visa.id}
                className="discover-card"
                onClick={() => setSheet({ kind: "visa", visaId: assessment.visa.id })}
                type="button"
              >
                <div
                  className="discover-thumb"
                  style={getCountrySceneStyle(country)}
                />
                <div className="discover-copy">
                  <p>{country?.name ?? "Country"}</p>
                  <strong>{assessment.visa.name}</strong>
                  <span>{assessment.visa.summary}</span>
                </div>
                <span className={`cta-pill${assessment.isEligible ? " eligible" : ""}`}>
                  {assessment.isEligible ? "Eligible" : "Explore"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="screen-section country-section">
        <div className="section-heading">
          <h2>Discover Countries</h2>
          <button
            className="section-arrow"
            onClick={() =>
              discoverCountries[0]
                ? setSheet({
                    kind: "country",
                    countryCode: discoverCountries[0].code,
                  })
                : undefined
            }
            type="button"
          >
            →
          </button>
        </div>
        <div className="mobile-card-stack">
          {discoverCountries.map((country) => {
            const countryVisaCount = eligibleAssessments.filter(
              (assessment) => assessment.visa.countryCode === country.code
            ).length;

            return (
              <button
                key={country.code}
                className="country-discovery-card"
                onClick={() => setSheet({ kind: "country", countryCode: country.code })}
                type="button"
              >
                <div
                  className="country-discovery-thumb"
                  style={getCountrySceneStyle(country)}
                />
                <div className="discover-copy">
                  <p>{country.region}</p>
                  <strong>{country.name}</strong>
                  <span>
                    {countryVisaCount || 1} popular visa
                    {countryVisaCount === 1 ? "" : "s"}
                  </span>
                </div>
                <span className="flag-pill">{country.flag}</span>
              </button>
            );
          })}
        </div>
      </section>

      {unreadCount > 0 ? (
        <section className="screen-section alerts-summary-section">
          <div className="soft-callout">
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"} waiting
            in alerts.
          </div>
        </section>
      ) : null}

      {tier === "starter" ? (
        <section className="screen-section upgrade-summary-section">
          <button
            className="upgrade-inline-trigger"
            onClick={() =>
              setSheet({
                kind: "upgrade",
                title: "Unlock premium guidance",
                description:
                  "Upgrade to save multiple pathways, see visa insights, and get fix-to-qualify guidance.",
              })
            }
            type="button"
          >
            Upgrade for visa insights and multiple pathways
          </button>
        </section>
      ) : null}

      {renderSheet()}
    </div>
  );

  const renderListScreen = (hrefBase: "/app" | "/app/visas") => (
    <div className="screen-stack visas-list-screen">
      <section className="screen-section list-header-section">
        <div className="section-heading">
          <h1>Your Visas</h1>
        </div>
        <p className="page-subtitle">View and update your visa pathways</p>
      </section>

      <section className="screen-section list-body-section">
        <div className="section-heading">
          <h2>Started Pathways</h2>
        </div>

        {savedEntries.length === 0 ? (
          <div className="soft-callout">
            No started pathways yet. Head to search to discover eligible visas.
          </div>
        ) : (
          <div className="mobile-card-stack">
            {savedEntries.map((entry) => (
              <button
                key={entry.visa.id}
                className="pathway-summary-card"
                onClick={() => openPathway(entry.visa.id, hrefBase)}
                type="button"
              >
                <div>
                  <strong>
                    {entry.country?.flag ?? "🌍"} {entry.country?.name ?? "Country"}
                  </strong>
                  <span>{entry.visa.name}, residency</span>
                </div>
                <span className="pathway-arrow">→</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {renderSheet()}
    </div>
  );

  const renderDetailScreen = (
    entry: SavedPathwayEntry,
    hrefBase: "/app" | "/app/visas"
  ) => {
    const requirementSummary = getRequirementSummaryCount(entry.assessment);
    const completedDocuments = entry.pathway.completedDocumentIds.length;
    const completedSteps = entry.pathway.completedStepIds.length;
    const firstIncompleteStep = entry.visa.steps.find(
      (step) => !entry.pathway.completedStepIds.includes(step.id)
    );

    return (
      <div className="screen-stack pathway-detail-screen">
        <section className="screen-section pathway-hero-section">
          <div className="visa-hero-panel">
            <div className="visa-hero-copy">
              <h2>{entry.country?.name ?? "Country"}</h2>
              <p>{entry.visa.name}, residency</p>
            </div>
            <span className="flag-pill large-flag">{entry.country?.flag ?? "🌍"}</span>
          </div>
        </section>

        <section className="screen-section pathway-progress-section">
          <article className="progress-card">
            <div className="completion-bubble small-bubble">
              <strong>{entry.progress}%</strong>
            </div>
            <div className="completion-copy">
              <strong>Continue your visa pathway steps today</strong>
              <p>
                {firstIncompleteStep
                  ? `Next up: ${firstIncompleteStep.title}`
                  : "All steps completed"}
              </p>
            </div>
            <button
              className="section-arrow pill-arrow"
              onClick={() => openPathway(entry.visa.id, hrefBase)}
              type="button"
            >
              ✎
            </button>
          </article>
        </section>

        <section className="screen-section pathway-requirements-section">
          <div className="detail-card">
            <button
              className="detail-summary"
              onClick={() => setActivePathwayPanel(entry, "requirements")}
              type="button"
            >
              <div>
                <strong>Requirements</strong>
                <span>
                  {requirementSummary.passed} of {requirementSummary.total} requirements met
                </span>
              </div>
              <span className="detail-summary-pill">
                {openPathwayPanel === "requirements" ? "▾" : "▸"}
              </span>
            </button>
            {openPathwayPanel === "requirements" ? (
              <div className="detail-content">
                {entry.assessment.requiredResults.map((result) => (
                  <div key={result.requirement.id} className="detail-row">
                    <div>
                      <strong>{result.requirement.label}</strong>
                      {tier === "premium" ? (
                        <p>
                          {result.passed
                            ? result.requirement.detail
                            : describeRequirementGap(result.requirement)}
                        </p>
                      ) : null}
                    </div>
                    <span className={`status-pill ${result.passed ? "pass" : "fail"}`}>
                      {result.passed ? "Met" : "Missing"}
                    </span>
                  </div>
                ))}

                {tier !== "premium" ? (
                  <button
                    className="upgrade-inline-trigger"
                    onClick={() =>
                      setSheet({
                        kind: "upgrade",
                        title: "Unlock requirement details",
                        description:
                          "Premium adds detailed requirement explanations and fix-to-qualify guidance.",
                      })
                    }
                    type="button"
                  >
                    Unlock requirement details
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="screen-section pathway-documents-section">
          <div className="detail-card">
            <button
              className="detail-summary"
              onClick={() => setActivePathwayPanel(entry, "documents")}
              type="button"
            >
              <div>
                <strong>Documentation</strong>
                <span>
                  {completedDocuments} of {entry.visa.documents.length} documents complete
                </span>
              </div>
              <span className="detail-summary-pill">
                {openPathwayPanel === "documents" ? "▾" : "▸"}
              </span>
            </button>
            {openPathwayPanel === "documents" ? (
              <div className="detail-content">
                {entry.visa.documents.map((document) => {
                  const completed = entry.pathway.completedDocumentIds.includes(
                    document.id
                  );

                  return (
                    <div key={document.id} className="checklist-row">
                      <div>
                        <strong>{document.title}</strong>
                        <p>
                          {tier === "premium"
                            ? document.description
                            : completed
                              ? "Marked complete"
                              : "Mark done when ready"}
                        </p>
                      </div>
                      <button
                        className={`check-action${completed ? " complete" : ""}`}
                        onClick={() => toggleDocument(entry.pathway.id, document.id)}
                        type="button"
                      >
                        {completed ? "Done" : "Mark done"}
                      </button>
                    </div>
                  );
                })}

                {tier !== "premium" ? (
                  <button
                    className="upgrade-inline-trigger"
                    onClick={() =>
                      setSheet({
                        kind: "upgrade",
                        title: "Unlock document assistance",
                        description:
                          "Premium adds richer document details and stronger evidence guidance.",
                      })
                    }
                    type="button"
                  >
                    Unlock document assistance
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="screen-section pathway-steps-section">
          <div className="detail-card">
            <button
              className="detail-summary"
              onClick={() => setActivePathwayPanel(entry, "steps")}
              type="button"
            >
              <div>
                <strong>Application Steps</strong>
                <span>
                  {completedSteps} of {entry.visa.steps.length} steps complete
                </span>
              </div>
              <span className="insight-pill">
                {entry.visa.premiumInsights.length} Visa Insights
              </span>
            </button>
            {openPathwayPanel === "steps" ? (
              <div className="detail-content">
                {entry.visa.steps.map((step) => {
                  const completed = entry.pathway.completedStepIds.includes(step.id);

                  return (
                    <div key={step.id} className="checklist-row">
                      <div>
                        <strong>{step.title}</strong>
                        <p>{tier === "premium" ? step.description : "Track each step in order."}</p>
                      </div>
                      <button
                        className={`check-action${completed ? " complete" : ""}`}
                        onClick={() => toggleStep(entry.pathway.id, step.id)}
                        type="button"
                      >
                        {completed ? "Done" : "Mark done"}
                      </button>
                    </div>
                  );
                })}

                {tier !== "premium" ? (
                  <button
                    className="upgrade-inline-trigger"
                    onClick={() =>
                      setSheet({
                        kind: "upgrade",
                        title: "Unlock visa insights",
                        description:
                          "Premium adds visa insights, step nudges, and richer application help.",
                      })
                    }
                    type="button"
                  >
                    Unlock visa insights
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {renderSheet()}
      </div>
    );
  };

  if (mode === "search") {
    return renderSearchScreen();
  }

  if (mode === "visas") {
    if (requestedVisaId && selectedSavedEntry) {
      return renderDetailScreen(selectedSavedEntry, "/app/visas");
    }

    return renderListScreen("/app/visas");
  }

  if (requestedVisaId && selectedSavedEntry) {
    return renderDetailScreen(selectedSavedEntry, "/app");
  }

  if (savedEntries.length === 0) {
    return renderSearchScreen();
  }

  if (savedEntries.length === 1 && selectedSavedEntry) {
    return renderDetailScreen(selectedSavedEntry, "/app");
  }

  return renderListScreen("/app");
}
