import Link from "next/link";

import { RotatingWord } from "@/components/rotating-word";

export default function LandingPage() {
  return (
    <main className="marketing-page">
      <section className="marketing-hero">
        <div className="marketing-grid">
          <div className="marketing-copy">
            <p className="eyebrow">Migrately proposal to MVP</p>
            <h1>
              Follow your dreams.
              <br />
              Move abroad to <RotatingWord />.
            </h1>
            <p>
              A mobile-first visa discovery app that matches users to likely
              pathways, highlights qualification gaps, and tracks the application
              process without pretending to be legal counsel.
            </p>
            <div className="actions-row">
              <Link className="button primary" href="/app">
                Get started
              </Link>
              <Link className="button secondary" href="/admin">
                Open admin
              </Link>
            </div>
          </div>

          <aside className="marketing-card">
            <p className="eyebrow">Why web first</p>
            <h2>Cross-platform without native drag</h2>
            <p>
              The proposal does not require camera, GPS, or offline-native APIs.
              A PWA gets us onto Android and iOS immediately while keeping the
              stack aligned with the proposed React + Next.js direction.
            </p>
            <div className="marketing-stats">
              <div className="marketing-stat">
                <span>Core flows</span>
                <strong>5</strong>
              </div>
              <div className="marketing-stat">
                <span>Seed visas</span>
                <strong>6</strong>
              </div>
              <div className="marketing-stat">
                <span>Installable</span>
                <strong>PWA</strong>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <p className="eyebrow">Onboarding</p>
          <h3>Profile wizard</h3>
          <p>
            Captures the data points from the proposal and recalculates visa fit
            as the user edits their profile.
          </p>
        </article>

        <article className="feature-card">
          <p className="eyebrow">Matching</p>
          <h3>Eligibility engine</h3>
          <p>
            Supports straightforward requirements plus conditional branches like
            “experience route” or “education route.”
          </p>
        </article>

        <article className="feature-card">
          <p className="eyebrow">Tracking</p>
          <h3>Pathway progress</h3>
          <p>
            Lets users save visas, check off documents and steps, and see where
            premium detail adds value.
          </p>
        </article>
      </section>
    </main>
  );
}
