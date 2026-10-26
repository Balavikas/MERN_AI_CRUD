import { vi } from 'vitest';

// Stubs global fetch with canned API responses so component tests never reach the server.
// `routes` maps "METHOD /path" (or just "/path" for GET) to { status, body } or to a function returning one.
// Unmatched requests fail loudly with a 500 so a missing route shows up in the test output.
export function mockFetch(routes) {
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const route = routes[`${method} ${url}`] ?? (method === 'GET' ? routes[url] : undefined);
    const reply = typeof route === 'function' ? route(url, options) : route;
    const { status = 200, body = {} } = reply ?? { status: 500, body: { error: `No mock for ${method} ${url}` } };

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
