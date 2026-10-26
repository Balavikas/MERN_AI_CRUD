---
name: unit-tests
description: Write unit tests for React components in client/src. Use after creating or changing a component, or when asked to add or fix tests. Uses Vitest, React Testing Library and jsdom.
---

# Unit tests for components

Create unit tests for the components we implement. Every new or changed component in `client/src/components`
or `client/src/pages` gets a test file, and the whole suite passes before the work is reported as done.

## Setup (already in place)

- Runner: Vitest 2 with jsdom, configured in the `test` block of `client/vite.config.js`.
- `client/src/test/setup.js` loads the jest-dom matchers, cleans up after each test, and fills in
  `HTMLDialogElement.showModal()` / `close()`, which jsdom lacks (`Modal.jsx` needs them).
- `client/src/test/mockFetch.js` stubs `fetch` with canned API replies.

## Steps

1. Read the component and note what a user can see and do: loading, error and empty states, the data it
   renders, clicks, keyboard handling, and which API calls it makes.
2. Create `ComponentName.test.jsx` next to the component.
3. Write the tests:
   - Import `describe`, `it`, `expect`, `vi` from `vitest`. Globals are off.
   - Render with `render` from `@testing-library/react`; drive it with `userEvent.setup()` from
     `@testing-library/user-event`.
   - Query the way a user finds things: `getByRole`, `getByLabelText`, `getByText`. Avoid class selectors and
     test ids unless nothing else identifies the element.
   - For data from the API, call `mockFetch({ '/api/...': { body: [...] }, 'POST /api/...': { status: 201, body: {...} } })`
     before rendering, then wait with `findBy...` or `waitFor`. Assert on request URLs, methods and
     `Authorization` headers through the returned mock when the request itself matters.
   - Pass callbacks as `vi.fn()` and assert they were called.
   - Cover the main success path, the error and empty states, and any non-obvious logic (sorting, filtering,
     calculations, keyboard navigation). Don't test styling or implementation details.
4. Run `npm test` in `client/`. Fix failures in the component when it is wrong, or in the test when the test is
   wrong. Never weaken an assertion just to make it pass.
5. Report which components were tested, what each test covers, and the `npm test` summary line.

## Commands

```bash
cd client
npm test              # run every test once
npm run test:watch    # re-run on change
npx vitest run src/components/EnrollmentChart.test.jsx   # one file
npx vitest run -t "sorts"                                # tests whose name matches
```
