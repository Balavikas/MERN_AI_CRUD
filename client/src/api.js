function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// What screens show for a system failure instead of the raw technical message (specs/Timeout.md).
export const systemErrorMessage = 'Something went wrong.';

export class ApiError extends Error {
  constructor(message, fieldErrors = {}, { system = false } = {}) {
    super(message);
    this.fieldErrors = fieldErrors;
    // True for failures the user can't fix from the form: server unreachable, a 5xx, an unreadable response, or an
    // expired session. Validation and permission errors (400/403/404/409) are not system failures.
    this.system = system;
  }
}

// The app listens here while someone is logged in and shows the "please log out and log in again" dialog.
const systemErrorListeners = new Set();

export function onSystemError(listener) {
  systemErrorListeners.add(listener);
  return () => systemErrorListeners.delete(listener);
}

function systemFailure(cause) {
  systemErrorListeners.forEach((listener) => listener(cause));
  return new ApiError(systemErrorMessage, {}, { system: true });
}

// Parses a JSON body. Returns `{ ok: false }` for a body that isn't JSON (e.g. an HTML error page from a proxy) and
// `{ ok: true, value: undefined }` for an empty one (204 No Content).
async function readBody(response) {
  const text = await response.text();
  if (!text) {
    return { ok: true, value: undefined };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

// Sends a request and returns the parsed body. System failures are reported to onSystemError listeners and thrown as
// ApiError with the friendly message; ordinary API errors are thrown with the server's own message and field errors.
async function request(endpoint, { method = 'GET', body, token, signal } = {}, fallbackError) {
  let response;
  try {
    response = await fetch(endpoint, {
      method,
      signal,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...authHeaders(token) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw systemFailure(error);
  }

  const parsed = await readBody(response);
  // A 401 on a logged-in request means the session expired; a 401 from the login form just means wrong credentials.
  const expiredSession = response.status === 401 && Boolean(token);
  if (!parsed.ok || response.status >= 500 || expiredSession) {
    throw systemFailure(new Error(`${method} ${endpoint} failed with ${response.status}`));
  }

  const result = parsed.value ?? {};
  if (!response.ok) {
    const fieldErrors = result.fieldErrors || (result.field ? { [result.field]: result.error } : {});
    throw new ApiError(result.error || fallbackError, fieldErrors);
  }
  return parsed.value;
}

export async function fetchRecords(endpoint, recordLabel, signal, token) {
  const result = await request(endpoint, { signal, token }, `Unable to load ${recordLabel}.`);
  if (!Array.isArray(result)) {
    throw systemFailure(new Error(`${endpoint} did not return a list`));
  }
  return result;
}

async function sendJson(method, endpoint, body, fallbackError, token) {
  return (await request(endpoint, { method, body, token }, fallbackError)) ?? {};
}

export function createAccount(account) {
  return sendJson('POST', '/api/registrations', account, 'Could not create your account. Give it another shot.');
}

export function logIn(credentials) {
  return sendJson('POST', '/api/login', credentials, 'Could not log you in. Give it another shot.');
}

export function enrollInCourse(token, courseId) {
  return sendJson('POST', '/api/student/courses', { courseId }, 'Could not add that course.', token);
}

export function completeAssignment(token, assignmentId) {
  return sendJson('POST', `/api/student/assignments/${assignmentId}/complete`, undefined, 'Could not mark that done.', token);
}

export function updateStudent(token, studentId, profile) {
  return sendJson('PATCH', `/api/students/${studentId}`, profile, 'Could not save that student.', token);
}

export function updateFaculty(token, facultyId, profile) {
  return sendJson('PATCH', `/api/faculty/${facultyId}`, profile, 'Could not save that faculty member.', token);
}

export function createAssignment(token, assignment) {
  return sendJson('POST', '/api/assignments', assignment, 'Could not post that assignment.', token);
}

export function createFaculty(token, account) {
  return sendJson('POST', '/api/faculty', account, 'Could not add that faculty member.', token);
}

export function deleteFaculty(token, facultyId) {
  return sendJson('DELETE', `/api/faculty/${facultyId}`, undefined, 'Could not remove that faculty member.', token);
}

export function assignFaculty(token, assignment) {
  return sendJson('POST', '/api/faculty-assignments', assignment, 'Could not assign that faculty member.', token);
}

export function unassignFaculty(token, facultyId, courseId) {
  return sendJson(
    'DELETE',
    `/api/faculty-assignments/${facultyId}/${encodeURIComponent(courseId)}`,
    undefined,
    'Could not remove that assignment.',
    token,
  );
}

export function fetchReport(token) {
  return sendJson('GET', '/api/report', undefined, 'Could not build the report.', token);
}
