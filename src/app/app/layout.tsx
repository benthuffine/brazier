import Link from "next/link";
import { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import { formatTierLabel, getInitials } from "@/lib/mockup-ui";
import { requireAuthenticatedUser } from "@/lib/server/auth";

export default async function ProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuthenticatedUser();

  return (
    <AppStateProvider>
      <main className="app-shell">
        <div className="mobile-app-frame">
          <header className="app-topbar">
            <div className="app-topbar-copy">
              <p className="app-kicker">Visa discovery app</p>
              <Link className="app-wordmark" href="/app">
                migrately
              </Link>
            </div>
            <div className="app-topbar-actions">
              {user.role === "admin" ? (
                <Link className="topbar-chip" href="/admin">
                  Admin
                </Link>
              ) : null}
              <Link className="profile-badge" href="/app/profile">
                <span>{getInitials(user.fullName)}</span>
                <small>{formatTierLabel(user.tier)}</small>
              </Link>
            </div>
          </header>
          <div className="app-screen">{children}</div>
          <BottomNav userName={user.fullName} />
        </div>
      </main>
    </AppStateProvider>
  );
}
