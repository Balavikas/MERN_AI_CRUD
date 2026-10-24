require('dotenv').config();

const crypto = require('crypto');
const cors = require('cors');
const express = require('express');
const { promisify } = require('util');
const { pool } = require('./db');
const { getMongoDb, mongoClient } = require('./mongo');
const { validateSignup } = require('./validation');

const app = express();
const scrypt = promisify(crypto.scrypt);

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Never select password_hash into an API response.
const publicColumns = 'id, full_name, email, phone_number, education, created_at';

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [scheme, salt, expectedHex] = storedHash.split(':');
  if (scheme !== 'scrypt' || !salt || !expectedHex) {
    return false;
  }
  const expected = Buffer.from(expectedHex, 'hex');
  const derivedKey = await scrypt(password, salt, expected.length);
  return crypto.timingSafeEqual(derivedKey, expected);
}

app.post('/api/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  try {
    const result = await pool.query(
      `SELECT ${publicColumns}, password_hash FROM registrations WHERE email = $1;`,
      [email],
    );
    const account = result.rows[0];

    // The spec asks for distinct messages for an unknown email and a wrong password.
    if (!account) {
      return res.status(404).json({ error: 'No account is associated with that email.', field: 'email' });
    }
    if (!(await verifyPassword(password, account.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials. Check your password and try again.', field: 'password' });
    }

    const { password_hash: _passwordHash, ...publicAccount } = account;
    res.json(publicAccount);
  } catch (error) {
    console.error('Failed to log in:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/registrations', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT ${publicColumns} FROM registrations ORDER BY created_at DESC;`);
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch registrations:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/registrations', async (req, res) => {
  const fields = ['fullName', 'email', 'phoneNumber', 'education', 'password', 'confirmPassword'];
  const values = Object.fromEntries(fields.map((field) => [field, String(req.body?.[field] ?? '')]));
  const fieldErrors = validateSignup(values);

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({ error: 'Some details need fixing.', fieldErrors });
  }

  try {
    const result = await pool.query(
      `INSERT INTO registrations (full_name, email, phone_number, education, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${publicColumns};`,
      [
        values.fullName.trim(),
        values.email.trim().toLowerCase(),
        values.phoneNumber.trim(),
        values.education,
        await hashPassword(values.password),
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // 23505 is PostgreSQL's unique_violation; email and phone_number are both UNIQUE.
    if (error.code === '23505') {
      const field = error.constraint?.includes('phone') ? 'phoneNumber' : 'email';
      const label = field === 'email' ? 'email' : 'phone number';
      return res.status(409).json({
        error: `That ${label} already has an account.`,
        fieldErrors: { [field]: `That ${label} already has an account. Try logging in.` },
      });
    }
    console.error('Failed to create registration:', error);
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
