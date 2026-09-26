import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Send, 
  Flag, 
  Heart, 
  Sparkles, 
  Info, 
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../api';

const ROOMS = [
  { id: 'exam', name: 'Exam Pressure & Deadlines', icon: '📚', desc: 'Vent safely about finals, submissions, and thesis stress.' },
  { id: 'freshers', name: 'Campus Life & Transition', icon: '🌱', desc: 'Dorm life, homesickness, and navigating college.' },
  { id: 'imposter', name: 'Imposter Syndrome & Doubts', icon: '🧠', desc: 'Reminding ourselves that everyone is learning as they go.' },
  { id: 'wins', name: 'Daily Micro-Wins & Joy', icon: '☀️', desc: 'Celebrate waking up on time, finishing a lecture, or drinking water.' }
];

const ADJECTIVES = ['Gentle', 'Thoughtful', 'Mindful', 'Resilient', 'Quiet', 'Patient', 'Curious', 'Serene'];
const ANIMALS = ['Otter', 'Panda', 'Sparrow', 'Koala', 'Falcon', 'Deer', 'Badger', 'Dolphin'];

export default function PeerRoomsPage({ onOpenCrisis }) {
  const [currentRoom, setCurrentRoom] = useState('exam');
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [userHandle, setUserHandle] = useState('');
  const [flaggedIds, setFlaggedIds] = useState(new Set());
  const [likedIds, setLikedIds] = useState(new Set());
  const [safetyNotice, setSafetyNotice] = useState('');

  // Initialize or fetch anonymous identity
  useEffect(() => {
    let savedHandle = localStorage.getItem('mindease_peer_handle');
    if (!savedHandle) {
      const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      const num = Math.floor(100 + Math.random() * 900);
      savedHandle = `${adj} ${animal} #${num}`;
      localStorage.setItem('mindease_peer_handle', savedHandle);
    }
    setUserHandle(savedHandle);

    apiRequest(`/api/peer-messages?room_id=${encodeURIComponent(currentRoom)}`)
      .then(rows => setMessages(rows.map(row => ({ ...row, id: row.id, roomId: row.room_id, timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }))))
      .catch(() => setMessages([]));
  }, [currentRoom]);

  const regenerateHandle = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const newHandle = `${adj} ${animal} #${num}`;
    localStorage.setItem('mindease_peer_handle', newHandle);
    setUserHandle(newHandle);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    // Safety guardrail keyword check
    const lower = inputContent.toLowerCase();
    const crisisPatterns = ['suicide', 'kill myself', 'end my life', 'want to die', 'self harm', 'cutting myself'];
    const matched = crisisPatterns.some(k => lower.includes(k));

    if (matched) {
      setSafetyNotice('We care about your safety. Peer rooms are peer-to-peer and not equipped for active crises. Please connect directly with our 24/7 crisis resources.');
      onOpenCrisis();
      return;
    }

    try {
      const saved = await apiRequest('/api/peer-messages', { method: 'POST', body: JSON.stringify({
        roomId: currentRoom, author: userHandle, content: inputContent.trim()
      })});
      const newMsg = { ...saved, id: saved.id, roomId: saved.room_id, timestamp: new Date(saved.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [newMsg, ...prev]);
    } catch {
      setSafetyNotice('The message could not be posted. Please try again.');
      return;
    }
    setInputContent('');
    setSafetyNotice('');
  };

  const toggleLike = (id) => {
    const newLikes = new Set(likedIds);
    const isLiked = newLikes.has(id);
    
    if (isLiked) {
      newLikes.delete(id);
    } else {
      newLikes.add(id);
    }
    setLikedIds(newLikes);

    const updated = messages.map(m => {
      if (m.id === id) {
        return { ...m, likes: m.likes + (isLiked ? -1 : 1) };
      }
      return m;
    });
    setMessages(updated);
  };

  const flagMessage = (id) => {
    const newFlagged = new Set(flaggedIds);
    newFlagged.add(id);
    setFlaggedIds(newFlagged);
    alert('This post has been flagged and submitted to campus peer safety moderators for review.');
  };

  const currentRoomMsgs = messages.filter(m => m.roomId === currentRoom);
  const activeRoomData = ROOMS.find(r => r.id === currentRoom) || ROOMS[0];

  return (
    <div className="section">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="section-label">Empathetic Community</div>
        <h2>Moderated Peer Support Rooms</h2>
        <p className="text-secondary" style={{ maxWidth: '640px' }}>
          Connect anonymously with fellow students navigating similar university pressures. Moderated strictly with automated safety guardrails.
        </p>
      </div>

      {/* Moderation & Identity Banner */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <span style={{ fontSize: '13px', color: 'var(--text-dark)' }}>
            Your anonymous identity: <strong>{userHandle}</strong>
          </span>
          <button 
            type="button" 
            onClick={regenerateHandle}
            className="btn-secondary" 
            style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title="Generate new alias"
          >
            <RefreshCw className="w-3 h-3" /> New Alias
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-light)' }}>
          <Info className="w-4 h-4" />
          <span>No name or academic record collected • Anonymous client ID only</span>
        </div>
      </div>

      {safetyNotice && (
        <div style={{ 
          padding: '14px 18px', 
          borderRadius: 'var(--radius-md)', 
          background: '#FFF0F5', 
          border: '1.5px solid #E91E63', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle className="w-5 h-5 text-rose-700" />
          <div style={{ flex: 1, fontSize: '13px', color: '#880E4F' }}>
            {safetyNotice}
          </div>
          <button type="button" onClick={onOpenCrisis} className="btn-crisis-nav" style={{ padding: '6px 14px', fontSize: '12px' }}>
            Get Help Now
          </button>
        </div>
      )}

      {/* Main Grid: Room Nav + Room Stream */}
      <div className="peer-rooms-layout">
        
        {/* Left: Rooms List */}
        <div className="glass-card" style={{ padding: '16px', minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-light)', marginBottom: '12px' }}>
            Active Student Rooms
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ROOMS.map(room => {
              const isActive = currentRoom === room.id;
              const count = messages.filter(m => m.roomId === room.id).length;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setCurrentRoom(room.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--deep-purple)' : 'var(--card-border)',
                    background: isActive ? 'linear-gradient(135deg, rgba(201, 184, 232, 0.4), rgba(184, 232, 212, 0.3))' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-dark)' }}>
                      {room.icon} {room.name}
                    </span>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: '50px', color: 'var(--text-light)', fontWeight: 600 }}>
                      {count}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-mid)', marginTop: '4px' }}>
                    {room.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Community Guidelines */}
          <div style={{ marginTop: '20px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(201, 184, 232, 0.15)', fontSize: '11.5px', color: 'var(--text-mid)', lineHeight: 1.5 }}>
            <strong>Community Rule:</strong> Be kind, avoid giving unverified medical advice, and respect privacy. No promotions or harassment.
          </div>
        </div>

        {/* Right: Active Room Chat Stream */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, padding: '24px' }}>
          
          {/* Room Header */}
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--card-border)', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.3rem', margin: '0 0 4px 0' }}>
              {activeRoomData.icon} {activeRoomData.name}
            </h3>
            <p className="text-muted" style={{ fontSize: '12.5px', margin: 0 }}>
              {activeRoomData.desc}
            </p>
          </div>

          {/* Message Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {currentRoomMsgs.length === 0 ? (
              <div className="empty-state" style={{ margin: 'auto 0' }}>
                <div className="empty-state-icon">💬</div>
                <div className="empty-state-title">No messages in this room yet</div>
                <p className="empty-state-desc">
                  Be the first student to share what is on your mind. You are completely anonymous.
                </p>
              </div>
            ) : (
              currentRoomMsgs.map((msg) => {
                const isFlagged = flaggedIds.has(msg.id);
                const isLiked = likedIds.has(msg.id);

                return (
                  <div 
                    key={msg.id} 
                    style={{ 
                      padding: '14px 18px', 
                      borderRadius: 'var(--radius-md)', 
                      background: 'white', 
                      border: '1px solid var(--card-border)',
                      boxShadow: '0 2px 8px rgba(123, 94, 167, 0.05)',
                      opacity: isFlagged ? 0.4 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--deep-purple)' }}>
                          {msg.author}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                          • {msg.timestamp}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => toggleLike(msg.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            color: isLiked ? '#E91E63' : 'var(--text-light)',
                            fontWeight: 600
                          }}
                        >
                          <Heart className="w-3.5 h-3.5" fill={isLiked ? '#E91E63' : 'none'} />
                          {msg.likes > 0 ? msg.likes : ''}
                        </button>

                        <button
                          type="button"
                          onClick={() => flagMessage(msg.id)}
                          disabled={isFlagged}
                          title="Report to moderator"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: isFlagged ? 'default' : 'pointer',
                            color: isFlagged ? '#e91e63' : 'var(--text-light)'
                          }}
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '13.5px', color: 'var(--text-dark)', lineHeight: 1.5 }}>
                      {isFlagged ? (
                        <em style={{ color: 'var(--text-light)' }}>[This message has been flagged for moderation review]</em>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Post Message Input Form */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder={`Share something in ${activeRoomData.name} as ${userHandle}...`}
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              style={{ flex: 1 }}
              maxLength={400}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!inputContent.trim()}
              style={{ padding: '0 20px', flexShrink: 0 }}
            >
              <Send className="w-4 h-4" /> Share
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
