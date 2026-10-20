require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');
const { getMongoDb, mongoClient } = require('./mongo');

const app = express();
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'ai_class',
});

app.use(cors({ origin: 'http://localhost:5173' }));

app.get('/api/registrations', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM registrations;');
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch registrations:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tutors', async (_req, res) => {
  try {
    const db = await getMongoDb();
    const tutors = await db.collection('registrations').find().sort({ name: 1 }).toArray();
    res.json(tutors);
  } catch (error) {
    console.error('Failed to fetch tutors:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => {
  console.log(`Registration API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(async () => {
    await Promise.allSettled([pool.end(), mongoClient.close()]);
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
