import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { fetchReport } from '../api.js';
import { saveFile, toCsv } from '../utils/download.js';

const totalStats = [
  { key: 'students', label: 'Students', icon: 'users' },
  { key: 'faculty', label: 'Faculty', icon: 'userCheck' },
  { key: 'courses', label: 'Courses', icon: 'brain' },
  { key: 'enrollments', label: 'Enrollments', icon: 'layers' },
  { key: 'assignments', label: 'Assignments', icon: 'file' },
  { key: 'completions', label: 'Completed', icon: 'check' },
];

const courseColumns = [
  { key: 'title', label: 'Course' },
  { key: 'enrollments', label: 'Enrolled' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'completions', label: 'Completed' },
];

// The director's report: headline totals plus a per-course breakdown that can be downloaded as CSV.
function ReportView({ token }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    setError('');
    fetchReport(token)
      .then((result) => !cancelled && setReport(result))
      .catch((loadError) => !cancelled && setError(loadError.message));
    return () => {
      cancelled = true;
    };
  }, [token, version]);

  if (error) {
    return (
      <div className="status-message status-message--error" role="alert">
        <p>{error}</p>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => setVersion((current) => current + 1)}>
          Try again
        </button>
      </div>
    );
  }
  if (!report) {
    return <p className="status-message" role="status">Crunching the numbers…</p>;
  }

  function download() {
    const date = new Date().toISOString().slice(0, 10);
    saveFile(`skillstack-report-${date}.csv`, toCsv(report.courses, courseColumns), 'text/csv;charset=utf-8');
  }

  return (
    <div className="form">
      <ul className="stat-grid row row-cols-2 row-cols-md-3 row-cols-lg-6 g-3">
        {totalStats.map((stat) => (
          <li key={stat.key} className="col">
            <div className="stat h-100">
              <span className="stat__label">
                <Icon name={stat.icon} size={16} />
                {stat.label}
              </span>
              <span className="stat__value">{report.totals[stat.key]}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="records__head d-flex flex-wrap align-items-center justify-content-between">
        <h3 className="dashboard__subtitle">By course</h3>
        <button type="button" className="btn btn--outline btn--sm" onClick={download}>
          <Icon name="download" size={16} />
          Download CSV
        </button>
      </div>
      <div className="data-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {courseColumns.map((column) => (
                  <th scope="col" key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.courses.map((course) => (
                <tr key={course.course_id}>
                  {courseColumns.map((column) => (
                    <td className={column.key === 'title' ? 'candidate-name' : undefined} key={column.key}>
                      {course[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportView;
