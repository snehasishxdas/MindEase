import React, { useState } from 'react';
import { 
  BarChart3, 
  Flame, 
  ShieldCheck, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Download,
  Users,
  CheckCircle,
  Lightbulb,
  Building,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

export default function CampusInsightsPage({ role = 'admin', onToggleRole }) {
  // Sub-options in this 6th menu option:
  // 1: 'stress-index' (Campus Stress Index)
  // 2: 'exam-insights' (Exam-Season Stress Insights ★)
  // 3: 'clinic-capacity' (Clinic Capacity & Resource Allocation)
  const [activeSubTab, setActiveSubTab] = useState('exam-insights');
  const [hoveredWeek, setHoveredWeek] = useState(null);

  // Semester weeks data for Exam Season Timeline
  const semesterWeeks = [
    { week: 'W1', label: 'Orientation', stress: 28, exams: false },
    { week: 'W2', label: 'Classes Start', stress: 32, exams: false },
    { week: 'W3', label: 'Assignments', stress: 45, exams: false },
    { week: 'W4', label: 'Lab Reports', stress: 52, exams: false },
    { week: 'W5', label: 'Midterm Prep', stress: 68, exams: false },
    { week: 'W6', label: 'Midterms Week', stress: 88, exams: true },
    { week: 'W7', label: 'Recess / Rest', stress: 41, exams: false },
    { week: 'W8', label: 'Project Drafts', stress: 58, exams: false },
    { week: 'W9', label: 'Submissions', stress: 66, exams: false },
    { week: 'W10', label: 'Presentations', stress: 73, exams: false },
    { week: 'W11', label: 'Finals Prep', stress: 84, exams: false },
    { week: 'W12', label: 'Finals Week 1', stress: 94, exams: true },
    { week: 'W13', label: 'Finals Week 2', stress: 91, exams: true },
    { week: 'W14', label: 'Term End', stress: 35, exams: false },
  ];

  return (
    <section className="section" style={{ minHeight: 'auto' }}>
      
      {/* Editorial Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <div className="section-label">Faculty &amp; Health Administration</div>
        <h2 className="section-title">Campus Mental Health Index &amp; Insights 📊</h2>
        <p className="section-subtitle">
          Real-time aggregated mental health telemetry across academic departments. Provides campus leadership with actionable predictive early warnings while strictly preserving student anonymity.
        </p>
      </div>

      {/* Role Notice & K-Anonymity Privacy Guarantee Banner */}
      <div className="glass-card" style={{ 
        padding: '18px 24px', 
        marginBottom: '28px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '14px', 
        background: 'linear-gradient(135deg, rgba(201, 184, 232, 0.35), rgba(184, 232, 212, 0.25))', 
        borderColor: 'rgba(201, 184, 232, 0.7)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(123, 94, 167, 0.12)' }}>
            <ShieldCheck className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--deep-purple)' }}>
              Differential Privacy &amp; K-Anonymity Threshold: k ≥ 25 Students
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginTop: '2px' }}>
              Zero individual journals, names, or IP addresses are linked. Only aggregated cohort trends are computed.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-mid)', fontWeight: 500 }}>Access Portal:</span>
          <button
            type="button"
            onClick={() => onToggleRole && onToggleRole(role === 'admin' ? 'student' : 'admin')}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600 }}
          >
            {role === 'admin' ? '🔒 Campus Admin Mode' : '👤 Student Preview Mode'}
          </button>
        </div>
      </div>

      {/* 6th Menu Sub-Options Dock (Segmented Liquid Glass Tabs) */}
      <div className="insights-subtabs-dock">
        <button
          type="button"
          onClick={() => setActiveSubTab('stress-index')}
          className={`insights-subtab-btn ${activeSubTab === 'stress-index' ? 'active' : ''}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Campus Stress Index</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('exam-insights')}
          className={`insights-subtab-btn ${activeSubTab === 'exam-insights' ? 'active' : ''}`}
        >
          <Flame className="w-4 h-4" />
          <span>Exam-Season Stress Insights ★</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('clinic-capacity')}
          className={`insights-subtab-btn ${activeSubTab === 'clinic-capacity' ? 'active' : ''}`}
        >
          <Users className="w-4 h-4" />
          <span>Clinic Capacity &amp; Triage</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-OPTION 2: Exam-Season Stress Insights ★ (Primary)   */}
      {/* ======================================================== */}
      {activeSubTab === 'exam-insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Executive Exam Summary KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px 22px', borderLeft: '4px solid #E91E63' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#C2185B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Finals Peak Alert</span>
                <span style={{ fontSize: '10px', background: '#FFF0F5', color: '#E91E63', padding: '2px 8px', borderRadius: '50px', fontWeight: 700 }}>Critical</span>
              </div>
              <div style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#E91E63', lineHeight: 1.1 }}>
                Week 12
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginTop: '4px' }}>
                Projected 94% student stress peak
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px 22px', borderLeft: '4px solid var(--deep-purple)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--deep-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sleep Deficit</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', color: '#C2185B', fontWeight: 700 }}>
                  <ArrowUpRight className="w-3.5 h-3.5" /> +42%
                </span>
              </div>
              <div style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--deep-purple)', lineHeight: 1.1 }}>
                &gt; 2:00 AM
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginTop: '4px' }}>
                Late-night study check-in volume surge
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px 22px', borderLeft: '4px solid #166534' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Somatic Relief</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', color: '#166534', fontWeight: 700 }}>
                  <TrendingUp className="w-3.5 h-3.5" /> +18%
                </span>
              </div>
              <div style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#166534', lineHeight: 1.1 }}>
                68%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginTop: '4px' }}>
                Students using guided breathing before exams
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px 22px', borderLeft: '4px solid #E65100' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#E65100', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Early Warning</span>
                <span style={{ fontSize: '10px', background: '#FFF3E0', color: '#E65100', padding: '2px 8px', borderRadius: '50px', fontWeight: 700 }}>Buffer</span>
              </div>
              <div style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#E65100', lineHeight: 1.1 }}>
                4.8 Days
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginTop: '4px' }}>
                Avg lead time before midterm burnouts
              </div>
            </div>
          </div>

          {/* 14-Week Semester Exam Stress Trajectory Visualization */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px 0' }}>14-Week Semester Stress Trajectory &amp; Exam Spikes</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-mid)', margin: 0 }}>
                  Aggregated from 1-tap student mood check-ins across 8 undergraduate faculties.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '14px', fontSize: '12px', alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-mid)' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--deep-purple)' }} />
                  Normal Curriculum
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#E91E63', fontWeight: 700 }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E91E63' }} />
                  Exam Peak Period
                </span>
              </div>
            </div>

            {/* Interactive Visual Bar Chart */}
            <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
              <div style={{ minWidth: '700px', height: '240px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingTop: '24px', position: 'relative' }}>
                
                {/* Horizontal guide lines */}
                <div style={{ position: 'absolute', top: '24px', left: 0, right: 0, borderTop: '1px dashed rgba(233, 30, 99, 0.25)', pointerEvents: 'none' }}>
                  <span style={{ position: 'absolute', right: 0, top: '-16px', fontSize: '10px', color: '#E91E63', fontWeight: 700 }}>100% Critical Alert</span>
                </div>
                <div style={{ position: 'absolute', top: '90px', left: 0, right: 0, borderTop: '1px dashed rgba(201, 184, 232, 0.4)', pointerEvents: 'none' }}>
                  <span style={{ position: 'absolute', right: 0, top: '-14px', fontSize: '9px', color: 'var(--text-light)' }}>75% Elevated</span>
                </div>
                <div style={{ position: 'absolute', top: '155px', left: 0, right: 0, borderTop: '1px dashed rgba(201, 184, 232, 0.4)', pointerEvents: 'none' }}>
                  <span style={{ position: 'absolute', right: 0, top: '-14px', fontSize: '9px', color: 'var(--text-light)' }}>50% Baseline</span>
                </div>

                {semesterWeeks.map((w, idx) => {
                  const barHeight = (w.stress / 100) * 170;
                  const isHovered = hoveredWeek === w.week;
                  return (
                    <div 
                      key={w.week} 
                      onMouseEnter={() => setHoveredWeek(w.week)}
                      onMouseLeave={() => setHoveredWeek(null)}
                      style={{ 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        height: '100%', 
                        justifyContent: 'flex-end',
                        cursor: 'pointer',
                        zIndex: 2
                      }}
                    >
                      {/* Peak Badge */}
                      {w.exams && (
                        <div style={{ 
                          fontSize: '9.5px', 
                          fontWeight: 800, 
                          color: '#E91E63', 
                          background: '#FFF0F5', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          border: '1px solid #F48FB1',
                          marginBottom: '6px',
                          whiteSpace: 'nowrap'
                        }}>
                          EXAMS
                        </div>
                      )}

                      {/* Stress bar */}
                      <div 
                        style={{
                          width: '100%',
                          maxWidth: '38px',
                          height: `${barHeight}px`,
                          borderRadius: '8px 8px 0 0',
                          background: w.exams 
                            ? 'linear-gradient(180deg, #F06292 0%, #E91E63 100%)' 
                            : isHovered 
                              ? 'linear-gradient(180deg, #D1C4E9 0%, var(--deep-purple) 100%)'
                              : 'linear-gradient(180deg, var(--lavender) 0%, #B39DDB 100%)',
                          boxShadow: w.exams ? '0 4px 16px rgba(233, 30, 99, 0.35)' : isHovered ? '0 4px 14px rgba(123, 94, 167, 0.25)' : 'none',
                          transform: isHovered ? 'translateY(-3px)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        title={`${w.label} (${w.week}): ${w.stress}% Campus Stress`}
                      />

                      {/* Week Label */}
                      <div style={{ marginTop: '8px', fontSize: '11px', fontWeight: isHovered ? 700 : 600, color: 'var(--text-dark)' }}>
                        {w.week}
                      </div>
                      <div style={{ fontSize: '9.5px', color: isHovered ? 'var(--deep-purple)' : 'var(--text-light)', fontWeight: isHovered ? 700 : 500, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {w.stress}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insight Takeaway Banner */}
            <div style={{ marginTop: '20px', padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lightbulb className="w-4 h-4 text-amber-700" />
              </div>
              <span style={{ fontSize: '12.5px', color: 'var(--text-dark)', lineHeight: 1.5 }}>
                <strong>Key Administrative Takeaway:</strong> Stress rises exponentially 10 days before Midterms (Week 6) and Finals (Week 12). Proactive wellness pop-ups launched in Weeks 4 and 10 show a <strong>28% reduction</strong> in acute clinical panic visits.
              </span>
            </div>
          </div>

          {/* Row: Top Pressure Factors + Leadership Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
            
            {/* Top Student Exam Pressure Factors */}
            <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '1.2rem', margin: '0 0 4px 0' }}>Top Self-Reported Exam Pressure Drivers</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-mid)', marginBottom: '18px' }}>
                  Aggregated from student reflection tags during exam periods
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { factor: 'Overlapping deadlines across multiple courses', pct: 86, color: '#E91E63' },
                    { factor: 'Sleep deprivation (< 5 hours nightly)', pct: 74, color: '#9C27B0' },
                    { factor: 'High fear of academic failure or grade drops', pct: 69, color: 'var(--deep-purple)' },
                    { factor: 'Lack of quiet, non-crowded campus study spaces', pct: 53, color: '#1E88E5' },
                    { factor: 'Difficulty retaining dense textbook material', pct: 44, color: '#43A047' }
                  ].map((item) => (
                    <div key={item.factor}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-dark)' }}>{item.factor}</span>
                        <strong style={{ color: item.color }}>{item.pct}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '7px', borderRadius: '50px', background: 'rgba(201, 184, 232, 0.25)', overflow: 'hidden' }}>
                        <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: '50px', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actionable Administrative Interventions */}
            <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '1.2rem', margin: '0 0 4px 0' }}>Campus Leadership Recommended Actions</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-mid)', marginBottom: '16px' }}>
                  Targeted structural interventions for Weeks 5–6 &amp; 11–13
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { title: 'Open Library 24/7 with Free Tea & Fruit', desc: 'Deploy quiet stations and hydration carts in Main Library Weeks 5-6 & 11-13.', status: 'Active' },
                    { title: 'Institute "No-Submission Sunday"', desc: 'Instruct faculty to prohibit major project deadlines on Sunday midnight.', status: 'Approved' },
                    { title: 'Therapy Dogs on Quad Lawn', desc: 'Host 2-hour certified canine de-stress sessions during midterm week.', status: 'Scheduled' },
                    { title: 'Drop-In 15-Minute Triage Booths', desc: 'Station counselors in Engineering and Science atriums for quick check-ins.', status: 'Active' }
                  ].map((action, idx) => (
                    <div key={idx} style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{action.title}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-mid)', marginTop: '2px' }}>{action.desc}</div>
                      </div>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        padding: '3px 10px', 
                        borderRadius: '50px', 
                        background: action.status === 'Active' ? 'var(--mint)' : action.status === 'Scheduled' ? 'var(--lavender)' : 'rgba(255, 240, 245, 0.9)',
                        color: action.status === 'Active' ? '#166534' : action.status === 'Scheduled' ? 'var(--deep-purple)' : '#C2185B',
                        flexShrink: 0,
                        marginLeft: '8px'
                      }}>
                        {action.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-OPTION 1: Campus Stress Index                       */}
      {/* ======================================================== */}
      {activeSubTab === 'stress-index' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 6px 0' }}>Stress Index Breakdown by Academic Faculty</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-mid)', marginBottom: '22px' }}>
              Minimum sample threshold: 50 student check-ins per department. No individual scores shown.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { faculty: 'Faculty of Engineering & CS', score: 78, change: '+14% this week', alert: 'Elevated', students: '340 students' },
                { faculty: 'Faculty of Medicine & Nursing', score: 82, change: '+18% this week', alert: 'High', students: '220 students' },
                { faculty: 'Faculty of Law & Governance', score: 71, change: '+6% this week', alert: 'Moderate', students: '185 students' },
                { faculty: 'Faculty of Arts & Humanities', score: 54, change: '-4% this week', alert: 'Stable', students: '290 students' },
                { faculty: 'School of Business & Finance', score: 65, change: '+3% this week', alert: 'Moderate', students: '310 students' },
                { faculty: 'Faculty of Science & Math', score: 74, change: '+9% this week', alert: 'Elevated', students: '260 students' }
              ].map((f) => (
                <div key={f.faculty} style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-dark)' }}>{f.faculty}</div>
                        <div style={{ fontSize: '11px', color: f.change.startsWith('+') ? '#C2185B' : '#166534', marginTop: '2px', fontWeight: 600 }}>
                          {f.change}
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: '50px',
                        background: f.alert === 'High' ? '#FFF0F5' : f.alert === 'Elevated' ? 'var(--dusty-rose)' : 'var(--mint)',
                        color: f.alert === 'High' ? '#C2185B' : f.alert === 'Elevated' ? '#881337' : '#166534'
                      }}>
                        {f.alert}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '16px 0 8px 0' }}>
                      <span style={{ fontSize: '2.2rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1 }}>
                        {f.score}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>/ 100 Index</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ width: '100%', height: '7px', borderRadius: '50px', background: 'rgba(201, 184, 232, 0.25)', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ width: `${f.score}%`, height: '100%', background: 'linear-gradient(90deg, var(--lavender), var(--deep-purple))', borderRadius: '50px' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>Cohort size: {f.students}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-OPTION 3: Clinic Capacity & Triage                  */}
      {/* ======================================================== */}
      {activeSubTab === 'clinic-capacity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 6px 0' }}>Mental Health Center Slot Utilization</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-mid)', marginBottom: '22px' }}>
              Real-time counselor capacity across both campus clinic locations and telehealth channels.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-mid)', fontWeight: 600 }}>Active Counselors on Duty</div>
                <div style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--deep-purple)', marginTop: '4px', lineHeight: 1.1 }}>
                  8 Providers
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-light)', marginTop: '6px' }}>Across 3 campus wellness clinics</div>
              </div>

              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-mid)', fontWeight: 600 }}>Average Booking Lead Time</div>
                <div style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: '#166534', marginTop: '4px', lineHeight: 1.1 }}>
                  &lt; 24 Hours
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-light)', marginTop: '6px' }}>Same-day crisis walk-in slots available</div>
              </div>

              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'white', border: '1px solid var(--card-border)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-mid)', fontWeight: 600 }}>Telehealth vs. In-Person</div>
                <div style={{ fontSize: '2.4rem', fontFamily: "'Playfair Display', serif", fontWeight: 700, color: 'var(--text-dark)', marginTop: '4px', lineHeight: 1.1 }}>
                  62% / 38%
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-light)', marginTop: '6px' }}>Students prefer confidential video sessions</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Export / Compliance Footer Note */}
      <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
          Audit Report ID: <strong>AGG-2026-CAMPUS</strong> • Differential privacy guarantee validated.
        </span>

        <button 
          type="button" 
          onClick={() => alert('Generating encrypted aggregate campus compliance summary PDF...')}
          className="btn-secondary" 
          style={{ padding: '8px 16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Download className="w-3.5 h-3.5" /> Export Aggregate Report (PDF)
        </button>
      </div>

    </section>
  );
}
