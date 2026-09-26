import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Smile, 
  BookOpen, 
  HeartHandshake, 
  Users, 
  Calendar, 
  BarChart3, 
  PhoneCall, 
  CircleUserRound,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function TopNavbar({ onOpenCrisis, user, onLogout }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobile = () => setMobileMenuOpen(false);

  // Check if peer room is active (matching both /peer-rooms and /peer-room)
  const isPeerRoomsActive = location.pathname.startsWith('/peer-room');

  return (
    <header className="top-navbar" role="navigation" aria-label="Main Navigation">
      
      {/* Brand Logo */}
      <Link to="/" className="top-navbar-logo" onClick={closeMobile}>
        <div className="top-navbar-logo-icon">
          <img 
            src="/MindEase_logo.jpeg" 
            alt="MindEase Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '11px', display: 'block' }} 
          />
        </div>
        <div className="top-navbar-logo-text">
          <span className="top-navbar-brand">MindEase</span>
          <span className="top-navbar-tagline">Student Wellness</span>
        </div>
      </Link>

      {/* Desktop Nav Links (Liquid Glass Dock) */}
      <nav className="top-navbar-links" aria-label="Desktop Nav">
        <NavLink 
          to="/" 
          end 
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </NavLink>

        <NavLink 
          to="/mood" 
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <Smile className="w-4 h-4" />
          <span>Mood</span>
        </NavLink>

        <NavLink 
          to="/journal" 
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Journal</span>
        </NavLink>

        <NavLink 
          to="/resources" 
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Resources</span>
        </NavLink>

        <NavLink 
          to="/peer-rooms" 
          className={`top-nav-btn ${isPeerRoomsActive ? 'active' : ''}`}
        >
          <Users className="w-4 h-4" />
          <span>Peer Rooms</span>
        </NavLink>

        <NavLink 
          to="/counsellor" 
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <Calendar className="w-4 h-4" />
          <span>Counsellor</span>
        </NavLink>

        <NavLink 
          to="/campus-insights" 
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Campus Insights</span>
        </NavLink>
      </nav>

      {/* Right Actions */}
      <div className="top-navbar-actions">
        <span className="navbar-user-name">{user?.full_name}</span>
        <NavLink to="/account" className="account-nav-link" aria-label="Account and activity">
          <CircleUserRound style={{ width: 17, height: 17 }} />
          <span>Account</span>
        </NavLink>
        <button className="account-logout-button" type="button" onClick={onLogout} aria-label="Sign out">
          <LogOut style={{ width: 16, height: 16 }} />
          <span>Sign out</span>
        </button>

        {/* ALWAYS-VISIBLE 'Get Help Now' Emergency Button */}
        <button 
          onClick={onOpenCrisis} 
          className="btn-crisis-nav" 
          aria-label="Open emergency crisis resources"
          type="button"
        >
          <PhoneCall style={{ width: 14, height: 14 }} />
          <span>Get Help Now</span>
        </button>

        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-menu-toggle"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
        </button>
      </div>

      {/* Mobile Slide-Down Liquid Glass Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <NavLink 
          to="/" 
          end 
          onClick={closeMobile}
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </NavLink>

        <NavLink 
          to="/mood" 
          onClick={closeMobile}
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <Smile className="w-4 h-4" />
          <span>Mood Check-in</span>
        </NavLink>

        <NavLink 
          to="/journal" 
          onClick={closeMobile}
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Private Journal</span>
        </NavLink>

        <NavLink 
          to="/resources" 
          onClick={closeMobile}
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Self-Help Resources</span>
        </NavLink>

        <NavLink 
          to="/peer-rooms" 
          onClick={closeMobile}
          className={`top-nav-btn ${isPeerRoomsActive ? 'active' : ''}`}
        >
          <Users className="w-4 h-4" />
          <span>Peer Support Rooms</span>
        </NavLink>

        <NavLink 
          to="/counsellor" 
          onClick={closeMobile}
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <Calendar className="w-4 h-4" />
          <span>Book Counsellor</span>
        </NavLink>

        <NavLink 
          to="/campus-insights" 
          onClick={closeMobile}
          className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Campus Insights</span>
        </NavLink>
        <NavLink to="/account" onClick={closeMobile} className={({ isActive }) => `top-nav-btn ${isActive ? 'active' : ''}`}>
          <CircleUserRound className="w-4 h-4" />
          <span>Account &amp; Activity</span>
        </NavLink>
        <button type="button" className="top-nav-btn mobile-signout" onClick={() => { closeMobile(); onLogout(); }}>
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>

    </header>
  );
}
