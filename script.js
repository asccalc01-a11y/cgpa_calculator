/**
 * GradeOS — CGPA Calculator
 * script.js
 *
 * Modules:
 *  1. Tab Navigation
 *  2. SGPA Calculator
 *  3. CGPA Calculator
 *  4. Percentage Converter
 *  5. Toast Notifications
 *  6. localStorage Persistence
 */

/* =============================================
   Grade Map
   ============================================= */
const GRADE_MAP = {
  'O':  10,
  'A+': 9,
  'A':  8,
  'B+': 7,
  'B':  6,
  'C':  5,
  'P':  4,
  'F':  0,
};

const GRADE_OPTIONS = Object.entries(GRADE_MAP)
  .map(([g, v]) => `<option value="${v}">${g} — ${v}</option>`)
  .join('');

/* =============================================
   1. TAB NAVIGATION
   ============================================= */
const tabBtns  = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    // Update buttons
    tabBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === target);
      b.setAttribute('aria-selected', b.dataset.tab === target);
    });

    // Update panels
    tabPanels.forEach(p => {
      const show = p.id === `tab-${target}`;
      p.classList.toggle('active', show);
      p.hidden = !show;
    });
  });
});

/* =============================================
   2. SGPA CALCULATOR
   ============================================= */
let subjectCounter = 0;

const subjectsList = document.getElementById('subjects-list');
const sgpaValueEl  = document.getElementById('sgpa-value');

/** Create a subject row element */
function createSubjectRow() {
  subjectCounter++;
  const id  = subjectCounter;
  const row = document.createElement('div');
  row.classList.add('subject-row');
  row.dataset.id = id;

  row.innerHTML = `
    <input
      type="text"
      class="text-input subject-name"
      placeholder="Subject ${id}"
      aria-label="Subject name"
    />
    <input
      type="number"
      class="number-input subject-credits"
      placeholder="3"
      min="0"
      max="10"
      step="0.5"
      inputmode="decimal"
      aria-label="Credits"
    />
    <select class="grade-select subject-grade" aria-label="Grade">
      ${GRADE_OPTIONS}
    </select>
    <button class="delete-btn" aria-label="Remove subject">×</button>
  `;

  // Auto-recalculate on change
  row.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', computeSGPA);
    el.addEventListener('change', computeSGPA);
  });

  // Delete row
  row.querySelector('.delete-btn').addEventListener('click', () => {
    row.style.animation = 'none';
    row.style.transition = 'opacity 0.2s, transform 0.2s';
    row.style.opacity = '0';
    row.style.transform = 'translateX(12px)';
    setTimeout(() => {
      row.remove();
      computeSGPA();
      saveSGPAData();
    }, 220);
  });

  return row;
}

/** Add a subject row to the list */
function addSubject(name = '', credits = '', gradeValue = '10') {
  const row = createSubjectRow();
  subjectsList.appendChild(row);

  if (name)       row.querySelector('.subject-name').value    = name;
  if (credits)    row.querySelector('.subject-credits').value = credits;
  if (gradeValue) row.querySelector('.subject-grade').value   = gradeValue;

  computeSGPA();
}

/** Compute and display SGPA */
function computeSGPA() {
  const rows = subjectsList.querySelectorAll('.subject-row');
  let totalPoints  = 0;
  let totalCredits = 0;

  rows.forEach(row => {
    const credits = parseFloat(row.querySelector('.subject-credits').value) || 0;
    const grade   = parseFloat(row.querySelector('.subject-grade').value)   || 0;
    totalCredits += credits;
    totalPoints  += credits * grade;
  });

  const sgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;
  sgpaValueEl.textContent = sgpa ?? '—';
  saveSGPAData();
}

/* ----- SGPA Persistence ----- */
function saveSGPAData() {
  const rows = [...subjectsList.querySelectorAll('.subject-row')].map(row => ({
    name:    row.querySelector('.subject-name').value,
    credits: row.querySelector('.subject-credits').value,
    grade:   row.querySelector('.subject-grade').value,
  }));
  localStorage.setItem('gradeos_subjects', JSON.stringify(rows));
}

function loadSGPAData() {
  try {
    const data = JSON.parse(localStorage.getItem('gradeos_subjects') || '[]');
    if (data.length === 0) {
      // Seed two empty rows
      addSubject(); addSubject();
    } else {
      data.forEach(d => addSubject(d.name, d.credits, d.grade));
    }
  } catch {
    addSubject(); addSubject();
  }
}

/* ----- SGPA Controls ----- */
document.getElementById('add-subject-btn').addEventListener('click', () => {
  addSubject();
  showToast('Subject added', 'info', '📚');
});

document.getElementById('copy-sgpa-btn').addEventListener('click', () => {
  const val = sgpaValueEl.textContent;
  if (val === '—') { showToast('No SGPA to copy', 'error', '⚠️'); return; }
  copyToClipboard(`SGPA: ${val}`, 'SGPA copied!');
});

document.getElementById('reset-sgpa-btn').addEventListener('click', () => {
  subjectsList.innerHTML = '';
  subjectCounter = 0;
  sgpaValueEl.textContent = '—';
  addSubject(); addSubject();
  localStorage.removeItem('gradeos_subjects');
  showToast('SGPA reset', 'info', '↺');
});

/* =============================================
   3. CGPA CALCULATOR
   ============================================= */
let semesterCounter = 0;

const semestersList = document.getElementById('semesters-list');
const cgpaValueEl   = document.getElementById('cgpa-value');

/** Create a semester row element */
function createSemesterRow() {
  semesterCounter++;
  const id  = semesterCounter;
  const row = document.createElement('div');
  row.classList.add('subject-row', 'semester-row');
  row.dataset.id = id;

  row.innerHTML = `
    <input
      type="text"
      class="text-input sem-name"
      placeholder="Semester ${id}"
      aria-label="Semester name"
    />
    <input
      type="number"
      class="number-input sem-sgpa"
      placeholder="8.5"
      min="0"
      max="10"
      step="0.01"
      inputmode="decimal"
      aria-label="SGPA"
    />
    <input
      type="number"
      class="number-input sem-credits"
      placeholder="24"
      min="0"
      max="999"
      step="1"
      inputmode="numeric"
      aria-label="Total credits"
    />
    <button class="delete-btn" aria-label="Remove semester">×</button>
  `;

  row.querySelectorAll('input').forEach(el => {
    el.addEventListener('input', computeCGPA);
  });

  row.querySelector('.delete-btn').addEventListener('click', () => {
    row.style.transition = 'opacity 0.2s, transform 0.2s';
    row.style.opacity = '0';
    row.style.transform = 'translateX(12px)';
    setTimeout(() => {
      row.remove();
      computeCGPA();
      saveCGPAData();
    }, 220);
  });

  return row;
}

/** Add a semester row */
function addSemester(name = '', sgpa = '', credits = '') {
  const row = createSemesterRow();
  semestersList.appendChild(row);

  if (name)    row.querySelector('.sem-name').value    = name;
  if (sgpa)    row.querySelector('.sem-sgpa').value    = sgpa;
  if (credits) row.querySelector('.sem-credits').value = credits;

  computeCGPA();
}

/** Compute weighted CGPA */
function computeCGPA() {
  const rows = semestersList.querySelectorAll('.semester-row');
  let totalPoints  = 0;
  let totalCredits = 0;

  rows.forEach(row => {
    const sgpa    = parseFloat(row.querySelector('.sem-sgpa').value)    || 0;
    const credits = parseFloat(row.querySelector('.sem-credits').value) || 0;
    totalCredits += credits;
    totalPoints  += sgpa * credits;
  });

  const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;
  cgpaValueEl.textContent = cgpa ?? '—';
  saveCGPAData();
}

/* ----- CGPA Persistence ----- */
function saveCGPAData() {
  const rows = [...semestersList.querySelectorAll('.semester-row')].map(row => ({
    name:    row.querySelector('.sem-name').value,
    sgpa:    row.querySelector('.sem-sgpa').value,
    credits: row.querySelector('.sem-credits').value,
  }));
  localStorage.setItem('gradeos_semesters', JSON.stringify(rows));
}

function loadCGPAData() {
  try {
    const data = JSON.parse(localStorage.getItem('gradeos_semesters') || '[]');
    if (data.length === 0) {
      addSemester(); addSemester();
    } else {
      data.forEach(d => addSemester(d.name, d.sgpa, d.credits));
    }
  } catch {
    addSemester(); addSemester();
  }
}

/* ----- CGPA Controls ----- */
document.getElementById('add-semester-btn').addEventListener('click', () => {
  addSemester();
  showToast('Semester added', 'info', '🎓');
});

document.getElementById('copy-cgpa-btn').addEventListener('click', () => {
  const val = cgpaValueEl.textContent;
  if (val === '—') { showToast('No CGPA to copy', 'error', '⚠️'); return; }
  copyToClipboard(`CGPA: ${val}`, 'CGPA copied!');
});

document.getElementById('reset-cgpa-btn').addEventListener('click', () => {
  semestersList.innerHTML = '';
  semesterCounter = 0;
  cgpaValueEl.textContent = '—';
  addSemester(); addSemester();
  localStorage.removeItem('gradeos_semesters');
  showToast('CGPA reset', 'info', '↺');
});

/* =============================================
   4. PERCENTAGE CONVERTER
   ============================================= */
const cgpaInput      = document.getElementById('cgpa-input');
const percentValueEl = document.getElementById('percent-value');

/** Convert CGPA to percentage */
function computePercentage() {
  const cgpa = parseFloat(cgpaInput.value);
  if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
    percentValueEl.textContent = '—';
    return;
  }
  const pct = ((cgpa - 0.75) * 10).toFixed(2);
  percentValueEl.textContent = `${pct}%`;
  localStorage.setItem('gradeos_cgpa_input', cgpaInput.value);
}

cgpaInput.addEventListener('input', computePercentage);

// Load saved CGPA input
const savedCGPAInput = localStorage.getItem('gradeos_cgpa_input');
if (savedCGPAInput) {
  cgpaInput.value = savedCGPAInput;
  computePercentage();
}

document.getElementById('copy-percent-btn').addEventListener('click', () => {
  const val = percentValueEl.textContent;
  if (val === '—') { showToast('Nothing to copy', 'error', '⚠️'); return; }
  copyToClipboard(val, 'Percentage copied!');
});

document.getElementById('reset-percent-btn').addEventListener('click', () => {
  cgpaInput.value = '';
  percentValueEl.textContent = '—';
  localStorage.removeItem('gradeos_cgpa_input');
  showToast('Converter reset', 'info', '↺');
});

/* =============================================
   5. TOAST NOTIFICATIONS
   ============================================= */
const toastContainer = document.getElementById('toast-container');

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {string} icon
 * @param {number} duration  ms before auto-dismiss
 */
function showToast(message, type = 'success', icon = '✓', duration = 2800) {
  const toast = document.createElement('div');
  toast.classList.add('toast', type);
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  // Auto-dismiss
  setTimeout(() => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* =============================================
   6. UTILITY — Copy to Clipboard
   ============================================= */
function copyToClipboard(text, successMsg = 'Copied!') {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMsg, 'success', '⎘'))
      .catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(successMsg, 'success', '⎘');
  } catch {
    showToast('Copy failed — try manually', 'error', '⚠️');
  }
  ta.remove();
}

/* =============================================
   INIT — Load persisted data on page load
   ============================================= */
(function init() {
  loadSGPAData();
  loadCGPAData();

  // Warm welcome on first visit
  if (!localStorage.getItem('gradeos_visited')) {
    localStorage.setItem('gradeos_visited', '1');
    setTimeout(() => showToast('Welcome to GradeOS!', 'success', '◈'), 600);
  }
})();