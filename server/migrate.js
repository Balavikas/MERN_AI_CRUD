require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const migrationsDir = path.join(__dirname, 'migrations');

// Applies each .sql file in migrations/ once, in name order, recording it in schema_migrations.
async function migrate() {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());',
  );
  const applied = new Set((await pool.query('SELECT name FROM schema_migrations;')).rows.map((row) => row.name));
  const pending = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql') && !applied.has(file)).sort();

  if (pending.length === 0) {
    console.log('Database is up to date.');
    return;
  }

  for (const file of pending) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1);', [file]);
      await client.query('COMMIT');
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${error.message}`);
    } finally {
      client.release();
    }
  }
}

migrate()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
