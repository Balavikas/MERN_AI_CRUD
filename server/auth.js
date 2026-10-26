const crypto = require('crypto');

const roles = ['student', 'faculty', 'director'];
const tokenLifetimeMs = 12 * 60 * 60 * 1000;

// Without SESSION_SECRET, tokens are signed with a per-process key and stop working when the server restarts.
const secret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET is not set; logins will not survive a server restart.');
}

function sign(payload) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

// A token is base64url(JSON payload) + "." + HMAC of that payload.
function createToken(account) {
  const payload = Buffer.from(JSON.stringify({
    id: account.id,
    role: account.role,
    exp: Date.now() + tokenLifetimeMs,
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function readToken(token) {
  const [payload, signature] = String(token).split('.');
  if (!payload || !signature) {
    return null;
  }
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return claims.exp > Date.now() ? claims : null;
  } catch {
    return null;
  }
}

// Express middleware: only lets requests through with a valid token for one of `allowedRoles`.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const header = req.get('Authorization') || '';
    const claims = header.startsWith('Bearer ') ? readToken(header.slice('Bearer '.length)) : null;

    if (!claims) {
      return res.status(401).json({ error: 'Your session has expired. Log in again.' });
    }
    if (!allowedRoles.includes(claims.role)) {
      return res.status(403).json({ error: "Your account can't do that." });
    }
    req.user = claims;
    next();
  };
}

module.exports = { roles, createToken, requireRole };
