# SkillStack

A React and Vite client with an Express API, styled after the LMS redesign specs in [specs/Redesign.md](specs/Redesign.md), [specs/RedesignPatch.md](specs/RedesignPatch.md) and [specs/RedesignPatch2.md](specs/RedesignPatch2.md), plus [specs/RegistrationFeature.md](specs/RegistrationFeature.md), [specs/Login.md](specs/Login.md) [specs/AfterLogin.md](specs/AfterLogin.md) and [specs/CourseTable.md](specs/CourseTable.md). Learner accounts and the course catalog live in PostgreSQL and mentors (tutors) live in MongoDB.

- **Log in / Sign up** (shown first): sign up creates a real account in the PostgreSQL `registrations` table, with validation in the browser and again on the server. Log in checks the email and password against those accounts. An unknown email shows "No account is associated with that email"; a wrong password shows "Invalid credentials". Both forms have a role dropdown (Student, Faculty, Director). The role chosen at sign-up is saved in the `role` column, and log in only works with that same role. The **Join the Movement** form on Home always creates a student.

- **Role dashboards** (the first tab after logging in):
  - **Student · My Learning**: completed assignments on the left (with a "Still to do" list to mark assignments done), an **Add the course** button in the middle, and current courses on the right.
  - **Faculty · Faculty Desk**: **Edit student** on the left, **Show all registered students** in the middle, and **Add Assignment** (with the posted assignments) on the right.
  - **Director · Director's Office**: **Show Registered Students** on the left, **Report** in the middle (totals plus a per-course breakdown, downloadable as CSV), and **Add Faculty** / **Delete Faculty** on the right.

- **Home**: hero with a continue-learning card, the "hottest right now" course carousel, and a bento grid with live crew stats, the **Join the Movement** form (creates an account for someone else in PostgreSQL), downloadable resources and a project gallery.
- **Manage Crew**: searchable learner (PostgreSQL) and mentor (MongoDB) tables.
- **The Toolkit**: cheat sheets plus CSV exports of the live rosters.
- Responsive on phones, tablets and desktops ([specs/responsive.md](specs/responsive.md)): page layouts use Bootstrap's grid and flex utilities. Only `bootstrap-grid` and `bootstrap-utilities` are loaded, so Bootstrap doesn't restyle the app's own buttons, forms and tables.
- Light and dark themes via the header toggle, using View Transitions where the browser supports them.

## Requirements

- Node.js and npm
- PostgreSQL
- A PostgreSQL database named `ai_class` with the `public.registrations` table from [specs/ExternalData.md](specs/ExternalData.md). Run `npm run migrate` once (see below) to reshape it for sign-up.
- MongoDB with a database named `ai_class` containing a `registrations` collection (used by the Registered Tutors tab). See [specs/RegisteredTutor.md](specs/RegisteredTutor.md).

## Configure the server

Create a file named `server/.env` and set your PostgreSQL and MongoDB connection details:

```env
PGHOST=localhost
PGPORT=5432
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=ai_class
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=ai_class
SESSION_SECRET=a_long_random_string
```

`SESSION_SECRET` signs login tokens. If it is not set, the server makes a random one at startup, so everyone is logged out when it restarts.

`MONGODB_URI` and `MONGODB_DB` default to the values above if they are not set.

Use your own database settings. Do not commit `server/.env` or share its credentials.

## Start the application

Open two terminal windows from the repository folder.

### 1. Start the API server

In the first terminal:

```bash
cd server
npm install
npm run migrate   # one time: applies SQL files in server/migrations
npm start
```

`npm run migrate` applies each file in `server/migrations` once and records it in a `schema_migrations` table, so running it again is safe. The first migration **deletes every existing row** in `registrations` and changes it to:

| Column | Type | Notes |
|---|---|---|
| `id` | `BIGINT` identity | Primary key |
| `full_name` | `TEXT` | No digits allowed |
| `email` | `TEXT` | Unique, stored lowercase |
| `phone_number` | `TEXT` | Unique, 7–15 digits |
| `education` | `TEXT` | One of the sign-up options |
| `password_hash` | `TEXT` | scrypt hash; the password itself is never stored or returned |
| `created_at` | `TIMESTAMPTZ` | Defaults to `now()` |

The third migration creates the `courses` table: the original 8 courses plus 10 Gen AI and Agentic AI courses, each with an icon name used by the front end. `enrollments.course_id` and `assignments.course_id` are foreign keys to it, so only real courses can be enrolled in or given assignments. To add a course, insert a row into `courses`; it appears on Home and in the student's **Add the course** picker straight away.

The second migration adds a `role` column (`student`, `faculty` or `director`; existing accounts become students) and the `enrollments`, `assignments` and `assignment_completions` tables used by the dashboards.

You can also create a director from the command line, in the `server` folder:

```bash
DIRECTOR_NAME="Ada Lovelace" DIRECTOR_EMAIL=ada@example.com DIRECTOR_PHONE="+1 555 010 2030" \
DIRECTOR_PASSWORD='Secret123!' npm run create-director
```

Directors can also add faculty from their dashboard.

Passwords must be more than 7 characters with at least 1 capital letter, 3 digits and 1 special character, and must match the confirmation.

The API listens at `http://localhost:5000`. The endpoints are:

```text
GET  http://localhost:5000/api/registrations   # PostgreSQL learners
POST http://localhost:5000/api/registrations   # Create an account (JSON: role, fullName, email, phoneNumber, education, password, confirmPassword)
POST http://localhost:5000/api/login           # Log in (JSON: email, password)
GET  http://localhost:5000/api/tutors          # MongoDB mentors
```

`GET /api/courses` returns the catalog (newest first) and needs no login.

`POST /api/login` also takes `role` and returns a `token`. The dashboard endpoints need an `Authorization: Bearer <token>` header from an account with the listed role:

```text
GET    /api/student/courses                     # student: my courses, with course details
GET    /api/student/available-courses           # student: courses I'm not taking yet (the "Add the course" picker)
POST   /api/student/courses                     # student: enroll (JSON: courseId)
GET    /api/student/assignments                 # student: assignments in my courses, with completed_at
POST   /api/student/assignments/:id/complete    # student: mark an assignment done
GET    /api/students                            # faculty, director: all students with course counts
PATCH  /api/students/:id                        # faculty: edit a student (JSON: fullName, email, phoneNumber, education)
GET    /api/assignments                         # faculty: all assignments
POST   /api/assignments                         # faculty: create (JSON: courseId, title, description, dueDate)
GET    /api/faculty                             # director: list faculty
POST   /api/faculty                             # director: add faculty (same JSON as sign-up)
DELETE /api/faculty/:id                         # director: delete faculty
GET    /api/report                              # director: totals and per-course counts
```

### 2. Start the client

In the second terminal:

```bash
cd client
npm install
npm run dev
```

### 3. Open the page

Visit **http://localhost:5173** in your browser. Choose **Sign up** to create an account; it shows up under **Manage Crew → Learners**.

The client is configured to access the API at `http://localhost:5000`, and the API allows browser requests from `http://localhost:5173`.
