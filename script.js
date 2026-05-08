// ============================================
// MAIN SCRIPT - Akshuu's Exam Portal
// Made with love by Gaurav 💜
// ============================================

// ---- USERS ----
const USERS = {
  gaurav: { password: 'gaurav',       role: 'admin'   },
  akshuu: { password: 'ohhyessdaddyy', role: 'student' }
};

// ---- ROMANTIC QUOTES ----
const QUOTES = [
  "Baby focus karo… reels baad mein dekh lena 😏",
  "Aaj prove karo ki tum sirf cute nahi smart bhi ho 💜",
  "Meri topper girlfriend banogi? 😌",
  "Har correct answer pe ek virtual kiss 💋",
  "Padh lo jaan… warna taunt ready hai 😭",
  "Tum kar logi, mujhe pata hai 💜",
  "Smart + cute = meri Akshuu 😘",
  "Exam dena hai, Instagram baad mein 😤💜"
];

// ---- TEST STATE ----
let currentQuestion = 0;
let userAnswers = [];
let timerInterval = null;
let timeLeft = 90 * 60; // seconds
let testQuestions = [];
let testStarted = false;

// ============================================
// INIT
// ============================================
window.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initHearts();
  startQuoteRotation();
  triggerKissAnimation(); // 💋 romantic welcome kiss

  // Loading screen
  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    ls.style.opacity = '0';
    setTimeout(() => {
      ls.style.display = 'none';
      checkSession();
    }, 600);
  }, 2200);

  // Prevent accidental refresh during test
  window.addEventListener('beforeunload', (e) => {
    if (testStarted) {
      e.preventDefault();
      e.returnValue = 'Test is in progress! Are you sure you want to leave?';
    }
  });
});

function checkSession() {
  const user = localStorage.getItem('loggedInUser');
  const role = localStorage.getItem('userRole');
  if (user && role === 'admin')   { showPage('adminPage');   initAdmin(); return; }
  if (user && role === 'student') {
    const inTest = localStorage.getItem('testInProgress');
    if (inTest === 'true') { resumeTest(); return; }
    showPage('instructionsPage');
    return;
  }
  showPage('loginPage');
}

// ============================================
// PAGE NAVIGATION
// ============================================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
}

// ============================================
// LOGIN
// ============================================
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  const errEl    = document.getElementById('loginError');

  if (USERS[username] && USERS[username].password === password) {
    errEl.classList.add('hidden');
    localStorage.setItem('loggedInUser', username);
    localStorage.setItem('userRole', USERS[username].role);

    if (USERS[username].role === 'admin') {
      showPage('adminPage');
      initAdmin();
    } else {
      showPage('instructionsPage');
    }
  } else {
    errEl.classList.remove('hidden');
    document.getElementById('loginForm').classList.add('shake');
    setTimeout(() => document.getElementById('loginForm').classList.remove('shake'), 500);
  }
}

function togglePassword() {
  const inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ============================================
// QUOTE ROTATION
// ============================================
let quoteIndex = 0;
function startQuoteRotation() {
  const el = document.getElementById('romanticQuote');
  if (!el) return;
  el.textContent = QUOTES[quoteIndex];
  setInterval(() => {
    quoteIndex = (quoteIndex + 1) % QUOTES.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = QUOTES[quoteIndex];
      el.style.opacity = '1';
      el.style.transition = 'opacity 0.5s ease';
    }, 300);
  }, 4000);
}

// ============================================
// TEST START
// ============================================
function startTest() {
  // Always use the latest questions from questions.js
  // Clear any stale localStorage version that may have fewer questions
  const stored = localStorage.getItem('examQuestions');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // If stored count doesn't match source, refresh it
      if (parsed.length !== questions.length) {
        localStorage.removeItem('examQuestions');
      }
    } catch(e) {
      localStorage.removeItem('examQuestions');
    }
  }

  const fresh = localStorage.getItem('examQuestions');
  testQuestions = fresh ? JSON.parse(fresh) : [...questions];

  userAnswers = new Array(testQuestions.length).fill(null);
  currentQuestion = 0;
  timeLeft = 90 * 60;
  testStarted = true;

  // Clear any leftover test state
  localStorage.removeItem('userAnswers');
  localStorage.removeItem('timeLeft');
  localStorage.setItem('testInProgress', 'true');
  localStorage.setItem('userAnswers', JSON.stringify(userAnswers));

  showPage('testPage');
  buildPalette();
  renderQuestion();
  startTimer();
}

function resumeTest() {
  const stored = localStorage.getItem('examQuestions');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.length !== questions.length) localStorage.removeItem('examQuestions');
    } catch(e) { localStorage.removeItem('examQuestions'); }
  }

  const fresh = localStorage.getItem('examQuestions');
  testQuestions = fresh ? JSON.parse(fresh) : [...questions];

  const savedAnswers = localStorage.getItem('userAnswers');
  // If saved answers length doesn't match questions, start fresh
  if (savedAnswers) {
    const parsed = JSON.parse(savedAnswers);
    userAnswers = parsed.length === testQuestions.length ? parsed : new Array(testQuestions.length).fill(null);
  } else {
    userAnswers = new Array(testQuestions.length).fill(null);
  }

  const savedTime = localStorage.getItem('timeLeft');
  timeLeft = savedTime ? parseInt(savedTime) : 90 * 60;

  currentQuestion = 0;
  testStarted = true;

  showPage('testPage');
  buildPalette();
  renderQuestion();
  startTimer();
}

// ============================================
// TIMER
// ============================================
function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeLeft--;
    localStorage.setItem('timeLeft', timeLeft);
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const display = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const el = document.getElementById('timerDisplay');
  if (el) {
    el.textContent = display;
    if (timeLeft <= 300) el.classList.add('warning');
    else el.classList.remove('warning');
  }
}

function autoSubmit() {
  testStarted = false;
  showResults();
}

// ============================================
// QUESTION PALETTE
// ============================================
function buildPalette() {
  const grid = document.getElementById('paletteGrid');
  if (!grid) return;
  grid.innerHTML = '';
  testQuestions.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'palette-btn';
    btn.textContent = i + 1;
    btn.onclick = () => goToQuestion(i);
    btn.id = `pb-${i}`;
    grid.appendChild(btn);
  });
  updatePalette();
}

function updatePalette() {
  testQuestions.forEach((_, i) => {
    const btn = document.getElementById(`pb-${i}`);
    if (!btn) return;
    btn.className = 'palette-btn';
    if (i === currentQuestion) btn.classList.add('current');
    else if (userAnswers[i] !== null) btn.classList.add('answered');
  });
  updateNavStats();
}

function updateNavStats() {
  const attempted = userAnswers.filter(a => a !== null).length;
  const remaining = testQuestions.length - attempted;
  const aEl = document.getElementById('attemptedCount');
  const rEl = document.getElementById('remainingCount');
  if (aEl) aEl.textContent = attempted;
  if (rEl) rEl.textContent = remaining;
}

// ============================================
// RENDER QUESTION
// ============================================
function renderQuestion() {
  const q = testQuestions[currentQuestion];
  if (!q) return;

  document.getElementById('qNumber').textContent = `Question ${currentQuestion + 1} of ${testQuestions.length}`;
  document.getElementById('qText').textContent = q.question;

  const optContainer = document.getElementById('qOptions');
  optContainer.innerHTML = '';

  const labels = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, i) => {
    const label = document.createElement('label');
    label.className = 'option-label' + (userAnswers[currentQuestion] === i ? ' selected' : '');
    label.innerHTML = `
      <input type="radio" name="option" value="${i}" ${userAnswers[currentQuestion] === i ? 'checked' : ''} />
      <span class="opt-circle">${labels[i]}</span>
      <span>${opt}</span>
    `;
    label.addEventListener('click', () => selectAnswer(i));
    optContainer.appendChild(label);
  });

  updatePalette();
}

function selectAnswer(index) {
  userAnswers[currentQuestion] = index;
  localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
  renderQuestion();
}

function clearAnswer() {
  userAnswers[currentQuestion] = null;
  localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
  renderQuestion();
}

function nextQuestion() {
  if (currentQuestion < testQuestions.length - 1) {
    currentQuestion++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion();
  }
}

function goToQuestion(index) {
  currentQuestion = index;
  renderQuestion();
}

// ============================================
// SUBMIT
// ============================================
function confirmSubmit() {
  const attempted = userAnswers.filter(a => a !== null).length;
  const unattempted = testQuestions.length - attempted;
  const msg = unattempted > 0
    ? `You have ${unattempted} unattempted questions. Submit anyway?`
    : 'Submit the test?';
  if (confirm(msg)) {
    clearInterval(timerInterval);
    testStarted = false;
    showResults();
  }
}

// ============================================
// RESULTS
// ============================================
function showResults() {
  localStorage.removeItem('testInProgress');
  localStorage.removeItem('timeLeft');
  // unique session ID for this attempt
  localStorage.setItem('lastTestSession', 'session_' + Date.now());

  let correct = 0, wrong = 0, unattempted = 0;

  testQuestions.forEach((q, i) => {
    if (userAnswers[i] === null) unattempted++;
    else if (userAnswers[i] === q.answer) correct++;
    else wrong++;
  });

  const positiveMarks = correct * 2;
  const negativeMarks = wrong * 0.5;
  const finalScore = positiveMarks - negativeMarks;
  const passed = correct >= 100;

  // Update DOM
  document.getElementById('finalScore').textContent = finalScore.toFixed(1);
  document.getElementById('correctCount').textContent = correct;
  document.getElementById('wrongCount').textContent = wrong;
  document.getElementById('unattemptedCount').textContent = unattempted;
  document.getElementById('positiveMarks').textContent = '+' + positiveMarks.toFixed(1);
  document.getElementById('negativeMarks').textContent = '-' + negativeMarks.toFixed(1);

  const statusEl = document.getElementById('resultStatus');
  const titleEl  = document.getElementById('resultTitle');
  const emojiEl  = document.getElementById('resultEmoji');
  const msgEl    = document.getElementById('resultMessage');

  if (passed) {
    statusEl.textContent = '🎉 PASSED';
    statusEl.className = 'result-status pass';
    titleEl.textContent = 'You Passed! 💜';
    emojiEl.textContent = '🎉';
    msgEl.innerHTML = `Meri genius girlfriend 😭💋<br>Proud of you baby 🥺<br>Party pending 🎉`;
  } else {
    statusEl.textContent = '💔 FAILED';
    statusEl.className = 'result-status fail';
    titleEl.textContent = 'Better Luck Next Time';
    emojiEl.textContent = '💜';
    msgEl.innerHTML = `It's okay baby 💜<br>Mujhe pata hai tum kar sakti ho<br>Next attempt mein phod dena 😌`;
  }

  buildAnalysis();
  showPage('resultPage');

  // Show celebration or fail overlay after a short delay
  setTimeout(() => {
    if (passed) showCelebration();
    else showFailOverlay();
  }, 800);
}

function retryTest() {
  localStorage.removeItem('userAnswers');
  localStorage.removeItem('testInProgress');
  localStorage.removeItem('timeLeft');
  localStorage.removeItem('lastTestSession');
  showPage('instructionsPage');
}

// ============================================
// ANALYSIS
// ============================================
function buildAnalysis() {
  const container = document.getElementById('analysisContainer');
  if (!container) return;

  const labels = ['A', 'B', 'C', 'D'];
  container.innerHTML = testQuestions.map((q, i) => {
    const selected = userAnswers[i];
    const correct  = q.answer;
    let status = 'skipped';
    if (selected !== null) status = selected === correct ? 'correct' : 'wrong';

    const badge = status === 'correct' ? '✅ Correct' : status === 'wrong' ? '❌ Wrong' : '⬜ Skipped';

    const optionsHTML = q.options.map((opt, oi) => {
      let cls = '';
      if (oi === correct && oi === selected) cls = 'correct-sel';
      else if (oi === correct) cls = 'correct-ans';
      else if (oi === selected) cls = 'wrong-sel';
      return `
        <div class="ai-option ${cls}">
          <span class="ai-opt-label">${labels[oi]}</span>
          <span>${opt}</span>
          ${oi === correct ? '<span style="margin-left:auto;font-size:0.75rem;font-weight:600;">✓ Correct</span>' : ''}
          ${oi === selected && oi !== correct ? '<span style="margin-left:auto;font-size:0.75rem;font-weight:600;">← Your Answer</span>' : ''}
        </div>
      `;
    }).join('');

    // Report button — shown for ALL questions (correct, wrong, skipped)
    const alreadyReported = isQuestionReported(i);
    const reportPlaceholder = status === 'correct'
      ? 'You think this answer is wrong? Tell us why... (optional)'
      : 'Why do you think this answer is wrong? (optional)';
    const reportHTML = `
      <div class="report-section" id="report-section-${i}">
        ${alreadyReported
          ? `<div class="report-done">🚩 Reported — Admin will review this ✓</div>`
          : `<div class="report-row">
              <input type="text" class="report-input" id="report-input-${i}" placeholder="${reportPlaceholder}" />
              <button class="btn-report" onclick="reportQuestion(${i})">🚩 Report Issue</button>
            </div>`
        }
      </div>
    `;

    return `
      <div class="analysis-item ${status}" id="analysis-item-${i}">
        <div class="ai-header">
          <span class="ai-num">Q${i + 1}</span>
          <span class="ai-badge ${status}">${badge}</span>
        </div>
        <div class="ai-question">${q.question}</div>
        <div class="ai-options">${optionsHTML}</div>
        ${reportHTML}
      </div>
    `;
  }).join('');
}

function scrollToAnalysis() {
  document.getElementById('analysisSection').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// REPORT QUESTION
// ============================================
function isQuestionReported(qIndex) {
  const reports = getReports();
  return reports.some(r => r.qIndex === qIndex && r.sessionId === getSessionId());
}

function getSessionId() {
  // unique per test attempt — use submit timestamp stored at result time
  return localStorage.getItem('lastTestSession') || 'session1';
}

function getReports() {
  const stored = localStorage.getItem('questionReports');
  return stored ? JSON.parse(stored) : [];
}

function saveReports(reports) {
  localStorage.setItem('questionReports', JSON.stringify(reports));
}

function reportQuestion(qIndex) {
  const inputEl = document.getElementById(`report-input-${qIndex}`);
  const reason  = inputEl ? inputEl.value.trim() : '';
  const q       = testQuestions[qIndex];
  const labels  = ['A', 'B', 'C', 'D'];

  const report = {
    id:            Date.now(),
    sessionId:     getSessionId(),
    qIndex:        qIndex,
    qNumber:       qIndex + 1,
    question:      q.question,
    options:       q.options,
    systemAnswer:  q.answer,
    studentAnswer: userAnswers[qIndex],
    reason:        reason || 'No reason provided',
    reportedAt:    new Date().toLocaleString(),
    status:        'pending'   // pending | resolved | dismissed
  };

  const reports = getReports();
  reports.push(report);
  saveReports(reports);

  // Update UI inline
  const section = document.getElementById(`report-section-${qIndex}`);
  if (section) {
    section.innerHTML = `<div class="report-done">🚩 Reported — Admin will review this ✓</div>`;
  }

  showReportToast('Question reported! Admin will review it 🚩');
}

function showReportToast(msg) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'admin-toast success show';
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// CELEBRATION
// ============================================
function showCelebration() {
  const overlay = document.getElementById('celebrationOverlay');
  overlay.classList.remove('hidden');
  spawnCelebParticles();
}

function closeCelebration() {
  document.getElementById('celebrationOverlay').classList.add('hidden');
}

function spawnCelebParticles() {
  const container = document.getElementById('celebEmojis');
  const emojis = ['💋', '❤️', '🎉', '😘', '✨', '🌸', '💕', '🩷', '💗'];
  container.innerHTML = '';

  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.className = 'celeb-particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.animationDuration = (2 + Math.random() * 4) + 's';
    el.style.animationDelay = (Math.random() * 3) + 's';
    el.style.fontSize = (16 + Math.random() * 24) + 'px';
    container.appendChild(el);
  }
}

// ============================================
// FAIL OVERLAY
// ============================================
function showFailOverlay() {
  document.getElementById('failOverlay').classList.remove('hidden');
}

function closeFailOverlay() {
  document.getElementById('failOverlay').classList.add('hidden');
}

// ============================================
// FLOATING HEARTS BACKGROUND
// ============================================
function initHearts() {
  const container = document.getElementById('heartsContainer');
  const emojis = ['❤️', '🌸', '💕', '✨', '💋', '🩷', '💗', '💖'];

  function spawnHeart() {
    const el = document.createElement('div');
    el.className = 'heart-particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = (10 + Math.random() * 18) + 'px';
    const dur = 8 + Math.random() * 12;
    el.style.animationDuration = dur + 's';
    el.style.animationDelay = '0s';
    container.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000);
  }

  // Initial batch
  for (let i = 0; i < 15; i++) {
    setTimeout(spawnHeart, Math.random() * 5000);
  }
  setInterval(spawnHeart, 1200);
}

// ============================================
// CUSTOM CURSOR
// ============================================
function initCursor() {
  // Only on non-touch devices
  if (window.matchMedia('(hover: none)').matches) {
    document.getElementById('cursorHeart').style.display = 'none';
    return;
  }
  const cursor = document.getElementById('cursorHeart');
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });
}

// ============================================
// MUSIC TOGGLE — Romantic tune
// ============================================
let musicPlaying = false;
function toggleMusic() {
  const audio = document.getElementById('bgMusic');
  const btn   = document.getElementById('musicToggle');
  if (musicPlaying) {
    audio.pause();
    btn.textContent = '🔇';
    musicPlaying = false;
  } else {
    audio.play().catch(() => {});
    btn.textContent = '🎵';
    musicPlaying = true;
  }
}

// ============================================
// 💋 KISS ANIMATION — fullscreen fade in/out
// ============================================
function triggerKissAnimation() {
  const el = document.getElementById('kissOverlay');
  if (!el) return;
  el.classList.remove('hidden');
  el.style.opacity = '0';
  // fade in
  requestAnimationFrame(() => {
    el.style.transition = 'opacity 0.8s ease';
    el.style.opacity = '1';
    // hold then fade out
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.classList.add('hidden'), 900);
    }, 1800);
  });
}

// ============================================
// SHAKE ANIMATION (CSS injection)
// ============================================
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-8px); }
    40%      { transform: translateX(8px); }
    60%      { transform: translateX(-6px); }
    80%      { transform: translateX(6px); }
  }
  .shake { animation: shake 0.5s ease; }
`;
document.head.appendChild(shakeStyle);
