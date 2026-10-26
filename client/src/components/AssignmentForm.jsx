import { useState } from 'react';
import Icon from './Icon.jsx';
import useRecords from '../hooks/useRecords.js';
import { createAssignment } from '../api.js';

const emptyForm = { courseId: '', title: '', description: '', dueDate: '' };
const fieldOrder = Object.keys(emptyForm);

// Posts an assignment to one course; every student enrolled in it sees it on their dashboard.
// Only the courses a director has assigned to this faculty member are offered (specs/AssignFaculty.md); the API
// enforces the same rule.
function AssignmentForm({ token, onCreated }) {
  const courses = useRecords('/api/faculty-assignments/mine', 'courses', token);
  const noCourses = courses.status === 'success' && courses.records.length === 0;
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const fieldErrors = {};
    if (!form.courseId) {
      fieldErrors.courseId = 'Pick a course.';
    }
    if (!form.title.trim()) {
      fieldErrors.title = 'Give the assignment a title.';
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setStatus('error');
      document.getElementById(`assignment-${fieldErrors.courseId ? 'courseId' : 'title'}`)?.focus();
      return;
    }

    setStatus('submitting');
    try {
      const assignment = await createAssignment(token, form);
      setForm({ ...emptyForm, courseId: form.courseId });
      setErrors({});
      setStatus('success');
      setMessage(`Posted “${assignment.title}”.`);
      onCreated(assignment);
    } catch (error) {
      const fieldErrors = error.fieldErrors || {};
      setStatus('error');
      setErrors(fieldErrors);
      setMessage(error.message);
      const firstField = fieldOrder.find((name) => fieldErrors[name]);
      if (firstField) {
        document.getElementById(`assignment-${firstField}`)?.focus();
      }
    }
  }

  function fieldProps(name) {
    const hasError = Boolean(errors[name]);
    return {
      id: `assignment-${name}`,
      name,
      value: form[name],
      onChange: updateField,
      'aria-invalid': hasError || undefined,
      'aria-describedby': hasError ? `assignment-${name}-error` : undefined,
    };
  }

  function renderError(name) {
    return errors[name] ? <p className="field__error" id={`assignment-${name}-error`}>{errors[name]}</p> : null;
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="assignment-courseId">Course</label>
        <div className="select">
          <select {...fieldProps('courseId')} className="input" disabled={courses.status !== 'success' || noCourses}>
            <option value="">{courses.status === 'loading' ? 'Loading your courses…' : 'Choose a course…'}</option>
            {courses.records.map((course) => (
              <option key={course.id} value={course.id}>{course.title} · {course.category}</option>
            ))}
          </select>
          <Icon name="chevronDown" size={18} className="select__icon" />
        </div>
        {renderError('courseId')}
        {courses.status === 'error' && <p className="field__error">Couldn't load your courses: {courses.error}</p>}
        {noCourses && (
          <p className="field__hint">You aren't assigned to any courses yet. Ask a director to assign you to one.</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="assignment-title">Title</label>
        <input {...fieldProps('title')} className="input" maxLength={120} placeholder="Build a REST endpoint" required />
        {renderError('title')}
      </div>

      <div className="field">
        <label htmlFor="assignment-description">Description</label>
        <textarea
          {...fieldProps('description')}
          className="input input--textarea"
          maxLength={2000}
          placeholder="What should students hand in?"
        />
        {renderError('description')}
      </div>

      <div className="field">
        <label htmlFor="assignment-dueDate">Due date (optional)</label>
        <input {...fieldProps('dueDate')} type="date" className="input" />
        {renderError('dueDate')}
      </div>

      <button type="submit" className="btn btn--primary btn--block" disabled={status === 'submitting' || noCourses}>
        {status === 'submitting' ? 'Posting…' : 'Post assignment'}
      </button>

      <p
        className={`form-status${status === 'error' ? ' form-status--error' : ''}${status === 'success' ? ' form-status--success' : ''}`}
        role={status === 'error' ? 'alert' : 'status'}
      >
        {message}
      </p>
    </form>
  );
}

export default AssignmentForm;
