# SkillStack

A React and Vite client with an Express API, styled after the LMS redesign specs in [specs/Redesign.md](specs/Redesign.md), [specs/RedesignPatch.md](specs/RedesignPatch.md) and [specs/RedesignPatch2.md](specs/RedesignPatch2.md), plus [specs/RegistrationFeature.md](specs/RegistrationFeature.md) and [specs/Login.md](specs/Login.md). Learner accounts live in PostgreSQL and mentors (tutors) live in MongoDB.

- **Log in / Sign up** (shown first): sign up creates a real account in the PostgreSQL `registrations` table, with validation in the browser and again on the server. Log in checks the email and password against those accounts. An unknown email shows "No account is associated with that email"; a wrong password shows "Invalid credentials".

- **Home**: hero with a continue-learning card, the "hottest right now" course carousel, and a bento grid with live crew stats, the **Join the Movement** form (creates an account for someone else in PostgreSQL), downloadable resources and a project gallery.
- **Manage Crew**: searchable learner (PostgreSQL) and mentor (MongoDB) tables.
- **The Toolkit**: cheat sheets plus CSV exports of the live rosters.
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
```

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

Passwords must be more than 7 characters with at least 1 capital letter, 3 digits and 1 special character, and must match the confirmation.

The API listens at `http://localhost:5000`. The endpoints are:

```text
GET  http://localhost:5000/api/registrations   # PostgreSQL learners
POST http://localhost:5000/api/registrations   # Create an account (JSON: fullName, email, phoneNumber, education, password, confirmPassword)
POST http://localhost:5000/api/login           # Log in (JSON: email, password)
GET  http://localhost:5000/api/tutors          # MongoDB mentors
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
