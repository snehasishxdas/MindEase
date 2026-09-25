import React, { useState, useEffect, useRef } from 'react';
import { 
  Wind, 
  Headphones, 
  Moon, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ShieldCheck,
  Zap,
  Info,
  Sliders
} from 'lucide-react';

export default function ResourcesPage({ onOpenCrisis }) {
  // --- Breathing State ---
  const [breathTechnique, setBreathTechnique] = useState('box'); // 'box' (4-4-4-4) or 'relax' (4-7-8)
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState('Inhale'); // 'Inhale', 'Hold', 'Exhale'
  const [breathCounter, setBreathCounter] = useState(4);
  const breathTimerRef = useRef(null);

  // --- Soundscape Web Audio API ---
  const [activeSound, setActiveSound] = useState(null); // 'rain', 'ocean', 'forest', 'whitenoise'
  const [volume, setVolume] = useState(0.5);
  const audioCtxRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  // --- Study Timer (Pomodoro) ---
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [studySeconds, setStudySeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('focus'); // 'focus' (25m), 'break' (5m)
  const timerRef = useRef(null);

  // --- Sleep Checklist State ---
  const [sleepTasks, setSleepTasks] = useState([
    { id: 1, text: 'No screens or blue light 45 min before sleep', done: false },
    { id: 2, text: 'Room temperature cooled to ~19°C (66°F)', done: false },
    { id: 3, text: 'Brain-dump tomorrow’s to-do items into Journal', done: false },
    { id: 4, text: 'No caffeine after 4:00 PM', done: false },
    { id: 5, text: '5-minute 4-7-8 breathing practice in bed', done: false }
  ]);

  // ==========================================
  // Breathing Logic
  // ==========================================
  useEffect(() => {
    if (!isBreathing) {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      setBreathPhase('Inhale');
      setBreathCounter(breathTechnique === 'box' ? 4 : 4);
      return;
    }

    const phases = breathTechnique === 'box' ? [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 4 },
      { name: 'Exhale', duration: 4 },
      { name: 'Hold', duration: 4 }
    ] : [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 7 },
      { name: 'Exhale', duration: 8 }
    ];

    let currentPhaseIdx = 0;
    let currentSeconds = phases[0].duration;
    setBreathPhase(phases[0].name);
    setBreathCounter(currentSeconds);

    breathTimerRef.current = setInterval(() => {
      currentSeconds -= 1;
      if (currentSeconds <= 0) {
        currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
        currentSeconds = phases[currentPhaseIdx].duration;
        setBreathPhase(phases[currentPhaseIdx].name);
      }
      setBreathCounter(currentSeconds);
    }, 1000);

    return () => {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, [isBreathing, breathTechnique]);

  const toggleBreathing = () => {
    setIsBreathing(!isBreathing);
  };

  const getOrbStateClass = () => {
    if (!isBreathing) return '';
    const lower = breathPhase.toLowerCase();
    if (lower === 'inhale') return 'inhale';
    if (lower === 'hold') return 'hold';
    if (lower === 'exhale') return 'exhale';
    return '';
  };

  const getOrbWrapClass = () => {
    if (!isBreathing) return '';
    const lower = breathPhase.toLowerCase();
    if (lower === 'inhale') return 'inhaling';
    if (lower === 'hold') return 'holding';
    if (lower === 'exhale') return 'exhaling';
    return '';
  };

  const getBreathingInstruction = () => {
    if (!isBreathing) return 'Tap Start to begin somatic vagus nerve regulation';
    if (breathPhase === 'Inhale') return 'Inhale slowly and deeply through your nose';
    if (breathPhase === 'Hold') return 'Gently hold your breath without tension';
    return 'Exhale slowly and smoothly through pursed lips';
  };

  // ==========================================
  // Procedural Web Audio Soundscapes
  // ==========================================
  const stopSoundscape = () => {
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setActiveSound(null);
  };

  const playSoundscape = (type) => {
    if (activeSound === type) {
      stopSoundscape();
      return;
    }
    stopSoundscape();

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      if (type === 'rain') {
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.11;
        }
      } else if (type === 'ocean') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5;
        }
      } else if (type === 'forest') {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.045;
        }
      } else {
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.05;
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
      } else if (type === 'ocean') {
        filter.type = 'lowpass';
        filter.frequency.value = 450;
      } else if (type === 'forest') {
        filter.type = 'bandpass';
        filter.frequency.value = 850;
        filter.Q.value = 1.2;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 1800;
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noiseNodeRef.current = noise;
      gainNodeRef.current = gain;
      setActiveSound(type);
    } catch (err) {
      console.error('Audio initialization failed', err);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
  };

  useEffect(() => {
    return () => {
      stopSoundscape();
    };
  }, []);

  // ==========================================
  // Pomodoro Focus Timer Logic
  // ==========================================
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        if (studySeconds > 0) {
          setStudySeconds(studySeconds - 1);
        } else if (studyMinutes > 0) {
          setStudyMinutes(studyMinutes - 1);
          setStudySeconds(59);
        } else {
          clearInterval(timerRef.current);
          setIsTimerRunning(false);
          const nextMode = timerMode === 'focus' ? 'break' : 'focus';
          setTimerMode(nextMode);
          setStudyMinutes(nextMode === 'focus' ? 25 : 5);
          setStudySeconds(0);
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.8);
          } catch (e) {}
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, studyMinutes, studySeconds, timerMode]);

  const toggleStudyTimer = () => setIsTimerRunning(!isTimerRunning);
  
  const setTimerPreset = (mins, mode) => {
    setIsTimerRunning(false);
    setTimerMode(mode);
    setStudyMinutes(mins);
    setStudySeconds(0);
  };

  const toggleSleepTask = (id) => {
    setSleepTasks(tasks => 
      tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    );
  };

  const completedSleepTasks = sleepTasks.filter(t => t.done).length;

  return (
    <section className="section" style={{ minHeight: 'auto' }}>
      
      {/* Editorial Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <div className="section-label">Evidence-Based Somatic Tools</div>
        <h2 className="section-title">Curated Self-Help Sanctuary 🌿</h2>
        <p className="section-subtitle">
          Calm acute sympathetic arousal in minutes with neuro-regulating breathing, synthesized procedural noise, rhythmic focus blocks, and restorative circadian habits.
        </p>
      </div>

      {/* Row 1: Breathing Orb + Ambient Audio */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        
        {/* 1. Guided Somatic Breathing Card */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(201, 184, 232, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wind className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Neuro-Regulating Breathing</h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-mid)', marginTop: '2px' }}>
                    Activates vagal brake within 90 seconds
                  </div>
                </div>
              </div>

              {/* Segmented Technique Selector */}
              <div style={{ display: 'inline-flex', flexWrap: 'wrap', maxWidth: '100%', background: 'rgba(255,255,255,0.7)', padding: '3px', borderRadius: '50px', border: '1px solid var(--card-border)' }}>
                <button 
                  type="button" 
                  onClick={() => { setBreathTechnique('box'); setIsBreathing(false); }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '50px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: breathTechnique === 'box' ? 'var(--lavender)' : 'transparent',
                    color: breathTechnique === 'box' ? 'var(--deep-purple)' : 'var(--text-mid)',
                    transition: 'var(--transition)'
                  }}
                >
                  Box 4-4-4
                </button>
                <button 
                  type="button" 
                  onClick={() => { setBreathTechnique('relax'); setIsBreathing(false); }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '50px',
                    border: 'none',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: breathTechnique === 'relax' ? 'var(--lavender)' : 'transparent',
                    color: breathTechnique === 'relax' ? 'var(--deep-purple)' : 'var(--text-mid)',
                    transition: 'var(--transition)'
                  }}
                >
                  4-7-8 Sleep
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Breathing Orb with Ripple Rings */}
          <div className={`breathe-orb-wrap ${getOrbWrapClass()}`} onClick={toggleBreathing}>
            <div className="breathe-ripple-outer" />
            <div className="breathe-ripple-inner" />
            <div className={`breathe-orb ${getOrbStateClass()}`}>
              <span className="breathe-phase">{breathPhase}</span>
              <span className="breathe-count">{isBreathing ? breathCounter : '•'}</span>
            </div>
          </div>

          {/* Guidance & Actions */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--deep-purple)', marginBottom: '14px', minHeight: '18px' }}>
              {getBreathingInstruction()}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={toggleBreathing}
                style={{ minWidth: '180px', justifyContent: 'center' }}
              >
                {isBreathing ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Session
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Begin Guided Session
                  </>
                )}
              </button>
              {isBreathing && (
                <button 
                  type="button" 
                  onClick={() => setIsBreathing(false)}
                  className="btn-secondary"
                  title="Reset session"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '10px', marginBottom: 0 }}>
              {breathTechnique === 'box' 
                ? 'Navy SEAL Box Protocol: Inhale 4s • Hold 4s • Exhale 4s • Hold 4s' 
                : 'Dr. Weil 4-7-8 Technique: Inhale 4s • Hold 7s • Exhale slowly 8s'}
            </p>
          </div>
        </div>

        {/* 2. Procedural Soundscapes Card */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(184, 232, 212, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Headphones className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Procedural Ambient Noise</h3>
                <div style={{ fontSize: '11.5px', color: 'var(--text-mid)', marginTop: '2px' }}>
                  Synthesized in browser via Web Audio • Zero latency
                </div>
              </div>
            </div>
          </div>

          {/* Soundscape Tiles Grid */}
          <div className="sound-tiles-grid" style={{ margin: '20px 0' }}>
            {[
              { id: 'rain', label: 'Gentle Rain', desc: 'Pink noise spectrum', icon: '🌧️' },
              { id: 'ocean', label: 'Ocean Tide', desc: 'Brownian rhythmic surge', icon: '🌊' },
              { id: 'forest', label: 'Deep Forest', desc: 'Subtle resonant breeze', icon: '🌲' },
              { id: 'whitenoise', label: 'White Mask', desc: 'Pure study focus mask', icon: '☁️' }
            ].map((sound) => {
              const isActive = activeSound === sound.id;
              return (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => playSoundscape(sound.id)}
                  className={`sound-card-btn ${isActive ? 'active' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '26px' }}>{sound.icon}</span>
                    {isActive ? (
                      <div className="eq-bars">
                        <span className="eq-bar" />
                        <span className="eq-bar" />
                        <span className="eq-bar" />
                        <span className="eq-bar" />
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600 }}>Play</span>
                    )}
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-dark)' }}>
                      {sound.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                      {sound.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Volume Control Bar */}
          <div style={{ 
            padding: '12px 18px', 
            borderRadius: 'var(--radius-md)', 
            background: 'rgba(255,255,255,0.75)', 
            border: '1px solid var(--card-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={() => volume > 0 ? setVolume(0) : setVolume(0.5)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              title={volume === 0 ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-purple-700" />}
            </button>
            
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={volume} 
              onChange={handleVolumeChange}
              style={{ flex: 1, accentColor: 'var(--deep-purple)', cursor: 'pointer' }}
            />
            
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--deep-purple)', width: '36px', textAlign: 'right' }}>
              {Math.round(volume * 100)}%
            </span>

            {activeSound && (
              <button 
                type="button" 
                onClick={stopSoundscape} 
                className="btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                Stop
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Row 2: Pomodoro Focus Timer + Sleep Hygiene Routine */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px', alignItems: 'stretch' }}>
        
        {/* Pomodoro Focus Timer Card */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(247, 197, 208, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock className="w-5 h-5 text-rose-800" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Gentle Study Focus</h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-mid)', marginTop: '2px' }}>
                    Dopamine pacing without cognitive fatigue
                  </div>
                </div>
              </div>

              {/* Preset Selector */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setTimerPreset(25, 'focus')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '50px',
                    border: '1px solid var(--card-border)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: timerMode === 'focus' && studyMinutes === 25 ? 'var(--mint)' : 'rgba(255,255,255,0.7)',
                    color: timerMode === 'focus' && studyMinutes === 25 ? '#166534' : 'var(--text-mid)'
                  }}
                >
                  25m Focus
                </button>
                <button
                  type="button"
                  onClick={() => setTimerPreset(50, 'focus')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '50px',
                    border: '1px solid var(--card-border)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: timerMode === 'focus' && studyMinutes === 50 ? 'var(--lavender)' : 'rgba(255,255,255,0.7)',
                    color: timerMode === 'focus' && studyMinutes === 50 ? 'var(--deep-purple)' : 'var(--text-mid)'
                  }}
                >
                  50m Deep
                </button>
                <button
                  type="button"
                  onClick={() => setTimerPreset(5, 'break')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '50px',
                    border: '1px solid var(--card-border)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: timerMode === 'break' ? 'var(--dusty-rose)' : 'rgba(255,255,255,0.7)',
                    color: timerMode === 'break' ? '#881337' : 'var(--text-mid)'
                  }}
                >
                  5m Rest
                </button>
              </div>
            </div>

            {/* Timer Dial Display */}
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ 
                fontSize: 'clamp(3.2rem, 6vw, 4.4rem)', 
                fontFamily: "'Playfair Display', serif", 
                fontWeight: 700, 
                color: 'var(--text-dark)',
                letterSpacing: '0.04em',
                lineHeight: 1
              }}>
                {String(studyMinutes).padStart(2, '0')}:{String(studySeconds).padStart(2, '0')}
              </div>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: 700, 
                color: timerMode === 'focus' ? 'var(--deep-purple)' : '#881337', 
                marginTop: '10px', 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em' 
              }}>
                {timerMode === 'focus' ? '🎯 High-Focus Interval' : '☕ Restorative Vagus Break'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              type="button" 
              onClick={toggleStudyTimer} 
              className="btn-primary" 
              style={{ minWidth: '150px', justifyContent: 'center' }}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isTimerRunning ? 'Pause Timer' : 'Start Timer'}
            </button>
            <button 
              type="button" 
              onClick={() => setTimerPreset(timerMode === 'focus' ? 25 : 5, timerMode)} 
              className="btn-secondary"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* Restful Sleep Routine Card */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(201, 184, 232, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Moon className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Restful Sleep Checklist</h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-mid)', marginTop: '2px' }}>
                    Circadian habits for deep restorative REM cycles
                  </div>
                </div>
              </div>

              {/* Progress counter pill */}
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px', background: completedSleepTasks === 5 ? 'var(--mint)' : 'rgba(255,255,255,0.7)', color: completedSleepTasks === 5 ? '#166534' : 'var(--text-mid)', border: '1px solid var(--card-border)' }}>
                {completedSleepTasks} of {sleepTasks.length} Checked
              </span>
            </div>

            {/* Checklist items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '18px 0' }}>
              {sleepTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleSleepTask(task.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: task.done ? 'rgba(184, 232, 212, 0.40)' : 'rgba(255,255,255,0.70)',
                    border: '1px solid',
                    borderColor: task.done ? 'rgba(184, 232, 212, 0.9)' : 'var(--card-border)',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: task.done ? 'none' : '2px solid var(--card-border)',
                    background: task.done ? 'var(--mint)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {task.done && <CheckCircle2 className="w-4 h-4 text-emerald-800" />}
                  </div>
                  <span style={{ 
                    fontSize: '12.5px', 
                    color: task.done ? 'var(--text-light)' : 'var(--text-dark)',
                    textDecoration: task.done ? 'line-through' : 'none',
                    flex: 1
                  }}>
                    {task.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--deep-purple)', fontWeight: 600, textAlign: 'center', paddingTop: '8px' }}>
            {completedSleepTasks === 5 
              ? '✨ Outstanding! Your nervous system is primed for uninterrupted rest.' 
              : 'Complete your evening wind-down habits before heading to bed 🌙'}
          </div>
        </div>

      </div>

      {/* Row 3: 3-Minute Exam Room Acute Panic Protocol */}
      <div className="glass-card" style={{ marginTop: '24px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--dusty-rose)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap className="w-5 h-5 text-rose-900" />
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', margin: 0 }}>The 3-Minute Acute Exam Panic Protocol</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '2px 0 0 0' }}>
                If your heart races during a lecture, presentation, or midterm:
              </p>
            </div>
          </div>

          {onOpenCrisis && (
            <button 
              type="button" 
              onClick={onOpenCrisis}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 14px', color: '#E91E63', borderColor: '#F48FB1' }}
            >
              Need Immediate Human Support?
            </button>
          )}
        </div>

        {/* 3 Step Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--deep-purple)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Step 1 • Somatic Grounding
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-dark)', lineHeight: 1.5 }}>
              Press both soles flat against the floor. Feel the firmness of your chair and desk holding you securely.
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--deep-purple)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Step 2 • Physiological Sigh
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-dark)', lineHeight: 1.5 }}>
              Take two consecutive quick inhales through your nose, then one long, audible sigh through your mouth. Repeat 3 times.
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--card-border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--deep-purple)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Step 3 • Prefrontal Re-Orientation
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-dark)', lineHeight: 1.5 }}>
              Silently identify 3 neutral objects in your immediate sight (e.g. clock, pen, exit sign) to disengage the amygdala.
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
