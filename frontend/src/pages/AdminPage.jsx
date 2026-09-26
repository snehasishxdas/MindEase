import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

const emptyProfile = { full_name: '', mobile: '', date_of_birth: '' };

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadUsers = async () => setUsers(await apiRequest('/api/admin/users'));
  useEffect(() => { loadUsers().catch((requestError) => setError(requestError.message)); }, []);

  const startEdit = (user) => {
    setSelected(user);
    setProfile({ full_name: user.full_name, mobile: user.mobile, date_of_birth: user.date_of_birth.slice(0, 10) });
    setError('');
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/api/admin/users/${encodeURIComponent(selected.id)}`, {
        method: 'PUT', body: JSON.stringify(profile),
      });
      setSelected(null);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Permanently delete ${user.full_name}'s account and associated data?`)) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/api/admin/users/${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const visibleUsers = users.filter((user) => `${user.full_name} ${user.email}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <section className="admin-page">
      <div className="account-heading">
        <div><span className="auth-eyebrow">MindEase administration</span><h1>Registered accounts</h1></div>
        <p>{users.length} {users.length === 1 ? 'account' : 'accounts'}</p>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}

      {selected && (
        <form className="admin-edit-form" onSubmit={saveUser}>
          <div><span className="auth-eyebrow">Edit account</span><h2>{selected.email}</h2></div>
          <label>Full name<input required maxLength={100} value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} /></label>
          <label>Mobile number<input required type="tel" value={profile.mobile} onChange={(event) => setProfile({ ...profile, mobile: event.target.value })} /></label>
          <label>Date of birth<input required type="date" value={profile.date_of_birth} onChange={(event) => setProfile({ ...profile, date_of_birth: event.target.value })} /></label>
          <p>Email is immutable. The user will be notified of this update.</p>
          <div className="admin-edit-actions">
            <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save and notify user'}</button>
            <button className="auth-text-button" type="button" onClick={() => setSelected(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="admin-table-toolbar">
        <label className="admin-search">Search accounts<input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Name or email" /></label>
        <button className="auth-text-button" type="button" onClick={() => loadUsers().catch((requestError) => setError(requestError.message))}>Refresh</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Mobile</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.full_name}</td><td>{user.email}</td><td>{user.mobile}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="admin-row-actions">
                  <button type="button" onClick={() => startEdit(user)}>Edit</button>
                  <button type="button" className="admin-delete-action" disabled={busy} onClick={() => deleteUser(user)}>Delete</button>
                </td>
              </tr>
            ))}
            {!visibleUsers.length && <tr><td colSpan="5">No matching accounts.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}