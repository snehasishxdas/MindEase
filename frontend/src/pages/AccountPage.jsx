import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function AccountPage({ user, onUserUpdated, onDeleted }) {
  const [profile, setProfile] = useState({
    full_name: user.full_name || '',
    mobile: user.mobile || '',
    date_of_birth: user.date_of_birth?.slice(0, 10) || '',
  });
  const [activities, setActivities] = useState([]);
  const [mode, setMode] = useState('idle');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest('/api/activity').then(setActivities).catch(() => setActivities([]));
  }, []);

  const updateProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await apiRequest('/api/auth/profile/request', { method: 'POST', body: JSON.stringify(profile) });
      setMode('profile-otp');
      setMessage(`A verification code was sent to ${user.email}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiRequest('/api/auth/profile/verify', { method: 'POST', body: JSON.stringify({ otp }) });
      await onUserUpdated();
      setMode('idle');
      setOtp('');
      setMessage('Your account details were updated.');
      setActivities(await apiRequest('/api/activity'));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const requestDeletion = async () => {
    if (!window.confirm('Permanently delete your account and its associated data? This cannot be undone.')) return;
    setError('');
    try {
      await apiRequest('/api/auth/delete/request', { method: 'POST' });
      setMode('delete-otp');
      setMessage(`A deletion verification code was sent to ${user.email}.`);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const verifyDeletion = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiRequest('/api/auth/delete/verify', { method: 'POST', body: JSON.stringify({ otp }) });
      onDeleted();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="account-page">
      <div className="account-heading">
        <div><span className="auth-eyebrow">Your space</span><h1>Account & activity</h1></div>
        <p>Your email address is verified and cannot be changed here.</p>
      </div>

      <div className="account-columns">
        <div className="account-section">
          <h2>Personal details</h2>
          <p className="account-email">{user.email}</p>
          {mode === 'profile-otp' ? (
            <form className="account-form" onSubmit={verifyProfile}>
              <label>Email verification code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} /></label>
              <button className="btn-primary" disabled={busy}>{busy ? 'Verifying…' : 'Verify and save details'}</button>
            </form>
          ) : mode !== 'delete-otp' ? (
            <form className="account-form" onSubmit={updateProfile}>
              <label>Full name<input required maxLength={100} value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} /></label>
              <label>Mobile number<input required type="tel" value={profile.mobile} onChange={(event) => setProfile({ ...profile, mobile: event.target.value })} /></label>
              <label>Date of birth<input required type="date" value={profile.date_of_birth} onChange={(event) => setProfile({ ...profile, date_of_birth: event.target.value })} /></label>
              <button className="btn-primary" disabled={busy}>{busy ? 'Sending code…' : 'Verify by email and save'}</button>
            </form>
          ) : null}
          {mode === 'delete-otp' && (
            <form className="account-form account-delete-form" onSubmit={verifyDeletion}>
              <label>Deletion verification code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} /></label>
              <button className="btn-danger" disabled={busy}>{busy ? 'Deleting…' : 'Permanently delete account'}</button>
              <button className="auth-text-button" type="button" onClick={() => { setMode('idle'); setOtp(''); setMessage(''); }}>Cancel deletion</button>
            </form>
          )}
          {message && <p className="auth-message" role="status">{message}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          <div className="account-danger-zone">
            <div><strong>Delete account</strong><p>Deletes your profile and linked MindEase records. This cannot be reversed.</p></div>
            <button className="btn-danger-outline" type="button" onClick={requestDeletion}>Request deletion</button>
          </div>
        </div>

        <div className="account-section account-activity">
          <h2>Recent activity</h2>
          <p>Only action names and timestamps are recorded. Private content is not included.</p>
          {activities.length ? <ol>{activities.map((activity, index) => (
            <li key={`${activity.created_at}-${index}`}>
              <span>{activity.summary}</span>
              <time dateTime={activity.created_at}>{new Date(activity.created_at).toLocaleString()}</time>
            </li>
          ))}</ol> : <p className="account-empty">No activity recorded yet.</p>}
        </div>
      </div>
    </section>
  );
}