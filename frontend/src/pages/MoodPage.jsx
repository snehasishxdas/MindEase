import React, { useState, useEffect } from 'react';
import { Sparkles, Smile, Check } from 'lucide-react';

const MOODS = [
  { score: 5, label: 'Thriving', emoji: '🌟' },
  { score: 4, label: 'Good', emoji: '😊' },
  { score: 3, label: 'Okay', emoji: '😐' },
  { score: 2, label: 'Low', emoji: '🌧️' },
  { score: 1, label: 'Overwhelmed', emoji: '⚡' },
];

const TAGS = ['Sleep', 'Exams', 'Deadlines', 'Friends', 'Family', 'Health', 'Hostel'];

export default function MoodPage() {
  const [selectedScore, setSelectedScore] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [note, setNote] = useState('');
  const [moods, setMoods] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mindease_moods')) || [];
    } catch {
      return [];
    }
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem('mindease_moods', JSON.stringify(moods));
  }, [moods]);

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSave = () => {
    if (!selectedScore) {
      alert('Please select your mood rating above first.');
      return;
    }

    const newEntry = {
      id: Date.now(),
      score: selectedScore,
      label: selectedLabel,
      tags: selectedTags,
      note: note.trim(),
      timestamp: new Date().toISOString()
    };

    setMoods(prev => [newEntry, ...prev]);

    // Reset
    setSelectedScore(null);
    setSelectedLabel('');
    setSelectedTags([]);
    setNote('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const recent = [...moods].reverse().slice(-7);
  const W = 400;
  const H = 120;
  const points = recent.map((m, idx) => {
    const x = recent.length === 1 ? W / 2 : (idx / (recent.length - 1)) * (W - 40) + 20;
    const y = H - 15 - ((m.score - 1) / 4) * (H - 40);
    const dateStr = new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
    return { x, y, score: m.score, label: m.label, date: dateStr };
  });

  const pathData = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaData = points.length > 1
    ? `${pathData} L ${points[points.length - 1].x} ${H - 5} L ${points[0].x} ${H - 5} Z`
    : '';

  return (
    <section className="section" style={{ minHeight: 'auto' }}>
      <div className="section-label">Feature 1: Daily Mood Check-In</div>
      <h2 className="section-title">How are you feeling today? 🌸</h2>
      <p className="section-subtitle">
        Check in with yourself in 10 seconds. Your records are saved strictly on your device to help you understand your emotional patterns over time.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* 1-Tap Form */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>1-Tap Mood Scale</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-mid)', marginBottom: 14 }}>Select the state that best represents you right now:</p>

          <div className="mood-grid">
            {MOODS.map(m => (
              <button
                key={m.score}
                type="button"
                onClick={() => { setSelectedScore(m.score); setSelectedLabel(m.label); }}
                className={`mood-choice-btn ${selectedScore === m.score ? 'active' : ''}`}
              >
                <span className="mood-emoji">{m.emoji}</span>
                <span className="mood-label">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Tags */}
          <div style={{ marginTop: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
              What factors are influencing this? (optional)
            </label>
            <div className="tags-wrap">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginTop: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-mid)', display: 'block', marginBottom: 6 }}>
              Optional Note (140 characters)
            </label>
            <input 
              type="text" 
              maxLength={140}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Nervous about morning physics lab viva..." 
              className="styled-input" 
            />
          </div>

          <button onClick={handleSave} className="btn-primary" style={{ marginTop: 20, width: '100%' }}>
            <Sparkles style={{ width: 16, height: 16 }} />
            <span>Save Today's Check-in</span>
          </button>
          {savedSuccess && (
            <div style={{ color: '#2e7d5a', fontSize: 12, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
              ✓ Check-in recorded privately!
            </div>
          )}
        </div>

        {/* Personal Trend Timeline (Zero Mock Data) */}
        <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Personal Trend Curve</h3>
                <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>Generated strictly from your saved logs</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-lavender">{moods.length} Check-ins</span>
              </div>
            </div>

            {/* Chart / Empty State Container */}
            {moods.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">😊</div>
                <div className="empty-state-title">No Check-ins Logged Yet</div>
                <div className="empty-state-desc">Select your mood on the left to start mapping your personal emotional curve!</div>
              </div>
            ) : (
              <div>
                <div style={{ height: 140, width: '100%', position: 'relative' }}>
                  <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="moodPastelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C9B8E8" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#C9B8E8" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="20" x2={W} y2="20" stroke="rgba(201,184,232,0.3)" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2={W} y2="60" stroke="rgba(201,184,232,0.3)" strokeDasharray="3 3" />
                    <line x1="0" y1="100" x2={W} y2="100" stroke="rgba(201,184,232,0.3)" strokeDasharray="3 3" />
                    {areaData && <path d={areaData} fill="url(#moodPastelGrad)" />}
                    {pathData && <path d={pathData} fill="none" stroke="#7B5EA7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r={4} fill="#7B5EA7" stroke="white" strokeWidth="2" />
                        <text x={p.x} y={H} textAnchor="middle" fontSize={8} fill="#9B8AAD" fontFamily="DM Sans, sans-serif">{p.date}</text>
                      </g>
                    ))}
                  </svg>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-light)', borderTop: '1px solid var(--card-border)', paddingTop: 6, marginTop: 6 }}>
                  <span>1: Overwhelmed</span>
                  <span>3: Okay</span>
                  <span>5: Thriving</span>
                </div>
              </div>
            )}
          </div>

          {/* Recent Logs List */}
          {moods.length > 0 && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--card-border)', paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: 8 }}>Recent Check-ins</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {moods.slice(0, 3).map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                    <div>
                      <strong>{m.label}</strong> {m.note && <span style={{ color: 'var(--text-mid)', fontSize: 11 }}>— {m.note}</span>}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-light)' }}>{new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
