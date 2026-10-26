# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SkillStack: an LMS with a React 18 + Vite client (`client/`) and an Express API (`server/`). Accounts, courses, enrollments and assignments live in PostgreSQL (database `ai_class`). MongoDB is used only for the mentors list (`GET /api/tutors`, collection `ai_class.registrations`). Feature requests arrive as markdown files in `specs/`, and the README links each implemented one.

## Commands

The client has unit tests (Vitest + React Testing Library + jsdom); the server has none, and neither package has a linter. Follow `.claude/skills/unit-tests/SKILL.md` when adding or changing a component.

```bash
# API (http://localhost:5000); needs server/.env with PG* vars, optional MONGODB_URI/MONGODB_DB and SESSION_SECRET
cd server && npm install
npm run migrate          # applies new server/migrations/*.sql files once each (tracked in schema_migrations)
npm start
DIRECTOR_NAME=... DIRECTOR_EMAIL=... DIRECTOR_PHONE=... DIRECTOR_PASSWORD=... npm run create-director

# Client (http://localhost:5173); Vite proxies /api to :5000
cd client && npm install
npm run dev
npm run build            # the quickest way to check the client compiles
npm test                 # all client unit tests (vitest run)
npx vitest run src/components/EnrollmentChart.test.jsx   # one file; add -t "name" for one test
```

Without `SESSION_SECRET`, tokens are signed with a random per-process key, so every restart logs everyone out.

## Architecture

**Schema changes go in a new numbered file in `server/migrations/`** (`004_faculty_assignments.sql` is the latest). Never edit an applied migration. `migrate.js` runs each file in its own transaction.

**Auth and roles.** Roles are `student`, `faculty` and `director`, stored in `registrations.role`. Users pick a role at sign-up, and `POST /api/login` only succeeds when the requested role matches the stored one. Login returns an HMAC-signed token (custom, not JWT; see `server/auth.js`). Protected routes use `requireRole(...roles)`, which sets `req.user = { id, role }`. Passwords are scrypt-hashed in `server/passwords.js`. Responses never include `password_hash`: queries select `publicColumns` explicitly.

**API error shape.** Validation failures return `{ error, fieldErrors: { field: message } }`, or `{ error, field }` for a single field. The client's `ApiError` (`client/src/api.js`) normalizes both into `error.fieldErrors`, and the forms show them inline. Postgres `23505` (unique violation) maps to a 409 with field errors, and `23503` (foreign key) maps to a 400 "pick a course".

**Courses are data, not code.** The catalog is the `courses` table, served by `GET /api/courses` (public, newest first). `enrollments.course_id` and `assignments.course_id` are foreign keys to it. Each course's `icon` column must name an entry in `client/src/components/Icon.jsx`. Card art is tinted per category through `.course-card__art[data-category='...']` rules in `styles.css`; add a rule when introducing a new category, and add it to `categories` in `client/src/data.js` so it appears in the filters. Student, faculty and report routes join `courses` and return `title`/`icon` (or `course_title`/`course_icon`), so the client never looks courses up locally.

**Faculty may only post to courses they're assigned to.** Directors manage `faculty_assignments` (faculty ↔ course). `POST /api/assignments` inserts with `WHERE EXISTS` on that table and returns 403 otherwise, so the rule holds even if the UI is bypassed. The Faculty `AssignmentForm` lists courses from `/api/faculty-assignments/mine`, not `/api/courses`.

**Client navigation has no router.** `App.jsx` holds `activePage` state. The first tab is the role's dashboard (`dashboards` map: StudentPage / FacultyPage / DirectorPage), followed by the shared Home, Manage Crew and Toolkit pages. Those three are currently hidden through `hiddenPages` in `App.jsx`. That one list removes their tabs and the footer links into them, sends the logo to the dashboard, and hides the course search (`SubNav` `showTools`). The pages' code stays; remove an id to bring a page back. `navigate(page, targetId, focusId)` switches pages inside a View Transition and then scrolls or focuses. The session `{ id, firstName, role, token }` is kept in localStorage, or in sessionStorage when "Keep me logged in" is off.

**Data fetching.** `useRecords(endpoint, label, token?)` returns `{ records, status, error, reload }` and is used for every list. Writes go through the helpers in `api.js`, which take the token as their first argument. Dashboard actions open the native-`<dialog>` `Modal`, which mounts its children only while open, so forms and pickers inside it reset on each open.

**Rules duplicated on both sides; change both together:**
- Sign-up and profile validation: `client/src/validation.js` ↔ `server/validation.js`.
- Role ids: `roles` in `client/src/data.js` ↔ `roles` in `server/auth.js`.

**Tests.** `*.test.jsx` files sit next to their component. `vite.config.js` runs test workers with `--no-experimental-webstorage`, so Node 25+'s built-in Web Storage doesn't hide jsdom's `localStorage`. Tests stub `fetch` with `src/test/mockFetch.js` (never a real server). `src/test/setup.js` adds the jest-dom matchers and fills in `HTMLDialogElement.showModal()`/`close()`, which jsdom lacks. The Vitest config is the `test` block in `client/vite.config.js`.

**Charts.** The Faculty enrollment chart (`EnrollmentChart`) is plain HTML/CSS. The Director's education chart (`EducationChart`) uses **Recharts**, lazy-loaded from `DirectorPage` so the library only downloads for directors. Series colors are the `--series-students` / `--series-faculty` tokens in `styles.css`, applied via each `<Bar>`'s className, not Recharts' `fill` prop, so they follow the theme toggle. They were checked for color-blind separation with the dataviz skill's validator; re-run it if you change them. In tests, `src/test/setup.js` swaps Recharts' `ResponsiveContainer` for a fixed 800×320 size, because jsdom can't measure layout.

**Dates.** `due_date` is returned as `YYYY-MM-DD` text (`due_date::text`). Format it with `formatDueDate` (UTC) and other timestamps with `formatDate`, both in `data.js`.

## Styling

- **One stylesheet:** `client/src/styles.css`, with design tokens on `:root` and a `[data-theme='dark']` override. The theme toggle is `useTheme`.
- **Bootstrap is partial.** Only `bootstrap-grid` and `bootstrap-utilities` are imported (in `main.jsx`, before `styles.css`). Do not import full Bootstrap: its `.btn`, `.container`, form and table styles clash with the app's own classes.
- **Layout uses Bootstrap.** Page layouts use `row` / `col-*` and the flex utilities in JSX. `.container` keeps the app's own width (`min(1240px, 100% - 32px)`, Bootstrap's max-width and padding switched off), so keep row gutters at `g-4` or below, or rows overflow the 16px page edge.
- **Card layouts wrap columns.** Put `col-*` on a wrapper element, not on a padded card (`.bento-card`, `.stat`, `.trend-card`), or the gutters disappear.
- **Form rows stay custom.** `.field-row` deliberately keeps a CSS auto-fit grid, because it sizes to its container rather than the viewport.
- **Media queries** use Bootstrap's breakpoints (575.98 / 767.98 / 991.98 / 1199.98px).
