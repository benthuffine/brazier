# Brazier Consultation Notes

## Overview

Two app proposals under review: **Formy** (golf swing analysis) and **Migrately** (visa matching & application tracking). The proposer is seeking a technical partner to build these products, potentially in exchange for equity. This document captures technical evaluation, business considerations, and questions to resolve before committing.

**Status as of 2026-03-31:** Decision made to build Migrately first. An MVP is underway. First meeting with the proposer has not yet happened -- key business/financial questions remain unresolved. Building in good faith in the meantime, but compensation structure must be agreed before significant additional scope is committed to.

---

## Proposal Evaluations

### Formy (Golf Swing Analysis)

**Viability: Moderate -- significant technical risk at the core**

The concept fits a real and growing market. The proposal is well-structured with clear MVP scope, good mockups, and a detailed MediaPipe metrics spec. The critical question is whether MediaPipe Pose can produce reliable enough data from a phone camera to give useful golf swing feedback.

**Strengths:**
- Well-defined feature set with sensible free/premium split
- Detailed MediaPipe landmark spec with 14+ metrics ready to implement against
- Clear navigation flow and mockups
- Golf tech market is growing (launch monitors, swing sensors, coaching platforms)

**Concerns:**
- **Accuracy ceiling.** MediaPipe Pose estimates landmarks from a single camera. Golf swings last ~1.5 seconds with high angular velocity. Metrics like "Pelvic Lateral Shift 2-5cm" or "Trail Heel Lift 2-6cm" require sub-centimeter precision that MediaPipe likely can't deliver from phone video.
- **Phase detection.** Detecting 6 swing phases from monocular video is a research-level problem. The proposed heuristics (wrist height, hip rotation velocity) are reasonable starting points but will need extensive tuning.
- **Competition.** Sportsbox AI, Swing Profile, OnForm, and others have had years to refine pose-estimation pipelines. The Ochy app already covers running form analysis (the original intended sport).
- **Liability.** The line between "biomechanical coaching" and "health/medical advice" can blur, especially with injury-risk framing.

**Effort Estimates:**

| Phase | Key Work | Scope |
|-------|----------|-------|
| Spike/PoC | MediaPipe on sample golf videos, measure angle stability | 1-2 weeks |
| Prototype | Record/upload video, compute 3-4 metrics, basic feedback | 4-6 weeks |
| MVP | Auth, profiles, goals, tiers, capture history, all metrics, phase detection, admin | 3-5 months |
| Full Product | Skeleton overlay, trend charts, multi-sport, payments, partnerships, polish | Additional 4-6+ months |

**Recommendation:** A 1-2 week proof-of-concept spike is mandatory before committing. Record 10-20 swings at different angles/distances and evaluate whether MediaPipe output is stable enough to be useful. If the data is too noisy, the entire product concept falls apart regardless of how good the rest of the app is.

---

### Migrately (Visa Matching & Application Tracker)

**Viability: Strong -- but the hard part is data, not code**

Technically straightforward: a rules engine + profile matching + CRUD admin. The proposal is solid -- the data model handles conditional requirements (requirement_groups), the pathway/steps tracker is a natural premium upsell, and the suggested stack (Next.js + Supabase + PostgreSQL) is appropriate.

**Strengths:**
- Clear, high-intent value proposition ("Where can I go?" is a question millions of people search for)
- Smart free/premium split: free discovery hooks users, premium gates actionable steps
- Data model accounts for conditional requirements (not just simple boolean checks)
- Well-understood technical patterns -- low implementation risk
- Pathway tracking + fix-this-to-qualify are genuine differentiators in UX

**Concerns:**
- **Data sourcing and maintenance is the entire business.** Visa rules change constantly. Building the initial dataset for even 10-15 countries is a massive manual research effort. Keeping it current is an ongoing editorial/ops cost -- this is less a software problem and more a content problem.
- **Liability.** Even with disclaimers, people making life decisions based on your data creates risk. Stale or incorrect information could cause someone to miss deadlines or misunderstand eligibility.
- **Competition.** VisaGuide.World, ImmiSimple, and immigration law firm tools exist. Differentiation comes from UX + pathway tracking.
- **"Fix-this-to-qualify"** is clever but potentially misleading -- implies users can change circumstances to qualify, which may not always be realistic.

**Effort Estimates:**

| Phase | Key Work | Scope |
|-------|----------|-------|
| ~~MVP Core~~ | ~~Auth, onboarding wizard, profile, matching engine, browse, one pathway, tiers, admin~~ | ~~2-4 months~~ **Done** |
| Data Seeding | Research and enter visa data for 10-15 countries (parallel with dev) | 2-4 weeks dedicated research -- **unstarted, owner unresolved** |
| Full Product | Signup flow, payments, real database, email notifications, 50+ countries, polish | 2-3 additional months |

---

## Migrately MVP -- Current Build Status

A functional MVP skeleton exists as of 2026-03-31. Stack: **Next.js 15 + React 19 + TypeScript + SQLite + PWA**.

### What's Built

- **Auth:** Session-based login, role-based access (user/admin), 3 demo accounts (admin, starter, premium). No signup flow yet.
- **Matching engine:** Full eligibility scoring against structured requirements. Supports conditional requirement groups (e.g., education OR experience route), 9 operator types.
- **Profile wizard:** 4-step onboarding collecting 17 profile fields with live visa recalculation.
- **Home dashboard:** Eligible visa count, profile completion %, matched visa cards, stretch visas.
- **Pathways board:** In-progress pathway tracking with requirements, documents, and steps. Progress bars. Premium gating enforced.
- **Notifications:** In-app feed with read/dismiss, filter by type.
- **Admin console:** Full visa CRUD -- create, edit, reorder, clone, toggle visibility. Inline requirement group editor with conditional logic.
- **Free/premium tier enforcement:** Starter limited to 1 pathway. Premium gates unlocked: multiple pathways, step tracking, document details, insights, fix-this-to-qualify (UI present), family members.
- **PWA:** Installable on mobile, service worker with app shell caching.
- **Visa data:** 6 routes seeded -- Portugal D8, Spain Digital Nomad, Estonia Digital Nomad, UAE Virtual Work Residence, Germany Opportunity Card, Costa Rica Digital Nomad.

### What's Not Yet Built

| Feature | Priority | Notes |
|---------|----------|-------|
| User signup | High -- blocker for real users | Currently demo accounts only |
| Real database (Supabase/PostgreSQL) | High -- blocker for deployment | SQLite is local/dev only |
| Payment integration (Stripe) | High -- required for revenue | Tier is manually set via admin |
| Deployment (Vercel) | High -- needed to show proposer | Nothing is live yet |
| Email notifications | Medium | In-app only currently |
| More visa data (20-30+ visas) | Medium -- required for real value | Only 6 routes seeded |
| Password reset / magic link | Medium | No account recovery exists |
| Social auth (Google/Apple) | Low-medium | Nice to have for conversion |
| Fix-this-to-qualify logic | Low | UI present, backend not wired |
| Family member profiles | Low | Premium feature, deferred |
| Offline mode | Low | SW caches shell only |
| Tests | Low | None exist yet |

---

### Head-to-Head Comparison

| Dimension | Formy | Migrately |
|-----------|-------|-----------|
| Technical risk | High (pose estimation accuracy) | Low (standard CRUD + rules engine) |
| Data/content risk | Low (metric standards are static) | High (visa rules change constantly) |
| MVP speed | Slower (must validate core tech first) | Faster (well-understood patterns) |
| Monetization clarity | Weaker (niche audience, monthly sub) | Stronger (high-intent users, annual sub) |
| Defensibility | Medium (sticky if analysis is good) | Low-medium (data can be replicated) |
| Proposal completeness | Very detailed (MediaPipe spec is build-ready) | Good (needs data model refinement) |

---

## Business & Contract Considerations

### The Equity Question

The current offer appears to be equity in exchange for building the product. Key factors to weigh:

- **Equity alone is not compensation.** Equity in a pre-revenue, pre-funded startup has a near-zero expected value. The vast majority of startups fail. Equity is a bet, not payment.
- **Sweat equity imbalance.** If one person writes the spec and the other builds the entire product, the builder is contributing the majority of the tangible work. The split should reflect that.
- **Opportunity cost.** Time spent building for equity is time not spent on paid work or job searching. Even if currently unemployed, that time has value.
- **Runway.** Building an MVP for either app is 2-5 months of full-time work. Can you sustain that with no income?

### Possible Arrangements

1. **Pure equity** -- Highest risk. Only consider if the equity stake is substantial (co-founder level, 40-50%+), there's a clear path to revenue or funding, and you can afford the runway.
2. **Reduced rate + equity** -- More common. Take a below-market hourly/monthly rate to cover living costs, plus a meaningful equity stake. Protects both sides.
3. **Paid contract with small equity kicker** -- Lowest risk for you. Market-rate (or near) pay, with a small equity bonus (5-15%) as upside.
4. **Milestone-based hybrid** -- Paid for the MVP phase, with equity vesting tied to continued involvement post-launch.

### What to Understand About the Proposer

- What is their background? Product? Business? Technical?
- What are they contributing beyond the spec? Design? Marketing? Sales? Data entry?
- Do they have domain expertise in either space (golf industry contacts, immigration knowledge)?
- Have they built/launched products before?
- Is this a side project or their full-time focus?

---

## Questions for the First Meeting

These are organized by priority. The answers to the first section determine whether there's any basis to move forward at all.

### Dealbreakers -- Must Answer First

1. **What is the funding situation?** Is there any capital behind this, or is equity the only thing on the table? Is there a plan to raise? From whom?
2. **What is the proposed equity split?** What percentage, and what are the vesting terms? Is there a vesting cliff?
3. **Is there any budget for infrastructure costs?** (Hosting, Supabase, domains, app store fees, payment processing, etc.) Someone has to pay for these from day one.
4. **Is there a legal entity?** Is there an LLC or incorporation, or would that need to happen? Who owns the IP?
5. **What is the expected time commitment?** Full-time? Part-time? Is there a target launch date?
6. **Are you open to a hybrid compensation model?** (Reduced rate + equity, milestone payments, etc.)

### Business Viability

7. **Which app is the priority?** Are both being built simultaneously, or is one first? (This affects scope and commitment significantly.)
8. **Who is doing the visa data research for Migrately?** Building the software is one thing -- populating and maintaining accurate visa data for dozens of countries is a separate, ongoing job.
9. **What does the go-to-market plan look like?** Who are the first 100 users and how do they find the app?
10. **Has any user research been done?** Have potential users been interviewed? Is there a waitlist or landing page with signups?
11. **What's the competitive analysis?** Has the proposer used Sportsbox AI, OnForm, VisaGuide.World, or similar products? What specifically is the differentiation?
12. **What is the pricing target for premium tiers?** Has any pricing research been done?
13. **For Formy: has any prototype testing been done with MediaPipe and golf swing video?** If not, this is a prerequisite before committing to build.

### Roles & Responsibilities

14. **What does the proposer's day-to-day contribution look like during the build phase?** Product management? Design? QA? Marketing? Data entry?
15. **Who handles design?** The mockups exist, but are they final? Who builds the detailed screens, handles design iteration, and creates assets?
16. **Who handles ongoing data/content maintenance post-launch?** (Especially critical for Migrately.)
17. **Are there other people involved?** Other co-founders, designers, advisors, investors?
18. **What happens if the partnership doesn't work out?** Is there a buyout clause? Who keeps the code? What about non-compete?

### Technical Decisions

19. ~~**Web app, native app, or both?**~~ **Decided:** PWA (Progressive Web App) via Next.js. Mobile-installable without app store. This defers native app complexity while still working on iOS and Android. App store submissions can come later.
20. **For Formy: is the video processing client-side or server-side?** Client-side (MediaPipe JS/on-device) has privacy benefits but device-performance constraints. Server-side adds latency and infrastructure cost but is more controllable. *(Formy is deferred -- not relevant yet.)*
21. ~~**What is the admin panel scope?**~~ **Decided:** Admin panel is built and functional from day one -- necessary for the proposer to enter and manage visa data without developer involvement.
22. ~~**Is there an existing codebase, or is this from scratch?**~~ **Answered:** MVP codebase is underway (see Build Status above).
23. **Which database/backend for production?** SQLite is dev-only. Supabase (PostgreSQL + Auth) is the likely migration target per the original proposal. Needs to be decided before deployment.
24. **Who pays for infrastructure?** Hosting (Vercel), database (Supabase), email delivery, Stripe fees -- these have real costs from day one. Must be resolved before going live.

### Legal & Compliance

23. **For Migrately: what is the legal liability strategy?** Disclaimers alone may not be sufficient. Has a lawyer been consulted?
24. **For Formy: same question regarding health/injury claims.**
25. **GDPR / data privacy.** Both apps collect sensitive personal data. What is the compliance plan?
26. **Terms of service and privacy policy.** Who is responsible for drafting these?

---

## My Position Going In

- Already building Migrately in good faith, but compensation must be agreed before committing further scope.
- Not willing to work for pure equity without understanding the full picture: funding, timeline, roles, and legal structure.
- If equity-only, the stake must reflect co-founder-level contribution and there must be a clear path to revenue or funding.
- Open to hybrid models (reduced rate + equity, milestone-based).
- The MVP core is largely done. Remaining work (payments, real DB, deployment, more visa data) is the harder, more valuable part -- that work should be scoped and compensated explicitly.
- Formy remains on hold pending the Migrately evaluation and the outcome of this meeting.
- Want to understand what the proposer brings beyond the spec: ongoing visa data research, user acquisition, design decisions. These directly affect build scope.

---

## Next Steps

### Before the Call
- [ ] Review this document and tighten the dealbreaker questions
- [ ] Have a clear number in mind for minimum acceptable equity stake (if equity-only) and minimum acceptable rate (if hybrid)

### During the Call -- Must Cover
- [ ] Dealbreaker questions 1-6 (funding, equity split, infrastructure budget, legal entity, time commitment, hybrid openness)
- [ ] Who owns the visa data research problem (question 8)
- [ ] Go-to-market basics (question 9)
- [ ] Infrastructure cost ownership (new question 24)

### After the Call
- [ ] Evaluate answers to dealbreaker questions -- walk away if unresolved
- [ ] Agree on compensation structure in writing before any further build work
- [ ] Align on which countries/visas to seed for MVP launch (proposer's job)
- [ ] Decide on production database (Supabase migration vs. other)
- [ ] Get legal agreements in place (IP ownership, equity vesting, exit terms)
- [ ] Plan deployment to Vercel so proposer can see and share the app
