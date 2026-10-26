import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import EnrollmentChart from './EnrollmentChart.jsx';
import { mockFetch } from '../test/mockFetch.js';

// Already sorted highest first, the way GET /api/course-enrollments returns them.
const enrollments = [
  { course_id: 'agents-tool-use', title: 'Build AI Agents with Tool Use', category: 'Agentic AI', enrollments: 6 },
  { course_id: 'rag-chat-with-your-data', title: 'RAG: Chat with Your Own Data', category: 'Gen AI', enrollments: 3 },
  { course_id: 'react-patterns', title: 'React Patterns, No BS', category: 'Web Development', enrollments: 1 },
  { course_id: 'react-native', title: 'React Native: Pocket-Sized Apps', category: 'Mobile', enrollments: 0 },
];

async function renderChart(reply = { body: enrollments }) {
  const fetchMock = mockFetch({ '/api/course-enrollments': reply });
  render(<EnrollmentChart token="faculty-token" />);
  return { fetchMock, user: userEvent.setup() };
}

const chartRows = async () => within(await screen.findByRole('list', { name: /bar chart/i })).getAllByRole('listitem');

describe('EnrollmentChart', () => {
  it('requests the counts with the faculty token', async () => {
    const { fetchMock } = await renderChart();
    await chartRows();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/course-enrollments',
      expect.objectContaining({ headers: { Authorization: 'Bearer faculty-token' } }),
    );
  });

  it('draws one bar per course in the order the API returns, including courses with no students', async () => {
    await renderChart();
    const rows = await chartRows();

    expect(rows.map((row) => row.getAttribute('aria-label'))).toEqual([
      'Build AI Agents with Tool Use: 6 students, 60% of enrollments',
      'RAG: Chat with Your Own Data: 3 students, 30% of enrollments',
      'React Patterns, No BS: 1 student, 10% of enrollments',
      'React Native: Pocket-Sized Apps: 0 students, 0% of enrollments',
    ]);
    expect(screen.getByText('10 enrollments across 4 courses, most popular first.')).toBeInTheDocument();
  });

  it('sizes each bar relative to the most popular course', async () => {
    await renderChart();
    const ratios = (await chartRows()).map((row) => row.querySelector('.bar-chart__bar').style.getPropertyValue('--ratio'));
    expect(ratios).toEqual(['1', '0.5', `${1 / 6}`, '0']);
  });

  it('shows a tooltip with the count, course and share while a bar is hovered', async () => {
    const { user } = await renderChart();
    const [, ragRow] = await chartRows();

    await user.hover(ragRow);
    expect(screen.getByText('3 students')).toBeInTheDocument();
    expect(screen.getByText('Gen AI · 30% of all enrollments')).toBeInTheDocument();

    await user.unhover(ragRow);
    await waitFor(() => expect(screen.queryByText('3 students')).not.toBeInTheDocument());
  });

  it('is a single tab stop, with arrow keys, Home and End moving between bars', async () => {
    const { user } = await renderChart();
    const rows = await chartRows();
    expect(rows.filter((row) => row.tabIndex === 0)).toEqual([rows[0]]);

    // Tab from the Chart/Table toggle (just before the plot) lands on the first bar.
    screen.getByRole('button', { name: 'Table' }).focus();
    await user.tab();
    expect(rows[0]).toHaveFocus();
    expect(screen.getByText('6 students')).toBeInTheDocument();

    await user.keyboard('{ArrowDown}');
    expect(rows[1]).toHaveFocus();
    await user.keyboard('{End}');
    expect(rows[3]).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(rows[3]).toHaveFocus();
    await user.keyboard('{Home}');
    expect(rows[0]).toHaveFocus();
    expect(rows.filter((row) => row.tabIndex === 0)).toEqual([rows[0]]);

    // One more Tab leaves the chart instead of visiting every bar.
    await user.tab();
    expect(rows.some((row) => row === document.activeElement)).toBe(false);
  });

  it('switches to a table with the same numbers', async () => {
    const { user } = await renderChart();
    await chartRows();

    await user.click(screen.getByRole('button', { name: 'Table' }));

    expect(screen.queryByRole('list', { name: /bar chart/i })).not.toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Enrollments by course' });
    const firstRow = within(table).getAllByRole('row')[1];
    expect(within(firstRow).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Build AI Agents with Tool Use', 'Agentic AI', '6', '60%',
    ]);
    expect(screen.getByRole('button', { name: 'Table' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the error with a retry that loads the chart', async () => {
    let calls = 0;
    const { user } = await renderChart(() => (calls++ === 0
      ? { status: 500, body: { error: 'Database is down' } }
      : { body: enrollments }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load enrollments: Something went wrong.");
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await chartRows()).toHaveLength(4);
  });

  it('says so when there are no courses', async () => {
    await renderChart({ body: [] });
    expect(await screen.findByText('No courses in the catalog yet.')).toBeInTheDocument();
  });
});
