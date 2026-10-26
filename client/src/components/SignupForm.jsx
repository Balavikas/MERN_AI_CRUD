import { useState } from 'react';
import Icon from './Icon.jsx';
import { createAccount } from '../api.js';
import { educationLevels, roles } from '../data.js';
import { passwordRules, validateSignup } from '../validation.js';

const emptyForm = {
  role: roles[0].id,
  fullName: '',
  email: '',
  phoneNumber: '',
  education: educationLevels[0],
  password: '',
  confirmPassword: '',
};

const fieldOrder = Object.keys(emptyForm);

// Creates a row in the Postgres registrations table. `idPrefix` keeps ids unique when the form appears twice.
// `submit` defaults to public sign-up; the director dashboard passes one that creates faculty instead.
// `showRole` adds the role dropdown; without it the account is a student.
function SignupForm({
  idPrefix,
  showRole = false,
  submitLabel,
  submittingLabel = 'Creating your account…',
  onCreated,
  successMessage,
  submit = createAccount,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const fieldId = (name) => `${idPrefix}-${name}`;

  function updateField(event) {
    const { name, value } = event.target;
    const next = { ...form, [name]: value };
    setForm(next);

    // Once a field has an error, re-check it (and the confirmation) as the user fixes it.
    if (errors[name] || (name === 'password' && errors.confirmPassword)) {
      const nextErrors = validateSignup(next);
      setErrors((current) => ({
        ...current,
        [name]: nextErrors[name],
        ...(current.confirmPassword ? { confirmPassword: nextErrors.confirmPassword } : {}),
      }));
    }
  }

  function focusFirstError(fieldErrors) {
    const firstField = fieldOrder.find((name) => fieldErrors[name]);
    if (firstField) {
      document.getElementById(fieldId(firstField))?.focus();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const fieldErrors = validateSignup(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      setStatus('error');
      focusFirstError(fieldErrors);
      return;
    }

    setStatus('submitting');
    try {
      const account = await submit(form);
      setStatus('success');
      setForm(emptyForm);
      setShowPassword(false);
      if (successMessage) {
        setMessage(successMessage(account));
      }
      onCreated(account);
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
      id: fieldId(name),
      name,
      value: form[name],
      onChange: updateField,
      'aria-invalid': hasError || undefined,
      'aria-describedby': hasError ? `${fieldId(name)}-error` : undefined,
    };
  }

  function renderError(name) {
    return errors[name] ? (
      <p className="field__error" id={`${fieldId(name)}-error`}>
        {errors[name]}
      </p>
    ) : null;
  }

  function renderPasswordToggle() {
    return (
      <button
        type="button"
        className="input-icon__trail"
        aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
        aria-pressed={showPassword}
        onClick={() => setShowPassword((shown) => !shown)}
      >
        <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
      </button>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {showRole && (
        <div className="field">
          <label htmlFor={fieldId('role')}>Sign up as</label>
          <div className="select">
            <select {...fieldProps('role')} className="input">
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.label}</option>
              ))}
            </select>
            <Icon name="chevronDown" size={18} className="select__icon" />
          </div>
          {renderError('role')}
        </div>
      )}

      <div className="field">
        <label htmlFor={fieldId('fullName')}>Your name</label>
        <div className="input-icon">
          <Icon name="user" size={18} className="input-icon__lead" />
          <input {...fieldProps('fullName')} className="input" autoComplete="name" placeholder="Ada Lovelace" required />
        </div>
        {renderError('fullName')}
      </div>

      <div className="field">
        <label htmlFor={fieldId('email')}>Email</label>
        <div className="input-icon">
          <Icon name="mail" size={18} className="input-icon__lead" />
          <input
            {...fieldProps('email')}
            type="email"
            className="input"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>
        {renderError('email')}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={fieldId('phoneNumber')}>Phone number</label>
          <div className="input-icon">
            <Icon name="smartphone" size={18} className="input-icon__lead" />
            <input
              {...fieldProps('phoneNumber')}
              type="tel"
              className="input"
              autoComplete="tel"
              placeholder="+1 555 010 2030"
              required
            />
          </div>
          {renderError('phoneNumber')}
        </div>
        <div className="field">
          <label htmlFor={fieldId('education')}>Education</label>
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

      <div className="field">
        <label htmlFor={fieldId('password')}>Password</label>
        <div className="input-icon">
          <Icon name="lock" size={18} className="input-icon__lead" />
          <input
            {...fieldProps('password')}
            type={showPassword ? 'text' : 'password'}
            className="input input--trail"
            autoComplete="new-password"
            placeholder="Make it strong"
            aria-describedby={[errors.password && `${fieldId('password')}-error`, `${fieldId('password')}-rules`]
              .filter(Boolean)
              .join(' ')}
            required
          />
          {renderPasswordToggle()}
        </div>
        {renderError('password')}
        <ul className="password-rules" id={`${fieldId('password')}-rules`} aria-label="Password rules">
          {passwordRules.map((rule) => {
            const met = rule.test(form.password);
            return (
              <li key={rule.id} className={met ? 'is-met' : undefined}>
                <Icon name={met ? 'check' : 'x'} size={14} />
                {rule.label}
                <span className="sr-only">{met ? ', done' : ', not yet'}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="field">
        <label htmlFor={fieldId('confirmPassword')}>Confirm password</label>
        <div className="input-icon">
          <Icon name="lock" size={18} className="input-icon__lead" />
          <input
            {...fieldProps('confirmPassword')}
            type={showPassword ? 'text' : 'password'}
            className="input input--trail"
            autoComplete="new-password"
            placeholder="Type it one more time"
            required
          />
          {renderPasswordToggle()}
        </div>
        {renderError('confirmPassword')}
      </div>

      <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={status === 'submitting'}>
        {status === 'submitting' ? submittingLabel : submitLabel}
        {status !== 'submitting' && <Icon name="arrowRight" size={18} />}
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

export default SignupForm;
