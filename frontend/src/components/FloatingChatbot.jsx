import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

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
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState('');
  const endRef = useRef(null);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const speak = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const addAssistantMessage = (message) => {
    setMessages(prev => [...prev, message]);
    speak(message.text);
  };

  const sendMessage = async (rawText) => {
    const query = rawText.trim();
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
      addAssistantMessage(crisisReply);
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
        addAssistantMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: data.response
        });
        setIsLoading(false);
        if (shouldListenRef.current) startListening();
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
      addAssistantMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: reply
      });
      setIsLoading(false);
      if (shouldListenRef.current) startListening();
    }, 600);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const query = inputText.trim();
    setInputText('');
    sendMessage(query);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setVoiceStatus('Voice input is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) recognitionRef.current.abort();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('Listening...');
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      shouldListenRef.current = false;
      setIsListening(false);
      setVoiceStatus('');
      sendMessage(transcript);
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      shouldListenRef.current = false;
      setVoiceStatus(event.error === 'not-allowed' ? 'Microphone permission is required.' : 'Voice input stopped.');
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    recognition.start();
  };

  const stopListening = () => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceStatus('');
  };

  useEffect(() => {
    if (!isOpen) {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
      return undefined;
    }

    if (voiceEnabled) startListening();
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
    };
  }, [isOpen, voiceEnabled]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 14px', borderBottom: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.55)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-mid)' }}>{voiceStatus || (voiceEnabled ? 'Voice replies on' : 'Text chat only')}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={isListening ? stopListening : startListening} className="btn-ghost" style={{ padding: '5px 8px', fontSize: 11 }} disabled={!voiceSupported}>
                {isListening ? <MicOff style={{ width: 14, height: 14 }} /> : <Mic style={{ width: 14, height: 14 }} />}
                <span>{isListening ? 'Stop' : 'Speak'}</span>
              </button>
              <button type="button" onClick={() => setVoiceEnabled(prev => !prev)} className="btn-ghost" style={{ padding: '5px 8px', fontSize: 11 }}>
                {voiceEnabled ? <Volume2 style={{ width: 14, height: 14 }} /> : <VolumeX style={{ width: 14, height: 14 }} />}
                <span>{voiceEnabled ? 'Voice on' : 'Voice off'}</span>
              </button>
            </div>
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
