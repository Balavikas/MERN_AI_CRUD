require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

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

const port = 5000;
app.listen(port, () => {
  console.log(`Registration API listening on http://localhost:${port}`);
});
