import { useState } from 'react';
import Icon from './Icon.jsx';
import { educationLevels } from '../data.js';
import { validateProfile } from '../validation.js';

const fieldOrder = ['fullName', 'email', 'phoneNumber', 'education'];

function toForm(person) {
  return {
    fullName: person.full_name,
    email: person.email,
    phoneNumber: person.phone_number,
    education: person.education,
  };
}

// Pick one account from `people` and fix their name, email, phone or education. Faculty use it for students
// (save = updateStudent) and directors for faculty (save = updateFaculty); `label` names the kind of person.
function ProfileEditor({ token, people, label, save, onSaved }) {
  const [personId, setPersonId] = useState('');
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  function pickPerson(event) {
    const person = people.find((candidate) => String(candidate.id) === event.target.value);
    setPersonId(event.target.value);
    setForm(person ? toForm(person) : null);
    setErrors({});
    setStatus('idle');
    setMessage('');
  }

  function updateField(event) {
    const { name, value } = event.target;
    const next = { ...form, [name]: value };
    setForm(next);
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: validateProfile(next)[name] }));
    }
  }

  function focusFirstError(fieldErrors) {
    const firstField = fieldOrder.find((name) => fieldErrors[name]);
    if (firstField) {
      document.getElementById(`edit-${firstField}`)?.focus();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const fieldErrors = validateProfile(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      setStatus('error');
      focusFirstError(fieldErrors);
      return;
    }

    setStatus('submitting');
    try {
      const saved = await save(token, personId, form);
      setForm(toForm(saved));
      setStatus('success');
      setMessage(`Saved ${saved.full_name}'s details.`);
      onSaved(saved);
    } catch (error) {
      setStatus('error');
      setErrors(error.fieldErrors || {});
      setMessage(error.message);
      focusFirstError(error.fieldErrors || {});
    }
  }

  function fieldProps(name) {
    const hasError = Boolean(errors[name]);
    return {
      id: `edit-${name}`,
      name,
      value: form[name],
      onChange: updateField,
      'aria-invalid': hasError || undefined,
      'aria-describedby': hasError ? `edit-${name}-error` : undefined,
    };
  }

  function renderError(name) {
    return errors[name] ? <p className="field__error" id={`edit-${name}-error`}>{errors[name]}</p> : null;
  }

  return (
    <div className="form">
      <div className="field">
        <label htmlFor="edit-person">{label}</label>
        <div className="select">
          <select id="edit-person" className="input" value={personId} onChange={pickPerson}>
            <option value="">Choose a {label.toLowerCase()}…</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>{person.full_name} · {person.email}</option>
            ))}
          </select>
          <Icon name="chevronDown" size={18} className="select__icon" />
        </div>
      </div>

      {form && (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="edit-fullName">Name</label>
            <input {...fieldProps('fullName')} className="input" autoComplete="off" required />
            {renderError('fullName')}
          </div>

          <div className="field">
            <label htmlFor="edit-email">Email</label>
            <input {...fieldProps('email')} type="email" className="input" autoComplete="off" required />
            {renderError('email')}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="edit-phoneNumber">Phone number</label>
              <input {...fieldProps('phoneNumber')} type="tel" className="input" autoComplete="off" required />
              {renderError('phoneNumber')}
            </div>
            <div className="field">
              <label htmlFor="edit-education">Education</label>
              <div className="select">
                <select {...fieldProps('education')} className="input">
                  {educationLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <Icon name="chevronDown" size={18} className="select__icon" />
              </div>
              {renderError('education')}
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}

      <p
        className={`form-status${status === 'error' ? ' form-status--error' : ''}${status === 'success' ? ' form-status--success' : ''}`}
        role={status === 'error' ? 'alert' : 'status'}
      >
        {message}
      </p>
    </div>
  );
}

export default ProfileEditor;
