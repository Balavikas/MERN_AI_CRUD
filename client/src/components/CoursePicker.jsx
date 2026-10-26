import { useState } from 'react';
import CourseArt from './CourseArt.jsx';
import Icon from './Icon.jsx';
import useRecords from '../hooks/useRecords.js';
import { enrollInCourse } from '../api.js';

// Lists every course in the database the student isn't already taking (GET /api/student/available-courses).
// Adding one writes a row to `enrollments` and removes it from this list.
function CoursePicker({ token, onEnrolled }) {
  const available = useRecords('/api/student/available-courses', 'courses', token);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function addCourse(course) {
    setBusyId(course.id);
    setMessage('');
    setError('');
    try {
      await enrollInCourse(token, course.id);
      setMessage(`Added ${course.title}. It's in “Courses I'm taking” now.`);
      available.reload();
      onEnrolled();
    } catch (enrollError) {
      setError(enrollError.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <>
      <p className={`form-status${error ? ' form-status--error' : ' form-status--success'}`} role={error ? 'alert' : 'status'}>
        {error || message}
      </p>

      {available.status === 'loading' && available.records.length === 0 && (
        <p className="status-message" role="status">Loading courses…</p>
      )}
      {available.status === 'error' && (
        <div className="status-message status-message--error" role="alert">
          <p>{available.error}</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={available.reload}>Try again</button>
        </div>
      )}
      {available.status === 'success' && available.records.length === 0 && (
        <p className="empty-state">You're taking every course we've got. Legend.</p>
      )}
      {available.records.length > 0 && (
        <ul className="course-picker row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
          {available.records.map((course) => (
            <li key={course.id} className="col">
              <article className="course-card course-card--picker h-100">
                <CourseArt course={course} compact />
                <div className="course-card__body">
                  <p className="course-card__category">{course.category}</p>
                  <h3 className="course-card__title">{course.title}</h3>
                  <p className="course-card__instructor">with {course.instructor}</p>
                  {course.description && <p className="course-card__description">{course.description}</p>}
                  <div className="course-card__footer">
                    <ul className="course-meta" aria-label="Course details">
                      <li>
                        <Icon name="clock" size={16} />
                        {course.duration}
                      </li>
                      <li>
                        <Icon name="chart" size={16} />
                        {course.level}
                      </li>
                    </ul>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => addCourse(course)}
                      disabled={Boolean(busyId)}
                      aria-label={`Add ${course.title}`}
                    >
                      {busyId === course.id ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default CoursePicker;
