import Link from "next/link";
import { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import { requireAdminUser } from "@/lib/server/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdminUser();

  return (
    <AppStateProvider>
      <main className="admin-page">
        <div className="admin-toolbar">
          <div className="brand-mark">
            <div className="brand-badge">A</div>
            <div className="brand-copy">
              <strong>Migrately Admin</strong>
              <p>
                {user.fullName} · {user.email} · admin
              </p>
            </div>
          </div>
          <div className="actions-row">
            <Link className="button ghost" href="/">
              Landing
            </Link>
            <Link className="button secondary" href="/app">
              Product app
            </Link>
            <LogoutButton />
          </div>
        </div>
        {children}
      </main>
    </AppStateProvider>
  );
}
