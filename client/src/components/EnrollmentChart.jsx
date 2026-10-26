import { useRef, useState } from 'react';
import useRecords from '../hooks/useRecords.js';

const studentsLabel = (count) => `${count} ${count === 1 ? 'student' : 'students'}`;
// Matches .bar-chart__tooltip's width in styles.css.
const tooltipWidth = 208;

// Horizontal bar chart of enrollments per course (specs/FacultyDashboard.md), sorted highest first by the API.
// One series, so one color and no legend; every bar carries its value at the tip, and the table view shows the
// same numbers without hovering. Rows use a roving tabindex: Tab enters the chart once, arrow keys move between bars.
function EnrollmentChart({ token }) {
  const enrollments = useRecords('/api/course-enrollments', 'enrollments', token);
  const [view, setView] = useState('chart');
  const [activeIndex, setActiveIndex] = useState(0);
  const [tooltip, setTooltip] = useState(null);
  const rowRefs = useRef([]);
  const plotRef = useRef(null);

  const rows = enrollments.records;
  const total = rows.reduce((sum, row) => sum + row.enrollments, 0);
  const max = Math.max(0, ...rows.map((row) => row.enrollments));
  const share = (count) => (total ? `${Math.round((count / total) * 100)}%` : '0%');

  function showTooltip(index) {
    const row = rowRefs.current[index];
    const plot = plotRef.current;
    if (!row || !plot) {
      return;
    }
    const bar = row.querySelector('.bar-chart__bar');
    const rowBox = row.getBoundingClientRect();
    const barBox = bar.getBoundingClientRect();
    const plotBox = plot.getBoundingClientRect();
    // Sit just past the value label; on long bars there's no room, so sit over the bar instead of covering the value.
    const afterValue = barBox.right - plotBox.left + 48;
    const overBar = barBox.right - plotBox.left - tooltipWidth - 12;
    setTooltip({
      index,
      top: rowBox.top - plotBox.top,
      left: afterValue + tooltipWidth <= plotBox.width ? afterValue : Math.max(0, overBar),
    });
  }

  function focusRow(index) {
    const next = Math.max(0, Math.min(rows.length - 1, index));
    setActiveIndex(next);
    rowRefs.current[next]?.focus();
  }

  function handleKeyDown(event, index) {
    const moves = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: rows.length - 1 };
    if (event.key in moves) {
      event.preventDefault();
      focusRow(moves[event.key]);
    } else if (event.key === 'Escape') {
      setTooltip(null);
    }
  }

  const tooltipRow = tooltip && rows[tooltip.index];

  return (
    <section className="bento-card enrollment-chart" aria-labelledby="enrollment-chart-title">
      <div className="bento-card__head">
        <div>
          <h2 id="enrollment-chart-title">Enrollments by course</h2>
          <p>
            {enrollments.status === 'success' || rows.length > 0
              ? `${total} ${total === 1 ? 'enrollment' : 'enrollments'} across ${rows.length} courses, most popular first.`
              : 'How many students are taking each course.'}
          </p>
        </div>
        <div className="segmented segmented--compact" role="group" aria-label="Show enrollments as">
          <button type="button" aria-pressed={view === 'chart'} onClick={() => setView('chart')}>Chart</button>
          <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>Table</button>
        </div>
      </div>

      {enrollments.status === 'loading' && rows.length === 0 && (
        <p className="status-message" role="status">Loading enrollments…</p>
      )}
      {enrollments.status === 'error' && (
        <div className="status-message status-message--error" role="alert">
          <p>Couldn't load enrollments: {enrollments.error}</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={enrollments.reload}>Try again</button>
        </div>
      )}
      {enrollments.status === 'success' && rows.length === 0 && (
        <p className="empty-state">No courses in the catalog yet.</p>
      )}

      {rows.length > 0 && view === 'chart' && (
        <div
          className={`bar-chart${enrollments.status === 'loading' ? ' is-refreshing' : ''}`}
          ref={plotRef}
          onPointerLeave={() => setTooltip(null)}
        >
          <ul className="bar-chart__rows" aria-label="Enrollments by course, bar chart">
            {rows.map((row, index) => (
              <li
                key={row.course_id}
                ref={(element) => { rowRefs.current[index] = element; }}
                className={`bar-chart__row${tooltip?.index === index ? ' is-active' : ''}`}
                tabIndex={index === activeIndex ? 0 : -1}
                aria-label={`${row.title}: ${studentsLabel(row.enrollments)}, ${share(row.enrollments)} of enrollments`}
                onPointerEnter={() => showTooltip(index)}
                onFocus={() => { setActiveIndex(index); showTooltip(index); }}
                onBlur={() => setTooltip(null)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <span className="bar-chart__label" aria-hidden="true">{row.title}</span>
                <span className="bar-chart__track" aria-hidden="true">
                  <span
                    className="bar-chart__bar"
                    style={{ '--ratio': max ? row.enrollments / max : 0 }}
                  />
                  <span className={`bar-chart__value${row.enrollments === 0 ? ' is-zero' : ''}`}>{row.enrollments}</span>
                </span>
              </li>
            ))}
          </ul>

          {tooltipRow && (
            <div className="bar-chart__tooltip" style={{ top: tooltip.top, left: tooltip.left }} aria-hidden="true">
              <strong>{studentsLabel(tooltipRow.enrollments)}</strong>
              <span>{tooltipRow.title}</span>
              <span className="bar-chart__tooltip-meta">{tooltipRow.category} · {share(tooltipRow.enrollments)} of all enrollments</span>
            </div>
          )}
        </div>
      )}

      {rows.length > 0 && view === 'table' && (
        <div className="data-panel">
          <div className="table-scroll">
            <table>
              <caption className="sr-only">Enrollments by course</caption>
              <thead>
                <tr>
                  <th scope="col">Course</th>
                  <th scope="col">Category</th>
                  <th scope="col" className="numeric">Students</th>
                  <th scope="col" className="numeric">Share</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.course_id}>
                    <td className="candidate-name">{row.title}</td>
                    <td>{row.category}</td>
                    <td className="numeric">{row.enrollments}</td>
                    <td className="numeric">{share(row.enrollments)}</td>
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

export default EnrollmentChart;
