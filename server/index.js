require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { createToken, requireRole, roles } = require('./auth');
const { pool } = require('./db');
const { getMongoDb, mongoClient } = require('./mongo');
const { hashPassword, verifyPassword } = require('./passwords');
const { validateAssignment, validateProfile, validateSignup } = require('./validation');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Never select password_hash into an API response.
const publicColumns = 'id, full_name, email, phone_number, education, role, created_at';
const signupFields = ['fullName', 'email', 'phoneNumber', 'education', 'password', 'confirmPassword'];
const profileFields = ['fullName', 'email', 'phoneNumber', 'education'];
const roleNames = { student: 'a student', faculty: 'a faculty member', director: 'a director' };
const courseColumns = 'c.id, c.title, c.description, c.instructor, c.category, c.level, c.duration, c.badge, c.icon';

function readFields(body, fields) {
  return Object.fromEntries(fields.map((field) => [field, String(body?.[field] ?? '')]));
}

function readId(value) {
  return /^\d+$/.test(String(value)) ? value : null;
}

// 23505 is PostgreSQL's unique_violation; email and phone_number are both UNIQUE.
function sendUniqueViolation(res, error) {
  const field = error.constraint?.includes('phone') ? 'phoneNumber' : 'email';
  const label = field === 'email' ? 'email' : 'phone number';
  return res.status(409).json({
    error: `That ${label} already has an account.`,
    fieldErrors: { [field]: `That ${label} already has an account.` },
  });
}

async function insertAccount(values, role) {
  const result = await pool.query(
    `INSERT INTO registrations (full_name, email, phone_number, education, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${publicColumns};`,
    [
      values.fullName.trim(),
      values.email.trim().toLowerCase(),
      values.phoneNumber.trim(),
      values.education,
      await hashPassword(values.password),
      role,
    ],
  );
  return result.rows[0];
}

app.post('/api/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const role = String(req.body?.role ?? 'student');

  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }
  if (!roles.includes(role)) {
    return res.status(400).json({ error: 'Pick Student, Faculty or Director.', field: 'role' });
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
    if (account.role !== role) {
      return res.status(403).json({ error: `This account isn't registered as ${roleNames[role]}.`, field: 'role' });
    }

    const { password_hash: _passwordHash, ...publicAccount } = account;
    res.json({ ...publicAccount, token: createToken(publicAccount) });
  } catch (error) {
    console.error('Failed to log in:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/registrations', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${publicColumns} FROM registrations WHERE role = 'student' ORDER BY created_at DESC;`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch registrations:', error);
    res.status(500).json({ error: error.message });
  }
});

// The role picked at sign-up is stored with the account, and log in only accepts that role.
app.post('/api/registrations', async (req, res) => {
  const values = readFields(req.body, signupFields);
  const role = String(req.body?.role ?? 'student');
  const fieldErrors = validateSignup(values);
  if (!roles.includes(role)) {
    fieldErrors.role = 'Pick Student, Faculty or Director.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({ error: 'Some details need fixing.', fieldErrors });
  }

  try {
    res.status(201).json(await insertAccount(values, role));
  } catch (error) {
    if (error.code === '23505') {
      return sendUniqueViolation(res, error);
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

// Course catalog, newest first. Public: the Home page carousel shows it to every role.
app.get('/api/courses', async (_req, res) => {
  try {
    const result = await pool.query(`SELECT ${courseColumns} FROM courses c ORDER BY c.created_at DESC, c.title;`);
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Student dashboard

app.get('/api/student/courses', requireRole('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.course_id, e.enrolled_at, ${courseColumns}
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = $1
       ORDER BY e.enrolled_at DESC;`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch enrollments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Every course in the catalog the student isn't already taking, for the "Add the course" picker.
app.get('/api/student/available-courses', requireRole('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${courseColumns}
       FROM courses c
       WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.student_id = $1)
       ORDER BY c.created_at DESC, c.title;`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch available courses:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/student/courses', requireRole('student'), async (req, res) => {
  const courseId = String(req.body?.courseId ?? '');
  if (!courseId) {
    return res.status(400).json({ error: 'Pick a course from the catalog.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING course_id, enrolled_at;`,
      [req.user.id, courseId],
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ error: "You're already taking that course." });
    }
    res.status(201).json(result.rows[0]);
  } catch (error) {
    // 23503 is foreign_key_violation: the course id isn't in the courses table.
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Pick a course from the catalog.' });
    }
    console.error('Failed to enroll:', error);
    res.status(500).json({ error: error.message });
  }
});

// Every assignment in the student's courses; completed_at is null until they finish it.
app.get('/api/student/assignments', requireRole('student'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.course_id, a.title, a.description, a.due_date::text AS due_date, done.completed_at,
              c.title AS course_title, c.icon AS course_icon
       FROM assignments a
       JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = $1
       JOIN courses c ON c.id = a.course_id
       LEFT JOIN assignment_completions done ON done.assignment_id = a.id AND done.student_id = $1
       ORDER BY done.completed_at DESC NULLS FIRST, a.due_date NULLS LAST, a.id;`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch student assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/student/assignments/:id/complete', requireRole('student'), async (req, res) => {
  const assignmentId = readId(req.params.id);
  if (!assignmentId) {
    return res.status(404).json({ error: 'That assignment does not exist.' });
  }

  try {
    // Only assignments in a course the student is enrolled in can be completed.
    const result = await pool.query(
      `INSERT INTO assignment_completions (assignment_id, student_id)
       SELECT a.id, $2 FROM assignments a
       JOIN enrollments e ON e.course_id = a.course_id AND e.student_id = $2
       WHERE a.id = $1
       ON CONFLICT (assignment_id, student_id) DO UPDATE SET completed_at = assignment_completions.completed_at
       RETURNING assignment_id, completed_at;`,
      [assignmentId, req.user.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'That assignment is not in one of your courses.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to complete assignment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Faculty and director dashboards

app.get('/api/students', requireRole('faculty', 'director'), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.full_name, r.email, r.phone_number, r.education, r.created_at,
              COUNT(e.course_id)::int AS course_count
       FROM registrations r
       LEFT JOIN enrollments e ON e.student_id = r.id
       WHERE r.role = 'student'
       GROUP BY r.id
       ORDER BY r.created_at DESC;`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch students:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/students/:id', requireRole('faculty'), async (req, res) => {
  const studentId = readId(req.params.id);
  const values = readFields(req.body, profileFields);
  const fieldErrors = validateProfile(values);

  if (!studentId) {
    return res.status(404).json({ error: 'That student does not exist.' });
  }
  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({ error: 'Some details need fixing.', fieldErrors });
  }

  try {
    const result = await pool.query(
      `UPDATE registrations
       SET full_name = $2, email = $3, phone_number = $4, education = $5
       WHERE id = $1 AND role = 'student'
       RETURNING ${publicColumns};`,
      [studentId, values.fullName.trim(), values.email.trim().toLowerCase(), values.phoneNumber.trim(), values.education],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'That student does not exist.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return sendUniqueViolation(res, error);
    }
    console.error('Failed to update student:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/assignments', requireRole('faculty'), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.course_id, a.title, a.description, a.due_date::text AS due_date, a.created_at,
              r.full_name AS created_by_name, c.title AS course_title, c.icon AS course_icon,
              (SELECT COUNT(*)::int FROM assignment_completions done WHERE done.assignment_id = a.id) AS completion_count
       FROM assignments a
       JOIN courses c ON c.id = a.course_id
       LEFT JOIN registrations r ON r.id = a.created_by
       ORDER BY a.created_at DESC;`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assignments', requireRole('faculty'), async (req, res) => {
  const values = readFields(req.body, ['courseId', 'title', 'description', 'dueDate']);
  const fieldErrors = validateAssignment(values);

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({ error: 'Some details need fixing.', fieldErrors });
  }

  try {
    const result = await pool.query(
      `INSERT INTO assignments (course_id, title, description, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, course_id, title, description, due_date::text AS due_date, created_at;`,
      [values.courseId, values.title.trim(), values.description.trim(), values.dueDate || null, req.user.id],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Some details need fixing.', fieldErrors: { courseId: 'Pick a course from the list.' } });
    }
    console.error('Failed to create assignment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Director dashboard

app.get('/api/faculty', requireRole('director'), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${publicColumns} FROM registrations WHERE role = 'faculty' ORDER BY created_at DESC;`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch faculty:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/faculty', requireRole('director'), async (req, res) => {
  const values = readFields(req.body, signupFields);
  const fieldErrors = validateSignup(values);

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({ error: 'Some details need fixing.', fieldErrors });
  }

  try {
    res.status(201).json(await insertAccount(values, 'faculty'));
  } catch (error) {
    if (error.code === '23505') {
      return sendUniqueViolation(res, error);
    }
    console.error('Failed to create faculty:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/faculty/:id', requireRole('director'), async (req, res) => {
  const facultyId = readId(req.params.id);
  if (!facultyId) {
    return res.status(404).json({ error: 'That faculty member does not exist.' });
  }

  try {
    const result = await pool.query(
      "DELETE FROM registrations WHERE id = $1 AND role = 'faculty' RETURNING id;",
      [facultyId],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'That faculty member does not exist.' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Failed to delete faculty:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/report', requireRole('director'), async (_req, res) => {
  try {
    const [totals, byCourse] = await Promise.all([
      pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM registrations WHERE role = 'student') AS students,
           (SELECT COUNT(*)::int FROM registrations WHERE role = 'faculty') AS faculty,
           (SELECT COUNT(*)::int FROM courses) AS courses,
           (SELECT COUNT(*)::int FROM enrollments) AS enrollments,
           (SELECT COUNT(*)::int FROM assignments) AS assignments,
           (SELECT COUNT(*)::int FROM assignment_completions) AS completions;`,
      ),
      pool.query(
        `SELECT c.id AS course_id, c.title,
                (SELECT COUNT(*)::int FROM enrollments e WHERE e.course_id = c.id) AS enrollments,
                (SELECT COUNT(*)::int FROM assignments a WHERE a.course_id = c.id) AS assignments,
                (SELECT COUNT(*)::int FROM assignment_completions done
                   JOIN assignments a ON a.id = done.assignment_id
                   WHERE a.course_id = c.id) AS completions
         FROM courses c
         ORDER BY c.created_at DESC, c.title;`,
      ),
    ]);
    res.json({ totals: totals.rows[0], courses: byCourse.rows });
  } catch (error) {
    console.error('Failed to build report:', error);
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
