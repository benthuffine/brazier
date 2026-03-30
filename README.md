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

## Run

```bash
npm install
npm run dev
```

## Notes

- The MVP currently uses seeded local data and `localStorage`.
- The next backend step is replacing local state with Supabase auth + PostgreSQL tables from the proposal.
- The app is explicitly framed as informational and non-legal-advice UX.
