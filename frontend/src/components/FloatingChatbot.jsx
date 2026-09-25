import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Bot, X, Send, AlertTriangle, PhoneCall } from 'lucide-react';

const CRISIS_KEYWORDS = [
  'kill myself', 'suicide', 'end my life', 'harm myself', 'want to die', 
  'cut myself', 'cant take it anymore', "can't go on", 'better off dead', 'hurt myself'
];

export default function FloatingChatbot({ onOpenCrisis }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I'm your MindEase wellness companion. Whether you're feeling overwhelmed by classes or just need a safe space to reflect, I'm here without judgement."
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isCrisisTriggered, setIsCrisisTriggered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query || isLoading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Safety guardrail scan
    const lower = query.toLowerCase();
    const isCrisis = CRISIS_KEYWORDS.some(k => lower.includes(k));

    if (isCrisis) {
      setIsCrisisTriggered(true);
      const crisisReply = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        isCrisisAlert: true,
        text: "I hear how deeply difficult things feel right now. Your safety and life matter. Because I am an AI, I cannot provide emergency care. Please dial Tele-MANAS (14416) or our campus emergency desk right now. Trained human professionals are ready to listen 24/7."
      };
      setMessages(prev => [...prev, crisisReply]);
      return;
    }

    setIsLoading(true);

    // Try backend if running
    try {
      const res = await fetch('http://127.0.0.1:5000/api/vent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: data.response
        }]);
        setIsLoading(false);
        return;
      }
    } catch {}

    // Fallback supportive reply
    setTimeout(() => {
      let reply = "Thank you for sharing that with me. It is completely natural to experience stress during academic challenges. Remember that your productivity or grades do not define your human worth. What is one kind thing you can do for yourself today?";
      if (lower.includes('exam') || lower.includes('study')) {
        reply = "Academic deadlines often feel suffocating. Try breaking your task into a single 20-minute chunk and give yourself full permission to pause after. You can take this one step at a time.";
      } else if (lower.includes('sleep')) {
        reply = "When your mind is racing at night, pushing yourself to sleep often increases anxiety. Try our procedural rain or ocean soundscapes in the Self-Help Hub to ease your mind.";
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: reply
      }]);
      setIsLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Floating FAB Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="floating-chat-trigger" 
        aria-label="Open AI Wellness Companion"
      >
        <Sparkles style={{ width: 17, height: 17 }} />
        <span>Talk with AI</span>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="floating-chat-window" role="dialog" aria-modal="true" aria-label="AI Wellness Chat">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.6)', flexShrink: 0, boxShadow: '0 2px 8px rgba(123,94,167,0.2)' }}>
                <img src="/MindEase_logo.jpeg" alt="MindEase" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-dark)' }}>MindEase AI Companion</div>
                <div style={{ fontSize: 10, color: 'var(--text-mid)' }}>Supportive Student Listener</div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-mid)' }}
            >
              ✕
            </button>
          </div>

          {/* Crisis alert banner */}
          {isCrisisTriggered && (
            <div style={{ padding: '8px 14px', background: '#FFF0F5', borderBottom: '1px solid #E91E63', fontSize: 11, color: '#880E4F', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Immediate crisis help is available 24/7.</span>
              <button 
                onClick={onOpenCrisis} 
                className="btn-crisis-nav" 
                style={{ padding: '4px 10px', fontSize: 10 }}
              >
                Get Help
              </button>
            </div>
          )}

          {/* Message stream */}
          <div className="chat-body">
            {messages.map(m => (
              <div 
                key={m.id} 
                className={`chat-bubble ${m.role === 'user' ? 'user' : m.isCrisisAlert ? 'crisis-alert' : 'assistant'}`}
              >
                {m.text}
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble assistant" style={{ fontStyle: 'italic', color: 'var(--text-light)' }}>
                MindEase is reflecting...
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderTop: '1px solid var(--card-border)', display: 'flex', gap: 8 }}>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Share what is on your mind..." 
              className="styled-input" 
              style={{ padding: '8px 12px', fontSize: 12.5 }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: 12 }}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
