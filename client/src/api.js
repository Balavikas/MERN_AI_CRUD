function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchRecords(endpoint, recordLabel, signal, token) {
  const response = await fetch(endpoint, { signal, headers: authHeaders(token) });
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

async function sendJson(method, endpoint, body, fallbackError, token) {
  let response;
  try {
    response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: body === undefined ? undefined : JSON.stringify(body),
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
