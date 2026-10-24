export async function fetchRecords(endpoint, recordLabel, signal) {
  const response = await fetch(endpoint, { signal });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `Unable to load ${recordLabel}.`);
  }
  if (!Array.isArray(result)) {
    throw new Error(`The ${recordLabel} API returned an invalid response.`);
  }
  return result;
}

export class ApiError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

async function postJson(endpoint, body, fallbackError) {
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Couldn't reach SkillStack. Check your connection and try again.");
  }
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fieldErrors = result.fieldErrors || (result.field ? { [result.field]: result.error } : {});
    throw new ApiError(result.error || fallbackError, fieldErrors);
  }
  return result;
}

export function createAccount(account) {
  return postJson('/api/registrations', account, 'Could not create your account. Give it another shot.');
}

export function logIn(credentials) {
  return postJson('/api/login', credentials, 'Could not log you in. Give it another shot.');
}
