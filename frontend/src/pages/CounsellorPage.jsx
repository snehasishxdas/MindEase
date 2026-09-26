import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  Building2, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  X, 
  AlertCircle,
  Download,
  Trash2,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '../api';

const COUNSELLORS = [
  {
    id: 'c1',
    name: 'Dr. Ananya Sharma, Ph.D.',
    role: 'Licensed Clinical Psychologist',
    specialties: ['Academic Burnout', 'Panic Disorder', 'Anxiety'],
    languages: 'English, Hindi',
    location: 'Student Health Centre, Room 204',
    rating: '4.9/5 (180+ sessions)',
    slots: ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM']
  },
  {
    id: 'c2',
    name: 'Prof. David Lee, M.S., LPC',
    role: 'University Mental Health Counselor',
    specialties: ['ADHD Coping', 'Depression', 'Sleep Disruption'],
    languages: 'English, Mandarin',
    location: 'Wellness Annex, Cabin B',
    rating: '4.8/5 (140+ sessions)',
    slots: ['09:30 AM', '01:00 PM', '03:15 PM', '05:00 PM']
  },
  {
    id: 'c3',
    name: 'Priya Mukherjee, M.Phil',
    role: 'Psychotherapist & Mindfulness Facilitator',
    specialties: ['Imposter Syndrome', 'First-Year Adjustment', 'Relationship Stress'],
    languages: 'English, Bengali, Hindi',
    location: 'Student Health Centre, Room 208',
    rating: '4.9/5 (210+ sessions)',
    slots: ['11:00 AM', '12:15 PM', '02:45 PM', '04:00 PM']
  }
];

export default function CounsellorPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedCounsellor, setSelectedCounsellor] = useState(null);
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingMode, setBookingMode] = useState('In-Person'); // In-Person, Video, Audio
  const [studentNote, setStudentNote] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastBooked, setLastBooked] = useState(null);

  useEffect(() => {
    apiRequest('/api/bookings')
      .then(rows => setBookings(rows.map(row => ({
        ...row,
        id: row.id,
        counsellorId: row.counsellor_id,
        counsellorName: row.counsellor_name,
        date: row.booking_date,
        time: row.booking_time,
        bookedAt: row.created_at,
      })))).catch(() => setBookings([]));
  }, []);

  const openBookingModal = (counsellor) => {
    setSelectedCounsellor(counsellor);
    setSelectedSlot(counsellor.slots[0]);
  };

  const closeBookingModal = () => {
    setSelectedCounsellor(null);
    setStudentNote('');
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedCounsellor || !selectedSlot) return;

    const booking = {
      counsellorId: selectedCounsellor.id,
      counsellorName: selectedCounsellor.name,
      role: selectedCounsellor.role,
      location: selectedCounsellor.location,
      date: bookingDate,
      time: selectedSlot,
      mode: bookingMode,
      note: studentNote.trim(),
    };

    let newBooking;
    try {
      const saved = await apiRequest('/api/bookings', { method: 'POST', body: JSON.stringify(booking) });
      newBooking = { ...booking, ...saved, id: saved.id, bookedAt: saved.created_at };
      setBookings(prev => [newBooking, ...prev]);
    } catch {
      alert('The appointment could not be booked. Please try again.');
      return;
    }

    setLastBooked(newBooking);
    setSelectedCounsellor(null);
    setStudentNote('');
    setIsSuccessModalOpen(true);
  };

  const cancelBooking = async (id) => {
    if (window.confirm('Are you sure you want to cancel this confidential appointment?')) {
      try {
        await apiRequest(`/api/bookings?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        setBookings(prev => prev.filter(b => b.id !== id));
      } catch {
        alert('The appointment could not be cancelled.');
      }
    }
  };

  // Generate .ics calendar file
  const downloadIcs = (booking) => {
    const cleanDate = booking.date.replace(/-/g, '');
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MindEase//Student Wellness Counsellor//EN',
      'BEGIN:VEVENT',
      `UID:${booking.id}@mindease.edu`,
      `SUMMARY:MindEase Confidential Session with ${booking.counsellorName}`,
      `DESCRIPTION:Mode: ${booking.mode}. Strictly confidential campus wellness support session.`,
      `LOCATION:${booking.location}`,
      `DTSTART;VALUE=DATE:${cleanDate}`,
      `DTEND;VALUE=DATE:${cleanDate}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `MindEase-Session-${booking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="section">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="section-label">Confidential Clinical Care</div>
        <h2>One-Click Counsellor Booking</h2>
        <p className="text-secondary" style={{ maxWidth: '640px' }}>
          Schedule private, zero-cost 1-on-1 sessions with licensed university mental health professionals. No academic record tracking.
        </p>
      </div>

      {/* Confidentiality Guarantee Banner */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(184, 232, 212, 0.25)', borderColor: 'rgba(184, 232, 212, 0.7)' }}>
        <div style={{ 
          width: '38px', 
          height: '38px', 
          borderRadius: '50%', 
          background: 'var(--mint)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <ShieldCheck className="w-5 h-5 text-emerald-800" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#14532d' }}>
            Strict Privacy & Medical Confidentiality
          </div>
          <p style={{ fontSize: '12px', color: '#166534', margin: '2px 0 0 0' }}>
            Under FERPA and HIPAA standards, your bookings are never disclosed to your professors, advisors, or parents. Free for all enrolled students.
          </p>
        </div>
      </div>

      {/* Active User Bookings Section */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Your Scheduled Appointments</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 600 }}>
            {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗓️</div>
            <div className="empty-state-title">No upcoming appointments scheduled</div>
            <p className="empty-state-desc">
              Choose an available counselor below and book a confidential 45-minute check-in in under 30 seconds.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {bookings.map((b) => (
              <div key={b.id} className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--deep-purple)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--lavender)', color: 'var(--deep-purple)', padding: '2px 8px', borderRadius: '50px' }}>
                      REF: {b.id}
                    </span>
                    <h4 style={{ margin: '8px 0 2px 0', fontSize: '1.1rem' }}>{b.counsellorName}</h4>
                    <div style={{ fontSize: '12px', color: 'var(--text-mid)' }}>{b.role}</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => cancelBooking(b.id)} 
                    title="Cancel booking"
                    style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 className="w-4 h-4 hover:text-rose-600" />
                  </button>
                </div>

                <div style={{ margin: '14px 0', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.6)', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
                    <Calendar className="w-4 h-4 text-purple-700" />
                    <strong>{b.date}</strong> at <strong>{b.time}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-mid)' }}>
                    {b.mode === 'Video' ? <Video className="w-4 h-4" /> : b.mode === 'Audio' ? <Phone className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    <span>{b.mode} • {b.location}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    onClick={() => downloadIcs(b)} 
                    className="btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download className="w-3.5 h-3.5" /> Add to Calendar (.ics)
                  </button>

                  <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                    Booked {b.bookedAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Counsellors Directory */}
      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Available University Counselors</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {COUNSELLORS.map((c) => (
            <div key={c.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--lavender), var(--dusty-rose))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--deep-purple)',
                  flexShrink: 0
                }}>
                  {c.name.split(' ')[1]?.[0] || 'C'}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '1.15rem' }}>{c.name}</h4>
                  <div style={{ fontSize: '12px', color: 'var(--deep-purple)', fontWeight: 600 }}>{c.role}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-light)', marginTop: '2px' }}>{c.rating}</div>
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '8px 0 14px 0' }}>
                {c.specialties.map(spec => (
                  <span key={spec} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.7)', padding: '3px 8px', borderRadius: '50px', border: '1px solid var(--card-border)', color: 'var(--text-mid)' }}>
                    {spec}
                  </span>
                ))}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Languages:</strong> {c.languages}</div>
                <div><strong>Office:</strong> {c.location}</div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--card-border)' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => openBookingModal(c)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Calendar className="w-4 h-4" /> Book Appointment (1-Click)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Form Modal */}
      {selectedCounsellor && (
        <div className="modal-overlay-custom" onClick={closeBookingModal}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.35rem' }}>Book 1-on-1 Session</h3>
                <p className="text-muted" style={{ margin: '2px 0 0 0', fontSize: '12.5px' }}>
                  with {selectedCounsellor.name}
                </p>
              </div>
              <button 
                type="button" 
                onClick={closeBookingModal} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mid)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Date selection */}
              <div>
                <label className="input-label" style={{ marginBottom: '6px' }}>Choose Preferred Date</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={bookingDate} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required 
                />
              </div>

              {/* Slot selection */}
              <div>
                <label className="input-label" style={{ marginBottom: '6px' }}>Available 45-Min Slots</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {selectedCounsellor.slots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: selectedSlot === slot ? 'var(--deep-purple)' : 'var(--card-border)',
                        background: selectedSlot === slot ? 'var(--lavender)' : 'white',
                        color: selectedSlot === slot ? 'var(--deep-purple)' : 'var(--text-dark)',
                        fontWeight: selectedSlot === slot ? 700 : 500,
                        fontSize: '12.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consultation Format */}
              <div>
                <label className="input-label" style={{ marginBottom: '6px' }}>Consultation Format</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['In-Person', 'Video', 'Audio'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setBookingMode(mode)}
                      style={{
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: bookingMode === mode ? 'var(--deep-purple)' : 'var(--card-border)',
                        background: bookingMode === mode ? 'var(--lavender)' : 'white',
                        color: bookingMode === mode ? 'var(--deep-purple)' : 'var(--text-mid)',
                        fontWeight: bookingMode === mode ? 700 : 500,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="input-label" style={{ marginBottom: '6px' }}>Private Note for Counselor (Optional)</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  placeholder="e.g. Struggling with thesis deadline anxiety..."
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={closeBookingModal} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Success Modal */}
      {isSuccessModalOpen && lastBooked && (
        <div className="modal-overlay-custom" onClick={() => setIsSuccessModalOpen(false)}>
          <div className="modal-content-custom" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'var(--mint)', 
              margin: '0 auto 16px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 className="w-8 h-8 text-emerald-800" />
            </div>

            <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px 0' }}>Session Confirmed</h3>
            <p className="text-secondary" style={{ fontSize: '13px', margin: '0 0 20px 0' }}>
              Your confidential session with <strong>{lastBooked.counsellorName}</strong> is reserved for <strong>{lastBooked.date} at {lastBooked.time}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                type="button" 
                onClick={() => { downloadIcs(lastBooked); setIsSuccessModalOpen(false); }}
                className="btn-primary"
                style={{ justifyContent: 'center' }}
              >
                <Download className="w-4 h-4" /> Save to Calendar (.ics)
              </button>
              <button 
                type="button" 
                onClick={() => setIsSuccessModalOpen(false)}
                className="btn-secondary"
                style={{ justifyContent: 'center' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
