import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import TopNavbar from './components/TopNavbar';
import CrisisModal from './components/CrisisModal';
import FloatingChatbot from './components/FloatingChatbot';

import HomePage from './pages/HomePage';
import MoodPage from './pages/MoodPage';
import JournalPage from './pages/JournalPage';
import ResourcesPage from './pages/ResourcesPage';
import PeerRoomsPage from './pages/PeerRoomsPage';
import CounsellorPage from './pages/CounsellorPage';
import CampusInsightsPage from './pages/CampusInsightsPage';

// Scroll window to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  const [isCrisisOpen, setIsCrisisOpen] = useState(false);
  const [role, setRole] = useState('student');

  return (
    <div className="app-root">
      <ScrollToTop />

      {/* Animated Warm Pastel Ambient Blobs */}
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="blob blob-3" aria-hidden="true" />
      <div className="blob blob-4" aria-hidden="true" />

      {/* Liquid Glass Top Navbar */}
      <TopNavbar 
        onOpenCrisis={() => setIsCrisisOpen(true)} 
        role={role} 
        onToggleRole={setRole} 
      />

      {/* Main Content Area (Fills space to push footer to the end) */}
      <main className="main-content" role="main">
        <Routes>
          {/* Core Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/mood" element={<MoodPage />} />
          <Route path="/journal" element={<JournalPage onOpenCrisis={() => setIsCrisisOpen(true)} />} />
          <Route path="/resources" element={<ResourcesPage onOpenCrisis={() => setIsCrisisOpen(true)} />} />
          
          {/* Peer Rooms & Aliases (e.g. /peer-room, /peer-rooms, /rooms) */}
          <Route path="/peer-rooms" element={<PeerRoomsPage onOpenCrisis={() => setIsCrisisOpen(true)} />} />
          <Route path="/peer-room" element={<Navigate to="/peer-rooms" replace />} />
          <Route path="/peerrooms" element={<Navigate to="/peer-rooms" replace />} />
          <Route path="/peerroom" element={<Navigate to="/peer-rooms" replace />} />
          <Route path="/rooms" element={<Navigate to="/peer-rooms" replace />} />

          {/* Counsellor & Aliases */}
          <Route path="/counsellor" element={<CounsellorPage />} />
          <Route path="/counselor" element={<Navigate to="/counsellor" replace />} />
          <Route path="/booking" element={<Navigate to="/counsellor" replace />} />

          {/* Campus Insights & Aliases */}
          <Route path="/campus-insights" element={<CampusInsightsPage role={role} onToggleRole={setRole} />} />
          <Route path="/insights" element={<Navigate to="/campus-insights" replace />} />
          <Route path="/exam-insights" element={<Navigate to="/campus-insights" replace />} />

          {/* Utility Aliases */}
          <Route path="/checkin" element={<Navigate to="/mood" replace />} />
          <Route path="/self-help" element={<Navigate to="/resources" replace />} />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Full-Bleed Liquid Glass Footer — Pushed till the end of the website */}
      <footer className="app-footer" role="contentinfo">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.6)', boxShadow: '0 4px 12px rgba(123, 94, 167, 0.2)', flexShrink: 0 }}>
                  <img 
                    src="/MindEase_logo.jpeg" 
                    alt="MindEase Logo" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                  />
                </div>
                <h3 style={{ margin: 0 }}>MindEase</h3>
              </div>
              <p>
                A confidential, student-first mental health sanctuary designed to help university students de-stress, reflect, and thrive. Zero academic tracking.
              </p>
            </div>

            <div className="footer-links-group">
              <div className="footer-col">
                <h4>Navigation</h4>
                <ul>
                  <li><Link to="/">Home Overview</Link></li>
                  <li><Link to="/mood">Mood Check-in</Link></li>
                  <li><Link to="/journal">Private Journal</Link></li>
                  <li><Link to="/resources">Self-Help Hub</Link></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4>Support Circles</h4>
                <ul>
                  <li><Link to="/peer-rooms">Peer Support Rooms</Link></li>
                  <li><Link to="/counsellor">Book 1-on-1 Counsellor</Link></li>
                  <li><Link to="/campus-insights">Campus Stress Index</Link></li>
                </ul>
              </div>

              <div className="footer-col">
                <h4>Crisis Care (24/7)</h4>
                <ul>
                  <li>
                    <button
                      type="button"
                      onClick={() => setIsCrisisOpen(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#E91E63',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontFamily: 'inherit',
                        fontSize: '13px'
                      }}
                    >
                      🚨 Emergency Numbers
                    </button>
                  </li>
                  <li style={{ color: 'var(--text-mid)', fontSize: '12px' }}>Tele-MANAS: 14416 (India)</li>
                  <li style={{ color: 'var(--text-mid)', fontSize: '12px' }}>Suicide &amp; Crisis: 988 (US)</li>
                  <li style={{ color: 'var(--text-mid)', fontSize: '12px' }}>Campus Security: Ext 1111</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 MindEase Student Wellness. All rights reserved. Strictly confidential.</span>
            <span>If you are in acute immediate danger, please dial your local emergency services (112 / 911) right now.</span>
          </div>
        </div>
      </footer>

      {/* Floating Supportive AI Companion FAB */}
      <FloatingChatbot onOpenCrisis={() => setIsCrisisOpen(true)} />

      {/* Always Accessible Crisis Help Modal */}
      <CrisisModal isOpen={isCrisisOpen} onClose={() => setIsCrisisOpen(false)} />
    </div>
  );
}
