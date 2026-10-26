import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FacultyAssignments from './FacultyAssignments.jsx';
import { mockFetch } from '../test/mockFetch.js';

// The page passes useRecords results in; these stand-ins have the same shape.
const loaded = (records) => ({ records, status: 'success', error: '', reload: vi.fn() });

const faculty = loaded([
  { id: '40', full_name: 'Fiona Faculty', email: 'fiona@example.com' },
  { id: '41', full_name: 'Felix Faculty', email: 'felix@example.com' },
]);
const courses = loaded([
  { id: 'mcp-servers', title: 'Model Context Protocol: Ship MCP Servers', category: 'Agentic AI' },
  { id: 'react-patterns', title: 'React Patterns, No BS', category: 'Web Development' },
]);
const existing = {
  faculty_id: '40', faculty_name: 'Fiona Faculty', faculty_email: 'fiona@example.com',
  course_id: 'mcp-servers', course_title: 'Model Context Protocol: Ship MCP Servers', assigned_at: '2026-10-26T17:10:35.157Z',
};

function setup({ assignments = loaded([existing]), routes = {} } = {}) {
  const fetchMock = mockFetch(routes);
  render(<FacultyAssignments token="director-token" faculty={faculty} courses={courses} assignments={assignments} />);
  return { fetchMock, assignments, user: userEvent.setup() };
}

describe('FacultyAssignments', () => {
  it('lists who is assigned to which course', () => {
    setup();
    const table = screen.getByRole('table', { name: 'Faculty assigned to each course' });
    const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell');
    expect(cells.slice(0, 2).map((cell) => cell.textContent)).toEqual(['Model Context Protocol: Ship MCP Servers', 'Fiona Faculty']);
    expect(screen.getByText('1 assigned')).toBeInTheDocument();
  });

  it('explains what an empty list means', () => {
    setup({ assignments: loaded([]) });
    expect(screen.getByText('No one is assigned yet, so no faculty can post assignments. Assign someone above.')).toBeInTheDocument();
  });

  it('asks for a faculty member and a course before sending anything', async () => {
    const { fetchMock, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Assign' }));

    expect(screen.getByText('Pick a faculty member.')).toBeInTheDocument();
    expect(screen.getByText('Pick a course.')).toBeInTheDocument();
    expect(screen.getByLabelText('Faculty')).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('assigns the chosen faculty member to the chosen course and refreshes the list', async () => {
    const { fetchMock, assignments, user } = setup({
      routes: { 'POST /api/faculty-assignments': { status: 201, body: { faculty_id: '41', course_id: 'react-patterns' } } },
    });

    await user.selectOptions(screen.getByLabelText('Faculty'), '41');
    await user.selectOptions(screen.getByLabelText('Course'), 'react-patterns');
    await user.click(screen.getByRole('button', { name: 'Assign' }));

    expect(await screen.findByText('Assigned Felix Faculty to React Patterns, No BS.')).toBeInTheDocument();
    expect(assignments.reload).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/faculty-assignments');
    expect(request.headers.Authorization).toBe('Bearer director-token');
    expect(JSON.parse(request.body)).toEqual({ facultyId: '41', courseId: 'react-patterns' });

    // The faculty member stays picked so the next course can be added straight away.
    expect(screen.getByLabelText('Faculty')).toHaveValue('41');
    expect(screen.getByLabelText('Course')).toHaveValue('');
  });

  it('shows the error when the faculty member is already assigned', async () => {
    const { assignments, user } = setup({
      routes: { 'POST /api/faculty-assignments': { status: 409, body: { error: 'That faculty member is already assigned to this course.' } } },
    });

    await user.selectOptions(screen.getByLabelText('Faculty'), '40');
    await user.selectOptions(screen.getByLabelText('Course'), 'mcp-servers');
    await user.click(screen.getByRole('button', { name: 'Assign' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That faculty member is already assigned to this course.');
    expect(assignments.reload).not.toHaveBeenCalled();
  });

  it('unassigns only after confirming, then refreshes the list', async () => {
    const { fetchMock, assignments, user } = setup({
      routes: { 'DELETE /api/faculty-assignments/40/mcp-servers': { status: 204 } },
    });
    const unassign = screen.getByRole('button', { name: 'Unassign Fiona Faculty from Model Context Protocol: Ship MCP Servers' });

    await user.click(unassign);
    await user.click(screen.getByRole('button', { name: 'Keep' }));
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Unassign Fiona Faculty/ }));
    await user.click(screen.getByRole('button', { name: 'Yes, unassign' }));

    expect(await screen.findByText('Removed Fiona Faculty from Model Context Protocol: Ship MCP Servers.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/faculty-assignments/40/mcp-servers',
      expect.objectContaining({ method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer director-token' }) }),
    );
    expect(assignments.reload).toHaveBeenCalledTimes(1);
  });
});
