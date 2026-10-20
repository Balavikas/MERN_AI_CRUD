# Registration Portal

A React and Vite client with an Express API that reads candidate registrations from PostgreSQL and tutor registrations from MongoDB.

## Requirements

- Node.js and npm
- PostgreSQL
- A PostgreSQL database named `ai_class` with the `public.registrations` table. The expected table schema is described in [specs/ExternalData.md](specs/ExternalData.md).
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
npm start
```

The API listens at `http://localhost:5000`. The endpoints are:

```text
http://localhost:5000/api/registrations   # PostgreSQL candidates
http://localhost:5000/api/tutors          # MongoDB tutors
```

### 2. Start the client

In the second terminal:

```bash
cd client
npm install
npm run dev
```

### 3. Open the page

Visit **http://localhost:5173** in your browser. Choose **Registered Candidates** or **Registered Tutors** to load the data from the API.

The client is configured to access the API at `http://localhost:5000`, and the API allows browser requests from `http://localhost:5173`.
