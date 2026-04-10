# Migrately MVP

Mobile-first MVP for the `migrately_visa_app.pdf` proposal, implemented as a Next.js progressive web app so it can run on Android and iOS without committing to native-first complexity.

## Included

- Marketing landing page
- Profile onboarding wizard
- Visa matching engine with conditional requirement groups
- Saved visa pathways with steps and document tracking
- In-app notifications
- Lightweight desktop-oriented admin editor
- Manifest + service worker for PWA installation
- SQLite-backed local persistence for the demo state

## Run

```bash
npm install
npm run dev
```

The app defaults to SQLite locally. To override the database backend, create a `.env.local` from `.env.example`.

## Database

- Local development: `DATABASE_PROVIDER=sqlite`
- Production: `DATABASE_PROVIDER=postgres` with `DATABASE_URL`
- Optional SQLite override: `SQLITE_DATABASE_PATH`
- Optional Postgres overrides: `DATABASE_SSL`, `POSTGRES_POOL_MAX`

## Demo Accounts

- Admin: `admin@migrately.demo` / `DemoAdmin!23`
- Starter user: `starter@migrately.demo` / `DemoStarter!23`
- Premium user: `premium@migrately.demo` / `DemoPremium!23`

## Notes

- The app uses SQLite by default in local development and can switch to PostgreSQL via environment variables.
- Local SQLite persists to `storage/migrately.sqlite` unless `SQLITE_DATABASE_PATH` is set.
- The app is explicitly framed as informational and non-legal-advice UX.
