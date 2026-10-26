import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import FacultyPage from './FacultyPage.jsx';
import { mockFetch } from '../test/mockFetch.js';

const session = { id: '40', firstName: 'Fiona', role: 'faculty', token: 'faculty-token' };
const mcp = {
  id: 'mcp-servers', title: 'Model Context Protocol: Ship MCP Servers', category: 'Agentic AI', icon: 'plug',
  level: 'Intermediate', duration: '3h 05m', assigned_at: '2026-10-26T17:10:35.157Z',
};

function renderPage(myCourses) {
  return renderPageWith({ '/api/faculty-assignments/mine': { body: myCourses } });
}

function renderPageWith(routes) {
  const fetchMock = mockFetch({
    '/api/students': { body: [] },
    '/api/assignments': { body: [] },
    '/api/course-enrollments': { body: [] },
    ...routes,
  });
  render(<FacultyPage session={session} />);
  return { fetchMock, user: userEvent.setup() };
}

describe('FacultyPage', () => {
  it('keeps the courses off the Assignments card and shows them from "View your courses"', async () => {
    const { user } = renderPage([mcp]);
    const card = screen.getByRole('region', { name: 'Assignments' });
    expect(within(card).queryByText(mcp.title)).not.toBeInTheDocument();

    await user.click(within(card).getByRole('button', { name: 'View your courses' }));

    const dialog = screen.getByRole('dialog', { name: 'Your courses' });
    const list = await within(dialog).findByRole('list', { name: 'Courses you teach' });
    const [item] = within(list).getAllByRole('listitem');
    expect(item).toHaveTextContent(mcp.title);
    expect(item).toHaveTextContent('Agentic AI · Intermediate · 3h 05m · Assigned Oct 26, 2026');
  });

  it('explains in the dialog that a director has to assign courses first', async () => {
    const { user } = renderPage([]);
    await user.click(screen.getByRole('button', { name: 'View your courses' }));

    expect(
      await within(screen.getByRole('dialog', { name: 'Your courses' })).findByText(
        "You aren't assigned to any courses yet. A director assigns faculty to courses before they can post assignments.",
      ),
    ).toBeInTheDocument();
  });

  it('refetches the courses each time the dialog opens, so new assignments show up', async () => {
    let assigned = [];
    const { fetchMock, user } = renderPageWith({ '/api/faculty-assignments/mine': () => ({ body: assigned }) });
    await user.click(screen.getByRole('button', { name: 'View your courses' }));
    const dialog = screen.getByRole('dialog', { name: 'Your courses' });
    await within(dialog).findByText(/aren't assigned to any courses yet/);
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));

    assigned = [mcp];
    await user.click(screen.getByRole('button', { name: 'View your courses' }));

    expect(await within(dialog).findByText(mcp.title)).toBeInTheDocument();
    const fetches = fetchMock.mock.calls.filter(([url]) => url === '/api/faculty-assignments/mine');
    expect(fetches.length).toBeGreaterThanOrEqual(3);
  });

  it('shows the error with a retry in the dialog', async () => {
    let calls = 0;
    const { user } = renderPageWith({
      '/api/faculty-assignments/mine': () => (calls++ < 2 ? { status: 500, body: { error: 'Database is down' } } : { body: [mcp] }),
    });
    await user.click(screen.getByRole('button', { name: 'View your courses' }));
    const dialog = screen.getByRole('dialog', { name: 'Your courses' });

    expect(await within(dialog).findByRole('alert')).toHaveTextContent("Couldn't load your courses: Something went wrong.");
    await user.click(within(dialog).getByRole('button', { name: 'Try again' }));
    expect(await within(dialog).findByText(mcp.title)).toBeInTheDocument();
  });

  it('keeps assignments off the card and lists them from "View assignments", with who posted each', async () => {
    const posted = [
      { id: '9', title: 'Build a weather agent', course_title: 'Build AI Agents with Tool Use', course_icon: 'bot',
        due_date: '2026-11-20', completion_count: 2, created_by_name: 'Fiona Faculty' },
      { id: '8', title: 'Ship a server', course_title: mcp.title, course_icon: 'plug', due_date: null, completion_count: 0,
        created_by_name: 'Felix Faculty' },
    ];
    const { user } = renderPageWith({ '/api/faculty-assignments/mine': { body: [mcp] }, '/api/assignments': { body: posted } });
    const card = screen.getByRole('region', { name: 'Assignments' });
    expect(await within(card).findByText('2 posted so far. Students in the course see them on their dashboard.')).toBeInTheDocument();
    expect(within(card).queryByText('Build a weather agent')).not.toBeInTheDocument();

    await user.click(within(card).getByRole('button', { name: 'View assignments' }));

    const dialog = screen.getByRole('dialog', { name: 'Assignments' });
    const items = within(within(dialog).getByRole('list', { name: 'Posted assignments' })).getAllByRole('listitem');
    expect(items.map((item) => item.querySelector('.resource__meta').textContent)).toEqual([
      'Build AI Agents with Tool Use · Due Nov 20, 2026 · 2 done · by Fiona Faculty',
      `${mcp.title} · 0 done · by Felix Faculty`,
    ]);
  });

  it('refetches assignments when the dialog opens and shows an empty state', async () => {
    let posted = [];
    const { fetchMock, user } = renderPageWith({ '/api/assignments': () => ({ body: posted }), '/api/faculty-assignments/mine': { body: [] } });
    await user.click(screen.getByRole('button', { name: 'View assignments' }));
    const dialog = screen.getByRole('dialog', { name: 'Assignments' });
    expect(await within(dialog).findByText('No assignments yet. Post the first one with Add Assignment.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));

    posted = [{ id: '1', title: 'Fresh one', course_title: mcp.title, course_icon: 'plug', due_date: null, completion_count: 0 }];
    await user.click(screen.getByRole('button', { name: 'View assignments' }));

    expect(await within(dialog).findByText('Fresh one')).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/assignments').length).toBeGreaterThanOrEqual(3);
  });

  it('offers only the assigned courses in the Add Assignment dialog', async () => {
    const { user } = renderPage([mcp]);

    await user.click(screen.getByRole('button', { name: 'Add Assignment' }));

    const dialog = screen.getByRole('dialog', { name: 'Add Assignment' });
    expect(await within(dialog).findByRole('option', { name: `${mcp.title} · Agentic AI` })).toBeInTheDocument();
    expect(within(dialog).getAllByRole('option')).toHaveLength(2);
  });
});
