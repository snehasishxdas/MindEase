import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Heart, Sparkles, Smile, BookOpen, HeartHandshake, Users, Calendar, BarChart3, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <section className="section" style={{ minHeight: 'auto' }}>
      <div className="home-header">
        <div className="section-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <img 
            src="/MindEase_logo.jpeg" 
            alt="MindEase" 
            style={{ width: 18, height: 18, borderRadius: '5px', objectFit: 'cover', display: 'inline-block' }} 
          />
          <span>Welcome to MindEase</span>
        </div>
        <h1 className="section-title">
          Your space to breathe,<br />reflect, and grow 🌸
        </h1>
        <p className="section-subtitle">
          MindEase is your student-first mental wellness sanctuary. Check your daily mood, write in your private journal, explore calming self-help tools, or book a confidential 1-on-1 counselor session.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
          <span className="badge badge-lavender">
            <Lock style={{ width: 13, height: 13 }} />
            100% Private &amp; Anonymous
          </span>
          <span className="badge badge-mint">
            <Heart style={{ width: 13, height: 13 }} />
            Confidential Campus Care
          </span>
          <span className="badge badge-pink">
            <Sparkles style={{ width: 13, height: 13 }} />
            Safe AI Companion
          </span>
        </div>
      </div>

      {/* Feature Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        
        <Link to="/mood" className="glass-card" style={{ padding: 24, textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>😊</div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 6 }}>Daily Mood Check-in</h3>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 12 }}>
            1-tap mood scale, tag tracking, and personal trend charts to spot emotional exhaustion early.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--deep-purple)', fontSize: 12, fontWeight: 700 }}>
            <span>Check your mood</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </Link>

        <Link to="/journal" className="glass-card" style={{ padding: 24, textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>📖</div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 6 }}>Private Student Journal</h3>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 12 }}>
            Encrypted reflection space with optional sentiment analysis and privacy blur mask.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--deep-purple)', fontSize: 12, fontWeight: 700 }}>
            <span>Open private journal</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </Link>

        <Link to="/resources" className="glass-card" style={{ padding: 24, textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>🌿</div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 6 }}>Curated Self-Help Hub</h3>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 12 }}>
            Guided visual breathing orb, synthesized ambient sleep soundscapes, and study guides.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--deep-purple)', fontSize: 12, fontWeight: 700 }}>
            <span>Explore wellness tools</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </Link>

        <Link to="/peer-rooms" className="glass-card" style={{ padding: 24, textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>👥</div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 6 }}>Peer Support Circles</h3>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 12 }}>
            Moderated student topic rooms for exam pressure, dorm life, and daily wins under anonymous handles.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--deep-purple)', fontSize: 12, fontWeight: 700 }}>
            <span>Join peer circles</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </Link>

        <Link to="/counsellor" className="glass-card" style={{ padding: 24, textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>📅</div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 6 }}>Book Counsellor</h3>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 12 }}>
            1-click confidential appointment booking with campus psychologists. Free &amp; independent of transcripts.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--deep-purple)', fontSize: 12, fontWeight: 700 }}>
            <span>Schedule 1-on-1</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </Link>

        <Link to="/campus-insights" className="glass-card" style={{ padding: 24, textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>📊</div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 6 }}>Campus Insights</h3>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.5, marginBottom: 12 }}>
            Anonymized aggregated trends, campus stress index, and predictive exam-season stress curves.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--deep-purple)', fontSize: 12, fontWeight: 700 }}>
            <span>View aggregate data</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </Link>

      </div>
    </section>
  );
}
