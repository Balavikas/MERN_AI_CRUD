import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { createFaculty, deleteFaculty, fetchRecords, logIn, onSystemError, systemErrorMessage } from './api.js';
import { mockFetch } from './test/mockFetch.js';

// Listens for system failures for the length of one test.
function listen() {
  const listener = vi.fn();
  onTestFinished(onSystemError(listener));
  return listener;
}

describe('api error handling (specs/Timeout.md)', () => {
  it('reports a 5xx as a system failure and hides the raw server message', async () => {
    const listener = listen();
    mockFetch({ '/api/faculty': { status: 500, body: { error: 'relation "registrations" does not exist' } } });

    await expect(fetchRecords('/api/faculty', 'faculty', undefined, 'token')).rejects.toMatchObject({
      message: systemErrorMessage, system: true,
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reports a response that is not JSON, like a proxy error page', async () => {
    const listener = listen();
    mockFetch({ '/api/faculty': { status: 502, raw: '<html>Bad gateway</html>' } });

    await expect(fetchRecords('/api/faculty', 'faculty', undefined, 'token')).rejects.toMatchObject({ system: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reports an unreadable success response too', async () => {
    const listener = listen();
    mockFetch({ '/api/faculty': { status: 200, raw: 'not json' } });

    await expect(fetchRecords('/api/faculty', 'faculty', undefined, 'token')).rejects.toMatchObject({ system: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reports when the server cannot be reached', async () => {
    const listener = listen();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(fetchRecords('/api/faculty', 'faculty', undefined, 'token')).rejects.toMatchObject({ system: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reports a 401 on a logged-in request as an expired session', async () => {
    const listener = listen();
    mockFetch({ '/api/faculty': { status: 401, body: { error: 'Your session has expired. Log in again.' } } });

    await expect(fetchRecords('/api/faculty', 'faculty', undefined, 'token')).rejects.toMatchObject({ system: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps wrong-password 401s from the login form as ordinary field errors', async () => {
    const listener = listen();
    mockFetch({ 'POST /api/login': { status: 401, body: { error: 'Invalid credentials.', field: 'password' } } });

    await expect(logIn({ email: 'a@b.co', password: 'x', role: 'student' })).rejects.toMatchObject({
      message: 'Invalid credentials.', fieldErrors: { password: 'Invalid credentials.' }, system: false,
    });
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps validation and permission errors inline with the server message', async () => {
    const listener = listen();
    mockFetch({
      'POST /api/faculty': { status: 409, body: { error: 'That email already has an account.', fieldErrors: { email: 'Taken.' } } },
    });

    await expect(createFaculty('token', {})).rejects.toMatchObject({
      message: 'That email already has an account.', fieldErrors: { email: 'Taken.' }, system: false,
    });
    expect(listener).not.toHaveBeenCalled();
  });

  it('treats an empty 204 reply as success', async () => {
    const listener = listen();
    mockFetch({ 'DELETE /api/faculty/40': { status: 204 } });

    await expect(deleteFaculty('token', '40')).resolves.toEqual({});
    expect(listener).not.toHaveBeenCalled();
  });

  it('passes an aborted request straight through without reporting it', async () => {
    const listener = listen();
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));

    await expect(fetchRecords('/api/faculty', 'faculty', new AbortController().signal, 'token')).rejects.toBe(abort);
    expect(listener).not.toHaveBeenCalled();
  });
});
