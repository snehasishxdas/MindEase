import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, HeartHandshake, MessageCircle, RotateCcw, Send, ShieldCheck, StopCircle } from 'lucide-react';
import { apiRequest } from '../api';
import MindMirrorMark from '../components/MindMirrorMark';

const scenarios = [
  { id: 'group-project', title: 'Peer pressure on a group project', description: "A classmate expects you to do most of the work because you're good at it.", tone: 'mint' },
  { id: 'study-demands', title: 'Constant study group demands', description: 'A friend wants your notes late every night, cutting into your time to study and rest.', tone: 'rose' },
  { id: 'harsh-feedback', title: 'Harsh feedback from a professor', description: 'Your presentation is criticized in front of class. Respond calmly and ask for useful feedback.', tone: 'lilac' },
  { id: 'comparison-spiral', title: 'Social media comparison spiral', description: 'A peer talks about internships and achievements, and you start to feel behind.', tone: 'gold' },
  { id: 'deadline-clash', title: 'Overwhelming deadline clash', description: 'Several assignments are due together, and a group member asks you to cover their part too.', tone: 'mint' },
  { id: 'family-career', title: 'Unsolicited family career advice', description: "Your family keeps pushing a career path you don't want.", tone: 'rose' },
];

export default function ResiliencePage({ onOpenCrisis }) {
  const [scenario, setScenario] = useState(null);
  const [turns, setTurns] = useState([]);
  const [draft, setDraft] = useState('');
  const [debrief, setDebrief] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const transcriptRef = useRef(null);

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [turns, debrief]);

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
      if (data.crisis_detected) {
        onOpenCrisis();
        return;
      }
      setTurns((current) => [...current, { role: 'user', content: message }, { role: 'assistant', content: data.response }]);
    } catch (requestError) {
      setDraft(message);
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const finishPractice = async () => {
    if (turns.filter((turn) => turn.role === 'user').length === 0 || busy) return;
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

  return (
    <section className="section resilience-page">
      {!scenario ? (
        <>
          <div className="resilience-heading">
            <span className="section-label"><MindMirrorMark className="resilience-mirror-mark" /> MindEase practice</span>
            <h1 className="section-title">Resilience role-play</h1>
            <p className="section-subtitle">Rehearse a difficult conversation at your own pace. Groq generates the replies; practice conversations are not saved to your MindEase account.</p>
          </div>
          <div className="resilience-safety-note"><ShieldCheck size={17} /><span>A low-stakes simulation, not therapy. You can pause or leave at any time.</span></div>
          <div className="resilience-scenarios">
            {scenarios.map((item, index) => (
              <button key={item.id} type="button" className={`resilience-scenario ${item.tone}`} onClick={() => startScenario(item)} disabled={busy}>
                <span className="resilience-scenario-index">SCENARIO {String(index + 1).padStart(2, '0')}</span>
                <span className="resilience-scenario-title">{item.title}</span>
                <span className="resilience-scenario-description">{item.description}</span>
                <span className="resilience-scenario-action">Practice conversation <ArrowRight size={15} /></span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="resilience-practice">
          <div className="resilience-practice-header">
            <button type="button" className="resilience-back" onClick={resetPractice} aria-label="Choose another scenario"><ArrowLeft size={17} /> Scenarios</button>
            <div><span className="resilience-scenario-index">PRACTICE SCENE</span><h1>{scenario.title}</h1></div>
            <button type="button" className="resilience-reset" onClick={resetPractice} title="End practice"><StopCircle size={17} /><span>End</span></button>
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
            {debrief && <div className="resilience-debrief"><span className="resilience-message-label">REFLECTION</span><p>{debrief}</p></div>}
          </div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {!debrief && (
            <>
              <form className="resilience-composer" onSubmit={sendMessage}>
                <label className="sr-only" htmlFor="resilience-reply">Your response</label>
                <textarea id="resilience-reply" rows="2" maxLength={1200} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="What would you say?" disabled={busy} />
                <button className="btn-primary" type="submit" disabled={busy || !draft.trim()} aria-label="Send response"><Send size={17} /><span>Reply</span></button>
              </form>
              <div className="resilience-practice-actions">
                <span>{turns.filter((turn) => turn.role === 'user').length} responses</span>
                <button type="button" className="resilience-debrief-button" onClick={finishPractice} disabled={busy || turns.filter((turn) => turn.role === 'user').length === 0}><HeartHandshake size={16} /> End and reflect</button>
              </div>
            </>
          )}
          {debrief && <button type="button" className="resilience-debrief-button" onClick={resetPractice}><RotateCcw size={16} /> Try another scenario</button>}
        </div>
      )}
    </section>
  );
}