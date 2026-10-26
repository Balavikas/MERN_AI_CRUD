import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import EducationChart, { ChartTooltip } from './EducationChart.jsx';
import { mockFetch } from '../test/mockFetch.js';

// What GET /api/education-breakdown returns: every level, zeros included, in chart order.
const breakdown = [
  { education: 'Bootcamp', students: 1, faculty: 0 },
  { education: 'High school', students: 0, faculty: 0 },
  { education: 'Self-taught', students: 2, faculty: 1 },
  { education: 'Undergraduate', students: 4, faculty: 0 },
  { education: 'Postgraduate', students: 4, faculty: 3 },
];

function renderChart(reply = { body: breakdown }) {
  const fetchMock = mockFetch({ '/api/education-breakdown': reply });
  render(<EducationChart token="director-token" />);
  return { fetchMock, user: userEvent.setup() };
}

const legendItems = () => within(screen.getByRole('list', { name: 'Legend' })).getAllByRole('listitem').map((item) => item.textContent);
// SVG bars have no accessible role, so count them by the series class each <Bar> carries.
const barCount = (series) => document.querySelectorAll(`.chart-bar--${series} .recharts-rectangle`).length;

describe('EducationChart', () => {
  it('loads the counts with the director token and draws both series with a legend', async () => {
    const { fetchMock } = renderChart();

    expect(await screen.findByRole('figure', { name: 'Candidates by Education Level' })).toBeInTheDocument();
    expect(legendItems()).toEqual(['Students', 'Faculty']);
    // Bars are only drawn for non-zero counts: 4 student levels, 2 faculty levels.
    expect(barCount('students')).toBe(4);
    expect(barCount('faculty')).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/education-breakdown',
      expect.objectContaining({ headers: { Authorization: 'Bearer director-token' } }),
    );
  });

  it('labels the axes and uses the short education names', async () => {
    renderChart();
    await screen.findByRole('figure');

    for (const text of ['Education level', 'Number of candidates', 'Bootcamp', 'High School', 'Self-taught', 'Undergrad', 'Postgrad']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
  });

  it('describes every level, zeros included, for screen readers', async () => {
    renderChart();
    const figure = await screen.findByRole('figure');

    expect(figure).toHaveAccessibleDescription(
      '11 students and 4 faculty by education level. Bootcamp: 1 student, 0 faculty; High School: 0 students, 0 faculty; '
      + 'Self-taught: 2 students, 1 faculty member; Undergrad: 4 students, 0 faculty; Postgrad: 4 students, 3 faculty.',
    );
  });

  it('filters to one candidate type without repainting it', async () => {
    const { user } = renderChart();
    await screen.findByRole('figure');

    await user.click(screen.getByRole('button', { name: 'Faculty only' }));

    expect(screen.getByRole('button', { name: 'Faculty only' })).toHaveAttribute('aria-pressed', 'true');
    expect(legendItems()).toEqual(['Faculty']);
    expect(barCount('students')).toBe(0);
    expect(barCount('faculty')).toBe(2);

    await user.click(screen.getByRole('button', { name: 'Students only' }));
    expect(legendItems()).toEqual(['Students']);
    expect(barCount('students')).toBe(4);
  });

  it('shows the same numbers as a table, following the filter', async () => {
    const { user } = renderChart();
    await screen.findByRole('figure');

    await user.click(screen.getByRole('button', { name: 'Table' }));
    const table = screen.getByRole('table', { name: 'Candidates by education level' });
    const rows = within(table).getAllByRole('row').map((row) => within(row).queryAllByRole('cell').map((cell) => cell.textContent));
    expect(rows.slice(1)).toEqual([
      ['Bootcamp', '1', '0'],
      ['High School', '0', '0'],
      ['Self-taught', '2', '1'],
      ['Undergrad', '4', '0'],
      ['Postgrad', '4', '3'],
    ]);

    await user.click(screen.getByRole('button', { name: 'Faculty only' }));
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Education level', 'Faculty']);
  });

  it('shows an empty state when nobody has signed up, or nobody of the filtered type', async () => {
    const { user } = renderChart({ body: breakdown.map((row) => ({ ...row, faculty: 0 })) });
    await screen.findByRole('figure');

    await user.click(screen.getByRole('button', { name: 'Faculty only' }));
    expect(screen.getByText('No faculty yet.')).toBeInTheDocument();
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });

  it('says so when there are no candidates at all', async () => {
    renderChart({ body: breakdown.map((row) => ({ ...row, students: 0, faculty: 0 })) });
    expect(await screen.findByText('No students or faculty have signed up yet.')).toBeInTheDocument();
  });

  it('shows the error with a retry that loads the chart', async () => {
    let calls = 0;
    const { user } = renderChart(() => (calls++ === 0 ? { status: 500, body: { error: 'Database is down' } } : { body: breakdown }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load candidates: Database is down");
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('figure')).toBeInTheDocument();
  });
});

describe('ChartTooltip', () => {
  const point = (dataKey, value, education) => [{ dataKey, value, payload: { education } }];

  it('shows the count, candidate type and education level of the hovered bar', () => {
    render(<ChartTooltip active payload={point('faculty', 3, 'Postgraduate')} />);
    expect(screen.getByText('3 faculty')).toBeInTheDocument();
    expect(screen.getByText('Faculty · Postgrad')).toBeInTheDocument();
  });

  it('uses the singular for one candidate', () => {
    render(<ChartTooltip active payload={point('students', 1, 'Bootcamp')} />);
    expect(screen.getByText('1 student')).toBeInTheDocument();
  });

  it('renders nothing when no bar is hovered', () => {
    const { container } = render(<ChartTooltip active={false} payload={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
