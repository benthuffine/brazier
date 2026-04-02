# Migrately MVP Demo Checklist

Use this as a live checklist during the client demo. It focuses on what is already built and worth showing now.

## Demo Accounts

- Admin: `admin@migrately.demo` / `DemoAdmin!23`
- Starter user: `starter@migrately.demo` / `DemoStarter!23`
- Premium user: `premium@migrately.demo` / `DemoPremium!23`

## Best Demo Order

1. Start on the landing page as a logged-out visitor.
2. Sign in as the Starter user and show the core free experience.
3. Switch to the Premium user and show the unlocked workflow depth.
4. Switch to the Admin user and show the content-management side.
5. Close with the technical talking points: installable PWA, SQLite persistence, auth, and admin-driven catalog editing.

## Public And Product Shell

- Marketing landing page with proposal-aligned branding and mobile-first positioning.
- Clear explanation of why the MVP is a PWA instead of native-first.
- Installable web app behavior through the web manifest and service worker.
- Cross-platform framing for Android and iOS from a single React/Next.js codebase.
- Login screen with demo-user shortcuts for admin, starter, and premium personas.

## Starter User Experience

- Profile onboarding wizard with multiple steps and completion progress.
- Profile fields for identity, work, finances, mobility, languages, and eligibility signals.
- Live visa matching based on the current profile.
- Dashboard cards showing eligible visas, close-fit visas, and match strength.
- Country discovery section showing destinations connected to the user’s current matches.
- Ability to save one visa pathway on the free tier.
- Notifications feed with unread count, mark-read, and dismiss actions.
- Clear premium gates inside the free experience so the upgrade boundaries are visible.

## Premium User Experience

- Multiple saved pathways instead of the Starter single-pathway limit.
- Family-member and dependent inputs unlocked in profile onboarding.
- Requirement explanations, including more detailed guidance than simple pass/fail.
- Conditional qualification logic for visas that have alternative routes, such as education vs experience.
- “Fix this to qualify” guidance for close-fit visas.
- Document detail view with descriptions and progress tracking.
- Step-by-step application tracker with completion progress.
- Optional requirements and “strengthen application” guidance.
- Visa insights that explain strategic or practical considerations.
- Source and review section for each visa, including official-source slot, review status, and last-reviewed metadata.

## Premium Boundary Messaging

- Starter boundaries are explicitly visible in the UI, not just implied.
- Premium gates are present in profile, discovery, and saved-pathway flows.
- The app already demonstrates what becomes more useful after upgrade, even before billing is wired in.

## Admin Experience

- Admin-only route protection separate from the normal user app.
- Ability to add new countries for future visa creation.
- Ability to create a visa from a blank starting point.
- Ability to create a visa from an existing visa template.
- Edit core visa fields such as name, country, category, summary, description, and processing time.
- Edit source and review metadata for each visa.
- Full eligibility-rule editor for base requirements.
- Alternative-path editor for conditional qualification groups.
- Typed rule editing for numbers, booleans, arrays, education level, language level, and enum-based fields.
- Edit optional boosts, premium insights, required documents, and application steps.
- Archive and restore visa records.
- Delete visa records.
- Drag-and-drop visa ordering in the admin catalog.

## Trust And Data-Readiness Features

- Visa catalog supports source authority, official URL, review status, review notes, and last-reviewed date.
- The app surfaces when a visa is still draft or not fully reviewed.
- The current demo data is placeholder content, but the schema is now prepared for real sourced records.
- Country creation and visa creation can happen through the UI without touching SQLite manually.

## Technical Talking Points

- Local SQLite database backs users, sessions, app state, countries, visas, pathways, and notifications.
- Cookie-based auth with role-aware routing for starter, premium, and admin users.
- Per-user state is persisted server-side instead of living only in browser storage.
- The storage layer is intentionally thin, making it easier to replace SQLite with an external database later.
- The app is already structured as a working end-to-end MVP, not just static mockups.

## Good Screens To Show Live

- Landing page
- Login page
- Starter dashboard
- Starter profile wizard
- Starter saved-pathway limitations
- Premium dashboard
- Premium saved pathway with steps, documents, and fix-plan detail
- Notifications screen
- Admin country creation
- Admin visa creation
- Admin requirement editor
- Admin source-and-review editor

## What To Be Clear About In The Demo

- The visa content is still demo data, not production-researched legal content.
- The source-review workflow is in place so real visa data can be loaded next.
- Billing is not wired yet; premium is demonstrated through account tiering and gated UX.
- Country management currently supports creation, but not yet a full country-editing workflow.
