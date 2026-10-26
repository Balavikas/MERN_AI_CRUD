import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import FacultyPage from './FacultyPage.jsx';
import { mockFetch } from '../test/mockFetch.js';

const session = { id: '40', firstName: 'Fiona', role: 'faculty', token: 'faculty-token' };
const mcp = { id: 'mcp-servers', title: 'Model Context Protocol: Ship MCP Servers', category: 'Agentic AI', icon: 'plug' };

function renderPage(myCourses) {
  mockFetch({
    '/api/students': { body: [] },
    '/api/assignments': { body: [] },
    '/api/course-enrollments': { body: [] },
    '/api/faculty-assignments/mine': { body: myCourses },
  });
  render(<FacultyPage session={session} />);
  return userEvent.setup();
}

describe('FacultyPage', () => {
  it('lists the courses this faculty member teaches', async () => {
    renderPage([mcp]);
    const list = await screen.findByRole('list', { name: 'Courses you teach' });
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual([mcp.title]);
  });

  it('explains that a director has to assign courses first', async () => {
    renderPage([]);
    expect(
      await screen.findByText('None yet. A director assigns faculty to courses before they can post assignments.'),
    ).toBeInTheDocument();
  });

  it('offers only the assigned courses in the Add Assignment dialog', async () => {
    const user = renderPage([mcp]);
    await screen.findByRole('list', { name: 'Courses you teach' });

    await user.click(screen.getByRole('button', { name: 'Add Assignment' }));

    const dialog = screen.getByRole('dialog', { name: 'Add Assignment' });
    expect(await within(dialog).findByRole('option', { name: `${mcp.title} · Agentic AI` })).toBeInTheDocument();
    expect(within(dialog).getAllByRole('option')).toHaveLength(2);
  });
});
