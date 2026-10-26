import Icon from './Icon.jsx';
import useRecords from '../hooks/useRecords.js';

// The login page shows at most this many, most-enrolled first.
const maxShown = 6;

// "Ada", "Ada and Ben", "Ada, Ben and Cy".
function joinNames(names) {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
}

// Real courses that have faculty assigned, with those faculty as instructors (specs/Root.md).
function TaughtCourses() {
  const courses = useRecords('/api/courses/taught', 'courses');
  const shown = courses.records.slice(0, maxShown);

  return (
    <div className="trending">
      <div className="trending__head">
        <h2 className="trending__title">
          <Icon name="zap" size={18} />
          Courses open now
        </h2>
        <p className="trending__sub">Taught by our faculty, most popular first</p>
      </div>

      {courses.status === 'loading' && shown.length === 0 && (
        <p className="status-message" role="status">Loading courses…</p>
      )}
      {courses.status === 'error' && (
        <div className="status-message status-message--error" role="alert">
          <p>Couldn't load courses: {courses.error}</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={courses.reload}>Try again</button>
        </div>
      )}
      {courses.status === 'success' && shown.length === 0 && (
        <p className="empty-state">Courses appear here once a director assigns faculty to them.</p>
      )}

      {shown.length > 0 && (
        <ul className="trending__list row row-cols-1 row-cols-sm-2 g-3" aria-label="Courses open now">
          {shown.map((course) => (
            <li key={course.id} className="col">
              <div className="trend-card h-100">
                <span className="icon-tile icon-tile--sm">
                  <Icon name={course.icon} size={18} />
                </span>
                <div className="trend-card__body">
                  <div className="trend-card__top">
                    <p className="trend-card__title">{course.title}</p>
                    {course.badge && <span className={`tag tag--${course.badge.toLowerCase()}`}>{course.badge}</span>}
                  </div>
                  <p className="trend-card__instructor">with {joinNames(course.faculty_names)}</p>
                  <ul className="course-meta" aria-label="Course details">
                    <li>
                      <Icon name="clock" size={14} />
                      {course.duration}
                    </li>
                    <li>
                      <Icon name="chart" size={14} />
                      {course.level}
                    </li>
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TaughtCourses;
