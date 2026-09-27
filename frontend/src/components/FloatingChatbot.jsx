import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { apiRequest } from '../api';
import MindMirrorMark from './MindMirrorMark';
import { normalizeLang, languageLabel, toBCP47 } from '../utils/languageDetect';

// ─── Crisis keywords (English; backend also screens all languages) ────────────
const CRISIS_KEYWORDS = [
  'kill myself', 'suicide', 'end my life', 'harm myself', 'want to die',
  'cut myself', 'cant take it anymore', "can't go on", 'better off dead', 'hurt myself'
];

// ─── Derive initial language from browser preference ─────────────────────────
function getBrowserLang() {
  return normalizeLang(navigator.language || 'en');
}

export default function FloatingChatbot({ onOpenCrisis }) {
  const [isOpen, setIsOpen] = useState(false);

  // Language state – updated whenever speech recognition reports a language or
  // the user selects one manually from the picker.
  const [detectedLang, setDetectedLang] = useState(getBrowserLang);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I'm your MindEase wellness companion. Whether you're feeling overwhelmed by classes or just need a safe space to reflect, I'm here without judgement.",
      lang: 'en',
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

  // Keep refs for values that speak() needs to read fresh at call-time,
  // avoiding any stale-closure issue regardless of when speak() was created.
  const detectedLangRef = useRef(detectedLang);
  useEffect(() => { detectedLangRef.current = detectedLang; }, [detectedLang]);
  const voiceEnabledRef = useRef(voiceEnabled);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  // ─── Scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ─── Load voices and keep a live ref to them ───────────────────────────────
  // Chrome loads voices asynchronously; we store them in a ref so pickVoice()
  // always sees the fully-populated list even from inside stale closures.
  const voicesRef = useRef([]);
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) voicesRef.current = v;
    };
    load(); // synchronous on Firefox / Safari
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // ─── Text-to-speech ────────────────────────────────────────────────────────
  // Stored in a ref so every caller (including stale closures in useCallback
  // chains) always invokes the latest version with the live voices list.
  const speakRef = useRef(null);
  speakRef.current = (text, langCode) => {
    if (!voiceEnabledRef.current || !('speechSynthesis' in window)) return;

    const lang  = langCode || detectedLangRef.current || 'en';
    const bcp47 = toBCP47(lang);

    // Cancel any ongoing speech before starting new utterance.
    // Use a short delay on Chrome to avoid the cancel+speak race that
    // silently drops the utterance.
    window.speechSynthesis.cancel();

    const fire = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate  = 0.96;
      utterance.pitch = 1;
      // utterance.lang is the primary signal many engines use to select a voice
      utterance.lang  = bcp47;

      // Walk the live voices list and pick the best match for this language.
      // Priority: local exact → any exact → prefix match.
      const voices = voicesRef.current;
      const target  = lang.split('-')[0].toLowerCase();
      const voice   =
        voices.find(v => v.localService  && v.lang.toLowerCase().startsWith(target)) ||
        voices.find(v => !v.localService && v.lang.toLowerCase().startsWith(target)) ||
        null;

      if (voice) utterance.voice = voice;

      window.speechSynthesis.speak(utterance);
    };

    // 50 ms gap lets Chrome finish its internal cancel before we push the new
    // utterance; without this the speak() call is swallowed on ~30% of clicks.
    setTimeout(fire, 50);
  };

  // Stable wrapper so the rest of the component can call speak() normally.
  const speak = useCallback((text, langCode) => speakRef.current(text, langCode), []);

  const addAssistantMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
    speak(message.text, message.lang);
  }, [speak]);

  // ─── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (rawText, langOverride) => {
    const query = rawText.trim();
    if (!query || isLoading) return;

    const lang = langOverride || detectedLangRef.current || 'en';

    const userMsg = { id: Date.now().toString(), role: 'user', text: query, lang };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Safety guardrail (English keywords; backend covers all languages)
    const lower = query.toLowerCase();
    const isCrisis = CRISIS_KEYWORDS.some(k => lower.includes(k));

    if (isCrisis) {
      setIsCrisisTriggered(true);
      const crisisReply = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        isCrisisAlert: true,
        lang,
        text: "I hear how deeply difficult things feel right now. Your safety and life matter. Because I am an AI, I cannot provide emergency care. Please dial Tele-MANAS (14416) or our campus emergency desk right now. Trained human professionals are ready to listen 24/7."
      };
      addAssistantMessage(crisisReply);
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiRequest('/api/vent', {
        method: 'POST',
        body: JSON.stringify({ text: query, language: lang })
      });
      addAssistantMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.response,
        lang,
      });
      setIsLoading(false);
      if (shouldListenRef.current) startListening();
      return;
    } catch {}

    // Offline / fallback supportive reply (mirrors the language of the query)
    setTimeout(() => {
      let reply = "Thank you for sharing that with me. It is completely natural to experience stress during academic challenges. Remember that your productivity or grades do not define your human worth. What is one kind thing you can do for yourself today?";
      if (lower.includes('exam') || lower.includes('study') ||
          lower.includes('परीक्षा') || lower.includes('पढ़ाई')) {
        reply = "Academic deadlines often feel suffocating. Try breaking your task into a single 20-minute chunk and give yourself full permission to pause after. You can take this one step at a time.";
      } else if (lower.includes('sleep') || lower.includes('नींद')) {
        reply = "When your mind is racing at night, pushing yourself to sleep often increases anxiety. Try our procedural rain or ocean soundscapes in the Self-Help Hub to ease your mind.";
      }
      addAssistantMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: reply,
        lang: 'en', // fallback is always English
      });
      setIsLoading(false);
      if (shouldListenRef.current) startListening();
    }, 600);
  }, [isLoading, addAssistantMessage]);

  const handleSend = (e) => {
    e.preventDefault();
    const query = inputText.trim();
    setInputText('');
    sendMessage(query);
  };

  // ─── Voice recognition with automatic language detection ───────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setVoiceStatus('Voice input is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) recognitionRef.current.abort();
    const recognition = new SpeechRecognition();

    // Use the currently detected language for the recognition session.
    // Setting it to a known language improves accuracy significantly; if the
    // user switches language mid-conversation, the detected language updates
    // and the next recognition session will use the new one.
    recognition.lang = toBCP47(detectedLangRef.current || 'en');
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('Listening...');
    };

    recognition.onresult = (event) => {
      const result = event.results[0][0];
      const transcript = result.transcript;

      // The SpeechRecognitionResult doesn't expose detected language in the
      // standard API, but we can inspect the recognition object's lang to confirm
      // which locale was active. We update detectedLang from the active tag.
      const activeLang = normalizeLang(recognition.lang);
      setDetectedLang(activeLang);

      setInputText(transcript);
      shouldListenRef.current = false;
      setIsListening(false);
      setVoiceStatus('');
      sendMessage(transcript, activeLang);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      shouldListenRef.current = false;
      setVoiceStatus(
        event.error === 'not-allowed'
          ? 'Microphone permission is required.'
          : 'Voice input stopped.'
      );
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    recognition.start();
  }, [sendMessage]);

  const stopListening = () => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceStatus('');
  };

  // ─── Toggle voice + restart listening when chat opens ─────────────────────
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

  // ─── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  // ─── Supported languages for the manual language picker ────────────────────
  const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'mr', label: 'मराठी' },
    { code: 'gu', label: 'ગુજરાતી' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ' },
    { code: 'ur', label: 'اردو' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
    { code: 'ar', label: 'العربية' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
  ];

  const handleLanguageChange = (e) => {
    const code = e.target.value;
    setDetectedLang(code);
    // Restart recognition with the newly chosen language
    if (isListening) {
      recognitionRef.current?.stop();
      setTimeout(() => startListening(), 150);
    }
  };

  const currentLangLabel = languageLabel(detectedLang);

  return (
    <>
      {/* Floating FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="floating-chat-trigger"
        aria-label="Open MindEase vent and burnout support"
      >
        <MindMirrorMark variant="candle" className="vent-candle-mark" />
        <span>Vent &amp; Burnout</span>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="floating-chat-window" role="dialog" aria-modal="true" aria-label="AI Wellness Chat">
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="chat-brand-mark">
                <MindMirrorMark variant="candle" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-dark)' }}>MindEase Vent Space</div>
                <div style={{ fontSize: 10, color: 'var(--text-mid)' }}>Vent and burnout reflection</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Language badge / auto-detected indicator */}
              <span
                className="lang-badge"
                title={`Detected language: ${currentLangLabel}`}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 20,
                  background: 'rgba(123,94,167,0.13)',
                  color: 'var(--deep-purple)',
                  border: '1px solid rgba(123,94,167,0.25)',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                🌐 {currentLangLabel}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-mid)' }}
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Controls bar ────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8, padding: '7px 14px', borderBottom: '1px solid var(--card-border)',
            background: 'rgba(255,255,255,0.55)', flexWrap: 'wrap'
          }}>
            {/* Status text */}
            <span style={{ fontSize: 11, color: 'var(--text-mid)', flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {voiceStatus || (voiceEnabled ? `Voice replies on · ${currentLangLabel}` : 'Text chat only')}
            </span>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              {/* Language selector */}
              <select
                value={detectedLang}
                onChange={handleLanguageChange}
                className="btn-ghost"
                style={{ padding: '4px 6px', fontSize: 11, cursor: 'pointer', borderRadius: 6 }}
                title="Select language"
                aria-label="Select language"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>

              {/* Mic toggle */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className="btn-ghost"
                style={{ padding: '5px 8px', fontSize: 11 }}
                disabled={!voiceSupported}
                title={isListening ? 'Stop listening' : `Speak in ${currentLangLabel}`}
              >
                {isListening ? <MicOff style={{ width: 14, height: 14 }} /> : <Mic style={{ width: 14, height: 14 }} />}
                <span>{isListening ? 'Stop' : 'Speak'}</span>
              </button>

              {/* Voice output toggle */}
              <button
                type="button"
                onClick={() => setVoiceEnabled(prev => !prev)}
                className="btn-ghost"
                style={{ padding: '5px 8px', fontSize: 11 }}
                title={voiceEnabled ? 'Turn off voice replies' : 'Turn on voice replies'}
              >
                {voiceEnabled ? <Volume2 style={{ width: 14, height: 14 }} /> : <VolumeX style={{ width: 14, height: 14 }} />}
                <span>{voiceEnabled ? 'Voice on' : 'Voice off'}</span>
              </button>
            </div>
          </div>

          {/* ── Crisis alert banner ─────────────────────────────── */}
          {isCrisisTriggered && (
            <div style={{
              padding: '8px 14px', background: '#FFF0F5', borderBottom: '1px solid #E91E63',
              fontSize: 11, color: '#880E4F', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
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

          {/* ── Message stream ──────────────────────────────────── */}
          <div className="chat-body">
            {messages.map(m => (
              <div
                key={m.id}
                className={`chat-bubble ${m.role === 'user' ? 'user' : m.isCrisisAlert ? 'crisis-alert' : 'assistant'}`}
                lang={m.lang || 'en'}
              >
                {m.text}
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble assistant" style={{ fontStyle: 'italic', color: 'var(--text-light)' }}>
                MindEase is reflecting…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* ── Input form ──────────────────────────────────────── */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '10px 14px', background: 'rgba(255,255,255,0.7)',
              borderTop: '1px solid var(--card-border)', display: 'flex', gap: 8
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Share what is on your mind… (${currentLangLabel})`}
              className="styled-input"
              style={{ padding: '8px 12px', fontSize: 12.5 }}
              lang={detectedLang}
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
