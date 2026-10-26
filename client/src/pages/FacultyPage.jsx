import { useState } from 'react';
import AssignmentForm from '../components/AssignmentForm.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import StudentEditor from '../components/StudentEditor.jsx';
import StudentRoster from '../components/StudentRoster.jsx';
import useRecords from '../hooks/useRecords.js';
import { formatDueDate } from '../data.js';

// Faculty dashboard (specs/AfterLogin.md): "Edit student" on the left, "Show all registered students" in the
// middle, "Add Assignment" on the right.
function FacultyPage({ session }) {
  const students = useRecords('/api/students', 'students', session.token);
  const assignments = useRecords('/api/assignments', 'assignments', session.token);
  const [openModal, setOpenModal] = useState('');
  const closeModal = () => setOpenModal('');

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
          <div className="row g-4 align-items-start">
            <div className="col-12 col-md-6 col-xl-4">
              <section className="bento-card dashboard__left dashboard__action" aria-labelledby="edit-student-title">
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
              <section className="bento-card dashboard__center dashboard__action" aria-labelledby="roster-title">
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
              <section className="bento-card dashboard__right" aria-labelledby="assignments-title">
                <div className="bento-card__head">
                  <div>
                    <h2 id="assignments-title">Assignments</h2>
                    <p>Posted to everyone enrolled in the course.</p>
                  </div>
                </div>
                <button type="button" className="btn btn--primary btn--block" onClick={() => setOpenModal('assignment')}>
                  <Icon name="file" size={18} />
                  Add Assignment
                </button>

                {assignments.status === 'loading' && <p className="status-message" role="status">Loading assignments…</p>}
                {assignments.status === 'error' && (
                  <div className="status-message status-message--error" role="alert">
                    <p>{assignments.error}</p>
                    <button type="button" className="btn btn--outline btn--sm" onClick={assignments.reload}>Try again</button>
                  </div>
                )}
                {assignments.status === 'success' && assignments.records.length === 0 && (
                  <p className="empty-state">No assignments yet. Post the first one.</p>
                )}
                {assignments.status === 'success' && assignments.records.length > 0 && (
                  <ul className="resource-list">
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
        id="edit-student"
        open={openModal === 'edit'}
        title="Edit student"
        description="Pick a student, change what's wrong, and save."
        onClose={closeModal}
      >
        {students.status === 'error' && <p className="form-status form-status--error" role="alert">{students.error}</p>}
        <StudentEditor token={session.token} students={students.records} onSaved={students.reload} />
      </Modal>

      <Modal id="roster" open={openModal === 'roster'} title="All registered students" wide onClose={closeModal}>
        <StudentRoster id="faculty-roster" token={session.token} />
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
