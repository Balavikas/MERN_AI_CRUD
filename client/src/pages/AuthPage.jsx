import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import SignupForm from '../components/SignupForm.jsx';
import TaughtCourses from '../components/TaughtCourses.jsx';
import { createAccount, logIn } from '../api.js';
import { roles } from '../data.js';

const modes = {
  login: {
    title: 'Jump back in',
    subtitle: 'Log in and pick up right where you left off.',
    submit: "Let's go",
  },
  signup: {
    title: 'Join the movement',
    subtitle: 'Create your account in a minute. No credit card, no strings.',
    submit: 'Create my account',
  },
};

// Sign up creates an account with the chosen role in Postgres; log in checks the email, password and role against it.
function AuthPage({ theme, onToggleTheme, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ role: roles[0].id, email: '', password: '', remember: true });
  const [showPassword, setShowPassword] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const copy = modes[mode];
  const isSignup = mode === 'signup';
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name] || errors.form) {
      setErrors((current) => ({ ...current, [name]: undefined, form: undefined, noAccount: false }));
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setNote('');
    setErrors({});
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNote('');

    const fieldErrors = {};
    if (!form.email.trim()) {
      fieldErrors.email = 'Enter the email you signed up with.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      fieldErrors.email = "That email doesn't look right.";
    }
    if (!form.password) {
      fieldErrors.password = 'Enter your password.';
    }
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      document.getElementById(fieldErrors.email ? 'login-email' : 'login-password')?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const account = await logIn({ email: form.email, password: form.password, role: form.role });
      onAuthenticated({ ...account, remember: form.remember });
    } catch (error) {
      const serverErrors = error.fieldErrors || {};
      // The server only flags the email field when no account uses it.
      setErrors(Object.keys(serverErrors).length > 0
        ? { ...serverErrors, noAccount: Boolean(serverErrors.email) }
        : { form: error.message });
      const fieldToFocus = ['email', 'role'].find((name) => serverErrors[name]) || 'password';
      document.getElementById(`login-${fieldToFocus}`)?.focus();
      setSubmitting(false);
    }
  }

  function errorProps(name) {
    return errors[name]
      ? { 'aria-invalid': true, 'aria-describedby': `login-${name}-error` }
      : {};
  }

  // Log the new account straight in with the role it signed up as.
  async function signUpAndLogIn(account) {
    await createAccount(account);
    return logIn({ email: account.email, password: account.password, role: account.role });
  }

  function comingSoon(provider) {
    setNote(`${provider} sign-in is coming soon. Use your email for now.`);
  }

  return (
    <div className="auth">
      <header className="auth__bar">
        <div className="container auth__bar-inner">
          <Logo />
          <button type="button" className="icon-btn" onClick={onToggleTheme} aria-label={`Switch to ${nextTheme} mode`}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>

      <main id="main" className="container auth__main">
        <div className="row g-4 align-items-center">
          <div className="col-12 col-lg-5">
            <section className="auth-card" aria-labelledby="auth-title">
              <div className="segmented segmented--full" role="group" aria-label="Choose how to continue">
                <button type="button" aria-pressed={mode === 'login'} onClick={() => switchMode('login')}>
                  Log in
                </button>
                <button type="button" aria-pressed={isSignup} onClick={() => switchMode('signup')}>
                  Sign up
                </button>
              </div>

              <div>
                <h2 className="auth-card__title" id="auth-title">{copy.title}</h2>
                <p className="auth-card__subtitle">{copy.subtitle}</p>
              </div>

              {isSignup ? (
                <SignupForm
                  idPrefix="signup"
                  showRole
                  submitLabel={copy.submit}
                  submit={signUpAndLogIn}
                  onCreated={onAuthenticated}
                />
              ) : (
                <form className="form" onSubmit={handleSubmit} noValidate>
                  <div className="field">
                    <label htmlFor="login-role">Log in as</label>
                    <div className="select">
                      <select
                        id="login-role"
                        name="role"
                        className="input"
                        value={form.role}
                        onChange={updateField}
                        {...errorProps('role')}
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>{role.label}</option>
                        ))}
                      </select>
                      <Icon name="chevronDown" size={18} className="select__icon" />
                    </div>
                    {errors.role && <p className="field__error" id="login-role-error">{errors.role}</p>}
                  </div>

                  <div className="field">
                    <label htmlFor="login-email">Email</label>
                    <div className="input-icon">
                      <Icon name="mail" size={18} className="input-icon__lead" />
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        className="input"
                        value={form.email}
                        onChange={updateField}
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                        {...errorProps('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="field__error" id="login-email-error">
                        {errors.email}{' '}
                        {errors.noAccount && (
                          <button type="button" className="text-link text-link--sm text-link--inline" onClick={() => switchMode('signup')}>
                            Sign up instead
                          </button>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="field">
                    <div className="field__label-row">
                      <label htmlFor="login-password">Password</label>
                      <button
                        type="button"
                        className="text-link text-link--sm"
                        onClick={() => setNote('Password resets are coming soon. Hang tight.')}
                      >
                        Forgot it?
                      </button>
                    </div>
                    <div className="input-icon">
                      <Icon name="lock" size={18} className="input-icon__lead" />
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className="input input--trail"
                        value={form.password}
                        onChange={updateField}
                        autoComplete="current-password"
                        placeholder="Your password"
                        required
                        {...errorProps('password')}
                      />
                      <button
                        type="button"
                        className="input-icon__trail"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((shown) => !shown)}
                      >
                        <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                      </button>
                    </div>
                    {errors.password && (
                      <p className="field__error" id="login-password-error">{errors.password}</p>
                    )}
                  </div>

                  <label className="checkbox">
                    <input type="checkbox" name="remember" checked={form.remember} onChange={updateField} />
                    Keep me logged in
                  </label>

                  <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
                    {submitting ? 'Checking…' : copy.submit}
                    {!submitting && <Icon name="arrowRight" size={18} />}
                  </button>

                  <p className="sr-only" role="alert">
                    {[errors.role, errors.email, errors.password, errors.form].filter(Boolean).join(' ')}
                  </p>
                  {errors.form && <p className="form-status form-status--error">{errors.form}</p>}
                </form>
              )}

              <p className="sr-only" role="status">{note}</p>
              {note && <p className="auth-card__note" aria-hidden="true">{note}</p>}

              <div className="divider"><span>or keep it quick</span></div>

              <div className="social-auth">
                <button type="button" className="btn btn--outline btn--lg" onClick={() => comingSoon('Google')}>
                  <span className="google-mark" aria-hidden="true">G</span>
                  Google
                </button>
                <button type="button" className="btn btn--outline btn--lg" onClick={() => comingSoon('GitHub')}>
                  <Icon name="github" size={18} />
                  GitHub
                </button>
              </div>

              <p className="auth-card__switch">
                {isSignup ? 'Already have an account? ' : 'New to SkillStack? '}
                <button type="button" className="text-link" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
                  {isSignup ? 'Log in instead' : 'Create an account'}
                </button>
              </p>
            </section>
          </div>

          <div className="col-12 col-lg-7">
            <section className="auth__showcase" aria-labelledby="auth-pitch">
              <span className="badge-pill">
                <Icon name="sparkles" size={16} />
                Skills that pay off
              </span>
              <h1 className="auth__pitch" id="auth-pitch">
                Learn essential <span className="accent">career and life skills</span>
              </h1>
              <p className="hero__lead">
                SkillStack helps you build in-demand skills fast and advance your career in a changing job market.
              </p>

              <TaughtCourses />
            </section>
          </div>
        </div>
      </main>

      <footer className="container auth__footer">
        <p>© {new Date().getFullYear()} SkillStack.</p>
        <ul className="legal-links">
          <li><a href="#">Terms</a></li>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Cookies</a></li>
        </ul>
      </footer>
    </div>
  );
}

export default AuthPage;
