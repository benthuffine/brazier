"use client";

import Link from "next/link";
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
    note: "Starter app experience",
  },
  {
    label: "Premium demo",
    email: "premium@migrately.demo",
    password: "DemoPremium!23",
    note: "Premium app experience",
  },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(demoCredentials[1].email);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function loginWithEmail(nextEmail: string) {
    const credential = demoCredentials.find(
      (candidate) => candidate.email.toLowerCase() === nextEmail.toLowerCase()
    );

    if (!credential) {
      throw new Error("Use one of the demo emails seeded in this build.");
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credential.email,
          password: credential.password,
        }),
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await loginWithEmail(email);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Login failed."
      );
    }
  }

  return (
    <div className="landing-shell">
      <section className="landing-device auth-device">
        <div className="auth-toprow">
          <Link className="auth-backlink" href="/">
            Back
          </Link>
          <span className="auth-brand">migrately</span>
        </div>

        <div className="auth-copy">
          <h1>Get started today</h1>
          <p>
            Sign in or create an account below.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <input
              autoComplete="email"
              placeholder="email@domain.com"
              onChange={(event) => setEmail(event.target.value)}
              value={email}
            />
          </label>

          {error ? <p className="error-copy">{error}</p> : null}

          <button className="button primary wide-button" disabled={pending} type="submit">
            {pending ? "Signing in..." : "Continue"}
          </button>
        </form>

        <div className="auth-divider">
          <span />
          <p>or</p>
          <span />
        </div>

        <div className="auth-social-list">
          <button
            className="auth-social-button"
            disabled={pending}
            onClick={() => {
              setEmail(demoCredentials[2].email);
              void loginWithEmail(demoCredentials[2].email).catch((nextError) => {
                setError(
                  nextError instanceof Error ? nextError.message : "Login failed."
                );
              });
            }}
            type="button"
          >
            Continue with Google
          </button>
          <button
            className="auth-social-button"
            disabled={pending}
            onClick={() => {
              setEmail(demoCredentials[1].email);
              void loginWithEmail(demoCredentials[1].email).catch((nextError) => {
                setError(
                  nextError instanceof Error ? nextError.message : "Login failed."
                );
              });
            }}
            type="button"
          >
            Continue with Apple
          </button>
        </div>

        <p className="auth-legal">
          By clicking continue, you agree to our Terms of Service and Privacy
          Policy.
        </p>
      </section>
    </div>
  );
}
