// Keep these rules in sync with server/validation.js.
import { educationLevels } from './data.js';

export const passwordRules = [
  { id: 'length', label: 'More than 7 characters', test: (password) => password.length > 7 },
  { id: 'capital', label: 'At least 1 capital letter', test: (password) => /[A-Z]/.test(password) },
  { id: 'digits', label: 'At least 3 digits', test: (password) => (password.match(/\d/g) || []).length >= 3 },
  { id: 'special', label: 'At least 1 special character', test: (password) => /[^A-Za-z0-9\s]/.test(password) },
];

export function validateSignup(values) {
  const errors = {};
  const fullName = values.fullName.trim();
  const phoneDigits = values.phoneNumber.replace(/\D/g, '');

  if (!fullName) {
    errors.fullName = 'Tell us your name.';
  } else if (/\d/.test(fullName)) {
    errors.fullName = "Name can't contain digits.";
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "That email doesn't look right.";
  }

  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone number is required.';
  } else if (!/^\+?[\d\s()-]+$/.test(values.phoneNumber.trim()) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phoneNumber = 'Use 7 to 15 digits, e.g. +1 555 010 2030.';
  }

  if (!educationLevels.includes(values.education)) {
    errors.education = 'Pick an education level from the list.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (passwordRules.some((rule) => !rule.test(values.password))) {
    errors.password = "Password doesn't meet every rule below yet.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords don't match.";
  }

  return errors;
}
