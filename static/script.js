/* ═══════════════════════════════════════════════════════════════
   MindMirror — script.js
   ═══════════════════════════════════════════════════════════════ */

// ─── API Config ───────────────────────────────────────────────
// Fix pathing when opened statically vs deployed
const API_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:') && window.location.port !== '5000' 
  ? 'http://127.0.0.1:5000' : '';

// ─── Quiz Data ────────────────────────────────────────────────
const questions = [
  {
    question: "What is one early sign of burnout in students?",
    options: ["Increased energy", "Emotional exhaustion", "Better focus", "Higher motivation"],
    correct: 1
  },
  {
    question: "Which strategy is most helpful for managing academic stress?",
    options: ["Pulling all-nighters regularly", "Ignoring feelings of overwhelm", "Breaking tasks into smaller steps", "Avoiding social contact"],
    correct: 2
  },
  {
    question: "What does 'self-compassion' mean in the context of mental health?",
    options: ["Being selfish", "Treating yourself with the same kindness you'd show a friend", "Avoiding responsibility", "Pushing yourself harder when you fail"],
    correct: 1
  },
  {
    question: "Which of the following is a healthy boundary-setting phrase?",
    options: ["I don't care about you", "I can't help right now, but I'll support you another time", "You're too demanding", "Fine, I'll do it even though I'm exhausted"],
    correct: 1
  },
  {
    question: "What is 'academic burnout' primarily characterised by?",
    options: ["Overly high grades", "Physical exhaustion only", "Emotional, physical, and mental depletion from academic pressure", "A desire to study more"],
    correct: 2
  },
  {
    question: "Which of the following is NOT a healthy coping mechanism?",
    options: ["Journalling your thoughts", "Talking to a friend", "Bottling up emotions", "Taking short mindful breaks"],
    correct: 2
  },
  {
    question: "What role does sleep play in mental wellness for students?",
    options: ["It has no effect on mood", "It worsens anxiety", "It is critical for emotional regulation and cognitive function", "It reduces productivity"],
    correct: 2
  },
  {
    question: "A student feels overwhelmed by a group project. The healthiest response is to:",
    options: ["Do all the work alone", "Drop the course immediately", "Communicate concerns to the group calmly", "Ignore the project"],
    correct: 2
  }
];

// ─── Scenario Data ────────────────────────────────────────────
const scenarios = [
  {
    id: 1,
    title: "Peer Pressure at a Group Project",
    description: "Your group is pressuring you to take on all the work because 'you're the smart one.' How do you respond?"
  },
  {
    id: 2,
    title: "Constant Study Group Demands",
    description: "A friend keeps asking you to explain all your notes every night, affecting your own study time. How do you handle this?"
  },
  {
    id: 3,
    title: "Professor's Harsh Feedback",
    description: "Your professor publicly criticises your presentation in front of the class. How do you respond in the moment and afterward?"
  },
  {
    id: 4,
    title: "Social Media Comparison Spiral",
    description: "You notice peers posting about internships and achievements, and you feel behind. How do you manage these feelings?"
  },
  {
    id: 5,
    title: "Overwhelming Deadline Clash",
    description: "Three major assignments are due on the same day. A group member asks you to cover their part too. What do you do?"
  },
  {
    id: 6,
    title: "Unsolicited Advice from Family",
    description: "Your family keeps pushing you toward a career path you don't want. How do you communicate your own goals respectfully?"
  }
];

// ─── Quiz State ───────────────────────────────────────────────
let currentQuestion = 0;
let score = 0;
let answered = false;
let selectedScenario = null;

// ─── DOM Ready ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initVent();
  initQuiz();
  initResilience();
});

/* ═══════════════════════════════════════════════════════════
   SIDEBAR — IntersectionObserver + smooth scroll
   ═══════════════════════════════════════════════════════════ */
function initSidebar() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');

  // Click → scroll
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // IntersectionObserver → highlight active
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          navBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === id);
          });
        }
      });
    },
    { threshold: 0.3, rootMargin: '-10% 0px -60% 0px' }
  );

  sections.forEach(section => observer.observe(section));
}

/* ═══════════════════════════════════════════════════════════
   VENT SECTION
   ═══════════════════════════════════════════════════════════ */
function initVent() {
  const textarea   = document.getElementById('vent-textarea');
  const charCount  = document.getElementById('vent-char-count');
  const submitBtn  = document.getElementById('vent-submit');
  const loader     = document.getElementById('vent-loader');
  const responseBox = document.getElementById('vent-response');
  const responseText = document.getElementById('vent-response-text');

  const MAX_CHARS = 1000;

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    charCount.textContent = `${len} / ${MAX_CHARS}`;
    if (len > MAX_CHARS) {
      textarea.value = textarea.value.slice(0, MAX_CHARS);
      charCount.textContent = `${MAX_CHARS} / ${MAX_CHARS}`;
    }
  });

  submitBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) {
      shakeElement(textarea);
      return;
    }

    submitBtn.disabled = true;
    loader.classList.add('visible');
    responseBox.classList.remove('visible');

    try {
      const res = await fetch(`${API_BASE}/api/vent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await res.json();

      if (data.response) {
        responseText.textContent = data.response;
        responseBox.classList.add('visible');
      } else {
        responseText.textContent = data.error || 'Something went wrong. Please try again.';
        responseBox.classList.add('visible');
      }
    } catch (err) {
      responseText.textContent = 'Could not connect to the server. Please ensure the app is running.';
      responseBox.classList.add('visible');
    } finally {
      submitBtn.disabled = false;
      loader.classList.remove('visible');
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   QUIZ SECTION
   ═══════════════════════════════════════════════════════════ */
function initQuiz() {
  renderQuestion();
}

function renderQuestion() {
  const quizCard    = document.getElementById('quiz-card');
  const scoreScreen = document.getElementById('score-screen');
  const progressFill = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');

  if (currentQuestion >= questions.length) {
    showScore();
    return;
  }

  answered = false;
  quizCard.classList.remove('hidden');
  scoreScreen.classList.remove('visible');

  const q = questions[currentQuestion];
  const pct = (currentQuestion / questions.length) * 100;

  progressFill.style.width = `${pct}%`;
  progressLabel.textContent = `${currentQuestion + 1} / ${questions.length}`;

  document.getElementById('quiz-question-text').textContent = q.question;

  const optionsContainer = document.getElementById('quiz-options');
  optionsContainer.innerHTML = '';

  q.options.forEach((opt, idx) => {
    const label = document.createElement('label');
    label.className = 'quiz-option';
    label.id = `option-${idx}`;

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'quiz-option';
    radio.value = idx;

    label.appendChild(radio);
    label.appendChild(document.createTextNode(opt));
    optionsContainer.appendChild(label);

    label.addEventListener('click', () => {
      if (answered) return;
      selectOption(idx, q.correct);
    });
  });

  // Update next button label
  const nextBtn = document.getElementById('quiz-next');
  nextBtn.textContent = currentQuestion === questions.length - 1 ? 'See Results ✨' : 'Next →';
  nextBtn.onclick = () => {
    if (!answered) {
      shakeElement(optionsContainer);
      return;
    }
    currentQuestion++;
    quizCard.style.animation = 'none';
    quizCard.offsetHeight; // reflow
    quizCard.style.animation = '';
    renderQuestion();
  };
}

function selectOption(selectedIdx, correctIdx) {
  answered = true;
  const options = document.querySelectorAll('.quiz-option');

  options.forEach((opt, idx) => {
    opt.classList.add('disabled');
    const radio = opt.querySelector('input[type="radio"]');

    if (idx === correctIdx) {
      opt.classList.add('correct');
    } else if (idx === selectedIdx && selectedIdx !== correctIdx) {
      opt.classList.add('incorrect');
    }
    if (idx === selectedIdx) {
      radio.checked = true;
      opt.classList.add('selected');
    }
  });

  if (selectedIdx === correctIdx) score++;
}

function showScore() {
  const quizCard    = document.getElementById('quiz-card');
  const scoreScreen = document.getElementById('score-screen');
  const scoreNum    = document.getElementById('score-number');
  const scoreTot    = document.getElementById('score-total');
  const scoreMsg    = document.getElementById('score-message');
  const scoreSub    = document.getElementById('score-sub');
  const retryBtn    = document.getElementById('quiz-retry');
  const progressFill = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');

  progressFill.style.width = '100%';
  progressLabel.textContent = `${questions.length} / ${questions.length}`;

  quizCard.classList.add('hidden');
  scoreScreen.classList.add('visible');

  scoreNum.textContent = score;
  scoreTot.textContent = `/ ${questions.length}`;

  const pct = score / questions.length;
  if (pct >= 0.85) {
    scoreMsg.textContent = 'Outstanding awareness! 🌟';
    scoreSub.textContent = 'You have a deep understanding of mental health and resilience. Keep championing wellness!';
  } else if (pct >= 0.6) {
    scoreMsg.textContent = 'Great job! 🌸';
    scoreSub.textContent = 'You have solid mental health knowledge. Keep exploring and growing your awareness.';
  } else if (pct >= 0.4) {
    scoreMsg.textContent = 'Good effort! 🌱';
    scoreSub.textContent = 'You\'re on your way. Consider exploring more about student wellness — every step counts.';
  } else {
    scoreMsg.textContent = 'Keep learning! 💜';
    scoreSub.textContent = 'Mental health literacy is a journey. Browse through the other sections to build your awareness.';
  }

  // Log score to backend (optional)
  fetch(`${API_BASE}/api/quiz-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, total: questions.length })
  }).catch(() => {});  // silently ignore

  retryBtn.onclick = () => {
    currentQuestion = 0;
    score = 0;
    scoreScreen.classList.remove('visible');
    quizCard.classList.remove('hidden');
    renderQuestion();
  };
}

/* ═══════════════════════════════════════════════════════════
   RESILIENCE SECTION
   ═══════════════════════════════════════════════════════════ */
function initResilience() {
  const grid = document.getElementById('scenario-grid');
  const textarea    = document.getElementById('resilience-textarea');
  const submitBtn   = document.getElementById('resilience-submit');
  const loader      = document.getElementById('resilience-loader');
  const responseBox = document.getElementById('resilience-response');
  const responseText = document.getElementById('resilience-response-text');
  const formSection = document.getElementById('resilience-form');
  const selectedTitle = document.getElementById('selected-scenario-title');

  // Build scenario cards
  scenarios.forEach(scenario => {
    const card = document.createElement('div');
    card.className = 'scenario-card glass-card';
    card.dataset.id = scenario.id;
    card.innerHTML = `
      <div class="scenario-number">Scenario ${scenario.id}</div>
      <div class="scenario-title">${scenario.title}</div>
      <div class="scenario-desc">${scenario.description}</div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedScenario = scenario;
      selectedTitle.textContent = `Responding to: "${scenario.title}"`;
      formSection.style.display = 'block';
      formSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      textarea.focus();
      responseBox.classList.remove('visible');
    });

    grid.appendChild(card);
  });

  submitBtn.addEventListener('click', async () => {
    if (!selectedScenario) {
      shakeElement(grid);
      return;
    }

    const userResponse = textarea.value.trim();
    if (!userResponse) {
      shakeElement(textarea);
      return;
    }

    submitBtn.disabled = true;
    loader.classList.add('visible');
    responseBox.classList.remove('visible');

    try {
      const res = await fetch(`${API_BASE}/api/resilience`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: `${selectedScenario.title}: ${selectedScenario.description}`,
          user_response: userResponse
        })
      });

      const data = await res.json();

      if (data.response) {
        responseText.textContent = data.response;
        responseBox.classList.add('visible');
      } else {
        responseText.textContent = data.error || 'Something went wrong. Please try again.';
        responseBox.classList.add('visible');
      }
    } catch (err) {
      responseText.textContent = 'Could not connect to the server. Please ensure the app is running.';
      responseBox.classList.add('visible');
    } finally {
      submitBtn.disabled = false;
      loader.classList.remove('visible');
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════ */
function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
  el.addEventListener('animationend', () => {
    el.style.animation = '';
  }, { once: true });
}

// Inject shake keyframe dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%  { transform: translateX(-8px); }
    40%  { transform: translateX(8px); }
    60%  { transform: translateX(-5px); }
    80%  { transform: translateX(5px); }
  }
`;
document.head.appendChild(shakeStyle);

// Feature card → scroll navigation (home section)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.feature-card[data-target]').forEach(card => {
    card.addEventListener('click', () => {
      const target = document.querySelector(card.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Init new screens
  initBreathe();
  initAffirmations();
  initCrisis();
  initPlanner();
  initSounds();
});

/* ═══════════════════════════════════════════════════════════
   SCREEN 5 — BREATHE & GROUND
   ═══════════════════════════════════════════════════════════ */
function initBreathe() {
  // ── Particle generator ──────────────────────────────────
  const container = document.getElementById('particle-container');
  if (container) {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 8 + Math.random() * 18;
      p.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        top:${40 + Math.random() * 60}%;
        animation-duration:${5 + Math.random() * 7}s;
        animation-delay:${Math.random() * 6}s;
        opacity:${0.3 + Math.random() * 0.4};
      `;
      container.appendChild(p);
    }
  }

  // ── Mode Toggle ─────────────────────────────────────────
  const breatheBtn   = document.getElementById('mode-breathe-btn');
  const groundBtn    = document.getElementById('mode-ground-btn');
  const breatheMode  = document.getElementById('breathe-mode');
  const groundMode   = document.getElementById('ground-mode');

  breatheBtn.addEventListener('click', () => {
    breatheBtn.classList.add('active'); breatheBtn.setAttribute('aria-pressed', 'true');
    groundBtn.classList.remove('active'); groundBtn.setAttribute('aria-pressed', 'false');
    breatheMode.style.display = '';
    groundMode.style.display = 'none';
  });

  groundBtn.addEventListener('click', () => {
    groundBtn.classList.add('active'); groundBtn.setAttribute('aria-pressed', 'true');
    breatheBtn.classList.remove('active'); breatheBtn.setAttribute('aria-pressed', 'false');
    breatheMode.style.display = 'none';
    groundMode.style.display = '';
    initGrounding();
  });

  // ── Breathing Exercise ──────────────────────────────────
  const orb         = document.getElementById('breathe-orb');
  const phase       = document.getElementById('breathe-phase');
  const countEl     = document.getElementById('breathe-count');
  const instruction = document.getElementById('breathe-instruction');
  const startBtn    = document.getElementById('breathe-start');

  const phases = [
    { name: 'Inhale',  cls: 'inhale', count: 4, hint: 'Breathe in slowly through your nose...' },
    { name: 'Hold',    cls: 'hold',   count: 4, hint: 'Hold gently... stay still...' },
    { name: 'Exhale',  cls: 'exhale', count: 4, hint: 'Breathe out slowly through your mouth...' },
  ];

  let running = false;
  let breatheTimer = null;
  let currentPhaseIdx = 0;
  let currentCount = 4;

  function tickBreathe() {
    const p = phases[currentPhaseIdx];
    orb.className = 'breathe-orb ' + p.cls;
    phase.textContent = p.name;
    instruction.textContent = p.hint;

    let c = p.count;
    countEl.textContent = c;
    breatheTimer = setInterval(() => {
      c--;
      countEl.textContent = c;
      if (c <= 0) {
        clearInterval(breatheTimer);
        currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
        setTimeout(tickBreathe, 600);
      }
    }, 1000);
  }

  startBtn.addEventListener('click', () => {
    if (!running) {
      running = true;
      startBtn.innerHTML = '<i data-lucide="pause" style="width:16px;height:16px;"></i> Pause';
      lucide.createIcons();
      tickBreathe();
    } else {
      running = false;
      clearInterval(breatheTimer);
      startBtn.innerHTML = '<i data-lucide="play" style="width:16px;height:16px;"></i> Start';
      lucide.createIcons();
      orb.className = 'breathe-orb';
      phase.textContent = 'Inhale';
      countEl.textContent = 4;
      instruction.textContent = 'Breathe in slowly through your nose...';
      currentPhaseIdx = 0;
    }
  });
}

// ── 5-4-3-2-1 Grounding ─────────────────────────────────
let groundInitialized = false;
function initGrounding() {
  if (groundInitialized) return;
  groundInitialized = true;

  const steps = [
    { num: 5, sense: 'See',   title: 'Name 5 things you can see',   desc: 'Look around and notice 5 things in your environment.' },
    { num: 4, sense: 'Touch', title: 'Touch 4 things around you',   desc: 'Feel textures — your chair, your clothes, a surface nearby.' },
    { num: 3, sense: 'Hear',  title: 'Listen for 3 sounds',         desc: 'Tune in to distant sounds, nearby hums, or your own breathing.' },
    { num: 2, sense: 'Smell', title: 'Notice 2 things you can smell', desc: 'Breathe in gently. Notice any subtle scents around you.' },
    { num: 1, sense: 'Taste', title: 'Identify 1 thing you can taste', desc: 'What taste lingers? Sip water or simply notice your mouth.' },
  ];

  const stepsContainer = document.getElementById('ground-steps');
  const progressFill   = document.getElementById('ground-progress-fill');
  const cta            = document.getElementById('ground-cta');

  let doneCount = 0;

  steps.forEach((step, i) => {
    const card = document.createElement('div');
    card.className = 'ground-step-card';
    card.dataset.idx = i;
    card.innerHTML = `
      <div class="ground-step-num">${step.num}</div>
      <div class="ground-step-text">
        <div class="ground-step-title">${step.sense} — ${step.title}</div>
        <div class="ground-step-desc">${step.desc}</div>
      </div>
      <div class="ground-checkmark">✓</div>
    `;
    stepsContainer.appendChild(card);

    // Staggered reveal
    setTimeout(() => card.classList.add('revealed'), i * 200);

    card.addEventListener('click', () => {
      if (card.classList.contains('done')) return;
      card.classList.add('done');
      doneCount++;
      progressFill.style.width = `${(doneCount / steps.length) * 100}%`;
      if (doneCount === steps.length) {
        setTimeout(() => { cta.style.display = 'block'; }, 400);
      }
    });
  });

  cta.addEventListener('click', () => {
    // Reset
    doneCount = 0;
    progressFill.style.width = '0%';
    cta.style.display = 'none';
    stepsContainer.querySelectorAll('.ground-step-card').forEach(c => c.classList.remove('done'));
  });
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 6 — AFFIRMATION OF THE DAY
   ═══════════════════════════════════════════════════════════ */
const affirmations = [
  { text: 'You are enough. You always have been, and you always will be.', icon: '☀️' },
  { text: 'Every small step forward is still progress. Be proud of how far you\'ve come.', icon: '⭐' },
  { text: 'Your feelings are valid. You are allowed to take up space in this world.', icon: '💜' },
  { text: 'Difficult roads often lead to beautiful destinations. Keep going.', icon: '🌸' },
  { text: 'You deserve kindness — especially from yourself.', icon: '💛' },
  { text: 'Your worth is not measured by your productivity or grades.', icon: '🌿' },
  { text: 'Rest is not weakness. It is wisdom.', icon: '🌙' },
  { text: 'You are growing in ways you can\'t always see yet. Trust the process.', icon: '🌱' },
  { text: 'It\'s okay to ask for help. Strength lies in connection.', icon: '🤝' },
  { text: 'Today you are brave enough to face whatever comes your way.', icon: '✨' },
  { text: 'You are not your worst day. You are all the days you kept going.', icon: '🌅' },
  { text: 'Your mind is a garden — nurture it with patience and care.', icon: '🌺' },
];

let currentAffirmationIdx = Math.floor(Math.random() * affirmations.length);

function initAffirmations() {
  const quoteEl  = document.getElementById('affirmation-quote');
  const iconEl   = document.getElementById('affirmation-icon');
  const dateEl   = document.getElementById('affirmation-date');
  const shuffle  = document.getElementById('shuffle-btn');
  const saveBtn  = document.getElementById('save-affirmation');
  const shareBtn = document.getElementById('share-affirmation');
  const toast    = document.getElementById('saved-toast');

  // Load daily affirmation based on day-of-year for consistency
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  currentAffirmationIdx = dayOfYear % affirmations.length;

  function renderAffirmation(idx, animate = false) {
    const card = document.getElementById('affirmation-card');
    if (animate) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(12px)';
    }
    const a = affirmations[idx];
    quoteEl.textContent = a.text;
    iconEl.textContent  = a.icon;
    dateEl.textContent  = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (animate) {
      setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 100);
    }
  }

  renderAffirmation(currentAffirmationIdx);

  shuffle.addEventListener('click', () => {
    currentAffirmationIdx = (currentAffirmationIdx + 1) % affirmations.length;
    renderAffirmation(currentAffirmationIdx, true);
    toast.classList.remove('show');
  });

  saveBtn.addEventListener('click', () => {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  });

  shareBtn.addEventListener('click', () => {
    const text = affirmations[currentAffirmationIdx].text;
    if (navigator.share) {
      navigator.share({ text: `"${text}" — MindMirror Daily Affirmation` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        shareBtn.innerHTML = '<i data-lucide="check" style="width:16px;height:16px;"></i> Copied!';
        lucide.createIcons();
        setTimeout(() => {
          shareBtn.innerHTML = '<i data-lucide="share-2" style="width:16px;height:16px;"></i> Share';
          lucide.createIcons();
        }, 2000);
      }).catch(() => {});
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 7 — CRISIS RESOURCES
   ═══════════════════════════════════════════════════════════ */
const helplines = [
  { name: 'iCall',                number: '9152987821', hours: 'Mon–Sat, 8am–10pm', available: true,  desc: 'Psychosocial helpline by TISS' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', hours: '24/7 available', available: true,  desc: 'Free mental health helpline' },
  { name: 'NIMHANS',              number: '080-46110007', hours: 'Mon–Sat, 9am–5pm', available: false, desc: 'National institute of mental health' },
  { name: 'Snehi',                number: '044-24640050', hours: 'Mon–Sat, 8am–10pm', available: true, desc: 'Emotional support helpline' },
  { name: 'iCall Student',        number: '022-25521111', hours: 'Mon–Fri, 9am–6pm', available: false, desc: 'Dedicated student support line' },
  { name: 'Aasra',                number: '9820466627',  hours: '24/7 available',    available: true,  desc: 'Crisis intervention & suicide prevention' },
];

function initCrisis() {
  const grid = document.getElementById('helpline-grid');
  if (!grid) return;

  helplines.forEach(h => {
    const card = document.createElement('div');
    card.className = 'helpline-card';
    card.innerHTML = `
      <div class="helpline-top">
        <div class="helpline-name">${h.name}</div>
        <div class="helpline-status ${h.available ? 'available' : 'limited'}" title="${h.available ? '24/7 Available' : 'Limited hours'}"></div>
      </div>
      <div style="font-size:0.8rem;color:var(--text-light);margin-bottom:4px;">${h.desc}</div>
      <a href="tel:${h.number.replace(/[-\s]/g,'')}" class="helpline-number" aria-label="Call ${h.name}">
        <i data-lucide="phone" style="width:14px;height:14px;"></i>
        ${h.number}
      </a>
      <div class="helpline-hours">🕐 ${h.hours}</div>
    `;
    grid.appendChild(card);
  });

  lucide.createIcons();
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 8 — ACADEMIC STRESS MAPPER
   ═══════════════════════════════════════════════════════════ */
let deadlines = [
  { id: 1, title: 'Physics Final Exam', date: addDays(new Date(), 2), type: 'exam',       urgency: 'high'   },
  { id: 2, title: 'Data Structures Project', date: addDays(new Date(), 4), type: 'project', urgency: 'medium' },
  { id: 3, title: 'Essay Submission', date: addDays(new Date(), 6), type: 'assignment',  urgency: 'low'    },
];

function addDays(date, days) {
  const d = new Date(date); d.setDate(d.getDate() + days); return d;
}

function initPlanner() {
  renderWeeklyStrip();
  renderDeadlines();
  renderForecastGraph();

  // Modal
  const addBtn    = document.getElementById('add-deadline-btn');
  const modal     = document.getElementById('deadline-modal');
  const saveBtn   = document.getElementById('modal-save');
  const cancelBtn = document.getElementById('modal-cancel');

  addBtn.addEventListener('click', () => {
    modal.classList.add('open');
    document.getElementById('deadline-date').valueAsDate = new Date();
  });

  cancelBtn.addEventListener('click', () => modal.classList.remove('open'));

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open');
  });

  saveBtn.addEventListener('click', () => {
    const title   = document.getElementById('deadline-title').value.trim();
    const date    = new Date(document.getElementById('deadline-date').value);
    const type    = document.getElementById('deadline-type').value;
    const urgency = document.getElementById('deadline-urgency').value;
    if (!title || isNaN(date.getTime())) { shakeElement(document.getElementById('deadline-title')); return; }
    deadlines.push({ id: Date.now(), title, date, type, urgency });
    deadlines.sort((a, b) => a.date - b.date);
    modal.classList.remove('open');
    document.getElementById('deadline-title').value  = '';
    document.getElementById('deadline-date').value   = '';
    renderDeadlines();
    renderWeeklyStrip();
    renderForecastGraph();
  });
}

function renderWeeklyStrip() {
  const strip = document.getElementById('weekly-strip');
  strip.innerHTML = '';
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i);
    const dayKey = d.toDateString();
    const isToday = i === 0;

    // Count deadlines on this day
    const dayDeadlines = deadlines.filter(dl => dl.date.toDateString() === dayKey);
    const urgencyHighCount = dayDeadlines.filter(dl => dl.urgency === 'high').length;
    const urgencyMedCount  = dayDeadlines.filter(dl => dl.urgency === 'medium').length;

    let stressClass = 'stress-low';
    if (urgencyHighCount >= 1) stressClass = 'stress-high';
    else if (urgencyMedCount >= 1 || dayDeadlines.length >= 2) stressClass = 'stress-medium';

    const isBreak = dayDeadlines.length === 0 && i > 0;

    const cell = document.createElement('div');
    cell.className = 'day-cell' + (isToday ? ' today' : '');
    cell.innerHTML = `
      <div class="day-label">${dayNames[d.getDay()]}</div>
      <div class="day-date">${d.getDate()}</div>
      <div class="day-stress-dot ${dayDeadlines.length > 0 ? stressClass : ''}"></div>
      ${isBreak ? '<div class="break-chip">Break</div>' : ''}
    `;
    strip.appendChild(cell);
  }
}

function renderDeadlines() {
  const list = document.getElementById('deadlines-list');
  list.innerHTML = '';
  const typeIcons = { exam: '📝', assignment: '📌', project: '🗂️' };

  if (deadlines.length === 0) {
    list.innerHTML = '<p style="color:var(--text-light);font-size:0.9rem;padding:16px 0;">No deadlines yet — enjoy the calm! ☀️</p>';
    return;
  }

  deadlines.forEach(dl => {
    const card = document.createElement('div');
    card.className = 'deadline-card';
    const diffDays = Math.ceil((dl.date - new Date()) / 86400000);
    const when = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
    card.innerHTML = `
      <div class="deadline-type-icon">${typeIcons[dl.type] || '📎'}</div>
      <div class="deadline-info">
        <div class="deadline-name">${dl.title}</div>
        <div class="deadline-date-label">${dl.date.toLocaleDateString('en-IN', { day:'numeric', month:'short' })} · ${when}</div>
      </div>
      <span class="urgency-tag urgency-${dl.urgency}">${dl.urgency.charAt(0).toUpperCase() + dl.urgency.slice(1)}</span>
      <button class="deadline-delete" aria-label="Delete deadline" data-id="${dl.id}">
        <i data-lucide="x" style="width:14px;height:14px;"></i>
      </button>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.deadline-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      deadlines = deadlines.filter(d => d.id !== id);
      renderDeadlines();
      renderWeeklyStrip();
      renderForecastGraph();
    });
  });

  lucide.createIcons();
}

function renderForecastGraph() {
  const container = document.getElementById('forecast-graph');
  container.innerHTML = '';

  const W = container.offsetWidth || 600;
  const H = 100;
  const today = new Date();
  const points = [];

  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i);
    const dayDeadlines = deadlines.filter(dl => dl.date.toDateString() === d.toDateString());
    let stress = 10;
    dayDeadlines.forEach(dl => {
      if (dl.urgency === 'high')   stress += 40;
      if (dl.urgency === 'medium') stress += 25;
      if (dl.urgency === 'low')    stress += 10;
    });
    stress = Math.min(stress, 100);
    points.push({ x: (i / 6) * W, y: H - (stress / 100) * H, stress, label: d.toLocaleDateString('en-IN', { day:'numeric', month:'short' }) });
  }

  // Build smooth curve path
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i-1].x + points[i].x) / 2;
    d += ` C ${cp1x} ${points[i-1].y}, ${cp1x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
  }

  const areaD = d + ` L ${points[points.length-1].x} ${H} L ${points[0].x} ${H} Z`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  // Gradient
  svg.innerHTML = `
    <defs>
      <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#C9B8E8" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#C9B8E8" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaD}" fill="url(#stressGrad)"/>
    <path d="${d}" fill="none" stroke="#C9B8E8" stroke-width="2.5" stroke-linecap="round"/>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${p.stress > 60 ? '#ff6b6b' : p.stress > 35 ? '#ffb347' : '#4aab78'}" stroke="white" stroke-width="1.5"/>`).join('')}
    ${points.map(p => `<text x="${p.x}" y="${H + 14}" text-anchor="middle" font-size="9" fill="#9B8AAD" font-family="DM Sans, sans-serif">${p.label}</text>`).join('')}
  `;

  container.appendChild(svg);

  // Tip bubbles at peaks
  points.forEach(p => {
    if (p.stress > 50) {
      const tip = document.createElement('div');
      tip.className = 'forecast-tip';
      tip.style.left  = `${p.x}px`;
      tip.style.top   = `${p.y - 36}px`;
      tip.textContent = p.stress > 75 ? '⚠️ High stress day' : '💛 Plan breaks';
      container.appendChild(tip);
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   SCREEN 9 — CALMING SOUNDSCAPES (Web Audio API Engine)
   ═══════════════════════════════════════════════════════════ */
const soundData = [
  { id: 'rain',       name: 'Rain',       emoji: '🌧️', bg: 'linear-gradient(180deg, #0d2137, #1a3a5c)' },
  { id: 'forest',     name: 'Forest',     emoji: '🌿', bg: 'linear-gradient(180deg, #0d2118, #1b4332)' },
  { id: 'whitenoise', name: 'White Noise',emoji: '〰️', bg: 'linear-gradient(180deg, #12122a, #2a2a4a)' },
  { id: 'ocean',      name: 'Ocean',      emoji: '🌊', bg: 'linear-gradient(180deg, #091a2d, #0a3f6b)' },
  { id: 'fireplace',  name: 'Fireplace',  emoji: '🔥', bg: 'linear-gradient(180deg, #1a0a05, #4a1a0a)' },
];

let activeSounds = [];
let isMixMode    = false;
let soundTimer   = null;

// ── Audio Context (shared, created on first user gesture) ──
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Master gain node per active sound (for volume slider updates)
const soundGains = {};

// Helper: create a 2-second white noise buffer
function makeNoiseBuf(ctx) {
  const n = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// Helper: loop a buffer source into a destination node
function loopBuf(ctx, buf, dest) {
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  src.connect(dest); src.start();
  return src;
}

/* ── RAIN ──────────────────────────────────────────────── */
function startRain(ctx, vol) {
  const master = ctx.createGain(); master.gain.value = vol * 0.55;
  master.connect(ctx.destination); soundGains.rain = master;
  const buf = makeNoiseBuf(ctx);

  // Heavy rain layer
  const heavy = ctx.createBiquadFilter(); heavy.type = 'lowpass'; heavy.frequency.value = 1200;
  const heavySrc = ctx.createBufferSource(); heavySrc.buffer = buf; heavySrc.loop = true;
  heavySrc.connect(heavy); heavy.connect(master); heavySrc.start();

  // Fine patter
  const patter = ctx.createBiquadFilter(); patter.type = 'bandpass'; patter.frequency.value = 3500; patter.Q.value = 0.5;
  const patterG = ctx.createGain(); patterG.gain.value = 0.35;
  const patterSrc = ctx.createBufferSource(); patterSrc.buffer = buf; patterSrc.loop = true;
  patterSrc.connect(patter); patter.connect(patterG); patterG.connect(master); patterSrc.start();

  // Swell LFO
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.08;
  const lfoG = ctx.createGain(); lfoG.gain.value = 0.15;
  lfo.connect(lfoG); lfoG.connect(master.gain); lfo.start();

  return { stop() { try { heavySrc.stop(); patterSrc.stop(); lfo.stop(); } catch(e){} master.disconnect(); delete soundGains.rain; } };
}

/* ── FOREST ────────────────────────────────────────────── */
function startForest(ctx, vol) {
  const master = ctx.createGain(); master.gain.value = vol * 0.42;
  master.connect(ctx.destination); soundGains.forest = master;
  const buf = makeNoiseBuf(ctx);

  // Wind
  const wind = ctx.createBiquadFilter(); wind.type = 'bandpass'; wind.frequency.value = 600; wind.Q.value = 0.4;
  const windSrc = ctx.createBufferSource(); windSrc.buffer = buf; windSrc.loop = true;
  windSrc.connect(wind); wind.connect(master); windSrc.start();
  const wLfo = ctx.createOscillator(); wLfo.type = 'sine'; wLfo.frequency.value = 0.05;
  const wLfoG = ctx.createGain(); wLfoG.gain.value = 0.18;
  wLfo.connect(wLfoG); wLfoG.connect(master.gain); wLfo.start();

  // Leaf hiss
  const leaf = ctx.createBiquadFilter(); leaf.type = 'highpass'; leaf.frequency.value = 4000;
  const leafG = ctx.createGain(); leafG.gain.value = 0.08;
  const leafSrc = ctx.createBufferSource(); leafSrc.buffer = buf; leafSrc.loop = true;
  leafSrc.connect(leaf); leaf.connect(leafG); leafG.connect(master); leafSrc.start();

  // Bird chirps
  const timers = [];
  function chirp() {
    const t = setTimeout(() => {
      if (!soundGains.forest) return;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = 2400 + Math.random() * 1200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.05);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
      o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 0.25);
      chirp();
    }, 3000 + Math.random() * 8000);
    timers.push(t);
  }
  chirp();

  return { stop() { try { windSrc.stop(); leafSrc.stop(); wLfo.stop(); } catch(e){} timers.forEach(clearTimeout); master.disconnect(); delete soundGains.forest; } };
}

/* ── WHITE NOISE ────────────────────────────────────────── */
function startWhiteNoise(ctx, vol) {
  const master = ctx.createGain(); master.gain.value = vol * 0.45;
  master.connect(ctx.destination); soundGains.whitenoise = master;
  const buf = makeNoiseBuf(ctx);
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  src.connect(master); src.start();
  return { stop() { try { src.stop(); } catch(e){} master.disconnect(); delete soundGains.whitenoise; } };
}

/* ── OCEAN ──────────────────────────────────────────────── */
function startOcean(ctx, vol) {
  const master = ctx.createGain(); master.gain.value = vol * 0.5;
  master.connect(ctx.destination); soundGains.ocean = master;
  const buf = makeNoiseBuf(ctx);

  // Deep rumble
  const deep = ctx.createBiquadFilter(); deep.type = 'lowpass'; deep.frequency.value = 300;
  const deepSrc = ctx.createBufferSource(); deepSrc.buffer = buf; deepSrc.loop = true;
  deepSrc.connect(deep); deep.connect(master); deepSrc.start();

  // Surf hiss
  const surf = ctx.createBiquadFilter(); surf.type = 'bandpass'; surf.frequency.value = 1800; surf.Q.value = 0.6;
  const surfG = ctx.createGain(); surfG.gain.value = 0.38;
  const surfSrc = ctx.createBufferSource(); surfSrc.buffer = buf; surfSrc.loop = true;
  surfSrc.connect(surf); surf.connect(surfG); surfG.connect(master); surfSrc.start();

  // Wave swell LFO
  const wLfo = ctx.createOscillator(); wLfo.type = 'sine'; wLfo.frequency.value = 0.12;
  const wLfoG = ctx.createGain(); wLfoG.gain.value = 0.22;
  wLfo.connect(wLfoG); wLfoG.connect(master.gain); wLfo.start();

  return { stop() { try { deepSrc.stop(); surfSrc.stop(); wLfo.stop(); } catch(e){} master.disconnect(); delete soundGains.ocean; } };
}

/* ── FIREPLACE ──────────────────────────────────────────── */
function startFireplace(ctx, vol) {
  const master = ctx.createGain(); master.gain.value = vol * 0.45;
  master.connect(ctx.destination); soundGains.fireplace = master;
  const buf = makeNoiseBuf(ctx);

  // Base crackle
  const fire = ctx.createBiquadFilter(); fire.type = 'lowpass'; fire.frequency.value = 800;
  const fireSrc = ctx.createBufferSource(); fireSrc.buffer = buf; fireSrc.loop = true;
  fireSrc.connect(fire); fire.connect(master); fireSrc.start();

  // Breathing LFO
  const fLfo = ctx.createOscillator(); fLfo.type = 'sine'; fLfo.frequency.value = 0.2;
  const fLfoG = ctx.createGain(); fLfoG.gain.value = 0.1;
  fLfo.connect(fLfoG); fLfoG.connect(master.gain); fLfo.start();

  // Wood pop crackles
  const timers = [];
  function pop() {
    const t = setTimeout(() => {
      if (!soundGains.fireplace) return;
      const pb = makeNoiseBuf(ctx);
      const ps = ctx.createBufferSource(); ps.buffer = pb;
      const pf = ctx.createBiquadFilter(); pf.type = 'bandpass';
      pf.frequency.value = 1000 + Math.random() * 2000; pf.Q.value = 2;
      const pg = ctx.createGain();
      pg.gain.setValueAtTime(0.15, ctx.currentTime);
      pg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      ps.connect(pf); pf.connect(pg); pg.connect(master);
      ps.start(); ps.stop(ctx.currentTime + 0.08);
      pop();
    }, 250 + Math.random() * 1200);
    timers.push(t);
  }
  pop();

  return { stop() { try { fireSrc.stop(); fLfo.stop(); } catch(e){} timers.forEach(clearTimeout); master.disconnect(); delete soundGains.fireplace; } };
}

// Running audio handles keyed by sound id
const runningAudio = {};

function startSound(id, vol) {
  if (runningAudio[id]) return;
  const ctx = getAudioCtx();
  const fns = { rain: startRain, forest: startForest, whitenoise: startWhiteNoise, ocean: startOcean, fireplace: startFireplace };
  if (fns[id]) runningAudio[id] = fns[id](ctx, vol);
}

function stopSound(id) {
  if (runningAudio[id]) { runningAudio[id].stop(); delete runningAudio[id]; }
}

function stopAllSounds() {
  Object.keys(runningAudio).forEach(stopSound);
}

function initSounds() {
  const tilesContainer = document.getElementById('sound-tiles');
  const nowPlayingBar  = document.getElementById('now-playing-bar');
  const stopBtn        = document.getElementById('stop-sound');
  const mixToggle      = document.getElementById('mix-toggle');
  const volumeSlider   = document.getElementById('volume-slider');
  const nowPlayingName = document.getElementById('now-playing-name');
  const soundsSection  = document.querySelector('.sounds-section');

  let currentVol = 0.7;

  // Build tiles
  soundData.forEach(sound => {
    const tile = document.createElement('div');
    tile.className = 'sound-tile';
    tile.dataset.sound = sound.id;
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('aria-label', `Play ${sound.name}`);
    tile.innerHTML = `
      <span class="sound-tile-emoji">${sound.emoji}</span>
      <span class="sound-tile-name">${sound.name}</span>
    `;
    tilesContainer.appendChild(tile);

    tile.addEventListener('click', () => {
      if (isMixMode) {
        // Toggle in mix — start or stop this sound
        if (tile.classList.contains('active')) {
          tile.classList.remove('active');
          activeSounds = activeSounds.filter(s => s !== sound.id);
          stopSound(sound.id);
        } else {
          tile.classList.add('active');
          activeSounds.push(sound.id);
          startSound(sound.id, currentVol);
        }
        if (activeSounds.length === 0) {
          nowPlayingBar.style.display = 'none';
          soundsSection.style.background = 'linear-gradient(180deg, #1a1230, #0f0b1e)';
        } else {
          nowPlayingBar.style.display = 'flex';
          nowPlayingName.textContent = activeSounds.map(id => soundData.find(s => s.id === id).name).join(' + ');
          soundsSection.style.background = soundData.find(s => s.id === activeSounds[activeSounds.length - 1]).bg;
        }
      } else {
        // Single mode — toggle off if clicking active, else switch
        const wasActive = tile.classList.contains('active');
        document.querySelectorAll('.sound-tile').forEach(t => t.classList.remove('active'));
        stopAllSounds();
        activeSounds = [];

        if (!wasActive) {
          tile.classList.add('active');
          activeSounds = [sound.id];
          startSound(sound.id, currentVol);
          nowPlayingBar.style.display = 'flex';
          nowPlayingName.textContent = sound.name;
          soundsSection.style.background = sound.bg;
        } else {
          nowPlayingBar.style.display = 'none';
          soundsSection.style.background = 'linear-gradient(180deg, #1a1230, #0f0b1e)';
        }
      }
    });

    tile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') tile.click(); });
  });

  // Stop button — halts all audio
  stopBtn.addEventListener('click', () => {
    document.querySelectorAll('.sound-tile').forEach(t => t.classList.remove('active'));
    stopAllSounds();
    activeSounds = [];
    nowPlayingBar.style.display = 'none';
    soundsSection.style.background = 'linear-gradient(180deg, #1a1230, #0f0b1e)';
    clearTimeout(soundTimer);
    document.querySelectorAll('.timer-pill').forEach(p => p.classList.remove('active'));
  });

  // Mix toggle
  mixToggle.addEventListener('click', () => {
    isMixMode = !isMixMode;
    mixToggle.classList.toggle('active', isMixMode);
    mixToggle.setAttribute('aria-pressed', isMixMode);
    if (!isMixMode) {
      // Collapse to the first sound only
      const first = activeSounds[0];
      document.querySelectorAll('.sound-tile').forEach(t => t.classList.remove('active'));
      stopAllSounds();
      activeSounds = [];
      if (first) {
        const tile = document.querySelector(`.sound-tile[data-sound="${first}"]`);
        if (tile) tile.click();
      }
    }
  });

  // Timer pills — auto-stop after chosen duration
  document.querySelectorAll('.timer-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.timer-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      clearTimeout(soundTimer);
      const mins = parseInt(pill.dataset.mins);
      soundTimer = setTimeout(() => {
        document.getElementById('stop-sound').click();
      }, mins * 60 * 1000);
    });
  });

  // Volume slider — real-time gain update on all running sounds
  volumeSlider.addEventListener('input', () => {
    currentVol = volumeSlider.value / 100;
    Object.values(soundGains).forEach(gainNode => {
      gainNode.gain.value = currentVol * 0.5;
    });
  });
}