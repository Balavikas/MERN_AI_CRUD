import { lazy, Suspense, useState } from 'react';
import FacultyAssignments from '../components/FacultyAssignments.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import ProfileEditor from '../components/ProfileEditor.jsx';
import ReportView from '../components/ReportView.jsx';
import Roster from '../components/Roster.jsx';
import SignupForm from '../components/SignupForm.jsx';
import useRecords from '../hooks/useRecords.js';
import { createFaculty, deleteFaculty, updateFaculty } from '../api.js';
import { rosters } from '../data.js';

// Recharts is large and only directors see this chart, so it loads in its own chunk on first visit.
const EducationChart = lazy(() => import('../components/EducationChart.jsx'));

// Director dashboard (specs/AfterLogin.md): "Show Registered Students" on the left, "Report" in the middle,
// "Show Registered Faculty", "Add Faculty", "Edit Faculty" and "Delete Faculty" on the right. Below them, full width:
// candidates by education level (specs/DirectorsDashboard.md), then course assignments (specs/AssignFaculty.md).
function DirectorPage({ session }) {
  const faculty = useRecords('/api/faculty', 'faculty', session.token);
  const courses = useRecords('/api/courses', 'courses');
  const facultyAssignments = useRecords('/api/faculty-assignments', 'assignments', session.token);
  const [openModal, setOpenModal] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState({ text: '', error: false });

  function closeModal() {
    setOpenModal('');
    setConfirmingId(null);
    setDeleteMessage({ text: '', error: false });
  }

  async function removeFaculty(member) {
    setDeletingId(member.id);
    try {
      await deleteFaculty(session.token, member.id);
      setDeleteMessage({ text: `Removed ${member.full_name}.`, error: false });
      faculty.reload();
      // Their course assignments are deleted with them.
      facultyAssignments.reload();
    } catch (error) {
      setDeleteMessage({ text: error.message, error: true });
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <>
      <section className="page-head" aria-labelledby="director-title">
        <div className="container page-head__inner d-flex flex-column flex-md-row align-items-start align-items-md-end justify-content-between">
          <div>
            <span className="badge-pill">
              <Icon name="chart" size={16} />
              Director
            </span>
            <h1 className="page-head__title" id="director-title">Director's Office</h1>
            <p className="hero__lead">The whole academy at a glance, {session.firstName}.</p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          {/* Rows stretch by default, so with h-100 the three cards share the tallest one's height. */}
          <div className="row g-4">
            <div className="col-12 col-md-6 col-xl-4">
              <section className="bento-card dashboard__left dashboard__action h-100 justify-content-center" aria-labelledby="director-roster-title">
                <span className="icon-tile">
                  <Icon name="users" size={22} />
                </span>
                <div>
                  <h2 id="director-roster-title">Students</h2>
                  <p className="section__sub">Everyone registered as a student, with their course load.</p>
                </div>
                <button type="button" className="btn btn--outline btn--lg" onClick={() => setOpenModal('roster')}>
                  <Icon name="users" size={18} />
                  Show Registered Students
                </button>
              </section>
            </div>

            <div className="col-12 col-xl-4 order-first order-xl-0">
              <section className="bento-card dashboard__center dashboard__action h-100 justify-content-center" aria-labelledby="report-title">
                <span className="icon-tile">
                  <Icon name="chart" size={22} />
                </span>
                <div>
                  <h2 id="report-title">Academy report</h2>
                  <p className="section__sub">Headcounts, enrollments and assignment completion by course.</p>
                </div>
                <button type="button" className="btn btn--primary btn--lg" onClick={() => setOpenModal('report')}>
                  <Icon name="chart" size={18} />
                  Report
                </button>
              </section>
            </div>

            <div className="col-12 col-md-6 col-xl-4">
              <section className="bento-card dashboard__right dashboard__action h-100 justify-content-center" aria-labelledby="faculty-title">
                <span className="icon-tile">
                  <Icon name="userCheck" size={22} />
                </span>
                <div>
                  <h2 id="faculty-title">Faculty</h2>
                  <p className="section__sub">
                    {faculty.status === 'success'
                      ? `${faculty.records.length} teaching on SkillStack, with the courses they're assigned to.`
                      : 'Everyone teaching on SkillStack, with the courses they are assigned to.'}
                  </p>
                  {faculty.status === 'error' && (
                    <p className="field__error" role="alert">Couldn't load faculty: {faculty.error}</p>
                  )}
                </div>
                <button type="button" className="btn btn--outline btn--lg" onClick={() => setOpenModal('faculty-roster')}>
                  <Icon name="userCheck" size={18} />
                  Show Registered Faculty
                </button>
                <div className="dashboard__buttons w-100">
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => setOpenModal('add')}>
                    <Icon name="userCheck" size={16} />
                    Add Faculty
                  </button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setOpenModal('edit-faculty')}>
                    <Icon name="pen" size={16} />
                    Edit Faculty
                  </button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => setOpenModal('delete')}>
                    <Icon name="x" size={16} />
                    Delete Faculty
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <Suspense fallback={<p className="status-message" role="status">Loading chart…</p>}>
            <EducationChart token={session.token} />
          </Suspense>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <FacultyAssignments
            token={session.token}
            faculty={faculty}
            courses={courses}
            assignments={facultyAssignments}
          />
        </div>
      </section>

      <Modal id="director-roster" open={openModal === 'roster'} title="Registered students" wide onClose={closeModal}>
        <Roster id="director-roster" token={session.token} roster={rosters.students} />
      </Modal>

      <Modal id="faculty-roster" open={openModal === 'faculty-roster'} title="Registered faculty" wide onClose={closeModal}>
        <Roster id="faculty-roster" token={session.token} roster={rosters.faculty} />
      </Modal>

      <Modal id="report" open={openModal === 'report'} title="Report" wide onClose={closeModal}>
        <ReportView token={session.token} />
      </Modal>

      <Modal
        id="add-faculty"
        open={openModal === 'add'}
        title="Add Faculty"
        description="They log in with these details by choosing Faculty on the login page."
        onClose={closeModal}
      >
        <SignupForm
          idPrefix="faculty"
          submitLabel="Add faculty member"
          submittingLabel="Adding…"
          submit={(account) => createFaculty(session.token, account)}
          successMessage={(member) => `Added ${member.full_name}. Share their login details with them.`}
          onCreated={faculty.reload}
        />
      </Modal>

      <Modal
        id="edit-faculty"
        open={openModal === 'edit-faculty'}
        title="Edit Faculty"
        description="Pick a faculty member, change what's wrong, and save."
        onClose={closeModal}
      >
        {faculty.status === 'error' && <p className="form-status form-status--error" role="alert">{faculty.error}</p>}
        <ProfileEditor
          token={session.token}
          people={faculty.records}
          label="Faculty member"
          save={updateFaculty}
          onSaved={() => {
            faculty.reload();
            // Assignment rows show the faculty member's name.
            facultyAssignments.reload();
          }}
        />
      </Modal>

      <Modal
        id="delete-faculty"
        open={openModal === 'delete'}
        title="Delete Faculty"
        description="Removing someone deletes their account. Assignments they posted stay up."
        onClose={closeModal}
      >
        {faculty.records.length === 0 ? (
          <p className="empty-state">No faculty to remove.</p>
        ) : (
          <ul className="resource-list">
            {faculty.records.map((member) => (
              <li key={member.id} className="resource">
                <span className="icon-tile icon-tile--sm icon-tile--muted">
                  <Icon name="user" size={18} />
                </span>
                <div className="resource__text">
                  <p className="resource__title">{member.full_name}</p>
                  <p className="resource__meta">{member.email}</p>
                </div>
                {confirmingId === member.id ? (
                  <div className="dashboard__buttons">
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => setConfirmingId(null)}>
                      Keep
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => removeFaculty(member)}
                      disabled={deletingId === member.id}
                    >
                      {deletingId === member.id ? 'Deleting…' : 'Yes, delete'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => setConfirmingId(member.id)}
                    aria-label={`Delete ${member.full_name}`}
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p
          className={`form-status${deleteMessage.error ? ' form-status--error' : ' form-status--success'}`}
          role={deleteMessage.error ? 'alert' : 'status'}
        >
          {deleteMessage.text}
        </p>
      </Modal>
    </>
  );
}

export default DirectorPage;
