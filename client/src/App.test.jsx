import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { mockFetch } from './test/mockFetch.js';

const session = { id: '7', firstName: 'Sam', role: 'student', token: 'student-token' };

// Start signed in as a student, the way a returning user with "Keep me logged in" lands.
function renderSignedIn() {
  localStorage.setItem('skillstack.session', JSON.stringify(session));
  mockFetch({
    '/api/student/courses': { body: [] },
    '/api/student/assignments': { body: [] },
  });
  render(<App />);
  return userEvent.setup();
}

describe('App (specs/Cleanup.md)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // jsdom has no matchMedia; useTheme and the motion helpers read it.
    vi.stubGlobal('matchMedia', (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }));
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
