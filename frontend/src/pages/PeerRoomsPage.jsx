import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Send,
  Flag,
  Heart,
  Info,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
  LogIn,
  LogOut,
} from 'lucide-react';
import { apiRequest } from '../api';

const ADJECTIVES = ['Gentle', 'Thoughtful', 'Mindful', 'Resilient', 'Quiet', 'Patient', 'Curious', 'Serene'];
const ANIMALS    = ['Otter', 'Panda', 'Sparrow', 'Koala', 'Falcon', 'Deer', 'Badger', 'Dolphin'];

const ALLOWED_ICONS = ['💬','📚','🌱','🧠','☀️','🎵','🏃','🎨','💡','🤝','🌙','❤️','🔥','🌈','🎓','🧘','💪','🌸'];

function makeHandle() {
  const adj    = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num    = Math.floor(100 + Math.random() * 900);
  return `${adj} ${animal} #${num}`;
}

export default function PeerRoomsPage({ onOpenCrisis }) {
  const [rooms, setRooms]               = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [userHandle, setUserHandle]     = useState('');
  const [flaggedIds, setFlaggedIds]     = useState(new Set());
  const [likedIds, setLikedIds]         = useState(new Set());
  const [safetyNotice, setSafetyNotice] = useState('');

  // Create-room modal state
  const [showCreate, setShowCreate]   = useState(false);
  const [newName, setNewName]         = useState('');
  const [newDesc, setNewDesc]         = useState('');
  const [newIcon, setNewIcon]         = useState('💬');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating]       = useState(false);

  // ── Identity ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let h = localStorage.getItem('mindease_peer_handle');
    if (!h) { h = makeHandle(); localStorage.setItem('mindease_peer_handle', h); }
    setUserHandle(h);
  }, []);

  const regenerateHandle = () => {
    const h = makeHandle();
    localStorage.setItem('mindease_peer_handle', h);
    setUserHandle(h);
  };

  // ── Load rooms list ────────────────────────────────────────────────────────
  const loadRooms = useCallback(() => {
    setRoomsLoading(true);
    apiRequest('/api/peer-rooms')
      .then(data => {
        setRooms(data);
        if (data.length > 0 && !currentRoomId) setCurrentRoomId(data[0].id);
      })
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadRooms(); }, [loadRooms]);

  // ── Load messages when room changes ────────────────────────────────────────
  useEffect(() => {
    if (!currentRoomId) return;
    apiRequest(`/api/peer-messages?room_id=${encodeURIComponent(currentRoomId)}`)
      .then(rows => setMessages(rows.map(r => ({
        ...r,
        roomId: r.room_id,
        timestamp: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))))
      .catch(() => setMessages([]));
  }, [currentRoomId]);

  // ── Join / Leave ───────────────────────────────────────────────────────────
  const handleJoin = async (roomId) => {
    try {
      const res = await apiRequest(`/api/peer-rooms/${encodeURIComponent(roomId)}/join`, { method: 'POST' });
      setRooms(prev => prev.map(r => r.id === roomId
        ? { ...r, joined: true, member_count: res.member_count }
        : r));
    } catch { /* ignore */ }
  };

  const handleLeave = async (roomId) => {
    try {
      const res = await apiRequest(`/api/peer-rooms/${encodeURIComponent(roomId)}/leave`, { method: 'POST' });
      setRooms(prev => prev.map(r => r.id === roomId
        ? { ...r, joined: false, member_count: res.member_count }
        : r));
    } catch { /* ignore */ }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const lower = inputContent.toLowerCase();
    const crisisPatterns = ['suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 'cutting myself'];
    if (crisisPatterns.some(k => lower.includes(k))) {
      setSafetyNotice('We care about your safety. Peer rooms are not equipped for active crises. Please connect with our 24/7 crisis resources.');
      onOpenCrisis();
      return;
    }

    try {
      const saved = await apiRequest('/api/peer-messages', {
        method: 'POST',
        body: JSON.stringify({ roomId: currentRoomId, author: userHandle, content: inputContent.trim() }),
      });
      const newMsg = {
        ...saved,
        roomId: saved.room_id,
        timestamp: new Date(saved.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [newMsg, ...prev]);
    } catch {
      setSafetyNotice('The message could not be posted. Please try again.');
      return;
    }
    setInputContent('');
    setSafetyNotice('');
  };

  // ── Like / Flag ────────────────────────────────────────────────────────────
  const toggleLike = (id) => {
    const next = new Set(likedIds);
    const was  = next.has(id);
    was ? next.delete(id) : next.add(id);
    setLikedIds(next);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, likes: (m.likes || 0) + (was ? -1 : 1) } : m));
  };

  const flagMessage = (id) => {
    setFlaggedIds(prev => new Set(prev).add(id));
    alert('This post has been flagged and submitted to campus peer safety moderators for review.');
  };

  // ── Create room ────────────────────────────────────────────────────────────
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newName.trim()) { setCreateError('Room name is required.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const room = await apiRequest('/api/peer-rooms', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim(), icon: newIcon }),
      });
      setRooms(prev => [...prev, room]);
      setCurrentRoomId(room.id);
      setShowCreate(false);
      setNewName(''); setNewDesc(''); setNewIcon('💬');
    } catch (err) {
      setCreateError(err.message || 'Could not create room. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const activeRoom     = rooms.find(r => r.id === currentRoomId);
  const currentMsgs    = messages.filter(m => m.roomId === currentRoomId);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="section">

      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="section-label">Empathetic Community</div>
        <h2>Moderated Peer Support Rooms</h2>
        <p className="text-secondary" style={{ maxWidth: '640px' }}>
          Connect anonymously with fellow students. Join existing rooms or create your own public room for any topic.
        </p>
      </div>

      {/* Identity banner */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={18} style={{ color: '#15803d', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--text-dark)' }}>
            Your anonymous identity: <strong>{userHandle}</strong>
          </span>
          <button type="button" onClick={regenerateHandle} className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={11} /> New Alias
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-light)' }}>
          <Info size={14} />
          <span>No name or academic record collected • Anonymous client ID only</span>
        </div>
      </div>

      {/* Safety notice */}
      {safetyNotice && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: '#FFF0F5', border: '1.5px solid #E91E63', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} style={{ color: '#be185d', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '13px', color: '#880E4F' }}>{safetyNotice}</div>
          <button type="button" onClick={onOpenCrisis} className="btn-crisis-nav" style={{ padding: '5px 12px', fontSize: '12px' }}>
            Get Help Now
          </button>
        </div>
      )}

      {/* Main layout */}
      <div className="peer-rooms-layout">

        {/* ── Left: Room list + create ───────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '16px', minWidth: 0 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-light)' }}>
              Active Rooms
            </span>
            <button
              type="button"
              onClick={() => { setShowCreate(true); setCreateError(''); }}
              className="btn-primary"
              style={{ padding: '5px 11px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Create a new public room"
            >
              <Plus size={12} /> New Room
            </button>
          </div>

          {roomsLoading ? (
            <div style={{ fontSize: '12px', color: 'var(--text-light)', padding: '12px 0', textAlign: 'center' }}>Loading rooms…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rooms.map(room => {
                const isActive = room.id === currentRoomId;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setCurrentRoomId(room.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '11px 13px', borderRadius: 'var(--radius-md)',
                      border: '1px solid', textAlign: 'left', cursor: 'pointer',
                      transition: 'var(--transition)',
                      borderColor: isActive ? 'var(--deep-purple)' : 'var(--card-border)',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(201,184,232,0.4), rgba(184,232,212,0.3))'
                        : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {/* Room name row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-dark)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {room.icon} {room.name}
                      </span>
                      {/* Member count badge */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '11px', background: 'rgba(255,255,255,0.85)', padding: '2px 7px', borderRadius: '50px', color: 'var(--text-mid)', fontWeight: 600, flexShrink: 0 }}>
                        <Users size={10} /> {room.member_count ?? 0}
                      </span>
                    </div>
                    {/* Room description */}
                    <div style={{ fontSize: '11.5px', color: 'var(--text-mid)', marginTop: '3px', lineHeight: 1.4 }}>
                      {room.description}
                    </div>
                    {/* Join / Leave pill */}
                    <div style={{ marginTop: '6px' }}>
                      {room.joined ? (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); handleLeave(room.id); }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '10.5px', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.7)', cursor: 'pointer', color: 'var(--text-mid)' }}
                          title="Leave this room"
                        >
                          <LogOut size={10} /> Joined
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); handleJoin(room.id); }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '10.5px', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--deep-purple)', background: 'rgba(123,94,167,0.08)', cursor: 'pointer', color: 'var(--deep-purple)', fontWeight: 600 }}
                          title="Join this room"
                        >
                          <LogIn size={10} /> Join
                        </button>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Community guideline */}
          <div style={{ marginTop: '18px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(201,184,232,0.15)', fontSize: '11.5px', color: 'var(--text-mid)', lineHeight: 1.5 }}>
            <strong>Community Rule:</strong> Be kind, avoid unverified medical advice, and respect privacy. No promotions or harassment.
          </div>
        </div>

        {/* ── Right: Active room chat stream ────────────────────────────── */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, padding: '22px' }}>
          {activeRoom ? (
            <>
              {/* Room header */}
              <div style={{ paddingBottom: '14px', borderBottom: '1px solid var(--card-border)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 3px 0' }}>
                    {activeRoom.icon} {activeRoom.name}
                  </h3>
                  <p className="text-muted" style={{ fontSize: '12.5px', margin: 0 }}>{activeRoom.description}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Live member count */}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '12px', fontWeight: 700, color: 'var(--deep-purple)', background: 'rgba(123,94,167,0.1)', padding: '4px 10px', borderRadius: 20 }}>
                    <Users size={13} /> {activeRoom.member_count ?? 0} member{activeRoom.member_count !== 1 ? 's' : ''}
                  </span>
                  {/* Join / Leave in header too */}
                  {activeRoom.joined ? (
                    <button type="button" onClick={() => handleLeave(activeRoom.id)} className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <LogOut size={13} /> Leave
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleJoin(activeRoom.id)} className="btn-primary" style={{ padding: '5px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <LogIn size={13} /> Join Room
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px', flex: 1, overflowY: 'auto', maxHeight: '340px' }}>
                {currentMsgs.length === 0 ? (
                  <div className="empty-state" style={{ margin: 'auto 0' }}>
                    <div className="empty-state-icon">💬</div>
                    <div className="empty-state-title">No messages yet</div>
                    <p className="empty-state-desc">Be the first to share something in this room. You are completely anonymous.</p>
                  </div>
                ) : (
                  currentMsgs.map(msg => {
                    const isFlagged = flaggedIds.has(msg.id);
                    const isLiked   = likedIds.has(msg.id);
                    return (
                      <div key={msg.id} style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--card-border)', boxShadow: '0 2px 6px rgba(123,94,167,0.05)', opacity: isFlagged ? 0.4 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--deep-purple)' }}>{msg.author}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>• {msg.timestamp}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={() => toggleLike(msg.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: '11.5px', color: isLiked ? '#E91E63' : 'var(--text-light)', fontWeight: 600 }}>
                              <Heart size={13} fill={isLiked ? '#E91E63' : 'none'} />
                              {(msg.likes || 0) > 0 ? msg.likes : ''}
                            </button>
                            <button type="button" onClick={() => flagMessage(msg.id)} disabled={isFlagged} title="Report to moderator" style={{ background: 'none', border: 'none', cursor: isFlagged ? 'default' : 'pointer', color: isFlagged ? '#e91e63' : 'var(--text-light)' }}>
                              <Flag size={13} />
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: '13.5px', color: 'var(--text-dark)', lineHeight: 1.5 }}>
                          {isFlagged ? <em style={{ color: 'var(--text-light)' }}>[Flagged for moderation review]</em> : msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send form */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text" className="input-field"
                  placeholder={`Share something as ${userHandle}…`}
                  value={inputContent}
                  onChange={e => setInputContent(e.target.value)}
                  style={{ flex: 1 }}
                  maxLength={400}
                />
                <button type="submit" className="btn-primary" disabled={!inputContent.trim()} style={{ padding: '0 18px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Send size={14} /> Share
                </button>
              </form>
            </>
          ) : (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <div className="empty-state-icon">🏠</div>
              <div className="empty-state-title">Select a room to get started</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Room Modal ─────────────────────────────────────────────── */}
      {showCreate && (
        <div className="modal-overlay-custom" onClick={() => setShowCreate(false)}>
          <div className="modal-content-custom" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '1.1rem' }}>Create a Public Room</h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-mid)' }}>Visible to everyone on MindEase</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Icon picker */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: '7px' }}>Room Icon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {ALLOWED_ICONS.map(ic => (
                    <button
                      key={ic} type="button"
                      onClick={() => setNewIcon(ic)}
                      style={{
                        width: 36, height: 36, borderRadius: 8, border: '1.5px solid',
                        borderColor: newIcon === ic ? 'var(--deep-purple)' : 'var(--card-border)',
                        background: newIcon === ic ? 'rgba(123,94,167,0.12)' : 'rgba(255,255,255,0.7)',
                        fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room name */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>
                  Room Name <span style={{ color: '#E91E63' }}>*</span>
                </label>
                <input
                  type="text" className="input-field"
                  placeholder="e.g. Late-Night Study Struggles"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  maxLength={60}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: 3, textAlign: 'right' }}>{newName.length}/60</div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: '5px' }}>Short Description</label>
                <input
                  type="text" className="input-field"
                  placeholder="What's this room for? (optional)"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  maxLength={160}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: 3, textAlign: 'right' }}>{newDesc.length}/160</div>
              </div>

              {/* Error */}
              {createError && (
                <div style={{ fontSize: '12.5px', color: '#991b1b', background: '#fee2e2', padding: '8px 12px', borderRadius: 6 }}>
                  {createError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary" style={{ padding: '9px 18px', fontSize: '13px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating || !newName.trim()} style={{ padding: '9px 20px', fontSize: '13px' }}>
                  {creating ? 'Creating…' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
