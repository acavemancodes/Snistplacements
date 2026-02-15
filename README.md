# SNIST Forum

Build. Share. Improve. Together.

This repository contains a college-community platform for SNIST students. The system currently ships with:
- Placement tracking (API + fallback data)
- Find Alumni (CSV-driven, searchable, sortable, paginated)
- Multi-category forum experience (Dev Worms, DSA Worms, SNIST News, PartyChat)
- Local login + Firebase-based Google login
- Local-first forum persistence using browser `localStorage`
- Netlify-ready static client deployment configuration

---

# Complete Project Manual (30+ Page Edition)

This guide is intentionally long and structured for new contributors, maintainers, and reviewers who need complete context quickly. Each section is marked as a “Page” for easier sequential reading.

---

## Page 01 - Product Mission and Scope

`SNIST Forum` is designed as a student collaboration hub that combines practical placement tracking with community-first discussion spaces. Unlike a simple blog, this system is built around category-based forum interactions where users create threads, comment, vote, and discover trending discussions.

The core value proposition is to reduce context switching for students by combining:
- career updates,
- alumni discovery,
- developer collaboration,
- and social community threads.

From a software perspective, the current implementation intentionally balances rapid delivery and extensibility:
- UI is plain HTML/CSS/JS for light runtime overhead.
- Backend is Express + MongoDB for auth and placement APIs.
- Forum state is currently local to each browser to avoid backend complexity in phase 1.

The architecture is deliberately modular so the forum can be promoted from `localStorage` to persistent backend models in a future phase.

---

## Page 02 - Functional Feature Overview

Current end-user features:
- **Placement Tracker**: fetches data from `/api/placements`, with robust fallback dataset.
- **Find Alumni**: searchable alumni list from CSV with filters, sort, and pagination.
- **Forum Categories**:
  - Dev Worms
  - DSA Worms
  - SNIST News
  - PartyChat
- **Threaded Experience**:
  - create posts,
  - open thread view,
  - add comments,
  - one-level replies,
  - upvote/downvote,
  - report,
  - author-only delete.
- **Forum Profiles**:
  - name, username, branch, year, skills, GitHub, bio.
- **Authentication**:
  - local signup/login,
  - Firebase Google sign-in.
- **Theme controls**:
  - day/night appearance.
- **Animation support**:
  - Lottie in selected UI contexts.

Key non-feature decision (important): forum posts/comments are not yet shared globally across all users. They persist per browser via `localStorage`.

---

## Page 03 - High-Level Architecture

The application is split into two major layers:

1. **Client (static)**
- Served from `client/`
- Contains UI markup, styles, and all frontend logic
- Uses fetch calls for auth/placements
- Uses browser storage for forum persistence

2. **Server (Node.js/Express)**
- Entry point: `server.js`
- Connects to MongoDB
- Exposes route modules:
  - `server/routes/auth.js`
  - `server/routes/placements.js`
- Exposes public config endpoints for frontend Firebase setup

Data ownership today:
- Forum: browser `localStorage`
- Auth users: MongoDB (`User` model)
- Placement mail extraction: server-side, computed at request time

This clear separation makes future migration straightforward:
- Forum persistence can move to backend without reworking the entire UI shell.

---

## Page 04 - Repository Layout and File Map

Top-level relevant files:
- `server.js` - Express bootstrap, middleware, route mounting, env config exposure
- `imapclient.js` - IMAP email fetch logic
- `netlify.toml` - deployment + redirect rules
- `package.json` - scripts and dependencies

Frontend:
- `client/index.html` - app shell, sections, auth modals, script inclusion
- `client/css/style.css` - global UI styles (including forum + alumni + theme)
- `client/css/auth.css` - auth card and modal-specific visual layer
- `client/js/script.js` - placements, alumni, navigation, theme, local auth orchestration
- `client/js/forum.js` - forum engine (local data store, rendering, interactions)
- `client/js/firebase-auth.js` - Firebase initialization and auth API bridge

Backend:
- `server/models/User.js` - user schema
- `server/routes/auth.js` - signup/login/google auth APIs
- `server/routes/placements.js` - placement fetch + parsing + fallback API
- `server/utils/JobEmailExtractor.js` - extraction pipeline for job info

---

## Page 05 - Runtime Startup Flow

When you run `npm run dev`:

1. `server.js` starts.
2. `.env` values are loaded.
3. MongoDB connection is attempted.
4. Express middleware is registered (`cors`, JSON parser, static serving).
5. API routes are mounted.
6. Server listens on configured port.

Frontend startup (`DOMContentLoaded`):

1. `Auth` class initializes (`client/js/script.js`).
2. Theme is loaded and applied.
3. Alumni animation and navigation bindings are prepared.
4. Alumni CSV data fetch + parse starts.
5. Firebase auth bootstrap hooks are attached.
6. Forum bootstrap script (`client/js/forum.js`) initializes category shells.
7. Forum state is loaded from `localStorage` or seeded if empty.

The result is fast first-load behavior with deterministic seed data for forum categories.

---

## Page 06 - Authentication Model (Current)

Two auth tracks currently coexist:

1. **Local auth fallback**
- Users are stored in local browser storage (`snist-users` / `snist-current-user`) if Firebase is not active.
- Used mainly as compatibility fallback.

2. **Firebase auth path**
- Config loaded from `/api/config/firebase`.
- Google sign-in available through popup provider.
- Email/password auth functions also exposed through Firebase client API wrapper.

Server-side auth route (`server/routes/auth.js`) also supports:
- `/api/auth/signup`
- `/api/auth/login`
- `/api/auth/google` (token verification via `google-auth-library`)

Important security note:
- Local DB password handling in current server route compares plaintext values.
- This is acceptable only for prototype/demo phases.
- Production must use salted hashing (e.g., `bcrypt`) and token-based sessions/JWT.

---

## Page 07 - Firebase Integration Flow

Frontend Firebase setup is isolated in `client/js/firebase-auth.js`:
- Fetches public Firebase config from `/api/config/firebase`
- Initializes app and auth provider
- Exposes `window.firebaseAuthApi`
- Dispatches `firebase-auth-ready` event for race-safe integration

`client/js/script.js` listens for readiness and wires:
- topbar Google button
- auth modal Google buttons
- auth state updates into local `Auth` instance

This event-based bridge solves async timing problems where UI code might run before Firebase is fully initialized.

Recommended production hardening:
- Add explicit Firebase project checks
- Add robust user-facing error states
- Add rate limiting and origin controls for auth endpoints

---

## Page 08 - Forum Module Design Philosophy

`client/js/forum.js` is intentionally self-contained as an IIFE module with:
- internal state object
- explicit helper functions
- render-by-category pipeline
- event delegation for actions

Design goals:
- No framework lock-in
- Keep app lightweight
- Support future backend migration
- Preserve predictable state transitions

Core local keys:
- `snist-forum-posts-v1`
- `snist-forum-comments-v1`
- `snist-forum-profiles-v1`

If keys are absent, seed data is injected to keep first experience non-empty.

By keeping all forum mutation paths centralized (`handleFeedAction`, `handleThreadAction`, `handleThreadSubmit`, profile/post modal handlers), behavior remains easy to audit and migrate.

---

## Page 09 - Forum Category and Metadata System

Categories are defined in one place via `CATEGORY_META`:
- label
- badge label
- default post mode (`project` or `discussion`)
- description

Current categories:
- `devworms`
- `dsaworms`
- `snistnews`
- `partychat`

Why this matters:
- New categories can be added by extending one metadata object and providing matching section shell in `index.html`.
- Category descriptions and defaults stay consistent across toolbar, post creation flow, and thread labeling.

This metadata-first approach avoids hardcoded scattered strings and reduces UI inconsistency risk.

---

## Page 10 - Forum Data Model (Posts, Comments, Profiles)

### Post shape (local)
- `id`
- `category`
- `mode` (`project` | `discussion`)
- `title`
- `body`
- `tags[]`
- `techStack[]`
- `github`
- `demo`
- `screenshot`
- `helpNeeded`
- `authorName`
- `authorEmail`
- `createdAt`
- `votes` (map of userEmail -> `1` or `-1`)
- `reports`
- `pinned`

### Comment shape
- `id`
- `postId`
- `parentId` (for one-level reply)
- `body`
- `authorName`
- `authorEmail`
- `createdAt`
- `votes`
- `reports`

### Profile shape
- `name`
- `username`
- `branch`
- `year`
- `skills[]`
- `github`
- `bio`

---

## Page 11 - Forum Rendering Pipeline

Rendering occurs category-by-category.

For each category shell:
1. Resolve view state (`search`, `tag`, `sort`, `page`, `activePostId`, `replyToCommentId`).
2. Get filtered and sorted posts.
3. Paginate result set.
4. Render feed cards.
5. Render pagination controls.
6. Render thread if active post exists.
7. Render side widgets:
   - Trending tags
   - Top contributors
   - User profile card (or guest prompt)

This split is performant enough for local phase and keeps rerender logic deterministic.

---

## Page 12 - Forum Interactions and Controls

Post-level actions:
- Open thread
- Copy link
- Report
- Delete (author only)
- Upvote/downvote

Comment-level actions:
- Reply
- Report
- Delete (author only)
- Upvote/downvote

Interaction policy:
- Non-authenticated users can browse.
- Mutating actions call `requireAuth()`.
- If not authenticated, login modal is opened.

Safety behavior:
- Deleting a post also removes its comments.
- Deleting a root comment removes its direct replies.
- Votes are toggle-based (repeat same vote removes it).

---

## Page 13 - New Category Pagination (Implemented)

Forum feed now supports category-wise pagination.

Behavior:
- Fixed page size (`FORUM_PAGE_SIZE = 8`).
- Controls include `Prev`, page numbers, `Next` with ellipsis for long ranges.
- Count row now reports current slice, e.g. `Showing 9-16 of 61 threads`.
- Filters and sorting reset the page to `1`.
- Global search bridge also resets page to `1`.
- Creating a post moves user to page `1` and opens new thread.

UX alignment:
- Pagination uses the same professional visual language as alumni pagination.
- Mobile behavior remains responsive through existing shared pagination styles.

This solves the “infinite scroll feels unprofessional” concern while preserving fast client-only rendering.

---

## Page 14 - Forum Profile System

Profiles are local but structured like scalable entities.

When authenticated user first interacts, system auto-creates default profile:
- Name derived from auth identity/email
- Username auto-generated with uniqueness checks

Edit profile modal supports:
- Name
- Username (unique)
- Branch
- Year
- Skills (CSV -> array)
- GitHub URL
- Bio

Sidebar profile card shows:
- avatar initial
- handle
- branch/year
- post count
- comment count
- accumulated positive upvotes

Why this matters:
- Data contract is future-backend friendly.
- UI already treats profile as first-class user object.

---

## Page 15 - Alumni Module Overview

The Find Alumni section is built for practical search workflows and currently uses a local CSV source.

Capabilities:
- Search across name/company/role/year/department
- Filter by year
- Filter by company
- Sort by columns (name, role, company, dept, batch)
- Paginated list rendering
- Result count with filtered context

UI structure mirrors enterprise list pages:
- table-like header row
- row cards with avatar initials and badges
- clear reset actions
- explicit pagination controls

This section is independent from forum storage and can be upgraded to API-backed data with minimal UI rework.

---

## Page 16 - Alumni Data Pipeline

Data source:
- `client/assets/data/snist-established-alumni.csv`

Processing flow:
1. CSV file fetched on load.
2. Row normalization and string cleanup.
3. Derived fields generated:
   - initials
   - normalized search blob
   - visual tone variant
4. Filter state applied.
5. Sort and pagination applied.
6. UI rendered.

Pagination strategy here influenced forum pagination implementation:
- numbered pages
- ellipsis handling
- prev/next nav
- disabled edge states

This consistency gives users predictable behavior across major list-based modules.

---

## Page 17 - Placement Tracker Module

The placement tracker mixes dynamic extraction and resilient fallback data.

Route: `GET /api/placements`

Flow:
1. Trigger IMAP email fetch for recent inbox messages.
2. Run extraction pipeline (`JobEmailExtractor`) against message text.
3. Clean/filter extracted records.
4. Return extracted data if valid.
5. Otherwise return curated fallback dataset.

Frontend renders:
- company list rows
- CTC
- deadline
- apply link
- applied-status toggles
- quick category filters

The design ensures usable UI even when email parsing fails or mailbox changes format.

---

## Page 18 - Email Extraction Engine (`JobEmailExtractor`)

`server/utils/JobEmailExtractor.js` is a pattern-heavy parsing utility with confidence scoring.

Extracted entities:
- company
- salary
- last date
- application link
- position

Key implementation ideas:
- multiple regexes per field with base confidence
- domain-to-company normalization
- invalid token filtering
- future-date validation
- URL classification
- deduplicate by strongest confidence

Output strategy:
- convert many noisy text fragments into one “best match” record
- keep only jobs with meaningful values

This module is intentionally decoupled so it can be unit tested independently from Express routes.

---

## Page 19 - Theme System and Visual Consistency

The project supports day/night themes via body classes:
- `theme-day`
- `theme-night`

Theme toggling is persisted in local storage under `snist-theme`.

Styling strategy:
- default dark-like tone
- explicit day overrides for readability
- semantic classes for interactive components

Forum, alumni, auth cards, and placement states all have day-theme adaptations so contrast remains strong.

When extending UI:
- prefer existing variables and class patterns
- add both base and day-specific styles for new components

---

## Page 20 - Animation and Motion Layer

The UI currently uses Lottie files for selective visual enhancement.

Examples:
- auth modal animation (`/assets/lottie/login.json`)
- alumni header animation (`/assets/lottie/alumni-chat.json`)
- placement empty-state animation (`/assets/lottie/workflow.json`)

Motion safety:
- respects `prefers-reduced-motion` checks before autoplay.

Forum also uses light entrance transitions and toast motion, with reduced-motion fallback disabling animation and transition where appropriate.

Best practice used in this codebase:
- animation supports content hierarchy
- animation never blocks core flow
- static fallback UI remains fully usable

---

## Page 21 - Deployment Model (Netlify + API Backend)

`netlify.toml` currently expects:
- static publish from `client`
- no frontend build step
- API redirect `/api/*` to deployed backend domain
- SPA fallback to `index.html`
- cache headers for assets/css/js/html

Before production deploy:
1. Replace `https://YOUR_BACKEND_DOMAIN` in `netlify.toml`.
2. Ensure backend CORS allows your Netlify domain.
3. Set backend environment variables.
4. Test Firebase config endpoint and Google sign-in from production origin.

Because forum data is localStorage-based, it does not require backend endpoints today.

---

## Page 22 - Environment Variables and Configuration

Common `.env` keys in this project:

Firebase config exposure:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_STORAGE_BUCKET`

Google backend token verification:
- `GOOGLE_CLIENT_ID`

IMAP extraction:
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_HOST`
- `EMAIL_PORT`

Server:
- `PORT` (optional)

Guidance:
- Keep `.env` out of git.
- Never store secrets in frontend bundles.
- Treat Firebase web config as public config but still enforce backend and Firebase security rules.

---

## Page 23 - API Contract Documentation

### `GET /api/placements`
Returns array of placement objects:
```json
[
  {
    "company": "Google",
    "salary": "₹28-40 LPA",
    "lastDate": "2026-03-15",
    "applicationLink": "https://careers.google.com"
  }
]
```

### `POST /api/auth/signup`
Body:
```json
{ "name": "User", "email": "user@example.com", "password": "secret" }
```

### `POST /api/auth/login`
Body:
```json
{ "email": "user@example.com", "password": "secret" }
```

### `POST /api/auth/google`
Body:
```json
{ "credential": "google-id-token" }
```

### `GET /api/config/firebase`
Returns Firebase public config object.

### `GET /api/config/public`
Returns safe public values (e.g., Google client ID).

---

## Page 24 - Storage Matrix and Data Lifetimes

| Domain | Storage | Scope | Lifetime |
|---|---|---|---|
| Local auth fallback | browser localStorage | per browser | until cleared |
| Current user | browser localStorage | per browser | until logout/clear |
| Forum posts/comments/profiles | browser localStorage | per browser | until cleared |
| Auth users (server routes) | MongoDB | global backend | persistent |
| Placement parsed output | in-memory per request | server request | transient |

Key implication:
- Two users on different devices currently do not share forum threads.

Migration-ready state keys in forum are versioned (`-v1`) to enable controlled schema evolution.

---

## Page 25 - Security Review Notes

Current risks and constraints to acknowledge:
- Server auth route compares plaintext passwords.
- No JWT/session token strategy implemented.
- Forum moderation is UI-level only (report counts local).
- Forum data can be modified through browser devtools because storage is local.

Production-hardening checklist:
1. Hash passwords (`bcrypt`).
2. Add auth tokens/cookies and protected endpoints.
3. Move forum data to backend DB with authorization checks.
4. Add server-side moderation actions.
5. Add rate limiting and input validation middleware.
6. Add audit logging for destructive actions.

Until then, treat current build as a strong product prototype, not a secured production community backend.

---

## Page 26 - Performance and Scalability Considerations

Current strengths:
- Static client assets load quickly.
- No heavy frontend framework overhead.
- Forum interactions are immediate because data is local.

Current limits:
- Forum rendering is full rerender per category update.
- Large local datasets can increase client memory and rerender cost.
- Placement extraction depends on mailbox structure and network.

Future optimization options:
- Virtualized feed rendering for very large thread counts.
- Debounced search inputs.
- Memoized derived computations (top tags/contributors).
- API pagination once backend forum storage exists.
- Caching placement extraction results server-side.

---

## Page 27 - Accessibility and UX Quality

Current accessibility positives:
- semantic buttons used for actions
- `aria-label` used on controls in key places
- keyboard close support for modals via `Escape`
- reduced-motion handling in animation paths

Opportunities:
- add stronger focus-visible styles for all interactive components
- add aria-live for toasts/status updates
- improve color contrast auditing with automated tooling
- include keyboard shortcuts for forum actions

Professional UX decisions already present:
- explicit sort/search/filter controls
- pagination over infinite scroll
- clear ownership rules on delete actions
- separated thread view for deep reading

---

## Page 28 - Testing Strategy and QA Checklist

### Manual smoke checklist
- Start server and verify no startup errors.
- Verify theme toggle persists.
- Verify alumni CSV loads and pagination works.
- Verify forum categories render with seeded data.
- Verify create post/comment/vote/report/delete under logged-in user.
- Verify guest cannot mutate and gets login prompt.
- Verify Google sign-in button opens provider flow.
- Verify placement API returns data (parsed or fallback).

### Recommended automated tests to add
- API route tests (`auth`, `placements`)
- extraction unit tests for `JobEmailExtractor`
- DOM behavior tests for forum state transitions
- serialization tests for local storage schema

Current project does not yet include an automated test suite; manual QA is required before release.

---

## Page 29 - Contributor Guide and Engineering Standards

If you contribute:
1. Keep changes modular and focused.
2. Prefer consistent naming and existing UI patterns.
3. Avoid introducing unused dependencies.
4. Preserve day/night theme parity.
5. Validate with `node --check` for modified JS files.

Suggested branch naming:
- `feat/forum-backend`
- `fix/auth-modal-overlap`
- `chore/docs-readme-expansion`

Commit message style:
- `feat: add forum feed pagination`
- `fix: guard missing resource containers in script init`
- `docs: add full architecture and flow manual`

---

## Page 30 - Backend Migration Plan for Forum (When Ready)

When moving forum from localStorage to backend:

1. Add models:
- `ForumPost`
- `ForumComment`
- `ForumProfile`

2. Add routes:
- `GET /api/forum/posts`
- `POST /api/forum/posts`
- `PATCH /api/forum/posts/:id/vote`
- `DELETE /api/forum/posts/:id`
- `GET /api/forum/posts/:id/comments`
- `POST /api/forum/comments`
- `PATCH /api/forum/comments/:id/vote`
- `DELETE /api/forum/comments/:id`
- `GET/PATCH /api/forum/profile`

3. Replace local read/write functions in `forum.js` with API service layer.

4. Keep client-side optimistic updates for speed, then reconcile from server response.

5. Preserve existing UI contracts to avoid redesign churn.

---

## Page 31 - Troubleshooting Handbook

### App starts but forum empty
- Check browser console for script errors.
- Clear `snist-forum-*-v1` keys and reload.

### Google sign-in button visible but non-functional
- Verify `/api/config/firebase` returns non-empty API key.
- Verify Firebase auth domain and OAuth settings.

### Placement list looks stale
- Mail extraction may fail and fallback data may be shown.
- Check server logs for extraction errors.

### Port already in use
- Start with alternate port:
```bash
PORT=4050 npm run dev
```

### Alumni CSV not loading
- Confirm file exists at `client/assets/data/snist-established-alumni.csv`.
- Verify static file serving path in server startup.

---

## Page 32 - Command Reference

Install:
```bash
npm install
```

Run dev server:
```bash
npm run dev
```

Run production server:
```bash
npm start
```

Syntax check key scripts:
```bash
node --check client/js/script.js
node --check client/js/forum.js
node --check client/js/firebase-auth.js
node --check server.js
```

Run on custom port:
```bash
PORT=4050 npm run dev
```

---

## Page 33 - Known Limitations

- Forum persistence is browser-local only.
- No cross-device thread synchronization.
- Auth security needs production hardening.
- No automated test suite yet.
- Forum reports are UI-level counters only.
- Placement extraction quality depends on mail format variability.

These are expected prototype-phase tradeoffs and are already isolated so they can be upgraded incrementally.

---

## Page 34 - Future Roadmap (Practical)

Near-term:
- Backend forum persistence
- Auth token/session hardening
- Moderator dashboard
- Bookmark/saved posts
- Pin management UI

Mid-term:
- Notifications for replies/mentions
- Better search indexing
- Analytics dashboard for category engagement
- Import/export tooling for alumni and forum archives

Long-term:
- Role-based access controls
- Mobile-first PWA mode
- Advanced anti-abuse controls

---

## Page 35 - Glossary

- **Thread**: a forum post opened in dedicated discussion view.
- **Root comment**: top-level comment tied directly to post.
- **Reply comment**: one-level nested comment under a root.
- **Vote score**: sum of per-user `+1` and `-1` vote entries.
- **Pinned post**: prioritized thread displayed before non-pinned threads.
- **Fallback data**: curated backup dataset used when extraction fails.
- **Category shell**: container where a forum category UI is rendered.
- **View state**: per-category UI state (`search`, `sort`, `tag`, `page`, etc.).

---

## Page 36 - Maintainer Notes

This repository is now in a clean “phase-1 forum” state:
- category forums are complete,
- pagination is implemented for forum feeds,
- docs are expanded for onboarding and audits,
- deployment scaffold exists for Netlify + API backend.

If you continue from here, prioritize backend forum persistence and auth hardening first. That path will deliver the largest jump in real-user value while preserving most of the existing frontend work.

---

## Appendix A - Suggested Production Hardening Checklist

- Password hashing (`bcrypt`)
- JWT/session management
- CSRF strategy (if cookie-based auth)
- Input schema validation
- Rate limiting
- Structured logging
- Error boundary UI states
- API monitoring and alerting
- DB indexes for post queries and sort keys

---

## Appendix B - Quick Orientation for New Developers

Read in this order:
1. `server.js`
2. `client/index.html`
3. `client/js/script.js`
4. `client/js/forum.js`
5. `client/css/style.css`
6. `server/routes/auth.js`
7. `server/routes/placements.js`
8. `server/utils/JobEmailExtractor.js`

Then run the manual QA list in **Page 28**.

