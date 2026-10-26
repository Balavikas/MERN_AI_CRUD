import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { inactivityLogoutGraceMs, inactivityTimeoutMs } from './data.js';
import { mockFetch } from './test/mockFetch.js';

const session = { id: '7', firstName: 'Sam', role: 'student', token: 'student-token' };

// Start signed in as a student, the way a returning user with "Keep me logged in" lands.
function renderSignedIn(routes = {}, userOptions = {}) {
  localStorage.setItem('skillstack.session', JSON.stringify(session));
  mockFetch({
    '/api/student/courses': { body: [] },
    '/api/student/assignments': { body: [] },
    ...routes,
  });
  render(<App />);
  return userEvent.setup(userOptions);
}

// jsdom has no matchMedia; useTheme and the motion helpers read it.
const stubMatchMedia = () => vi.stubGlobal('matchMedia', (query) => ({
  matches: false, media: query, addEventListener() {}, removeEventListener() {},
}));

describe('App (specs/Cleanup.md)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    stubMatchMedia();
  });

  it('shows only the dashboard tab: Home, Manage Crew and The Toolkit are hidden', () => {
    renderSignedIn();
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getAllByRole('button').map((tab) => tab.textContent)).toEqual(['My Learning']);
    expect(screen.getByRole('heading', { name: 'My Learning', level: 1 })).toBeInTheDocument();
  });

  it('hides the course search and filters, which only serve the hidden Home page', () => {
    renderSignedIn();
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Filters/ })).not.toBeInTheDocument();
  });

  it('has no Join Now button and shows a labelled Log out button', () => {
    renderSignedIn();
    expect(screen.queryByRole('button', { name: /join now/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toHaveTextContent('Log out');
  });

  it('leaves no footer links into the hidden pages', () => {
    renderSignedIn();
    const footer = screen.getByRole('contentinfo');
    for (const label of ['The Toolkit', 'Manage Crew', 'Join the Movement', 'Project gallery', 'Gen AI']) {
      expect(within(footer).queryByText(label)).not.toBeInTheDocument();
    }
    expect(within(footer).getByRole('navigation', { name: 'About' })).toBeInTheDocument();
  });

  it('keeps the logo on the dashboard instead of opening the hidden Home page', async () => {
    const user = renderSignedIn();
    await user.click(screen.getByRole('button', { name: 'SkillStack home' }));
    expect(screen.getByRole('heading', { name: 'My Learning', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Welcome back/ })).not.toBeInTheDocument();
  });

  it('logs out from the Log out button and forgets the saved session', async () => {
    const user = renderSignedIn();
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(screen.getByRole('heading', { name: 'Jump back in' })).toBeInTheDocument();
    expect(localStorage.getItem('skillstack.session')).toBeNull();
  });
});

describe('session dialogs (specs/Timeout.md)', () => {
  beforeEach(() => {
    stubMatchMedia();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => vi.useRealTimers());

  const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });
  const inactivityDialog = () => screen.queryByRole('alertdialog', { name: 'Still there?' });
  const signIn = (routes) => renderSignedIn(routes, { advanceTimers: vi.advanceTimersByTime });

  it('asks whether to continue after 7 minutes without a click, with Continue and Log out only', () => {
    signIn();
    advance(inactivityTimeoutMs - 1000);
    expect(inactivityDialog()).not.toBeInTheDocument();

    advance(1000);
    const dialog = inactivityDialog();
    expect(dialog).toHaveAccessibleDescription("You've been inactive for some time. Do you still want to continue?");
    expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Continue', 'Log out']);
  });

  it('restarts the countdown on every click', async () => {
    const user = signIn();
    advance(inactivityTimeoutMs - 60_000);
    await user.click(screen.getByRole('heading', { name: 'My Learning', level: 1 }));

    advance(inactivityTimeoutMs - 60_000);
    expect(inactivityDialog()).not.toBeInTheDocument();
    advance(60_000);
    expect(inactivityDialog()).toBeInTheDocument();
  });

  it('closes on Continue and starts counting again from zero', async () => {
    const user = signIn();
    advance(inactivityTimeoutMs);
    await user.click(within(inactivityDialog()).getByRole('button', { name: 'Continue' }));
    expect(inactivityDialog()).not.toBeInTheDocument();

    advance(inactivityTimeoutMs - 1000);
    expect(inactivityDialog()).not.toBeInTheDocument();
    advance(1000);
    expect(inactivityDialog()).toBeInTheDocument();
  });

  it('logs out to the login page from the inactivity dialog', async () => {
    const user = signIn();
    advance(inactivityTimeoutMs);
    await user.click(within(inactivityDialog()).getByRole('button', { name: 'Log out' }));

    expect(screen.getByRole('heading', { name: 'Jump back in' })).toBeInTheDocument();
    expect(localStorage.getItem('skillstack.session')).toBeNull();
    advance(inactivityTimeoutMs * 2);
    expect(inactivityDialog()).not.toBeInTheDocument();
  });

  it('logs out automatically if the dialog goes unanswered for 3 minutes, counting down meanwhile', () => {
    signIn();
    advance(inactivityTimeoutMs);
    expect(inactivityDialog()).toHaveTextContent("For your security, you'll be logged out automatically in 3:00.");

    advance(60_000);
    expect(inactivityDialog()).toHaveTextContent('logged out automatically in 2:00');

    advance(inactivityLogoutGraceMs - 60_000 - 1000);
    expect(inactivityDialog()).toHaveTextContent('logged out automatically in 0:01');
    expect(localStorage.getItem('skillstack.session')).not.toBeNull();

    advance(1000);
    expect(inactivityDialog()).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Jump back in' })).toBeInTheDocument();
    expect(localStorage.getItem('skillstack.session')).toBeNull();
  });

  it('cancels the automatic logout when Continue is clicked in time, and gives a full 3 minutes next time', async () => {
    const user = signIn();
    advance(inactivityTimeoutMs);
    advance(inactivityLogoutGraceMs - 10_000);
    await user.click(within(inactivityDialog()).getByRole('button', { name: 'Continue' }));

    advance(inactivityLogoutGraceMs);
    expect(screen.getByRole('heading', { name: 'My Learning', level: 1 })).toBeInTheDocument();

    advance(inactivityTimeoutMs - inactivityLogoutGraceMs);
    expect(inactivityDialog()).toHaveTextContent('logged out automatically in 3:00');
  });

  it('never times out on the login page', () => {
    mockFetch({ '/api/courses/taught': { body: [] } });
    render(<App />);
    advance(inactivityTimeoutMs * 2);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('replaces a backend failure with the "please log out and log in again" dialog, offering only Log out', async () => {
    const user = signIn({ '/api/student/courses': { status: 500, raw: '<html>Internal Server Error</html>' } });

    const dialog = await screen.findByRole('alertdialog', { name: 'Something went wrong' });
    expect(dialog).toHaveAccessibleDescription(
      'Something went wrong. Please log out and log in again to continue your progress. Sorry for the inconvenience.',
    );
    expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Log out']);
    expect(screen.queryByText(/Failed to execute|Unexpected token|Internal Server Error/)).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Log out' }));
    expect(screen.getByRole('heading', { name: 'Jump back in' })).toBeInTheDocument();
  });

  it('shows backend failures on the login page inline, since there is nobody to log out', async () => {
    mockFetch({
      '/api/courses/taught': { status: 500, body: { error: 'Database is down' } },
    });
    render(<App />);

    expect(await screen.findByText("Couldn't load courses: Something went wrong.")).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
