"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const demoCredentials = [
  {
    label: "Admin demo",
    email: "admin@migrately.demo",
    password: "DemoAdmin!23",
    note: "Admin + premium access",
  },
  {
    label: "Starter demo",
    email: "starter@migrately.demo",
    password: "DemoStarter!23",
    note: "Standard starter account",
  },
  {
    label: "Premium demo",
    email: "premium@migrately.demo",
    password: "DemoPremium!23",
    note: "Standard premium account",
  },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(demoCredentials[1].email);
  const [password, setPassword] = useState(demoCredentials[1].password);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const body = (await response.json()) as {
        error?: string;
        user?: { role?: string };
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Login failed.");
      }

      router.replace(body.user?.role === "admin" ? "/admin" : "/app");
      router.refresh();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Login failed."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="panel login-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Demo auth</p>
            <h1>Sign in</h1>
          </div>
        </div>
        <p className="muted">
          Local SQLite-backed users and cookie sessions. Use one of the seeded
          demo accounts below.
        </p>

        <div className="stack-sm">
          {demoCredentials.map((credential) => (
            <button
              key={credential.email}
              className="list-button"
              onClick={() => {
                setEmail(credential.email);
                setPassword(credential.password);
              }}
              type="button"
            >
              <strong>{credential.label}</strong>
              <span className="muted">{credential.email}</span>
              <span className="muted">{credential.note}</span>
            </button>
          ))}
        </div>

        <form className="stack-md" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              value={email}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="error-copy">{error}</p> : null}

          <button className="button primary" disabled={pending} type="submit">
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}
