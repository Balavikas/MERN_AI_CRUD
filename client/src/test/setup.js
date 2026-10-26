import '@testing-library/jest-dom/vitest';
import { cloneElement } from 'react';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Fallback for when jsdom's storage isn't reachable (Node 25+'s experimental Web Storage hides it unless
// vite.config.js turns that off). Fills localStorage/sessionStorage with an in-memory Storage.
class MemoryStorage {
  #items = new Map();

  get length() {
    return this.#items.size;
  }

  key(index) {
    return [...this.#items.keys()][index] ?? null;
  }

  getItem(key) {
    return this.#items.has(String(key)) ? this.#items.get(String(key)) : null;
  }

  setItem(key, value) {
    this.#items.set(String(key), String(value));
  }

  removeItem(key) {
    this.#items.delete(String(key));
  }

  clear() {
    this.#items.clear();
  }
}

for (const name of ['localStorage', 'sessionStorage']) {
  if (!globalThis[name]) {
    Object.defineProperty(globalThis, name, { value: new MemoryStorage(), configurable: true });
  }
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// jsdom has <dialog> but not showModal()/close(); Modal.jsx relies on both, so fill them in for tests.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

// jsdom can't measure layout, so Recharts' ResponsiveContainer would render charts at 0×0. Give every chart a fixed
// size in tests instead.
vi.mock('recharts', async (importOriginal) => {
  const recharts = await importOriginal();
  return {
    ...recharts,
    ResponsiveContainer: ({ children }) => cloneElement(children, { width: 800, height: 320 }),
  };
});

// jsdom doesn't implement scrolling; the app scrolls to the top on login, logout and page changes.
window.scrollTo = () => {};
