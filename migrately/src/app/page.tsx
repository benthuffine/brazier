import Link from "next/link";

import { RotatingWord } from "@/components/rotating-word";
import { getOptionalSessionUser } from "@/lib/server/auth";

export default async function LandingPage() {
  const user = await getOptionalSessionUser();
  const primaryHref = user ? (user.role === "admin" ? "/admin" : "/app") : "/login";

  return (
    <main className="landing-shell">
      <section className="landing-device">
        <div className="landing-content">
          <p className="landing-brand">migrately</p>
          <div className="landing-copy">
            <h1>
              Your journey
              <br />
              starts here.
              <br />
              Move abroad
              <br />
              to <RotatingWord />.
            </h1>
            <p>
              Migrately finds countries you can move to and visas you&apos;re
              eligible for.
            </p>
          </div>

          <div className="landing-actions">
            <Link className="button primary wide-button" href={primaryHref}>
              {user ? "Continue" : "Start for free"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
