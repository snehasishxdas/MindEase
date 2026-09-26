import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Bookmark, Lock, Trash2, Search } from 'lucide-react';
import { apiRequest } from '../api';

const PROMPTS = [
  "What gave you a tiny spark of peace today?",
  "What expectation can you let go of today?",
  "Write down what is draining your energy right now:",
  "What is one thing you did well this week despite feeling tired?"
];

export default function JournalPage({ onOpenCrisis }) {
  const [entries, setEntries] = useState([]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [privacyActive, setPrivacyActive] = useState(false);
  const [sentimentTone, setSentimentTone] = useState('');
  const [sentimentScore, setSentimentScore] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [safetyDisclosureAccepted, setSafetyDisclosureAccepted] = useState(false);
  const [latestScreening, setLatestScreening] = useState(null);

  useEffect(() => {
    apiRequest('/api/journals')
      .then(rows => setEntries(rows.map(row => ({
        ...row,
        id: row.id,
        title: row.title,
        content: row.content,
        tags: row.tags || [],
        sentimentTone: row.sentiment_label || 'Reflective',
        sentimentScore: row.sentiment_score,
        timestamp: row.created_at,
      })))).catch(() => setEntries([]));
  }, []);

  useEffect(() => {
    const text = content.trim();
    if (!text) {
      setSentimentTone('');
      setSentimentScore(null);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const result = await apiRequest('/api/sentiment', {
          method: 'POST',
          body: JSON.stringify({ text }),
          signal: controller.signal
        });
        setSentimentTone(result.label);
        setSentimentScore(result.score);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSentimentTone('Analysis unavailable');
          setSentimentScore(null);
        }
      } finally {
        setIsAnalyzing(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [content]);

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Please write your thoughts before saving.');
      return;
    }

    try {
      const saved = await apiRequest('/api/journals', { method: 'POST', body: JSON.stringify({
        title: title.trim() || 'Daily Reflection', content: content.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean), sentimentLabel: sentimentTone || 'Reflective',
        sentimentScore, sentimentModel: 'vaderSentiment'
      })});
      setEntries(prev => [{ ...saved, id: saved.id, tags: saved.tags || [], sentimentTone: saved.sentiment_label, timestamp: saved.created_at }, ...prev]);
      setLatestScreening(saved.screening || null);
      if (saved.screening?.self_harm_concern) onOpenCrisis?.();
    } catch {
      alert('The journal entry could not be saved. Please try again.');
      return;
    }

    setTitle('');
    setContent('');
    setTags('');
    setSentimentTone('');
    setSentimentScore(null);
    setSafetyDisclosureAccepted(false);
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/api/journals?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch {
      alert('The journal entry could not be deleted.');
    }
  };

  const filtered = entries.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.tags && e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <section className="section" style={{ minHeight: 'auto' }}>
      <div className="section-label">Feature 2: Private Student Journal</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>Private Journal &amp; Reflection 📖</h2>
        <button 
          onClick={() => setPrivacyActive(!privacyActive)} 
          className="btn-ghost" 
          title="Toggle Privacy Blur Mask to hide text"
        >
          {privacyActive ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
          <span>Privacy Shield: {privacyActive ? 'ON' : 'Off'}</span>
        </button>
      </div>
      <p className="section-subtitle">
        Your entries are saved to your account. MindEase screens them for burnout signs and possible self-harm language using rules, not an AI service. This is not a diagnosis or emergency monitoring. If a possible self-harm signal is found, the admin is emailed your name, email, and signal category, never your journal text.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* Editor */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: 12 }}>New Reflection</h3>

          {/* Prompt chips */}
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-mid)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Need prompt ideas? Tap one:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setContent(prev => prev ? prev + '\n\n' + p + '\n' : p + '\n\n')}
                  className="tag-btn"
                >
                  {p.slice(0, 24)}...
                </button>
              ))}
            </div>
          </div>

          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Unwinding after physics class)..." 
            className="styled-input" 
            style={{ marginBottom: 12 }} 
          />
          
          <textarea 
            rows={7} 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely here. Nobody else has access to this space..." 
            className={`styled-textarea ${privacyActive ? 'privacy-blur-active' : ''}`}
          />

          {/* Real-time sentiment preview */}
          {sentimentTone && (
            <div style={{ margin: '12px 0', padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Emotional Tone: <strong style={{ color: 'var(--deep-purple)' }}>{isAnalyzing ? 'Analyzing...' : sentimentTone}</strong></span>
              <span style={{ fontSize: 10, color: 'var(--text-light)' }}>{sentimentScore === null ? 'Visible only to you' : `${Math.round(sentimentScore * 100)}% strength`}</span>
            </div>
          )}

          {latestScreening && (
            <div role="status" style={{ margin: '12px 0', padding: '12px 14px', background: latestScreening.self_harm_concern ? 'rgba(247, 197, 208, 0.45)' : 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', fontSize: 12 }}>
              <strong>Burnout check: {latestScreening.burnout_level}</strong>
              <p style={{ margin: '6px 0 0' }}>This rules-based check can miss things or flag wording by mistake; it is not a clinical assessment.</p>
              {latestScreening.self_harm_concern && (
                <p style={{ margin: '6px 0 0' }}>
                  A possible self-harm signal was found. {latestScreening.admin_notified ? 'The admin was notified without your journal text.' : 'The admin could not be notified automatically.'} If you may be in immediate danger, contact local emergency services or open urgent support now.
                </p>
              )}
            </div>
          )}

          <input 
            type="text" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags separated by commas (e.g. self-care, exams, sleep)..." 
            className="styled-input" 
            style={{ marginTop: 12, marginBottom: 16 }} 
          />

          <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', margin: '0 0 12px', fontSize: 11, lineHeight: 1.5, color: 'var(--text-mid)' }}>
            <input type="checkbox" checked={safetyDisclosureAccepted} onChange={event => setSafetyDisclosureAccepted(event.target.checked)} />
            <span>I understand that entries are screened for safety signals and that a possible self-harm signal emails the admin my account name, email, and signal category, not my journal text.</span>
          </label>
          <button onClick={handleSave} disabled={!safetyDisclosureAccepted} className="btn-primary" style={{ width: '100%', opacity: safetyDisclosureAccepted ? 1 : 0.55 }}>
            <Bookmark style={{ width: 16, height: 16 }} />
            <span>Save to Private Journal</span>
          </button>
        </div>

        {/* History */}
        <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem' }}>Past Reflections</h3>
              {entries.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search entries..." 
                    className="styled-input" 
                    style={{ width: 160, padding: '6px 12px', fontSize: 12 }} 
                  />
                </div>
              )}
            </div>

            {/* Zero Mock Data Empty State */}
            {entries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📖</div>
                <div className="empty-state-title">Your Journal is Blank</div>
                <div className="empty-state-desc">Write your first reflection on the left to start building your private self-care archive!</div>
              </div>
            ) : filtered.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 12, padding: '20px 0' }}>No entries match your search query.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map(entry => (
                  <div key={entry.id} style={{ padding: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <strong style={{ fontSize: 13, color: 'var(--text-dark)' }}>{entry.title}</strong>
                        <div style={{ fontSize: 10, color: 'var(--text-light)' }}>
                          {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(entry.id)} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: 12 }} 
                        title="Delete entry"
                      >
                        ✕
                      </button>
                    </div>
                    <p className={`journal-entry-body ${privacyActive ? 'privacy-blur-active' : ''}`} style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5, margin: '6px 0', overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {entry.content}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <span className={`sentiment-pill ${entry.sentimentTone && entry.sentimentTone.includes('Stressed') ? 'sentiment-vulnerable' : entry.sentimentTone && entry.sentimentTone.includes('Hopeful') ? 'sentiment-positive' : 'sentiment-neutral'}`}>
                        {entry.sentimentTone || 'Reflective'}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(entry.tags || []).map((t, idx) => (
                          <span key={idx} style={{ fontSize: 9, background: 'rgba(201,184,232,0.3)', padding: '2px 6px', borderRadius: 4, color: 'var(--deep-purple)' }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-light)', borderTop: '1px solid var(--card-border)', paddingTop: 12, marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock style={{ width: 13, height: 13, color: 'var(--deep-purple)' }} />
            <span>Entries are stored with your account. The automated screen is not a substitute for professional help.</span>
          </div>
        </div>

      </div>
    </section>
  );
}
