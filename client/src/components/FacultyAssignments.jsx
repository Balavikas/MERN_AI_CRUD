import { useState } from 'react';
import Icon from './Icon.jsx';
import { assignFaculty, unassignFaculty } from '../api.js';
import { formatDate } from '../data.js';

const assignmentKey = (row) => `${row.faculty_id}:${row.course_id}`;

// Director tool (specs/AssignFaculty.md): assign faculty to courses and remove assignments. Only assigned faculty can
// post assignments to a course. `faculty`, `courses` and `assignments` are useRecords results owned by the page, so
// deleting a faculty member elsewhere on the page also refreshes this list.
function FacultyAssignments({ token, faculty, courses, assignments }) {
  const [form, setForm] = useState({ facultyId: '', courseId: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [confirmingKey, setConfirmingKey] = useState('');
  const [removingKey, setRemovingKey] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const fieldErrors = {};
    if (!form.facultyId) {
      fieldErrors.facultyId = 'Pick a faculty member.';
    }
    if (!form.courseId) {
      fieldErrors.courseId = 'Pick a course.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setStatus('error');
      document.getElementById(`assign-${fieldErrors.facultyId ? 'facultyId' : 'courseId'}`)?.focus();
      return;
    }

    setStatus('submitting');
    try {
      await assignFaculty(token, form);
      const member = faculty.records.find((candidate) => String(candidate.id) === form.facultyId);
      const course = courses.records.find((candidate) => candidate.id === form.courseId);
      setStatus('success');
      setMessage(`Assigned ${member?.full_name} to ${course?.title}.`);
      setErrors({});
      setForm((current) => ({ ...current, courseId: '' }));
      assignments.reload();
    } catch (error) {
      setStatus('error');
      setErrors(error.fieldErrors || {});
      setMessage(error.message);
    }
  }

  async function remove(row) {
    const key = assignmentKey(row);
    setRemovingKey(key);
    try {
      await unassignFaculty(token, row.faculty_id, row.course_id);
      setStatus('success');
      setMessage(`Removed ${row.faculty_name} from ${row.course_title}.`);
      assignments.reload();
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      setRemovingKey('');
      setConfirmingKey('');
    }
  }

  function fieldProps(name) {
    const hasError = Boolean(errors[name]);
    return {
      id: `assign-${name}`,
      name,
      value: form[name],
      onChange: updateField,
      'aria-invalid': hasError || undefined,
      'aria-describedby': hasError ? `assign-${name}-error` : undefined,
    };
  }

  function renderError(name) {
    return errors[name] ? <p className="field__error" id={`assign-${name}-error`}>{errors[name]}</p> : null;
  }

  return (
    <section className="bento-card" aria-labelledby="faculty-assignments-title">
      <div className="bento-card__head">
        <div>
          <h2 id="faculty-assignments-title">Course assignments</h2>
          <p>Assign faculty to courses. Only assigned faculty can post assignments to a course.</p>
        </div>
        {assignments.status === 'success' && (
          <span className="record-count">{assignments.records.length} assigned</span>
        )}
      </div>

      <form className="assign-form row g-3 align-items-start" onSubmit={handleSubmit} noValidate>
        <div className="field col-12 col-md-5">
          <label htmlFor="assign-facultyId">Faculty</label>
          <div className="select">
            <select {...fieldProps('facultyId')} className="input" disabled={faculty.status !== 'success'}>
              <option value="">{faculty.records.length === 0 ? 'No faculty yet' : 'Choose a faculty member…'}</option>
              {faculty.records.map((member) => (
                <option key={member.id} value={member.id}>{member.full_name} · {member.email}</option>
              ))}
            </select>
            <Icon name="chevronDown" size={18} className="select__icon" />
          </div>
          {renderError('facultyId')}
        </div>
        <div className="field col-12 col-md-5">
          <label htmlFor="assign-courseId">Course</label>
          <div className="select">
            <select {...fieldProps('courseId')} className="input" disabled={courses.status !== 'success'}>
              <option value="">{courses.status === 'loading' ? 'Loading courses…' : 'Choose a course…'}</option>
              {courses.records.map((course) => (
                <option key={course.id} value={course.id}>{course.title} · {course.category}</option>
              ))}
            </select>
            <Icon name="chevronDown" size={18} className="select__icon" />
          </div>
          {renderError('courseId')}
        </div>
        <div className="col-12 col-md-2 assign-form__submit">
          <button type="submit" className="btn btn--primary btn--block" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </form>

      <p
        className={`form-status${status === 'error' ? ' form-status--error' : ''}${status === 'success' ? ' form-status--success' : ''}`}
        role={status === 'error' ? 'alert' : 'status'}
      >
        {message}
      </p>

      {assignments.status === 'loading' && assignments.records.length === 0 && (
        <p className="status-message" role="status">Loading assignments…</p>
      )}
      {assignments.status === 'error' && (
        <div className="status-message status-message--error" role="alert">
          <p>{assignments.error}</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={assignments.reload}>Try again</button>
        </div>
      )}
      {assignments.status === 'success' && assignments.records.length === 0 && (
        <p className="empty-state">No one is assigned yet, so no faculty can post assignments. Assign someone above.</p>
      )}
      {assignments.records.length > 0 && (
        <div className="data-panel">
          <div className="table-scroll">
            <table>
              <caption className="sr-only">Faculty assigned to each course</caption>
              <thead>
                <tr>
                  <th scope="col">Course</th>
                  <th scope="col">Faculty</th>
                  <th scope="col">Assigned</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {assignments.records.map((row) => {
                  const key = assignmentKey(row);
                  return (
                    <tr key={key}>
                      <td className="candidate-name">{row.course_title}</td>
                      <td>{row.faculty_name}</td>
                      <td>{formatDate(row.assigned_at)}</td>
                      <td className="numeric">
                        {confirmingKey === key ? (
                          <span className="dashboard__buttons justify-content-end">
                            <button type="button" className="btn btn--outline btn--sm" onClick={() => setConfirmingKey('')}>
                              Keep
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              onClick={() => remove(row)}
                              disabled={removingKey === key}
                            >
                              {removingKey === key ? 'Removing…' : 'Yes, unassign'}
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            onClick={() => setConfirmingKey(key)}
                            aria-label={`Unassign ${row.faculty_name} from ${row.course_title}`}
                          >
                            Unassign
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default FacultyAssignments;
