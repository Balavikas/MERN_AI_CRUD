import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import DirectorPage from './DirectorPage.jsx';
import { mockFetch } from '../test/mockFetch.js';

const session = { id: '1', firstName: 'Dana', role: 'director', token: 'director-token' };
const fiona = { id: '40', full_name: 'Fiona Faculty', email: 'fiona@example.com', created_at: '2026-10-20T10:00:00Z' };
const assignment = {
  faculty_id: '40', faculty_name: 'Fiona Faculty', course_id: 'mcp-servers',
  course_title: 'Model Context Protocol: Ship MCP Servers', assigned_at: '2026-10-26T17:10:35.157Z',
};

const breakdown = [
  { education: 'Bootcamp', students: 1, faculty: 0 },
  { education: 'High school', students: 0, faculty: 0 },
  { education: 'Self-taught', students: 0, faculty: 0 },
  { education: 'Undergraduate', students: 4, faculty: 0 },
  { education: 'Postgraduate', students: 4, faculty: 4 },
];

describe('DirectorPage', () => {
  it('shows the candidates-by-education chart directly above course assignments', async () => {
    mockFetch({
      '/api/faculty': { body: [] },
      '/api/courses': { body: [] },
      '/api/education-breakdown': { body: breakdown },
      '/api/faculty-assignments': { body: [] },
    });
    render(<DirectorPage session={session} />);

    // The chart is lazy-loaded, so wait for its section to arrive.
    const chart = await screen.findByRole('region', { name: 'Candidates by Education Level' });
    const assignments = screen.getByRole('region', { name: 'Course assignments' });
    expect(chart.compareDocumentPosition(assignments) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(await within(chart).findByRole('figure')).toHaveAccessibleDescription(/9 students and 4 faculty/);
  });


  it('shows the course assignments section with the current assignments', async () => {
    mockFetch({
      '/api/faculty': { body: [fiona] },
      '/api/courses': { body: [{ id: 'mcp-servers', title: assignment.course_title, category: 'Agentic AI' }] },
      '/api/education-breakdown': { body: breakdown },
      '/api/faculty-assignments': { body: [assignment] },
    });
    render(<DirectorPage session={session} />);

    const section = screen.getByRole('region', { name: 'Course assignments' });
    const table = await within(section).findByRole('table', { name: 'Faculty assigned to each course' });
    expect(within(table).getByText(assignment.course_title)).toBeInTheDocument();
    expect(await within(section).findByRole('option', { name: 'Fiona Faculty · fiona@example.com' })).toBeInTheDocument();
  });

  it('keeps the faculty card short and opens the searchable faculty roster on demand', async () => {
    mockFetch({
      '/api/faculty': { body: [{ ...fiona, phone_number: '+1 555 010 2222', education: 'Postgraduate', course_count: 1 }] },
      '/api/courses': { body: [] },
      '/api/education-breakdown': { body: breakdown },
      '/api/faculty-assignments': { body: [] },
    });
    const user = userEvent.setup();
    render(<DirectorPage session={session} />);

    const card = screen.getByRole('region', { name: 'Faculty' });
    expect(await within(card).findByText("1 teaching on SkillStack, with the courses they're assigned to.")).toBeInTheDocument();
    expect(within(card).queryByText('Fiona Faculty')).not.toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Add Faculty' })).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Delete Faculty' })).toBeInTheDocument();

    await user.click(within(card).getByRole('button', { name: 'Show Registered Faculty' }));

    const dialog = screen.getByRole('dialog', { name: 'Registered faculty' });
    const row = await within(dialog).findByRole('row', { name: /Fiona Faculty/ });
    expect(within(row).getAllByRole('cell').at(-1)).toHaveTextContent('1');
    expect(within(dialog).getByRole('searchbox', { name: 'Search faculty' })).toBeInTheDocument();
  });

  it('edits a faculty member from the Faculty card and refreshes the faculty and assignment lists', async () => {
    let name = 'Fiona Faculty';
    // Shaped like the API's faculty rows, which always include phone and education.
    const record = () => ({ ...fiona, full_name: name, phone_number: '+1 555 010 2222', education: 'Postgraduate' });
    const fetchMock = mockFetch({
      '/api/faculty': () => ({ body: [record()] }),
      '/api/courses': { body: [] },
      '/api/education-breakdown': { body: breakdown },
      '/api/faculty-assignments': { body: [] },
      'PATCH /api/faculty/40': (_url, options) => {
        name = JSON.parse(options.body).fullName;
        return { body: record() };
      },
    });
    const user = userEvent.setup();
    render(<DirectorPage session={session} />);
    const card = screen.getByRole('region', { name: 'Faculty' });
    await within(card).findByText(/1 teaching on SkillStack/);

    await user.click(within(card).getByRole('button', { name: 'Edit Faculty' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Faculty' });
    await user.selectOptions(within(dialog).getByLabelText('Faculty member'), '40');
    await user.clear(within(dialog).getByLabelText('Name'));
    await user.type(within(dialog).getByLabelText('Name'), 'Fiona Teacher');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await within(dialog).findByText("Saved Fiona Teacher's details.")).toBeInTheDocument();
    expect(await within(dialog).findByRole('option', { name: 'Fiona Teacher · fiona@example.com' })).toBeInTheDocument();
    const fetchesOf = (url) => fetchMock.mock.calls.filter(([calledUrl]) => calledUrl === url).length;
    expect(fetchesOf('/api/faculty')).toBe(2);
    expect(fetchesOf('/api/faculty-assignments')).toBe(2);
  });

  it('refreshes the assignments after deleting a faculty member, whose assignments go with them', async () => {
    let deleted = false;
    const fetchMock = mockFetch({
      '/api/faculty': () => ({ body: deleted ? [] : [fiona] }),
      '/api/courses': { body: [] },
      '/api/education-breakdown': { body: breakdown },
      '/api/faculty-assignments': () => ({ body: deleted ? [] : [assignment] }),
      'DELETE /api/faculty/40': () => {
        deleted = true;
        return { status: 204 };
      },
    });
    const user = userEvent.setup();
    render(<DirectorPage session={session} />);
    const section = screen.getByRole('region', { name: 'Course assignments' });
    await within(section).findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Delete Faculty' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete Faculty' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete Fiona Faculty' }));
    await user.click(within(dialog).getByRole('button', { name: 'Yes, delete' }));

    await waitFor(() => expect(
      within(section).getByText('No one is assigned yet, so no faculty can post assignments. Assign someone above.'),
    ).toBeInTheDocument());
    const assignmentFetches = fetchMock.mock.calls.filter(([url]) => url === '/api/faculty-assignments');
    expect(assignmentFetches).toHaveLength(2);
  });
});
