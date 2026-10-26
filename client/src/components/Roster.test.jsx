import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Roster from './Roster.jsx';
import { rosters } from '../data.js';
import { mockFetch } from '../test/mockFetch.js';

const faculty = [
  { id: '41', full_name: 'Felix Faculty', email: 'felix@example.com', phone_number: '+1 555 010 1111', education: 'Postgraduate', created_at: '2026-10-25T10:00:00Z', course_count: 2 },
  { id: '40', full_name: 'Fiona Faculty', email: 'fiona@example.com', phone_number: '+1 555 010 2222', education: 'Undergraduate', created_at: '2026-10-20T10:00:00Z', course_count: 0 },
];
const students = [
  { id: '3', full_name: 'Rohit Sharma', email: 'rohit@example.com', phone_number: '3203105641', education: 'Postgraduate', created_at: '2026-10-24T18:51:14Z', course_count: 1 },
];

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const columnTexts = (row) => within(row).getAllByRole('cell').map((cell) => cell.textContent);

describe('Roster', () => {
  it('shows the faculty roster, including how many courses each one teaches, with the director token', async () => {
    const fetchMock = mockFetch({ '/api/faculty': { body: faculty } });
    render(<Roster id="test" token="director-token" roster={rosters.faculty} />);

    expect(await screen.findByRole('heading', { name: 'Registered faculty' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'ID', 'Name', 'Email', 'Phone', 'Education', 'Joined', 'Teaching',
    ]);
    const [felix] = bodyRows();
    expect(columnTexts(felix)[1]).toBe('Felix Faculty');
    expect(columnTexts(felix)[6]).toBe('2');
    expect(screen.getByText('2 total')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/faculty', expect.objectContaining({ headers: { Authorization: 'Bearer director-token' } }));
  });

  it('shows the student roster from the student endpoint with its own columns', async () => {
    mockFetch({ '/api/students': { body: students } });
    render(<Roster id="test" token="faculty-token" roster={rosters.students} />);

    expect(await screen.findByRole('heading', { name: 'Registered students' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Courses' })).toBeInTheDocument();
    expect(columnTexts(bodyRows()[0])[1]).toBe('Rohit Sharma');
  });

  it('filters rows as you search by name, email or phone', async () => {
    mockFetch({ '/api/faculty': { body: faculty } });
    const user = userEvent.setup();
    render(<Roster id="test" token="director-token" roster={rosters.faculty} />);
    await screen.findByRole('table');

    const search = screen.getByRole('searchbox', { name: 'Search faculty' });
    await user.type(search, 'fiona');
    expect(bodyRows().map((row) => columnTexts(row)[1])).toEqual(['Fiona Faculty']);
    expect(screen.getByText('1 of 2')).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, '1111');
    expect(bodyRows().map((row) => columnTexts(row)[1])).toEqual(['Felix Faculty']);

    await user.clear(search);
    await user.type(search, 'nobody');
    expect(screen.getByText('Nobody matches “nobody”.')).toBeInTheDocument();
  });

  it('shows the error with a retry', async () => {
    let calls = 0;
    mockFetch({ '/api/faculty': () => (calls++ === 0 ? { status: 500, body: { error: 'Database is down' } } : { body: faculty }) });
    const user = userEvent.setup();
    render(<Roster id="test" token="director-token" roster={rosters.faculty} />);

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load faculty: Something went wrong.");
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
