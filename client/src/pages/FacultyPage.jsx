import { useState } from 'react';
import AssignmentForm from '../components/AssignmentForm.jsx';
import EnrollmentChart from '../components/EnrollmentChart.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import ProfileEditor from '../components/ProfileEditor.jsx';
import Roster from '../components/Roster.jsx';
import useRecords from '../hooks/useRecords.js';
import { updateStudent } from '../api.js';
import { formatDate, formatDueDate, rosters } from '../data.js';

// Faculty dashboard (specs/AfterLogin.md): "Edit student" on the left, "Show all registered students" in the
// middle, "Add Assignment" with "View your courses" and "View assignments" (specs/AssignmentTab.md) on the right.
// The enrollments bar chart (specs/FacultyDashboard.md) runs full width below.
function FacultyPage({ session }) {
  const students = useRecords('/api/students', 'students', session.token);
  const assignments = useRecords('/api/assignments', 'assignments', session.token);
  // Courses a director assigned to this faculty member; only these accept new assignments from them.
  const myCourses = useRecords('/api/faculty-assignments/mine', 'courses', session.token);
  const [openModal, setOpenModal] = useState('');
  const closeModal = () => setOpenModal('');

  // Refetch on open so a course a director just assigned shows up without reloading the page.
  function openMyCourses() {
    myCourses.reload();
    setOpenModal('my-courses');
  }

  // Likewise for assignments other faculty posted since the page loaded.
  function openAssignments() {
    assignments.reload();
    setOpenModal('assignments');
  }

  return (
    <>
      <section className="page-head" aria-labelledby="faculty-title">
        <div className="container page-head__inner d-flex flex-column flex-md-row align-items-start align-items-md-end justify-content-between">
          <div>
            <span className="badge-pill">
              <Icon name="userCheck" size={16} />
              Faculty
            </span>
            <h1 className="page-head__title" id="faculty-title">Faculty Desk</h1>
            <p className="hero__lead">Keep student records tidy and keep the assignments coming, {session.firstName}.</p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          {/* Rows stretch by default, so with h-100 the three cards share one height (specs/AssignmentTab.md). */}
          <div className="row g-4">
            <div className="col-12 col-md-6 col-xl-4">
              <section className="bento-card dashboard__left dashboard__action h-100 justify-content-center" aria-labelledby="edit-student-title">
                <span className="icon-tile">
                  <Icon name="pen" size={22} />
                </span>
                <div>
                  <h2 id="edit-student-title">Fix a student's details</h2>
                  <p className="section__sub">Update a name, email, phone number or education level.</p>
                </div>
                <button type="button" className="btn btn--outline btn--lg" onClick={() => setOpenModal('edit')}>
                  <Icon name="pen" size={18} />
                  Edit student
                </button>
              </section>
            </div>

            <div className="col-12 col-xl-4 order-first order-xl-0">
              <section className="bento-card dashboard__center dashboard__action h-100 justify-content-center" aria-labelledby="roster-title">
                <span className="icon-tile">
                  <Icon name="users" size={22} />
                </span>
                <div>
                  <h2 id="roster-title">Your students</h2>
                  <p className="section__sub">
                    {students.status === 'success'
                      ? `${students.records.length} registered so far.`
                      : 'See everyone registered on SkillStack.'}
                  </p>
                </div>
                <button type="button" className="btn btn--primary btn--lg" onClick={() => setOpenModal('roster')}>
                  <Icon name="users" size={18} />
                  Show all registered students
                </button>
              </section>
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <section className="bento-card dashboard__right dashboard__action h-100 justify-content-center" aria-labelledby="assignments-title">
                <span className="icon-tile">
                  <Icon name="file" size={22} />
                </span>
                <div>
                  <h2 id="assignments-title">Assignments</h2>
                  <p className="section__sub">
                    {assignments.status === 'success'
                      ? `${assignments.records.length} posted so far. Students in the course see them on their dashboard.`
                      : 'Post work to everyone enrolled in one of your courses.'}
                  </p>
                </div>
                <button type="button" className="btn btn--primary btn--lg" onClick={() => setOpenModal('assignment')}>
                  <Icon name="file" size={18} />
                  Add Assignment
                </button>
                <div className="dashboard__buttons w-100">
                  <button type="button" className="btn btn--outline btn--sm" onClick={openMyCourses}>
                    <Icon name="layers" size={16} />
                    View your courses
                  </button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={openAssignments}>
                    <Icon name="file" size={16} />
                    View assignments
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <EnrollmentChart token={session.token} />
        </div>
      </section>

      <Modal
        id="edit-student"
        open={openModal === 'edit'}
        title="Edit student"
        description="Pick a student, change what's wrong, and save."
        onClose={closeModal}
      >
        {students.status === 'error' && <p className="form-status form-status--error" role="alert">{students.error}</p>}
        <ProfileEditor
          token={session.token}
          people={students.records}
          label="Student"
          save={updateStudent}
          onSaved={students.reload}
        />
      </Modal>

      <Modal id="roster" open={openModal === 'roster'} title="All registered students" wide onClose={closeModal}>
        <Roster id="faculty-roster" token={session.token} roster={rosters.students} />
      </Modal>

      <Modal
        id="assignments"
        open={openModal === 'assignments'}
        title="Assignments"
        description="Every posted assignment, newest first, with how many students have finished it."
        wide
        onClose={closeModal}
      >
        {assignments.status === 'loading' && assignments.records.length === 0 && (
          <p className="status-message" role="status">Loading assignments…</p>
        )}
        {assignments.status === 'error' && (
          <div className="status-message status-message--error" role="alert">
            <p>Couldn't load assignments: {assignments.error}</p>
            <button type="button" className="btn btn--outline btn--sm" onClick={assignments.reload}>Try again</button>
          </div>
        )}
        {assignments.status === 'success' && assignments.records.length === 0 && (
          <p className="empty-state">No assignments yet. Post the first one with Add Assignment.</p>
        )}
        {assignments.records.length > 0 && (
          <ul className="resource-list" aria-label="Posted assignments">
            {assignments.records.map((assignment) => (
              <li key={assignment.id} className="resource">
                <span className="icon-tile icon-tile--sm">
                  <Icon name={assignment.course_icon} size={18} />
                </span>
                <div className="resource__text">
                  <p className="resource__title">{assignment.title}</p>
                  <p className="resource__meta">
                    {assignment.course_title}
                    {assignment.due_date && ` · Due ${formatDueDate(assignment.due_date)}`}
                    {` · ${assignment.completion_count} done`}
                    {assignment.created_by_name && ` · by ${assignment.created_by_name}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        id="my-courses"
        open={openModal === 'my-courses'}
        title="Your courses"
        description="The courses a director has assigned you. You can post assignments to these."
        onClose={closeModal}
      >
        {myCourses.status === 'loading' && myCourses.records.length === 0 && (
          <p className="status-message" role="status">Loading your courses…</p>
        )}
        {myCourses.status === 'error' && (
          <div className="status-message status-message--error" role="alert">
            <p>Couldn't load your courses: {myCourses.error}</p>
            <button type="button" className="btn btn--outline btn--sm" onClick={myCourses.reload}>Try again</button>
          </div>
        )}
        {myCourses.status === 'success' && myCourses.records.length === 0 && (
          <p className="empty-state">You aren't assigned to any courses yet. A director assigns faculty to courses before they can post assignments.</p>
        )}
        {myCourses.records.length > 0 && (
          <ul className="resource-list" aria-label="Courses you teach">
            {myCourses.records.map((course) => (
              <li key={course.id} className="resource">
                <span className="icon-tile icon-tile--sm">
                  <Icon name={course.icon} size={18} />
                </span>
                <div className="resource__text">
                  <p className="resource__title">{course.title}</p>
                  <p className="resource__meta">
                    {course.category} · {course.level} · {course.duration} · Assigned {formatDate(course.assigned_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        id="add-assignment"
        open={openModal === 'assignment'}
        title="Add Assignment"
        description="Students enrolled in the course will see it on their dashboard."
        onClose={closeModal}
      >
        <AssignmentForm token={session.token} onCreated={assignments.reload} />
      </Modal>
    </>
  );
}

export default FacultyPage;
