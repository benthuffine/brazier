import Link from "next/link";

import { AdminConsole } from "@/components/admin-console";

export default function AdminPage() {
  return (
    <main className="admin-page">
      <div className="app-header" style={{ paddingTop: "1.1rem" }}>
        <div className="brand-mark">
          <div className="brand-badge">A</div>
          <div className="brand-copy">
            <strong>Migrately Admin</strong>
            <p>Editorial demo surface for visa content</p>
          </div>
        </div>
        <div className="actions-row">
          <Link className="button ghost" href="/">
            Landing
          </Link>
          <Link className="button secondary" href="/app">
            Product app
          </Link>
        </div>
      </div>
      <AdminConsole />
    </main>
  );
}
