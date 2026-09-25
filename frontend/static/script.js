/* ═══════════════════════════════════════════════════════════════
   MindEase — script.js (Interactive Logic, Web Audio API, & Storage)
   ═══════════════════════════════════════════════════════════════ */

// ─── API Config ───────────────────────────────────────────────
const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:') && window.location.port !== '5000' 
  ? 'http://127.0.0.1:5000' : '';

// ─── DOM Ready ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTopNavbar();
  initMoodCheckin();
  initJournal();
  initSelfHelp();
  initPeerRooms();
  initCounsellorBooking();
  initCampusInsights();
  initCrisisModal();
  initFloatingChatbot();
});

/* ═══════════════════════════════════════════════════════════
   TOP NAVBAR & NAVIGATION
   ═══════════════════════════════════════════════════════════ */
function initTopNavbar() {
  const navBtns = document.querySelectorAll('.top-nav-btn');
  const sections = document.querySelectorAll('.section');
  const roleToggleBtn = document.getElementById('role-toggle-btn');
  const roleLabelText = document.getElementById('role-label-text');

  let currentRole = localStorage.getItem('mindease_role') || 'student';
  if (roleLabelText) {
    roleLabelText.textContent = currentRole === 'student' ? 'Student View' : 'Campus Admin';
  }

  if (roleToggleBtn) {
    roleToggleBtn.addEventListener('click', () => {
      currentRole = currentRole === 'student' ? 'admin' : 'student';
      localStorage.setItem('mindease_role', currentRole);
      roleLabelText.textContent = currentRole === 'student' ? 'Student View' : 'Campus Admin';

      if (currentRole === 'admin') {
        const insightsSec = document.getElementById('campus-insights');
        if (insightsSec) insightsSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Smooth click scroll
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // IntersectionObserver to update active navbar button
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = '#' + entry.target.id;
        navBtns.forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('href') === id);
        });
      }
    });
  }, { threshold: 0.25, rootMargin: '-10% 0px -50% 0px' });

  sections.forEach(sec => observer.observe(sec));
}

/* ═══════════════════════════════════════════════════════════
   FEATURE 1: DAILY MOOD CHECK-IN & TREND CHART
   ═══════════════════════════════════════════════════════════ */
function initMoodCheckin() {
  const moodBtns = document.querySelectorAll('.mood-choice-btn');
  const tagBtns = document.querySelectorAll('#mood-tags-container .tag-btn');
  const noteInput = document.getElementById('mood-note-input');
  const saveBtn = document.getElementById('mood-save-btn');
  const successToast = document.getElementById('mood-success-toast');
  const chartWrapper = document.getElementById('mood-chart-wrapper');
  const streakBadge = document.getElementById('mood-streak-badge');
  const historyList = document.getElementById('mood-history-list');

  let selectedScore = null;
  let selectedLabel = null;
  let selectedTags = [];

  // Mood selection
  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedScore = parseInt(btn.dataset.score);
      selectedLabel = btn.dataset.label;
    });
  });

  // Tag selection
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const tag = btn.dataset.tag;
      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
      } else {
        selectedTags.push(tag);
      }
    });
  });

  // Load saved moods from localStorage
  const getSavedMoods = () => {
    try {
      return JSON.parse(localStorage.getItem('mindease_moods')) || [];
    } catch {
      return [];
    }
  };

  const saveMoods = (moods) => {
    localStorage.setItem('mindease_moods', JSON.stringify(moods));
  };

  // Render dynamic SVG trend chart
  const renderTrendChart = () => {
    const moods = getSavedMoods();
    streakBadge.textContent = `${moods.length} Check-ins`;

    if (moods.length === 0) {
      chartWrapper.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">😊</div>
          <div class="empty-state-title">No Check-ins Logged Yet</div>
          <div class="empty-state-desc">Select your mood on the left to start mapping your personal emotional curve!</div>
        </div>
      `;
      historyList.innerHTML = '';
      return;
    }

    // Prepare points from last 7 entries
    const recent = [...moods].reverse().slice(-7);
    const W = 400;
    const H = 120;
    const points = recent.map((m, idx) => {
      const x = recent.length === 1 ? W / 2 : (idx / (recent.length - 1)) * (W - 40) + 20;
      const y = H - 15 - ((m.score - 1) / 4) * (H - 40);
      const dateStr = new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      return { x, y, score: m.score, label: m.label, date: dateStr };
    });

    const pathData = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
    const areaData = points.length > 1
      ? `${pathData} L ${points[points.length - 1].x} ${H - 5} L ${points[0].x} ${H - 5} Z`
      : '';

    chartWrapper.innerHTML = `
      <div style="height: 140px; width: 100%; position: relative;">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%; height:100%; overflow:visible;">
          <defs>
            <linearGradient id="moodPastelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#C9B8E8" stop-opacity="0.45"/>
              <stop offset="100%" stop-color="#C9B8E8" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <line x1="0" y1="20" x2="${W}" y2="20" stroke="rgba(201,184,232,0.3)" stroke-dasharray="3 3"/>
          <line x1="0" y1="60" x2="${W}" y2="60" stroke="rgba(201,184,232,0.3)" stroke-dasharray="3 3"/>
          <line x1="0" y1="100" x2="${W}" y2="100" stroke="rgba(201,184,232,0.3)" stroke-dasharray="3 3"/>
          ${areaData ? `<path d="${areaData}" fill="url(#moodPastelGrad)"/>` : ''}
          ${pathData ? `<path d="${pathData}" fill="none" stroke="#7B5EA7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
          ${points.map(p => `
            <circle cx="${p.x}" cy="${p.y}" r="4" fill="#7B5EA7" stroke="white" stroke-width="2"/>
            <text x="${p.x}" y="${H}" text-anchor="middle" font-size="8" fill="#9B8AAD" font-family="DM Sans, sans-serif">${p.date}</text>
          `).join('')}
        </svg>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-light); border-top:1px solid var(--card-border); padding-top:6px; margin-top:6px;">
        <span>1: Overwhelmed</span>
        <span>3: Okay</span>
        <span>5: Thriving</span>
      </div>
    `;

    // Render recent logs
    historyList.innerHTML = `
      <div style="font-size:11px; font-weight:700; color:var(--text-light); text-transform:uppercase; margin-bottom:8px;">Recent Check-ins</div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${moods.slice(0, 3).map(m => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(255,255,255,0.6); border-radius:var(--radius-sm); font-size:12px;">
            <div>
              <strong>${m.label}</strong> ${m.note ? `<span style="color:var(--text-mid); font-size:11px;">— ${m.note}</span>` : ''}
            </div>
            <span style="font-size:10px; color:var(--text-light);">${new Date(m.timestamp).toLocaleDateString([], { month:'short', day:'numeric' })}</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  renderTrendChart();

  // Save check-in
  saveBtn.addEventListener('click', () => {
    if (!selectedScore) {
      alert('Please select your mood rating above first.');
      return;
    }

    const note = noteInput.value.trim();
    const newEntry = {
      id: Date.now(),
      score: selectedScore,
      label: selectedLabel,
      tags: selectedTags,
      note,
      timestamp: new Date().toISOString()
    };

    const moods = getSavedMoods();
    moods.unshift(newEntry);
    saveMoods(moods);

    // Reset
    noteInput.value = '';
    selectedTags = [];
    tagBtns.forEach(b => b.classList.remove('active'));
    moodBtns.forEach(b => b.classList.remove('active'));
    selectedScore = null;

    successToast.style.display = 'block';
    setTimeout(() => { successToast.style.display = 'none'; }, 2500);

    renderTrendChart();
  });
}

/* ═══════════════════════════════════════════════════════════
   FEATURE 2: PRIVATE JOURNAL WITH SENTIMENT ANALYSIS
   ═══════════════════════════════════════════════════════════ */
function initJournal() {
  const contentInput = document.getElementById('journal-content-input');
  const titleInput = document.getElementById('journal-title-input');
  const tagsInput = document.getElementById('journal-tags-input');
  const saveBtn = document.getElementById('journal-save-btn');
  const privacyToggleBtn = document.getElementById('journal-privacy-toggle');
  const searchInput = document.getElementById('journal-search-input');
  const entriesContainer = document.getElementById('journal-entries-container');
  const promptChips = document.querySelectorAll('.prompt-chip');
  const sentimentPreview = document.getElementById('journal-sentiment-preview');
  const sentimentToneText = document.getElementById('sentiment-tone-text');

  let privacyActive = false;

  // Prompts
  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const p = chip.dataset.prompt;
      contentInput.value = contentInput.value ? contentInput.value + '\n\n' + p + '\n' : p + '\n\n';
      contentInput.focus();
      triggerSentimentScan();
    });
  });

  // Privacy Shield
  privacyToggleBtn.addEventListener('click', () => {
    privacyActive = !privacyActive;
    privacyToggleBtn.innerHTML = privacyActive
      ? '<i data-lucide="eye-off" style="width:16px;height:16px;"></i><span>Privacy Shield: ON</span>'
      : '<i data-lucide="eye" style="width:16px;height:16px;"></i><span>Privacy Shield: Off</span>';
    lucide.createIcons();

    contentInput.classList.toggle('privacy-blur-active', privacyActive);
    document.querySelectorAll('.journal-entry-body').forEach(el => {
      el.classList.toggle('privacy-blur-active', privacyActive);
    });
  });

  // Client-side sentiment analyzer
  function triggerSentimentScan() {
    const text = contentInput.value.toLowerCase();
    if (!text.trim()) {
      sentimentPreview.style.display = 'none';
      return;
    }

    sentimentPreview.style.display = 'flex';
    const positiveWords = ['grateful', 'calm', 'peace', 'happy', 'relieved', 'proud', 'hopeful', 'good', 'joy'];
    const stressWords = ['exhausted', 'overwhelmed', 'anxious', 'stress', 'fear', 'scared', 'panic', 'crying', 'sad'];

    let pos = 0, stress = 0;
    positiveWords.forEach(w => { if (text.includes(w)) pos++; });
    stressWords.forEach(w => { if (text.includes(w)) stress++; });

    if (stress > pos) {
      sentimentToneText.textContent = 'Vulnerable & Stressed';
      sentimentToneText.style.color = '#9c274d';
    } else if (pos > stress) {
      sentimentToneText.textContent = 'Hopeful & Grounded';
      sentimentToneText.style.color = '#1b6844';
    } else {
      sentimentToneText.textContent = 'Reflective & Neutral';
      sentimentToneText.style.color = 'var(--deep-purple)';
    }
  }

  contentInput.addEventListener('input', triggerSentimentScan);

  const getSavedJournals = () => {
    try {
      return JSON.parse(localStorage.getItem('mindease_journals')) || [];
    } catch {
      return [];
    }
  };

  const saveJournals = (list) => {
    localStorage.setItem('mindease_journals', JSON.stringify(list));
  };

  const renderJournalList = (filterQuery = '') => {
    const all = getSavedJournals();
    const filtered = all.filter(e => 
      e.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      e.content.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (e.tags && e.tags.some(t => t.toLowerCase().includes(filterQuery.toLowerCase())))
    );

    if (all.length === 0) {
      entriesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📖</div>
          <div class="empty-state-title">Your Journal is Blank</div>
          <div class="empty-state-desc">Write your first reflection on the left to start building your private self-care archive!</div>
        </div>
      `;
      return;
    }

    if (filtered.length === 0) {
      entriesContainer.innerHTML = '<p style="text-align:center; color:var(--text-light); font-size:12px; padding:20px 0;">No entries match your search query.</p>';
      return;
    }

    entriesContainer.innerHTML = filtered.map(entry => `
      <div style="padding:14px; background:rgba(255,255,255,0.7); border-radius:var(--radius-md); border:1px solid var(--card-border); margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
          <div>
            <strong style="font-size:13px; color:var(--text-dark);">${entry.title}</strong>
            <div style="font-size:10px; color:var(--text-light);">${new Date(entry.timestamp).toLocaleDateString([], { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
          </div>
          <button class="delete-journal-btn" data-id="${entry.id}" style="background:none; border:none; color:var(--text-light); cursor:pointer; font-size:12px;" title="Delete entry">✕</button>
        </div>
        <p class="journal-entry-body ${privacyActive ? 'privacy-blur-active' : ''}" style="font-size:12px; color:var(--text-mid); line-height:1.5; margin:6px 0;">
          ${entry.content}
        </p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <span class="sentiment-pill ${entry.sentimentTone && entry.sentimentTone.includes('Stressed') ? 'sentiment-vulnerable' : entry.sentimentTone && entry.sentimentTone.includes('Hopeful') ? 'sentiment-positive' : 'sentiment-neutral'}">
            ${entry.sentimentTone || 'Reflective'}
          </span>
          <div style="display:flex; gap:4px;">
            ${(entry.tags || []).map(t => `<span style="font-size:9px; background:rgba(201,184,232,0.3); padding:2px 6px; border-radius:4px; color:var(--deep-purple);">#${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');

    // Attach delete listeners
    document.querySelectorAll('.delete-journal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const updated = getSavedJournals().filter(e => e.id !== id);
        saveJournals(updated);
        renderJournalList(searchInput ? searchInput.value : '');
      });
    });
  };

  renderJournalList();

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderJournalList(e.target.value);
    });
  }

  saveBtn.addEventListener('click', () => {
    const text = contentInput.value.trim();
    if (!text) {
      alert('Please write some thoughts before saving.');
      return;
    }

    const title = titleInput.value.trim() || 'Daily Reflection';
    const rawTags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
    const tone = sentimentToneText.textContent;

    const newJournal = {
      id: Date.now(),
      title,
      content: text,
      tags: rawTags,
      sentimentTone: tone,
      timestamp: new Date().toISOString()
    };

    const all = getSavedJournals();
    all.unshift(newJournal);
    saveJournals(all);

    contentInput.value = '';
    titleInput.value = '';
    tagsInput.value = '';
    sentimentPreview.style.display = 'none';

    renderJournalList();
  });
}

/* ═══════════════════════════════════════════════════════════
   FEATURE 3: CURATED SELF-HELP HUB
   ═══════════════════════════════════════════════════════════ */
function initSelfHelp() {
  // Sub-tabs
  const tabBreathing = document.getElementById('tab-btn-breathing');
  const tabSleep = document.getElementById('tab-btn-sleep');
  const tabStudy = document.getElementById('tab-btn-study');

  const viewBreathing = document.getElementById('subview-breathing');
  const viewSleep = document.getElementById('subview-sleep');
  const viewStudy = document.getElementById('subview-study');

  const subTabs = [
    { btn: tabBreathing, view: viewBreathing },
    { btn: tabSleep, view: viewSleep },
    { btn: tabStudy, view: viewStudy }
  ];

  subTabs.forEach(item => {
    if (!item.btn) return;
    item.btn.addEventListener('click', () => {
      subTabs.forEach(t => {
        t.btn.classList.remove('active');
        t.view.style.display = 'none';
      });
      item.btn.classList.add('active');
      item.view.style.display = 'block';
      lucide.createIcons();
    });
  });

  // ── Breathing Exercise ──
  const patternBoxBtn = document.getElementById('pattern-box-btn');
  const patternRelaxBtn = document.getElementById('pattern-relax-btn');
  const orb = document.getElementById('breathe-orb-main');
  const phaseText = document.getElementById('breathe-phase-text');
  const countText = document.getElementById('breathe-count-text');
  const instructionText = document.getElementById('breathe-instruction-text');
  const toggleBreatheBtn = document.getElementById('breathe-toggle-btn');

  let breatheRunning = false;
  let breatheTimer = null;
  let currentPattern = 'box'; // 'box' | 'relax'

  const boxPhases = [
    { name: 'Inhale', cls: 'inhale', count: 4, hint: 'Breathe in slowly through your nose...' },
    { name: 'Hold', cls: 'hold', count: 4, hint: 'Hold gently... stay still and peaceful...' },
    { name: 'Exhale', cls: 'exhale', count: 4, hint: 'Breathe out slowly through your mouth...' },
    { name: 'Hold Empty', cls: 'hold', count: 4, hint: 'Rest at the bottom of the breath...' }
  ];

  const relaxPhases = [
    { name: 'Inhale', cls: 'inhale', count: 4, hint: 'Inhale calm deeply...' },
    { name: 'Hold', cls: 'hold', count: 7, hint: 'Hold the serenity inside...' },
    { name: 'Exhale', cls: 'exhale', count: 8, hint: 'Exhale all tension completely...' }
  ];

  patternBoxBtn.addEventListener('click', () => {
    patternBoxBtn.classList.add('active');
    patternRelaxBtn.classList.remove('active');
    currentPattern = 'box';
    stopBreathe();
  });

  patternRelaxBtn.addEventListener('click', () => {
    patternRelaxBtn.classList.add('active');
    patternBoxBtn.classList.remove('active');
    currentPattern = 'relax';
    stopBreathe();
  });

  function stopBreathe() {
    breatheRunning = false;
    clearInterval(breatheTimer);
    orb.className = 'breathe-orb';
    phaseText.textContent = 'Inhale';
    countText.textContent = '4';
    instructionText.textContent = 'Breathe in slowly through your nose...';
    toggleBreatheBtn.innerHTML = '<i data-lucide="play" style="width:16px;height:16px;"></i><span>Start Exercise</span>';
    lucide.createIcons();
  }

  function startBreathe() {
    breatheRunning = true;
    toggleBreatheBtn.innerHTML = '<i data-lucide="pause" style="width:16px;height:16px;"></i><span>Pause Exercise</span>';
    lucide.createIcons();

    const phases = currentPattern === 'box' ? boxPhases : relaxPhases;
    let phaseIdx = 0;

    function step() {
      if (!breatheRunning) return;
      const p = phases[phaseIdx];
      orb.className = 'breathe-orb ' + p.cls;
      phaseText.textContent = p.name;
      instructionText.textContent = p.hint;

      let c = p.count;
      countText.textContent = c;

      breatheTimer = setInterval(() => {
        c--;
        countText.textContent = c;
        if (c <= 0) {
          clearInterval(breatheTimer);
          phaseIdx = (phaseIdx + 1) % phases.length;
          setTimeout(step, 400);
        }
      }, 1000);
    }

    step();
  }

  toggleBreatheBtn.addEventListener('click', () => {
    if (breatheRunning) stopBreathe();
    else startBreathe();
  });

  // ── Procedural Web Audio Synthesizer ──
  let audioCtx = null;
  let activeSoundSource = null;
  let activeGainNode = null;
  let currentActiveSound = null;

  const soundBtns = document.querySelectorAll('.sound-card-btn');
  const soundIndicator = document.getElementById('active-sound-indicator');
  const volumeSlider = document.getElementById('sound-volume-slider');
  const stopSoundBtn = document.getElementById('sound-stop-btn');

  function getAudioContext() {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function stopAllAudio() {
    if (activeSoundSource) {
      try { activeSoundSource.stop(); } catch {}
      activeSoundSource = null;
    }
    soundBtns.forEach(b => b.classList.remove('active'));
    soundIndicator.style.display = 'none';
    currentActiveSound = null;
  }

  stopSoundBtn.addEventListener('click', stopAllAllSoundscapes);
  function stopAllAllSoundscapes() {
    stopAllAudio();
  }

  function playSoundscape(soundType) {
    if (currentActiveSound === soundType) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    currentActiveSound = soundType;

    const ctx = getAudioContext();
    const gainNode = ctx.createGain();
    const vol = (volumeSlider ? volumeSlider.value : 70) / 100;
    gainNode.gain.value = vol * 0.45;
    gainNode.connect(ctx.destination);
    activeGainNode = gainNode;

    // 2-second noise buffer
    const n = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    if (soundType === 'rain') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1100;
      src.connect(filter);
      filter.connect(gainNode);
    } else if (soundType === 'ocean') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 0.8;
      src.connect(filter);
      filter.connect(gainNode);
    } else if (soundType === 'forest') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      src.connect(filter);
      filter.connect(gainNode);
    } else {
      src.connect(gainNode);
    }

    src.start();
    activeSoundSource = src;

    soundBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.sound === soundType);
    });

    soundIndicator.textContent = `Playing: ${soundType.toUpperCase()}`;
    soundIndicator.style.display = 'inline-flex';
  }

  soundBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSoundscape(btn.dataset.sound);
    });
  });

  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      if (activeGainNode) {
        activeGainNode.gain.value = (volumeSlider.value / 100) * 0.45;
      }
    });
  }

  // ── Pomodoro Timer ──
  let pomoSeconds = 25 * 60;
  let pomoRunning = false;
  let pomoInterval = null;
  let pomoMode = 'focus';

  const timerDisplay = document.getElementById('pomodoro-timer-display');
  const togglePomoBtn = document.getElementById('pomodoro-toggle-btn');
  const resetPomoBtn = document.getElementById('pomodoro-reset-btn');
  const modeBadge = document.getElementById('pomodoro-mode-badge');

  function updateTimerText() {
    const mins = Math.floor(pomoSeconds / 60);
    const secs = pomoSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  togglePomoBtn.addEventListener('click', () => {
    if (pomoRunning) {
      clearInterval(pomoInterval);
      pomoRunning = false;
      togglePomoBtn.textContent = 'Resume Sprint';
    } else {
      pomoRunning = true;
      togglePomoBtn.textContent = 'Pause Sprint';
      pomoInterval = setInterval(() => {
        if (pomoSeconds > 0) {
          pomoSeconds--;
          updateTimerText();
        } else {
          // Switch mode
          if (pomoMode === 'focus') {
            pomoMode = 'break';
            pomoSeconds = 5 * 60;
            modeBadge.textContent = 'Gentle Rest Break ☕';
            modeBadge.className = 'badge badge-mint';
          } else {
            pomoMode = 'focus';
            pomoSeconds = 25 * 60;
            modeBadge.textContent = 'Deep Focus Session';
            modeBadge.className = 'badge badge-lavender';
          }
          updateTimerText();
        }
      }, 1000);
    }
  });

  resetPomoBtn.addEventListener('click', () => {
    clearInterval(pomoInterval);
    pomoRunning = false;
    pomoMode = 'focus';
    pomoSeconds = 25 * 60;
    togglePomoBtn.textContent = 'Start Sprint';
    modeBadge.textContent = 'Deep Focus Session';
    modeBadge.className = 'badge badge-lavender';
    updateTimerText();
  });
}

/* ═══════════════════════════════════════════════════════════
   FEATURE 4: PEER-SUPPORT GROUP ROOMS
   ═══════════════════════════════════════════════════════════ */
function initPeerRooms() {
  const roomBtns = document.querySelectorAll('.room-selector-btn');
  const feed = document.getElementById('peer-messages-feed');
  const roomTitle = document.getElementById('current-room-title');
  const form = document.getElementById('peer-message-form');
  const input = document.getElementById('peer-input-text');
  const handleBadge = document.getElementById('peer-current-handle');

  const anonymousHandles = ['CalmSparrow88', 'GentleOtter42', 'QuietPine19', 'WarmComet93', 'SereneLeaf55'];
  let currentHandle = localStorage.getItem('mindease_peer_handle');
  if (!currentHandle) {
    currentHandle = anonymousHandles[Math.floor(Math.random() * anonymousHandles.length)];
    localStorage.setItem('mindease_peer_handle', currentHandle);
  }
  if (handleBadge) handleBadge.textContent = currentHandle;

  let activeRoom = 'exam-stress';

  const roomNames = {
    'exam-stress': 'Exam Pressure & All-Nighters',
    'first-year': 'First-Year & Hostels',
    'imposter-syndrome': 'Imposter Syndrome & Future',
    'daily-gratitude': 'Daily Wins & Encouragement'
  };

  const getSavedRoomMsgs = () => {
    try {
      return JSON.parse(localStorage.getItem('mindease_peer_rooms')) || {
        'exam-stress': [],
        'first-year': [],
        'imposter-syndrome': [],
        'daily-gratitude': []
      };
    } catch {
      return { 'exam-stress': [], 'first-year': [], 'imposter-syndrome': [], 'daily-gratitude': [] };
    }
  };

  const saveRoomMsgs = (data) => {
    localStorage.setItem('mindease_peer_rooms', JSON.stringify(data));
  };

  function updateRoomCounts() {
    const data = getSavedRoomMsgs();
    Object.keys(roomNames).forEach(rid => {
      const el = document.getElementById(`room-count-${rid}`);
      if (el) el.textContent = `${(data[rid] || []).length} msgs`;
    });
  }

  function renderRoomFeed() {
    updateRoomCounts();
    const data = getSavedRoomMsgs();
    const messages = data[activeRoom] || [];

    if (messages.length === 0) {
      feed.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">No Messages In This Room Yet</div>
          <div class="empty-state-desc">Be the first peer to leave an encouraging thought, a study rant, or a supportive note!</div>
        </div>
      `;
      return;
    }

    feed.innerHTML = messages.map(msg => `
      <div style="padding:12px 16px; background:rgba(255,255,255,0.75); border-radius:var(--radius-sm); border:1px solid var(--card-border);">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;">
          <strong style="color:var(--deep-purple);">${msg.handle}</strong>
          <span style="color:var(--text-light);">${msg.time}</span>
        </div>
        <p style="font-size:12.5px; color:var(--text-dark); line-height:1.5;">${msg.text}</p>
      </div>
    `).join('');
  }

  roomBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roomBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRoom = btn.dataset.room;
      roomTitle.textContent = roomNames[activeRoom];
      renderRoomFeed();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const data = getSavedRoomMsgs();
    const newMsg = {
      id: Date.now(),
      handle: currentHandle,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!data[activeRoom]) data[activeRoom] = [];
    data[activeRoom].push(newMsg);
    saveRoomMsgs(data);

    input.value = '';
    renderRoomFeed();
  });

  renderRoomFeed();
}

/* ═══════════════════════════════════════════════════════════
   FEATURE 5: CONFIDENTIAL COUNSELLOR APPOINTMENT BOOKING
   ═══════════════════════════════════════════════════════════ */
function initCounsellorBooking() {
  const triggerBtns = document.querySelectorAll('.book-slot-trigger-btn');
  const modal = document.getElementById('booking-modal-dialog');
  const closeModalBtn = document.getElementById('close-booking-modal-btn');
  const confirmBtn = document.getElementById('confirm-booking-btn');
  const counsellorNameEl = document.getElementById('booking-counsellor-name');
  const dateInput = document.getElementById('booking-date-input');
  const modeSelect = document.getElementById('booking-mode-select');
  const slotBtns = document.querySelectorAll('.slot-choice-btn');
  const bookingsContainer = document.getElementById('counsellor-bookings-container');
  const countBadge = document.getElementById('bookings-count-badge');

  let selectedCounsellor = '';
  let selectedSlot = '10:00 AM';

  // Set default tomorrow date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.value = tomorrow.toISOString().split('T')[0];

  slotBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      slotBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSlot = btn.dataset.slot;
    });
  });

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCounsellor = btn.dataset.counsellor;
      counsellorNameEl.textContent = `Booking with: ${selectedCounsellor}`;
      modal.style.display = 'flex';
    });
  });

  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  const getSavedBookings = () => {
    try {
      return JSON.parse(localStorage.getItem('mindease_counsellor_bookings')) || [];
    } catch {
      return [];
    }
  };

  const saveBookings = (list) => {
    localStorage.setItem('mindease_counsellor_bookings', JSON.stringify(list));
  };

  function renderBookings() {
    const list = getSavedBookings();
    countBadge.textContent = `${list.length} Bookings`;

    if (list.length === 0) {
      bookingsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">No Active Appointments</div>
          <div class="empty-state-desc">You have no scheduled sessions. Click "1-Click Book" beside any counsellor on the left to schedule a confidential meeting.</div>
        </div>
      `;
      return;
    }

    bookingsContainer.innerHTML = list.map(b => `
      <div style="padding:14px; background:rgba(255,255,255,0.75); border-radius:var(--radius-md); border:1px solid var(--card-border); margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <strong style="font-size:13px; color:var(--text-dark);">${b.counsellor}</strong>
          <span style="font-size:10px; font-weight:700; background:rgba(184,232,212,0.6); padding:2px 8px; border-radius:10px; color:#1b6844;">${b.code}</span>
        </div>
        <div style="font-size:12px; color:var(--text-mid); margin-bottom:6px;">
          📅 ${b.date} at ${b.time} · <strong>${b.mode}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--card-border); padding-top:8px;">
          <button class="download-ics-btn" data-code="${b.code}" data-name="${b.counsellor}" data-date="${b.date}" data-time="${b.time}" style="background:none; border:none; color:var(--deep-purple); font-size:11.5px; font-weight:600; cursor:pointer;">
            📥 Add to Calendar (.ics)
          </button>
          <button class="cancel-booking-btn" data-id="${b.id}" style="background:none; border:none; color:#c2185b; font-size:11.5px; cursor:pointer;">
            Cancel
          </button>
        </div>
      </div>
    `).join('');

    // Attach listeners
    document.querySelectorAll('.cancel-booking-btn').forEach(b => {
      b.addEventListener('click', () => {
        const id = parseInt(b.dataset.id);
        const updated = getSavedBookings().filter(item => item.id !== id);
        saveBookings(updated);
        renderBookings();
      });
    });

    document.querySelectorAll('.download-ics-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:MindEase Counselling Session with ${btn.dataset.name}\nDESCRIPTION:Confidential student session (Code: ${btn.dataset.code})\nEND:VEVENT\nEND:VCALENDAR`;
        const blob = new Blob([ics], { type: 'text/calendar' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `counselling-${btn.dataset.code}.ics`;
        a.click();
      });
    });
  }

  renderBookings();

  confirmBtn.addEventListener('click', () => {
    const code = 'CONF-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const date = dateInput.value;
    const mode = modeSelect.value;

    const newBooking = {
      id: Date.now(),
      code,
      counsellor: selectedCounsellor,
      date,
      time: selectedSlot,
      mode,
      created: new Date().toISOString()
    };

    const list = getSavedBookings();
    list.unshift(newBooking);
    saveBookings(list);

    modal.style.display = 'none';
    renderBookings();
    alert(`Appointment Confirmed!\nYour confirmation code: ${code}\nThis appointment is completely confidential.`);
  });
}

/* ═══════════════════════════════════════════════════════════
   FEATURE 6: COUNSELLOR & ADMIN ANALYTICS DASHBOARD
   (With Exam-Season Stress Insights as Sub-Option)
   ═══════════════════════════════════════════════════════════ */
function initCampusInsights() {
  const btnStress = document.getElementById('subtab-btn-stress-index');
  const btnExam = document.getElementById('subtab-btn-exam-insights');
  const btnCapacity = document.getElementById('subtab-btn-capacity');

  const viewStress = document.getElementById('subtab-view-stress-index');
  const viewExam = document.getElementById('subtab-view-exam-insights');
  const viewCapacity = document.getElementById('subtab-view-capacity');

  const tabs = [
    { btn: btnStress, view: viewStress },
    { btn: btnExam, view: viewExam },
    { btn: btnCapacity, view: viewCapacity }
  ];

  tabs.forEach(item => {
    if (!item.btn) return;
    item.btn.addEventListener('click', () => {
      tabs.forEach(t => {
        t.btn.classList.remove('active');
        t.view.style.display = 'none';
      });
      item.btn.classList.add('active');
      item.view.style.display = 'block';
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   ALWAYS-VISIBLE CRISIS MODAL
   ═══════════════════════════════════════════════════════════ */
function initCrisisModal() {
  const openBtn = document.getElementById('nav-get-help-btn');
  const modal = document.getElementById('crisis-modal');
  const closeBtn = document.getElementById('close-crisis-modal-btn');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
}

/* ═══════════════════════════════════════════════════════════
   FLOATING AI CHAT COMPANION (FAB + SAFETY GUARDRAILS)
   ═══════════════════════════════════════════════════════════ */
function initFloatingChatbot() {
  const triggerBtn = document.getElementById('floating-chat-trigger');
  const chatWindow = document.getElementById('floating-chat-window');
  const closeBtn = document.getElementById('close-chat-btn');
  const form = document.getElementById('chat-input-form');
  const input = document.getElementById('chat-text-input');
  const container = document.getElementById('chat-messages-container');
  const crisisBanner = document.getElementById('chat-crisis-banner');
  const crisisCallBtn = document.getElementById('chat-crisis-call-btn');
  const crisisModal = document.getElementById('crisis-modal');

  triggerBtn.addEventListener('click', () => {
    const isHidden = chatWindow.style.display === 'none';
    chatWindow.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.style.display = 'none';
  });

  if (crisisCallBtn) {
    crisisCallBtn.addEventListener('click', () => {
      crisisModal.style.display = 'flex';
    });
  }

  const CRISIS_KEYWORDS = [
    'kill myself', 'suicide', 'end my life', 'harm myself', 'want to die', 
    'cut myself', 'cant take it anymore', "can't go on", 'better off dead', 'hurt myself'
  ];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    // Render user bubble
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-bubble user';
    userDiv.textContent = query;
    container.appendChild(userDiv);
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // ── SAFETY GUARDRAIL INTERCEPTION ──
    const lower = query.toLowerCase();
    const isCrisis = CRISIS_KEYWORDS.some(k => lower.includes(k));

    if (isCrisis) {
      crisisBanner.style.display = 'flex';
      const botDiv = document.createElement('div');
      botDiv.className = 'chat-bubble crisis-alert';
      botDiv.innerHTML = `
        <strong>⚠️ Urgent Crisis Safety Alert</strong><br/>
        I hear how deeply difficult things feel right now. Your safety and life matter. Because I am an AI, I cannot provide emergency care. Please dial Tele-MANAS (14416) or our campus SOS desk right now. Trained human professionals are ready to listen 24/7.
      `;
      container.appendChild(botDiv);
      container.scrollTop = container.scrollHeight;
      return;
    }

    // Try backend if running or provide client fallback
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-bubble assistant';
    loadingDiv.textContent = 'Reflecting...';
    container.appendChild(loadingDiv);
    container.scrollTop = container.scrollHeight;

    try {
      const res = await fetch(`${API_BASE}/api/vent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      });
      if (res.ok) {
        const data = await res.json();
        loadingDiv.textContent = data.response;
        container.scrollTop = container.scrollHeight;
        return;
      }
    } catch {}

    // Empathetic client-side response
    setTimeout(() => {
      let reply = "Thank you for sharing that with me. It is completely natural to experience stress during academic challenges. Remember that your productivity or grades do not define your human worth. What is one kind thing you can do for yourself today?";
      if (lower.includes('exam') || lower.includes('study')) {
        reply = "Academic deadlines often feel suffocating. Try breaking your task into a single 20-minute chunk and allow yourself full permission to pause after. You can take this one step at a time.";
      } else if (lower.includes('sleep')) {
        reply = "When your mind is racing at night, pushing yourself to sleep often increases anxiety. Try our procedural rain or ocean soundscapes in the Self-Help Hub to ease your mind.";
      }
      loadingDiv.textContent = reply;
      container.scrollTop = container.scrollHeight;
    }, 600);
  });
}