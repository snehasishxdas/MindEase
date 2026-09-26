import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import MindMirrorMark from '../components/MindMirrorMark';

export default function AuthPage({ onAuthenticated, onOpenCrisis }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [stage, setStage] = useState('details');
  const [form, setForm] = useState({ full_name: '', email: '', mobile: '', date_of_birth: '', password: '', otp: '', activity_emails_enabled: true });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'admin') {
        await apiRequest('/api/auth/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        await onAuthenticated();
        navigate('/admin', { replace: true });
      } else if (stage === 'otp') {
        const path = mode === 'register' ? '/api/auth/register/verify' : '/api/auth/login/verify';
        await apiRequest(path, { method: 'POST', body: JSON.stringify({ email: form.email, otp: form.otp }) });
        await onAuthenticated();
        const destination = location.state?.from?.pathname || location.pathname || '/';
        navigate(destination, { replace: true });
      } else {
        const path = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
        const body = mode === 'register'
          ? { full_name: form.full_name, email: form.email, mobile: form.mobile, date_of_birth: form.date_of_birth, activity_emails_enabled: form.activity_emails_enabled }
          : { email: form.email };
        const response = await apiRequest(path, { method: 'POST', body: JSON.stringify(body) });
        setStage('otp');
        setMessage(mode === 'login'
          ? response.message
          : 'We sent a verification code to your email. It expires in 10 minutes.');
      }
    } catch (requestError) {
      setError(requestError.message || 'We could not complete that request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const path = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'register'
        ? { full_name: form.full_name, email: form.email, mobile: form.mobile, date_of_birth: form.date_of_birth, activity_emails_enabled: form.activity_emails_enabled }
        : { email: form.email };
      const response = await apiRequest(path, { method: 'POST', body: JSON.stringify(body) });
      setMessage(response.message || 'A new verification code has been sent.');
    } catch (requestError) {
      setError(requestError.message || 'We could not send another code yet.');
    } finally {
      setBusy(false);
    }
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setStage('details');
    setMessage('');
    setError('');
    setForm({ full_name: '', email: '', mobile: '', date_of_birth: '', password: '', otp: '', activity_emails_enabled: true });
  };

  const title = mode === 'admin' ? 'Administrator sign in' : mode === 'register' ? 'Create your account' : 'Welcome back';

  return (
    <main className="auth-screen">
      <section className="auth-brand-panel" aria-label="MindEase">
        <Link to="/" className="auth-brand-mark">
          <MindMirrorMark />
          <span>MindEase</span>
        </Link>
        <div className="auth-brand-copy">
          <span className="auth-eyebrow">Welcome to</span>
          <h1>MindEase</h1>
          <p>A gentler space for reflection, venting, and practicing difficult conversations.</p>
        </div>
        <button className="auth-crisis-link" type="button" onClick={onOpenCrisis}>Need urgent support?</button>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-heading">
          <span className="auth-eyebrow">MindEase account</span>
          <h2>{stage === 'otp' && mode !== 'admin' ? 'Check your email' : title}</h2>
          <p>{stage === 'otp' && mode !== 'admin'
            ? `Enter the six-digit code sent to ${form.email}.`
            : mode === 'admin'
              ? 'Use your configured administrator credentials.'
              : 'Your account is private and protected by email verification.'}</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && stage === 'details' && (
            <>
              <label>Full name<input required maxLength={100} autoComplete="name" value={form.full_name} onChange={update('full_name')} /></label>
              <label>Mobile number<input required type="tel" autoComplete="tel" value={form.mobile} onChange={update('mobile')} placeholder="+1 555 123 4567" /></label>
              <label>Date of birth<input required type="date" autoComplete="bday" value={form.date_of_birth} onChange={update('date_of_birth')} /></label>
              <label className="auth-consent"><input type="checkbox" checked={form.activity_emails_enabled} onChange={(event) => setForm((current) => ({ ...current, activity_emails_enabled: event.target.checked }))} /><span>Email me account activity summaries. These include action names and times, never private content.</span></label>
            </>
          )}

          {(stage === 'details' || mode === 'admin') && (
            <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={update('email')} /></label>
          )}

          {mode === 'admin' && (
            <label>Password<input required type="password" autoComplete="current-password" value={form.password} onChange={update('password')} /></label>
          )}

          {stage === 'otp' && mode !== 'admin' && (
            <label>Verification code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={form.otp} onChange={update('otp')} /></label>
          )}

          {message && <p className="auth-message" role="status">{message}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="btn-primary auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'admin' ? 'Sign in as administrator' : stage === 'otp' ? 'Verify and continue' : mode === 'register' ? 'Send verification code' : 'Email me a sign-in code'}
          </button>
        </form>

        {stage === 'otp' && mode !== 'admin' && (
          <div className="auth-otp-actions">
            <button className="auth-text-button" type="button" onClick={resendCode} disabled={busy}>Resend code</button>
            <button className="auth-text-button" type="button" onClick={() => { setStage('details'); setForm((current) => ({ ...current, otp: '' })); }}>
              Use a different email
            </button>
          </div>
        )}

        {stage === 'details' && mode !== 'admin' && (
          <p className="auth-switch">
            {mode === 'login' ? 'New to MindEase?' : 'Already have an account?'}{' '}
            <button type="button" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        )}
        <button className="auth-admin-link" type="button" onClick={() => changeMode(mode === 'admin' ? 'login' : 'admin')}>
          {mode === 'admin' ? 'Return to user sign in' : 'Administrator sign in'}
        </button>
        <p className="auth-privacy-note">We never include your journal entries, messages, or mood notes in account emails.</p>
      </section>
    </main>
  );
}