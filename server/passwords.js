const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

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

module.exports = { hashPassword, verifyPassword };
