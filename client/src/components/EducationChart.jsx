import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useRecords from '../hooks/useRecords.js';

// Colors come from --series-students / --series-faculty in styles.css (validated blue and purple per theme), applied
// through each bar's className so they follow the theme toggle. A series keeps its color under every filter.
const series = [
  { key: 'students', label: 'Students', singular: 'student' },
  { key: 'faculty', label: 'Faculty', singular: 'faculty member' },
];

const filters = [
  { id: 'all', label: 'All candidates', keys: ['students', 'faculty'] },
  { id: 'students', label: 'Students only', keys: ['students'] },
  { id: 'faculty', label: 'Faculty only', keys: ['faculty'] },
];

// Short axis labels from the spec; the API returns the stored education values.
const levelLabels = {
  Bootcamp: 'Bootcamp',
  'High school': 'High School',
  'Self-taught': 'Self-taught',
  Undergraduate: 'Undergrad',
  Postgraduate: 'Postgrad',
};

const countLabel = (count, item) => `${count} ${count === 1 ? item.singular : item.label.toLowerCase()}`;

// True while the media query matches. jsdom (tests) has no matchMedia, so it reports false there.
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const list = window.matchMedia?.(query);
    if (!list) {
      return undefined;
    }
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return matches;
}

// Exported for tests: jsdom has no layout, so hovering a Recharts bar can't be simulated there.
export function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }
  const [{ dataKey, value, payload: row }] = payload;
  const item = series.find((candidate) => candidate.key === dataKey);
  return (
    <div className="chart-tooltip">
      <strong>{countLabel(value, item)}</strong>
      <span className="chart-tooltip__meta">
        <span className={`chart-key chart-key--${dataKey}`} aria-hidden="true" />
        {item.label} · {levelLabels[row.education]}
      </span>
    </div>
  );
}

// Grouped bar chart of students and faculty per education level (specs/DirectorsDashboard.md).
function EducationChart({ token }) {
  const breakdown = useRecords('/api/education-breakdown', 'candidates', token);
  const [filterId, setFilterId] = useState('all');
  const [view, setView] = useState('chart');
  // On phones five category labels don't fit side by side, so they tilt.
  const narrow = useMediaQuery('(max-width: 575.98px)');

  const rows = breakdown.records;
  const visible = series.filter((item) => filters.find((filter) => filter.id === filterId).keys.includes(item.key));
  const totals = Object.fromEntries(series.map((item) => [item.key, rows.reduce((sum, row) => sum + row[item.key], 0)]));
  const visibleTotal = visible.reduce((sum, item) => sum + totals[item.key], 0);
  const summary = rows.length
    ? `${visible.map((item) => countLabel(totals[item.key], item)).join(' and ')} by education level. ${rows
      .map((row) => `${levelLabels[row.education]}: ${visible.map((item) => countLabel(row[item.key], item)).join(', ')}`)
      .join('; ')}.`
    : '';

  return (
    <section className="bento-card education-chart" aria-labelledby="education-chart-title">
      <div className="bento-card__head">
        <div>
          <h2 id="education-chart-title">Candidates by Education Level</h2>
          <p>Students and faculty counted by the education level they signed up with.</p>
        </div>
        <div className="segmented segmented--compact" role="group" aria-label="Show candidates as">
          <button type="button" aria-pressed={view === 'chart'} onClick={() => setView('chart')}>Chart</button>
          <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>Table</button>
        </div>
      </div>

      <div className="segmented segmented--compact education-chart__filters" role="group" aria-label="Filter candidates">
        {filters.map((filter) => (
          <button key={filter.id} type="button" aria-pressed={filterId === filter.id} onClick={() => setFilterId(filter.id)}>
            {filter.label}
          </button>
        ))}
      </div>

      {breakdown.status === 'loading' && rows.length === 0 && (
        <p className="status-message" role="status">Loading candidates…</p>
      )}
      {breakdown.status === 'error' && (
        <div className="status-message status-message--error" role="alert">
          <p>Couldn't load candidates: {breakdown.error}</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={breakdown.reload}>Try again</button>
        </div>
      )}
      {breakdown.status === 'success' && rows.length > 0 && visibleTotal === 0 && (
        <p className="empty-state">
          {filterId === 'all' ? 'No students or faculty have signed up yet.' : `No ${visible[0].label.toLowerCase()} yet.`}
        </p>
      )}

      {rows.length > 0 && visibleTotal > 0 && view === 'chart' && (
        <figure
          className={`education-chart__figure${breakdown.status === 'loading' ? ' is-refreshing' : ''}`}
          aria-labelledby="education-chart-title"
          aria-describedby="education-chart-summary"
        >
          <ul className="chart-legend" aria-label="Legend">
            {visible.map((item) => (
              <li key={item.key}>
                <span className={`chart-swatch chart-swatch--${item.key}`} aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
          <div className="education-chart__plot">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 8, bottom: narrow ? 8 : 28, left: 8 }} barGap={2} barCategoryGap="28%">
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="education"
                  tickFormatter={(value) => levelLabels[value]}
                  interval={0}
                  tickLine={false}
                  angle={narrow ? -35 : 0}
                  textAnchor={narrow ? 'end' : 'middle'}
                  height={narrow ? 72 : 30}
                  label={{ value: 'Education level', position: 'insideBottom', offset: narrow ? 0 : -16 }}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, 'auto']}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  label={{ value: 'Number of candidates', angle: -90, position: 'insideLeft', offset: 8, style: { textAnchor: 'middle' } }}
                />
                <Tooltip content={<ChartTooltip />} shared={false} cursor={{ className: 'chart-cursor' }} />
                {visible.map((item) => (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    name={item.label}
                    className={`chart-bar chart-bar--${item.key}`}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <figcaption className="sr-only" id="education-chart-summary">{summary}</figcaption>
        </figure>
      )}

      {rows.length > 0 && visibleTotal > 0 && view === 'table' && (
        <div className="data-panel">
          <div className="table-scroll">
            <table>
              <caption className="sr-only">Candidates by education level</caption>
              <thead>
                <tr>
                  <th scope="col">Education level</th>
                  {visible.map((item) => <th key={item.key} scope="col" className="numeric">{item.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.education}>
                    <td className="candidate-name">{levelLabels[row.education]}</td>
                    {visible.map((item) => <td key={item.key} className="numeric">{row[item.key]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default EducationChart;
