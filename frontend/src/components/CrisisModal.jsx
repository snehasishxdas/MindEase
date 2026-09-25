import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, X, Heart, Activity } from 'lucide-react';

export default function CrisisModal({ isOpen, onClose }) {
  const [activeGrounding, setActiveGrounding] = useState(false);
  const [groundingStep, setGroundingStep] = useState(0);

  if (!isOpen) return null;

  const groundingSteps = [
    'Place your feet flat on the floor. Unclench your jaw.',
    'Breathe in slowly through your nose for 4 seconds...',
    'Hold your breath gently for 4 seconds...',
    'Exhale slowly through your mouth for 6 seconds...',
    'Look around and notice 3 blue or green objects near you.'
  ];

  const handleNextGrounding = () => {
    if (groundingStep < groundingSteps.length - 1) {
      setGroundingStep(groundingStep + 1);
    } else {
      setActiveGrounding(false);
      setGroundingStep(0);
    }
  };

  return (
    <div 
      className="modal-overlay-custom" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="crisis-modal-title"
    >
      <div className="modal-content-custom">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #F06292, #E91E63)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <PhoneCall style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2 id="crisis-modal-title" style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif", margin: 0 }}>Immediate Emergency Support</h2>
              <div style={{ fontSize: 11, color: '#c2185b', fontWeight: 600 }}>Free, 24/7, Confidential Help</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>Close ✕</button>
        </div>

        {/* Urgent Callout */}
        <div style={{ padding: 14, background: 'rgba(247, 197, 208, 0.45)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(247, 197, 208, 0.8)', marginBottom: 20 }}>
          <strong style={{ color: '#880e4f', fontSize: 13 }}>In Immediate Distress or Danger?</strong>
          <p style={{ fontSize: 12, color: 'var(--text-dark)', marginTop: 4, lineHeight: 1.5 }}>
            Please reach out right now. Trained mental health professionals are ready to listen without judgement.
          </p>
        </div>

        {/* 60s Grounding Tool */}
        <div style={{ padding: 14, background: 'rgba(255, 255, 255, 0.65)', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-border)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--deep-purple)' }}>
              <Activity style={{ width: 15, height: 15 }} />
              <span>Feeling Overwhelmed? 60s Grounding Technique</span>
            </div>
            <button 
              onClick={() => { setActiveGrounding(!activeGrounding); setGroundingStep(0); }}
              style={{ background: 'none', border: 'none', color: 'var(--deep-purple)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
            >
              {activeGrounding ? 'Reset' : 'Start'}
            </button>
          </div>
          {activeGrounding ? (
            <div style={{ marginTop: 8, padding: 10, background: 'rgba(184, 232, 212, 0.4)', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1b6844', margin: '4px 0 10px 0' }}>{groundingSteps[groundingStep]}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-mid)' }}>
                <span>Step {groundingStep + 1} of {groundingSteps.length}</span>
                <button onClick={handleNextGrounding} className="btn-primary" style={{ padding: '4px 14px', fontSize: 11 }}>
                  {groundingStep === groundingSteps.length - 1 ? 'Finish ✓' : 'Next →'}
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 11.5, color: 'var(--text-mid)', margin: 0 }}>
              Use our quick sensory grounding exercise to slow your heart rate and regulate your breathing right now.
            </p>
          )}
        </div>

        {/* National Helplines */}
        <h3 style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif", marginBottom: 10 }}>24/7 Verified National Helplines</h3>
        
        <div className="helpline-box">
          <div>
            <strong style={{ fontSize: 13, color: 'var(--text-dark)' }}>Tele-MANAS (Govt. of India)</strong>
            <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>24/7 Toll-free national tele-mental health line across all languages</div>
          </div>
          <a href="tel:14416" className="btn-primary" style={{ padding: '6px 16px', fontSize: 12, textDecoration: 'none' }}>Call 14416</a>
        </div>

        <div className="helpline-box">
          <div>
            <strong style={{ fontSize: 13, color: 'var(--text-dark)' }}>iCall Psychosocial Helpline (TISS)</strong>
            <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>Counselors from Tata Institute of Social Sciences (Mon–Sat 8am–10pm)</div>
          </div>
          <a href="tel:9152987821" className="btn-primary" style={{ padding: '6px 16px', fontSize: 12, textDecoration: 'none' }}>Call 9152987821</a>
        </div>

        <div className="helpline-box">
          <div>
            <strong style={{ fontSize: 13, color: 'var(--text-dark)' }}>Vandrevala Foundation</strong>
            <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>24/7 Free &amp; Confidential Mental Health Support</div>
          </div>
          <a href="tel:9999666555" className="btn-primary" style={{ padding: '6px 16px', fontSize: 12, textDecoration: 'none' }}>Call 9999666555</a>
        </div>

        <div className="helpline-box">
          <div>
            <strong style={{ fontSize: 13, color: 'var(--text-dark)' }}>KIRAN Mental Health Helpline</strong>
            <div style={{ fontSize: 11, color: 'var(--text-mid)' }}>24/7 Toll-free national student assistance</div>
          </div>
          <a href="tel:18005990019" className="btn-primary" style={{ padding: '6px 16px', fontSize: 12, textDecoration: 'none' }}>Call 1800-599-0019</a>
        </div>

        {/* Campus Contacts */}
        <h3 style={{ fontSize: '1rem', fontFamily: "'Playfair Display', serif", margin: '18px 0 10px 0' }}>Campus Security &amp; Medical Contacts</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
          <span>Campus Health Centre Doctor</span>
          <a href="tel:0802345678" style={{ color: 'var(--deep-purple)', fontWeight: 700 }}>080-2345678</a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '10px 14px', background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-sm)' }}>
          <span>Chief Warden &amp; 24/7 Security Desk</span>
          <a href="tel:0809988776" style={{ color: 'var(--deep-purple)', fontWeight: 700 }}>080-9988776</a>
        </div>
      </div>
    </div>
  );
}
