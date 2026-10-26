import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import ReportView from '../components/ReportView.jsx';
import SignupForm from '../components/SignupForm.jsx';
import StudentRoster from '../components/StudentRoster.jsx';
import useRecords from '../hooks/useRecords.js';
import { createFaculty, deleteFaculty } from '../api.js';
import { formatDate } from '../data.js';

// Director dashboard (specs/AfterLogin.md): "Show Registered Students" on the left, "Report" in the middle,
// "Add Faculty" and "Delete Faculty" on the right.
function DirectorPage({ session }) {
  const faculty = useRecords('/api/faculty', 'faculty', session.token);
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
          <div className="row g-4 align-items-start">
            <div className="col-12 col-md-6 col-xl-4">
              <section className="bento-card dashboard__left dashboard__action" aria-labelledby="director-roster-title">
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
              <section className="bento-card dashboard__center dashboard__action" aria-labelledby="report-title">
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
              <section className="bento-card dashboard__right" aria-labelledby="faculty-title">
                <div className="bento-card__head">
                  <div>
                    <h2 id="faculty-title">Faculty</h2>
                    <p>The people teaching on SkillStack.</p>
                  </div>
                  {faculty.status === 'success' && <span className="record-count">{faculty.records.length} total</span>}
                </div>
                <div className="dashboard__buttons">
                  <button type="button" className="btn btn--primary" onClick={() => setOpenModal('add')}>
                    <Icon name="userCheck" size={18} />
                    Add Faculty
                  </button>
                  <button type="button" className="btn btn--outline" onClick={() => setOpenModal('delete')}>
                    <Icon name="x" size={18} />
                    Delete Faculty
                  </button>
                </div>

                {faculty.status === 'loading' && <p className="status-message" role="status">Loading faculty…</p>}
                {faculty.status === 'error' && (
                  <div className="status-message status-message--error" role="alert">
                    <p>{faculty.error}</p>
                    <button type="button" className="btn btn--outline btn--sm" onClick={faculty.reload}>Try again</button>
                  </div>
                )}
                {faculty.status === 'success' && faculty.records.length === 0 && (
                  <p className="empty-state">No faculty yet. Add your first teacher.</p>
                )}
                {faculty.status === 'success' && faculty.records.length > 0 && (
                  <ul className="resource-list">
                    {faculty.records.map((member) => (
                      <li key={member.id} className="resource">
                        <span className="icon-tile icon-tile--sm">
                          <Icon name="user" size={18} />
                        </span>
                        <div className="resource__text">
                          <p className="resource__title">{member.full_name}</p>
                          <p className="resource__meta">{member.email} · Since {formatDate(member.created_at)}</p>
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

      <Modal id="director-roster" open={openModal === 'roster'} title="Registered students" wide onClose={closeModal}>
        <StudentRoster id="director-roster" token={session.token} />
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
