require('dotenv').config();

const { pool } = require('./db');
const { hashPassword } = require('./passwords');
const { validateSignup } = require('./validation');

// Creates a director from the command line (directors can also sign up on the site). Usage:
//   DIRECTOR_NAME="Ada Lovelace" DIRECTOR_EMAIL=ada@example.com DIRECTOR_PHONE="+1 555 010 2030" \
//   DIRECTOR_PASSWORD='Secret123!' npm run create-director
async function createDirector() {
  const values = {
    fullName: process.env.DIRECTOR_NAME || '',
    email: process.env.DIRECTOR_EMAIL || '',
    phoneNumber: process.env.DIRECTOR_PHONE || '',
    education: process.env.DIRECTOR_EDUCATION || 'Postgraduate',
    password: process.env.DIRECTOR_PASSWORD || '',
  };
  const errors = validateSignup({ ...values, confirmPassword: values.password });
  if (Object.keys(errors).length > 0) {
    throw new Error(`Fix these and try again:\n- ${Object.values(errors).join('\n- ')}`);
  }

  const result = await pool.query(
    `INSERT INTO registrations (full_name, email, phone_number, education, password_hash, role)
     VALUES ($1, $2, $3, $4, $5, 'director')
     RETURNING id, email;`,
    [
      values.fullName.trim(),
      values.email.trim().toLowerCase(),
      values.phoneNumber.trim(),
      values.education,
      await hashPassword(values.password),
    ],
  );
  console.log(`Created director #${result.rows[0].id} (${result.rows[0].email}).`);
}

createDirector()
  .catch((error) => {
    console.error(error.code === '23505' ? 'That email or phone number already has an account.' : error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
