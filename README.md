# Registration Portal

A React and Vite client with an Express API that reads candidate registrations from PostgreSQL.

## Requirements

- Node.js and npm
- PostgreSQL
- A PostgreSQL database named `ai_class` with the `public.registrations` table. The expected table schema is described in [specs/ExternalData.md](specs/ExternalData.md).

## Configure the server

Create a file named `server/.env` and set your PostgreSQL connection details:

```env
PGHOST=localhost
PGPORT=5432
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=ai_class
```

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

The API listens at `http://localhost:5000`. The registrations endpoint is:

```text
http://localhost:5000/api/registrations
```

### 2. Start the client

In the second terminal:

```bash
cd client
npm install
npm run dev
```

### 3. Open the page

Visit **http://localhost:5173** in your browser. Choose **Registered Candidates** to load the data from the API.

The client is configured to access the API at `http://localhost:5000`, and the API allows browser requests from `http://localhost:5173`.
