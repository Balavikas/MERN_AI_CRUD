import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReportView from './ReportView.jsx';
import { saveFile } from '../utils/download.js';
import { mockFetch } from '../test/mockFetch.js';

vi.mock('../utils/download.js', async (importOriginal) => ({
  ...(await importOriginal()),
  saveFile: vi.fn(),
}));

const report = {
  totals: { students: 5, faculty: 2, courses: 18, enrollments: 13, assignments: 4, completions: 3 },
  courses: [
    { course_id: 'agents-tool-use', title: 'Build AI Agents with Tool Use', enrollments: 6, assignments: 2, completions: 2 },
    { course_id: 'react-patterns', title: 'React Patterns, No BS', enrollments: 1, assignments: 0, completions: 0 },
  ],
};

describe('ReportView', () => {
  it('shows the headline totals and a row per course', async () => {
    const fetchMock = mockFetch({ '/api/report': { body: report } });
    render(<ReportView token="director-token" />);

    const totals = await screen.findByRole('list');
    const stat = (label) => within(totals).getByText(label).closest('.stat');
    expect(stat('Students')).toHaveTextContent('5');
    expect(stat('Courses')).toHaveTextContent('18');
    expect(stat('Completed')).toHaveTextContent('3');

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Build AI Agents with Tool Use', '6', '2', '2',
    ]);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer director-token');
  });

  it('downloads the per-course table as CSV', async () => {
    mockFetch({ '/api/report': { body: report } });
    const user = userEvent.setup();
    render(<ReportView token="director-token" />);

    await user.click(await screen.findByRole('button', { name: 'Download CSV' }));

    expect(saveFile).toHaveBeenCalledTimes(1);
    const [filename, csv, type] = saveFile.mock.calls[0];
    expect(filename).toMatch(/^skillstack-report-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(type).toBe('text/csv;charset=utf-8');
    expect(csv.split('\r\n')).toEqual([
      'Course,Enrolled,Assignments,Completed',
      'Build AI Agents with Tool Use,6,2,2',
      '"React Patterns, No BS",1,0,0',
    ]);
  });

  it('shows the error and loads the report on retry', async () => {
    let calls = 0;
    mockFetch({
      '/api/report': () => (calls++ === 0 ? { status: 500, body: { error: 'Database is down' } } : { body: report }),
    });
    const user = userEvent.setup();
    render(<ReportView token="director-token" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Database is down');
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
