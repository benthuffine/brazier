import Link from "next/link";
import { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <div className="app-main">
        <header className="app-header">
          <div className="brand-mark">
            <div className="brand-badge">M</div>
            <div className="brand-copy">
              <strong>Migrately MVP</strong>
              <p>Cross-platform visa matching and pathway tracking</p>
            </div>
          </div>
          <div className="actions-row">
            <Link className="button ghost" href="/">
              Landing
            </Link>
            <Link className="button secondary" href="/admin">
              Admin
            </Link>
          </div>
        </header>
        {children}
      </div>
      <BottomNav />
    </main>
  );
}
