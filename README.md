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

## Demo Accounts

- Admin: `admin@migrately.demo` / `DemoAdmin!23`
- Starter user: `starter@migrately.demo` / `DemoStarter!23`
- Premium user: `premium@migrately.demo` / `DemoPremium!23`

## Notes

- The MVP now persists to a local SQLite file in `storage/migrately.sqlite`.
- The storage boundary is isolated so the next backend step can swap SQLite for Supabase/PostgreSQL without rewriting the UI.
- The app is explicitly framed as informational and non-legal-advice UX.
