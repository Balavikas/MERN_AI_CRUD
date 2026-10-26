import { useState } from 'react';
import CoursePicker from '../components/CoursePicker.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import useRecords from '../hooks/useRecords.js';
import { completeAssignment } from '../api.js';
import { formatDate, formatDueDate } from '../data.js';

// Student dashboard (specs/AfterLogin.md): completed assignments on the left, "Add the course" in the middle,
// current courses on the right.
function StudentPage({ session }) {
  const enrollments = useRecords('/api/student/courses', 'courses', session.token);
  const assignments = useRecords('/api/student/assignments', 'assignments', session.token);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const completed = assignments.records.filter((assignment) => assignment.completed_at);
  const pending = assignments.records.filter((assignment) => !assignment.completed_at);

  // A new course can bring assignments with it, so refresh both lists.
  function handleEnrolled() {
    enrollments.reload();
    assignments.reload();
  }

  async function markDone(assignment) {
    setBusyId(`assignment-${assignment.id}`);
    setError('');
    try {
      await completeAssignment(session.token, assignment.id);
      assignments.reload();
    } catch (completeError) {
      setError(completeError.message);
    } finally {
      setBusyId('');
    }
  }

  function openPicker() {
    setError('');
    setPickerOpen(true);
  }

  return (
    <>
      <section className="page-head" aria-labelledby="student-title">
        <div className="container page-head__inner d-flex flex-column flex-md-row align-items-start align-items-md-end justify-content-between">
          <div>
            <span className="badge-pill">
              <Icon name="user" size={16} />
              Student
            </span>
            <h1 className="page-head__title" id="student-title">My Learning</h1>
            <p className="hero__lead">Your courses, your wins, and what's next, {session.firstName}.</p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="row g-4 align-items-start">
            <div className="col-12 col-md-6 col-xl-4">
              <section className="bento-card dashboard__left" aria-labelledby="completed-title">
                <div className="bento-card__head">
                  <div>
                    <h2 id="completed-title">Completed assignments</h2>
                    <p>Everything you've shipped so far.</p>
                  </div>
                  {assignments.status === 'success' && <span className="record-count">{completed.length} done</span>}
                </div>

                {assignments.status === 'loading' && <p className="status-message" role="status">Loading assignments…</p>}
                {assignments.status === 'error' && (
                  <div className="status-message status-message--error" role="alert">
                    <p>{assignments.error}</p>
                    <button type="button" className="btn btn--outline btn--sm" onClick={assignments.reload}>Try again</button>
                  </div>
                )}
                {assignments.status === 'success' && (
                  <>
                    {completed.length === 0 ? (
                      <p className="empty-state">Nothing completed yet. Finish an assignment and it lands here.</p>
                    ) : (
                      <ul className="resource-list">
                        {completed.map((assignment) => (
                          <li key={assignment.id} className="resource">
                            <span className="icon-tile icon-tile--sm">
                              <Icon name="check" size={18} />
                            </span>
                            <div className="resource__text">
                              <p className="resource__title">{assignment.title}</p>
                              <p className="resource__meta">
                                {assignment.course_title} · Done {formatDate(assignment.completed_at)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {pending.length > 0 && (
                      <div className="dashboard__subsection">
                        <h3 className="dashboard__subtitle">Still to do</h3>
                        <ul className="resource-list">
                          {pending.map((assignment) => (
                            <li key={assignment.id} className="resource">
                              <span className="icon-tile icon-tile--sm icon-tile--muted">
                                <Icon name="file" size={18} />
                              </span>
                              <div className="resource__text">
                                <p className="resource__title">{assignment.title}</p>
                                <p className="resource__meta">
                                  {assignment.course_title}
                                  {assignment.due_date && ` · Due ${formatDueDate(assignment.due_date)}`}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="btn btn--outline btn--sm"
                                onClick={() => markDone(assignment)}
                                disabled={busyId === `assignment-${assignment.id}`}
                                aria-label={`Mark ${assignment.title} as done`}
                              >
                                <Icon name="check" size={16} />
                                Done
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                {error && !pickerOpen && <p className="form-status form-status--error" role="alert">{error}</p>}
              </section>
            </div>

            <div className="col-12 col-xl-4 order-first order-xl-0">
              <section className="bento-card dashboard__center dashboard__action" aria-labelledby="add-course-title">
                <span className="icon-tile">
                  <Icon name="sparkles" size={22} />
                </span>
                <div>
                  <h2 id="add-course-title">Stack another skill</h2>
                  <p className="section__sub">Pick a course from the catalog and it shows up in your list right away.</p>
                </div>
                <button type="button" className="btn btn--primary btn--lg" onClick={openPicker}>
                  <Icon name="sparkles" size={18} />
                  Add the course
                </button>
              </section>
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <section className="bento-card dashboard__right" aria-labelledby="my-courses-title">
                <div className="bento-card__head">
                  <div>
                    <h2 id="my-courses-title">Courses I'm taking</h2>
                    <p>What you're working through right now.</p>
                  </div>
                  {enrollments.status === 'success' && (
                    <span className="record-count">{enrollments.records.length} active</span>
                  )}
                </div>

                {enrollments.status === 'loading' && <p className="status-message" role="status">Loading courses…</p>}
                {enrollments.status === 'error' && (
                  <div className="status-message status-message--error" role="alert">
                    <p>{enrollments.error}</p>
                    <button type="button" className="btn btn--outline btn--sm" onClick={enrollments.reload}>Try again</button>
                  </div>
                )}
                {enrollments.status === 'success' && enrollments.records.length === 0 && (
                  <p className="empty-state">No courses yet. Hit “Add the course” to get started.</p>
                )}
                {enrollments.status === 'success' && enrollments.records.length > 0 && (
                  <ul className="resource-list">
                    {enrollments.records.map((course) => (
                      <li key={course.course_id} className="resource">
                        <span className="icon-tile icon-tile--sm">
                          <Icon name={course.icon} size={18} />
                        </span>
                        <div className="resource__text">
                          <p className="resource__title">{course.title}</p>
                          <p className="resource__meta">
                            {course.category} · {course.instructor} · {course.level} · Since {formatDate(course.enrolled_at)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      </section>

      <Modal
        id="course-picker"
        open={pickerOpen}
        title="Add a course"
        description="Every course in the catalog you're not already taking."
        wide
        onClose={() => setPickerOpen(false)}
      >
        <CoursePicker token={session.token} onEnrolled={handleEnrolled} />
      </Modal>
    </>
  );
}

export default StudentPage;
