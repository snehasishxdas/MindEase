import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, HeartHandshake, MessageCircle, RotateCcw, Send, ShieldCheck, StopCircle, Sparkles, RefreshCw } from 'lucide-react';
import { apiRequest } from '../api';
import MindMirrorMark from '../components/MindMirrorMark';

const SCENARIOS = [
  { id: 'group-project', title: 'Peer pressure on a group project',   description: "A classmate expects you to do most of the work because you're good at it.", tone: 'mint' },
  { id: 'study-demands', title: 'Constant study group demands',        description: 'A friend wants your notes late every night, cutting into your time to study and rest.', tone: 'rose' },
  { id: 'harsh-feedback', title: 'Harsh feedback from a professor',   description: 'Your presentation is criticized in front of class. Respond calmly and ask for useful feedback.', tone: 'lilac' },
  { id: 'comparison-spiral', title: 'Social media comparison spiral', description: 'A peer talks about internships and achievements, and you start to feel behind.', tone: 'gold' },
  { id: 'deadline-clash', title: 'Overwhelming deadline clash',        description: 'Several assignments are due together, and a group member asks you to cover their part too.', tone: 'mint' },
  { id: 'family-career', title: 'Unsolicited family career advice',    description: "Your family keeps pushing a career path you don't want.", tone: 'rose' },
];

export default function ResiliencePage({ onOpenCrisis }) {
  const [scenario, setScenario]   = useState(null);
  const [turns, setTurns]         = useState([]);
  const [draft, setDraft]         = useState('');
  const [debrief, setDebrief]     = useState('');
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');
  const transcriptRef             = useRef(null);

  // ── AI suggestion state ─────────────────────────────────────────────────────
  const [suggestion, setSuggestion]           = useState(null);   // { scenario_id, reason }
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const suggestedCardRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [turns, debrief]);

  // Auto-scroll to suggested card once it arrives
  useEffect(() => {
    if (suggestion && suggestedCardRef.current) {
      suggestedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [suggestion]);

  // ── Fetch suggestion from Groq on mount ────────────────────────────────────
  const fetchSuggestion = useCallback(async () => {
    setSuggestionLoading(true);
    setSuggestion(null);
    try {
      const data = await apiRequest('/api/resilience/suggest-scenario', { method: 'POST' });
      // Soft-fail responses (no data, invalid scenario, etc.) carry an "error" key
      if (!data.error && data.scenario_id) {
        setSuggestion({ scenario_id: data.scenario_id, reason: data.reason });
      }
    } catch {
      // Suggestion is purely additive — silently ignore any network error
    } finally {
      setSuggestionLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuggestion(); }, [fetchSuggestion]);

  // ── Roleplay helpers ────────────────────────────────────────────────────────
  const requestRoleplay = async (mode, message) => apiRequest('/api/resilience/roleplay', {
    method: 'POST',
    body: JSON.stringify({
      scenario_id: scenario.id,
      mode,
      turns: turns.map(({ role, content }) => ({ role, content })),
      ...(message ? { message } : {}),
    }),
  });

  const startScenario = async (selectedScenario) => {
    setScenario(selectedScenario);
    setTurns([]);
    setDebrief('');
    setError('');
    setBusy(true);
    try {
      const data = await apiRequest('/api/resilience/roleplay', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: selectedScenario.id, mode: 'start', turns: [] }),
      });
      setTurns([{ role: 'assistant', content: data.response }]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || busy) return;
    const message = draft.trim();
    setDraft('');
    setError('');
    setBusy(true);
    try {
      const data = await requestRoleplay('reply', message);
      if (data.crisis_detected) { onOpenCrisis(); return; }
      setTurns((current) => [...current, { role: 'user', content: message }, { role: 'assistant', content: data.response }]);
    } catch (requestError) {
      setDraft(message);
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const finishPractice = async () => {
    if (turns.filter((t) => t.role === 'user').length === 0 || busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await requestRoleplay('debrief');
      setDebrief(data.response);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPractice = () => {
    setScenario(null);
    setTurns([]);
    setDebrief('');
    setDraft('');
    setError('');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="section resilience-page">
      {!scenario ? (
        <>
          {/* ── Page heading ──────────────────────────────────────── */}
          <div className="resilience-heading">
            <span className="section-label">
              <MindMirrorMark className="resilience-mirror-mark" /> MindEase practice
            </span>
            <h1 className="section-title">Resilience role-play</h1>
            <p className="section-subtitle">
              Rehearse a difficult conversation at your own pace. Groq generates the replies; practice conversations are not saved to your MindEase account.
            </p>
          </div>
          <div className="resilience-safety-note">
            <ShieldCheck size={17} />
            <span>A low-stakes simulation, not therapy. You can pause or leave at any time.</span>
          </div>

          {/* ── AI suggestion banner ─────────────────────────────── */}
          {(suggestionLoading || suggestion) && (
            <div style={{
              marginBottom: '20px',
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(201,184,232,0.35), rgba(184,232,212,0.25))',
              border: '1.5px solid rgba(123,94,167,0.22)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(123,94,167,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Sparkles size={16} style={{ color: '#7c5cd8' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {suggestionLoading ? (
                  <>
                    <div style={{ height: 11, width: '55%', borderRadius: 6, background: 'rgba(123,94,167,0.18)', marginBottom: 7, animation: 'pulse 1.4s ease-in-out infinite' }} />
                    <div style={{ height: 10, width: '80%', borderRadius: 6, background: 'rgba(123,94,167,0.12)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7c5cd8', marginBottom: 3 }}>
                      Suggested for you · based on your journal &amp; mood
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-dark)', lineHeight: 1.5 }}>
                      <strong>{SCENARIOS.find(s => s.id === suggestion.scenario_id)?.title}</strong>
                      {suggestion.reason ? <span style={{ color: 'var(--text-mid)' }}> — {suggestion.reason}</span> : null}
                    </div>
                  </>
                )}
              </div>
              {!suggestionLoading && (
                <button
                  type="button"
                  onClick={fetchSuggestion}
                  title="Re-analyse your inputs"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '2px', flexShrink: 0 }}
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </div>
          )}

          {/* ── Scenario grid ────────────────────────────────────── */}
          <div className="resilience-scenarios">
            {SCENARIOS.map((item, index) => {
              const isSuggested = suggestion && suggestion.scenario_id === item.id && !suggestionLoading;
              return (
                <button
                  key={item.id}
                  ref={isSuggested ? suggestedCardRef : null}
                  type="button"
                  className={`resilience-scenario ${item.tone}`}
                  onClick={() => startScenario(item)}
                  disabled={busy}
                  style={isSuggested ? {
                    border: '2px solid #7c5cd8',
                    boxShadow: '0 0 0 3px rgba(123,94,167,0.15)',
                    position: 'relative',
                  } : undefined}
                >
                  {/* AI-recommended badge */}
                  {isSuggested && (
                    <span style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      background: '#7c5cd8',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: 20,
                    }}>
                      <Sparkles size={9} /> AI Pick
                    </span>
                  )}
                  <span className="resilience-scenario-index">SCENARIO {String(index + 1).padStart(2, '0')}</span>
                  <span className="resilience-scenario-title">{item.title}</span>
                  <span className="resilience-scenario-description">{item.description}</span>
                  <span className="resilience-scenario-action">Practice conversation <ArrowRight size={15} /></span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* ── Active practice ──────────────────────────────────────── */
        <div className="resilience-practice">
          <div className="resilience-practice-header">
            <button type="button" className="resilience-back" onClick={resetPractice} aria-label="Choose another scenario">
              <ArrowLeft size={17} /> Scenarios
            </button>
            <div>
              <span className="resilience-scenario-index">PRACTICE SCENE</span>
              <h1>{scenario.title}</h1>
            </div>
            <button type="button" className="resilience-reset" onClick={resetPractice} title="End practice">
              <StopCircle size={17} /><span>End</span>
            </button>
          </div>
          <div className="resilience-scene-context">{scenario.description}</div>
          <div className="resilience-transcript" ref={transcriptRef} aria-live="polite" aria-label="Role-play conversation">
            {turns.map((turn, index) => (
              <div key={`${index}-${turn.role}`} className={`resilience-message ${turn.role}`}>
                <span className="resilience-message-label">{turn.role === 'assistant' ? 'IN THE SCENE' : 'YOU'}</span>
                <p>{turn.content}</p>
              </div>
            ))}
            {busy && <div className="resilience-thinking"><MessageCircle size={16} /> Preparing the next reply…</div>}
            {debrief && (
              <div className="resilience-debrief">
                <span className="resilience-message-label">REFLECTION</span>
                <p>{debrief}</p>
              </div>
            )}
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {!debrief && (
            <>
              <form className="resilience-composer" onSubmit={sendMessage}>
                <label className="sr-only" htmlFor="resilience-reply">Your response</label>
                <textarea
                  id="resilience-reply"
                  rows="2"
                  maxLength={1200}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="What would you say?"
                  disabled={busy}
                />
                <button className="btn-primary" type="submit" disabled={busy || !draft.trim()} aria-label="Send response">
                  <Send size={17} /><span>Reply</span>
                </button>
              </form>
              <div className="resilience-practice-actions">
                <span>{turns.filter((turn) => turn.role === 'user').length} responses</span>
                <button
                  type="button"
                  className="resilience-debrief-button"
                  onClick={finishPractice}
                  disabled={busy || turns.filter((turn) => turn.role === 'user').length === 0}
                >
                  <HeartHandshake size={16} /> End and reflect
                </button>
              </div>
            </>
          )}
          {debrief && (
            <button type="button" className="resilience-debrief-button" onClick={resetPractice}>
              <RotateCcw size={16} /> Try another scenario
            </button>
          )}
        </div>
      )}
    </section>
  );
}
