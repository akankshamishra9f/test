// ============================================
// ADMIN PANEL LOGIC
// ============================================

let adminQuestions = [];
let editingIndex = -1;
let adminTab = 'questions'; // 'questions' | 'reports'

function initAdmin() {
  loadAdminQuestions();
  renderAdminQuestions();
  updateQuestionCount();
  setupAdminEventListeners();
  renderReportsBadge();
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.getElementById('tabQuestions').classList.toggle('tab-active', tab === 'questions');
  document.getElementById('tabReports').classList.toggle('tab-active', tab === 'reports');
  document.getElementById('adminQuestionsPanel').classList.toggle('hidden', tab !== 'questions');
  document.getElementById('adminReportsPanel').classList.toggle('hidden', tab !== 'reports');
  if (tab === 'reports') renderReports();
}

function renderReportsBadge() {
  const reports = getAdminReports().filter(r => r.status === 'pending');
  const badge = document.getElementById('reportsBadge');
  if (badge) {
    badge.textContent = reports.length || '';
    badge.style.display = reports.length ? 'inline-flex' : 'none';
  }
}

function loadAdminQuestions() {
  const stored = localStorage.getItem('examQuestions');
  if (stored) {
    adminQuestions = JSON.parse(stored);
  } else {
    adminQuestions = [...questions];
    saveAdminQuestions();
  }
}

function saveAdminQuestions() {
  localStorage.setItem('examQuestions', JSON.stringify(adminQuestions));
}

function updateQuestionCount() {
  const countEl = document.getElementById('adminQuestionCount');
  if (countEl) countEl.textContent = adminQuestions.length;
}

function renderAdminQuestions(filter = '') {
  const container = document.getElementById('adminQuestionList');
  if (!container) return;

  const filtered = adminQuestions.filter((q, i) =>
    q.question.toLowerCase().includes(filter.toLowerCase()) ||
    String(i + 1).includes(filter)
  );

  if (filtered.length === 0) {
    container.innerHTML = `<div class="no-questions">No questions found 💜</div>`;
    return;
  }

  container.innerHTML = filtered.map((q, i) => {
    const realIndex = adminQuestions.indexOf(q);
    return `
      <div class="admin-question-card" id="aqcard-${realIndex}">
        <div class="aq-header">
          <span class="aq-number">Q${realIndex + 1}</span>
          <div class="aq-actions">
            <button class="btn-edit" onclick="openEditModal(${realIndex})">✏️ Edit</button>
            <button class="btn-delete" onclick="deleteQuestion(${realIndex})">🗑️ Delete</button>
          </div>
        </div>
        <div class="aq-question">${q.question}</div>
        <div class="aq-options">
          ${q.options.map((opt, oi) => `
            <div class="aq-option ${oi === q.answer ? 'correct-option' : ''}">
              <span class="opt-label">${['A','B','C','D'][oi]}</span>
              ${opt}
              ${oi === q.answer ? '<span class="correct-badge">✓ Correct</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function openAddModal() {
  editingIndex = -1;
  document.getElementById('modalTitle').textContent = '➕ Add New Question';
  document.getElementById('modalQuestion').value = '';
  document.getElementById('modalOpt0').value = '';
  document.getElementById('modalOpt1').value = '';
  document.getElementById('modalOpt2').value = '';
  document.getElementById('modalOpt3').value = '';
  document.getElementById('modalAnswer').value = '0';
  document.getElementById('questionModal').classList.add('active');
}

function openEditModal(index) {
  editingIndex = index;
  const q = adminQuestions[index];
  document.getElementById('modalTitle').textContent = `✏️ Edit Question ${index + 1}`;
  document.getElementById('modalQuestion').value = q.question;
  document.getElementById('modalOpt0').value = q.options[0];
  document.getElementById('modalOpt1').value = q.options[1];
  document.getElementById('modalOpt2').value = q.options[2];
  document.getElementById('modalOpt3').value = q.options[3];
  document.getElementById('modalAnswer').value = q.answer;
  document.getElementById('questionModal').classList.add('active');
}

function closeModal() {
  document.getElementById('questionModal').classList.remove('active');
  editingIndex = -1;
}

function saveQuestion() {
  const question = document.getElementById('modalQuestion').value.trim();
  const opt0 = document.getElementById('modalOpt0').value.trim();
  const opt1 = document.getElementById('modalOpt1').value.trim();
  const opt2 = document.getElementById('modalOpt2').value.trim();
  const opt3 = document.getElementById('modalOpt3').value.trim();
  const answer = parseInt(document.getElementById('modalAnswer').value);

  if (!question || !opt0 || !opt1 || !opt2 || !opt3) {
    showAdminToast('Please fill all fields! 💜', 'error');
    return;
  }

  const newQ = {
    question,
    options: [opt0, opt1, opt2, opt3],
    answer
  };

  if (editingIndex === -1) {
    adminQuestions.push(newQ);
    showAdminToast('Question added successfully! 🎉', 'success');
  } else {
    adminQuestions[editingIndex] = newQ;
    showAdminToast('Question updated! ✨', 'success');
  }

  saveAdminQuestions();
  renderAdminQuestions();
  updateQuestionCount();
  closeModal();
}

function deleteQuestion(index) {
  if (confirm(`Delete Question ${index + 1}? This cannot be undone! 💔`)) {
    adminQuestions.splice(index, 1);
    saveAdminQuestions();
    renderAdminQuestions();
    updateQuestionCount();
    showAdminToast('Question deleted 🗑️', 'error');
  }
}

function resetToDefault() {
  if (confirm('Reset ALL questions to default? This will overwrite your changes! 💔')) {
    adminQuestions = [...questions];
    saveAdminQuestions();
    renderAdminQuestions();
    updateQuestionCount();
    showAdminToast('Questions reset to default! 🔄', 'success');
  }
}

function showAdminToast(msg, type = 'success') {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `admin-toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function setupAdminEventListeners() {
  const searchInput = document.getElementById('adminSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderAdminQuestions(e.target.value);
    });
  }

  const modal = document.getElementById('questionModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

function adminLogout() {
  localStorage.removeItem('loggedInUser');
  localStorage.removeItem('userRole');
  window.location.href = 'index.html';
}

// ============================================
// REPORTS SYSTEM
// ============================================

function getAdminReports() {
  const stored = localStorage.getItem('questionReports');
  return stored ? JSON.parse(stored) : [];
}

function saveAdminReports(reports) {
  localStorage.setItem('questionReports', JSON.stringify(reports));
}

function renderReports() {
  const container = document.getElementById('adminReportsList');
  if (!container) return;

  const reports = getAdminReports();

  if (reports.length === 0) {
    container.innerHTML = `<div class="no-questions">No reports yet 💜 All questions look good!</div>`;
    return;
  }

  const labels = ['A', 'B', 'C', 'D'];

  container.innerHTML = reports.slice().reverse().map((r) => {
    const statusClass = r.status === 'resolved' ? 'report-resolved' : r.status === 'dismissed' ? 'report-dismissed' : 'report-pending';
    const statusLabel = r.status === 'resolved' ? '✅ Resolved' : r.status === 'dismissed' ? '🚫 Dismissed' : '⏳ Pending';

    const optionsHTML = r.options.map((opt, oi) => {
      let cls = '';
      if (oi === r.systemAnswer && oi === r.studentAnswer) cls = 'correct-sel';
      else if (oi === r.systemAnswer) cls = 'correct-ans';
      else if (oi === r.studentAnswer) cls = 'wrong-sel';
      return `
        <div class="ai-option ${cls}">
          <span class="ai-opt-label">${labels[oi]}</span>
          <span>${opt}</span>
          ${oi === r.systemAnswer ? '<span style="margin-left:auto;font-size:0.72rem;font-weight:600;color:#22c55e;">✓ System Answer</span>' : ''}
          ${oi === r.studentAnswer && oi !== r.systemAnswer ? '<span style="margin-left:auto;font-size:0.72rem;font-weight:600;color:#fda4af;">← Student\'s Answer</span>' : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="report-card ${statusClass}">
        <div class="report-card-header">
          <div class="report-meta">
            <span class="aq-number">Q${r.qNumber}</span>
            <span class="report-status-badge ${r.status}">${statusLabel}</span>
            <span class="report-time">🕐 ${r.reportedAt}</span>
          </div>
          ${r.status === 'pending' ? `
            <div class="report-actions">
              <button class="btn-resolve" onclick="resolveReport(${r.id})">✅ Resolve</button>
              <button class="btn-dismiss" onclick="dismissReport(${r.id})">🚫 Dismiss</button>
              <button class="btn-edit" onclick="openEditModal(${r.qIndex})">✏️ Fix Answer</button>
            </div>
          ` : ''}
        </div>
        <div class="aq-question">${r.question}</div>
        <div class="report-reason-box">
          <span class="report-reason-label">💬 Student's Reason:</span>
          <span class="report-reason-text">${r.reason}</span>
        </div>
        <div class="ai-options" style="margin-top:10px;">${optionsHTML}</div>
      </div>
    `;
  }).join('');
}

function resolveReport(id) {
  const reports = getAdminReports();
  const r = reports.find(r => r.id === id);
  if (r) { r.status = 'resolved'; saveAdminReports(reports); renderReports(); renderReportsBadge(); showAdminToast('Report marked as resolved ✅', 'success'); }
}

function dismissReport(id) {
  const reports = getAdminReports();
  const r = reports.find(r => r.id === id);
  if (r) { r.status = 'dismissed'; saveAdminReports(reports); renderReports(); renderReportsBadge(); showAdminToast('Report dismissed 🚫', 'error'); }
}

function clearAllReports() {
  if (confirm('Clear all reports? This cannot be undone!')) {
    localStorage.removeItem('questionReports');
    renderReports();
    renderReportsBadge();
    showAdminToast('All reports cleared 🗑️', 'error');
  }
}
