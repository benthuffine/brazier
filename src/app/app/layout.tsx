import Link from "next/link";
import { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { LogoutButton } from "@/components/logout-button";
import { AppStateProvider } from "@/components/providers/app-state-provider";
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
        <div className="app-main">
          <header className="app-header">
            <div className="brand-mark">
              <div className="brand-badge">M</div>
              <div className="brand-copy">
                <strong>Migrately MVP</strong>
                <p>
                  {user.fullName} · {user.email} · {user.tier}
                </p>
              </div>
            </div>
            <div className="actions-row">
              <Link className="button ghost" href="/">
                Landing
              </Link>
              {user.role === "admin" ? (
                <Link className="button secondary" href="/admin">
                  Admin
                </Link>
              ) : null}
              <LogoutButton />
            </div>
          </header>
          {children}
        </div>
        <BottomNav />
      </main>
    </AppStateProvider>
  );
}
