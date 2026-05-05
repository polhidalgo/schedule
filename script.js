/* global PLANS, TYPES, DAYS */

const STORAGE_KEY = 'pol-schedule-v1';

const state = {
  currentPlan: 'A',
  hiddenTypes: new Set(['work', 'commute']),
  sessionStatus: {},
  sessionNotes: {},
  feedback: {},
};

/* ---------- Persistencia ---------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.currentPlan = data.currentPlan || 'A';
    state.hiddenTypes = new Set(data.hiddenTypes || ['work', 'commute']);
    state.sessionStatus = data.sessionStatus || {};
    state.sessionNotes = data.sessionNotes || {};
    state.feedback = data.feedback || {};
  } catch (err) {
    console.warn('No se pudo cargar el state:', err);
  }
}

function saveState() {
  const data = {
    currentPlan: state.currentPlan,
    hiddenTypes: Array.from(state.hiddenTypes),
    sessionStatus: state.sessionStatus,
    sessionNotes: state.sessionNotes,
    feedback: state.feedback,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ---------- Helpers ---------- */
function todayName() {
  const idx = (new Date().getDay() + 6) % 7;
  return DAYS[idx];
}

function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/* ---------- Render filtros ---------- */
function renderFilters() {
  const container = document.getElementById('typeFilters');
  container.innerHTML = '';
  Object.entries(TYPES).forEach(([key, info]) => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip';
    chip.style.color = info.color;
    if (state.hiddenTypes.has(key)) chip.classList.add('off');
    chip.innerHTML = `<span class="dot"></span><span style="color: var(--text)">${info.label}</span>`;
    chip.title = `Mostrar/ocultar ${info.label}`;
    chip.addEventListener('click', () => {
      if (state.hiddenTypes.has(key)) state.hiddenTypes.delete(key);
      else state.hiddenTypes.add(key);
      saveState();
      renderFilters();
      renderWeek();
    });
    container.appendChild(chip);
  });
}

/* ---------- Render semana ---------- */
function renderWeek() {
  const grid = document.getElementById('weekGrid');
  grid.innerHTML = '';
  const schedule = PLANS[state.currentPlan].schedule;
  const today = todayName();

  DAYS.forEach((day) => {
    const card = document.createElement('div');
    card.className = 'day-card';
    if (day === today) card.classList.add('today');

    const sessions = schedule[day] || [];
    const visibleCount = sessions.filter((s) => !state.hiddenTypes.has(s.type)).length;

    card.innerHTML = `
      <div class="day-header">
        <span class="day-name">${day}</span>
        <span class="day-tag">${day === today ? 'Hoy' : `${visibleCount} sesiones`}</span>
      </div>
      <div class="sessions"></div>
    `;

    const sessionsEl = card.querySelector('.sessions');
    sessions.forEach((session) => {
      const el = document.createElement('div');
      const status = state.sessionStatus[session.id] || '';
      el.className = `session ${status}`;
      if (state.hiddenTypes.has(session.type)) el.classList.add('hidden');
      el.style.setProperty('--type-color', TYPES[session.type]?.color || '#888');

      const statusTag = status
        ? `<span class="session-status-tag status-${status}">${status === 'done' ? 'Hecho' : status === 'modified' ? 'Modif.' : 'Saltado'}</span>`
        : '';

      el.innerHTML = `
        ${statusTag}
        <div class="session-time">${session.start} - ${session.end}</div>
        <div class="session-title">${session.title}</div>
        <span class="session-type">${TYPES[session.type]?.label || session.type}</span>
      `;
      el.addEventListener('click', () => openModal(session));
      sessionsEl.appendChild(el);
    });

    grid.appendChild(card);
  });
}

/* ---------- Today panel ---------- */
function renderToday() {
  const content = document.getElementById('todayContent');
  const today = todayName();
  const schedule = PLANS[state.currentPlan].schedule;
  const sessions = (schedule[today] || []).filter((s) => !state.hiddenTypes.has(s.type));
  const now = nowMinutes();

  const upcoming = sessions.find((s) => timeToMin(s.start) >= now);
  const current = sessions.find((s) => timeToMin(s.start) <= now && timeToMin(s.end) > now);
  const next = current || upcoming;

  let html = '';

  if (next) {
    const label = current ? 'En curso' : 'Siguiente';
    const color = TYPES[next.type]?.color || 'var(--accent)';
    html += `
      <div class="next-session" style="border-left-color: ${color}">
        <div class="next-label">${label} - ${TYPES[next.type]?.label || ''}</div>
        <div class="next-title">${next.title}</div>
        <div class="next-time">${next.start} - ${next.end}${next.location ? ' - ' + next.location : ''}</div>
      </div>
    `;
  } else {
    html += `<div class="next-session"><div class="next-label">Hoy ya</div><div class="next-title">Sin proximas sesiones</div></div>`;
  }

  const counts = {};
  sessions.forEach((s) => {
    counts[s.type] = (counts[s.type] || 0) + 1;
  });
  const chips = Object.entries(counts).map(([t, n]) => {
    const info = TYPES[t];
    return `<span class="summary-chip" style="color: ${info.color}">${info.label} x${n}</span>`;
  }).join('');
  html += `<div class="summary">${chips || '<span class="summary-chip">Dia tranquilo</span>'}</div>`;

  content.innerHTML = html;
}

/* ---------- Feedback ---------- */
function setupFeedbackListeners() {
  ['energy', 'pain', 'sleep'].forEach((id) => {
    const input = document.getElementById(id);
    const out = document.getElementById(`${id}Val`);
    input.addEventListener('input', () => {
      out.textContent = input.value;
      updateSuggestion();
    });
  });

  document.getElementById('feedbackForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const entry = {
      energy: Number(document.getElementById('energy').value),
      pain: Number(document.getElementById('pain').value),
      sleep: Number(document.getElementById('sleep').value),
      notes: document.getElementById('notes').value.trim(),
      plan: state.currentPlan,
      ts: Date.now(),
    };
    state.feedback[todayDateKey()] = entry;
    saveState();
    renderHistory();
    flashSaved();
  });
}

function loadTodayFeedback() {
  const entry = state.feedback[todayDateKey()];
  if (!entry) return;
  document.getElementById('energy').value = entry.energy;
  document.getElementById('energyVal').textContent = entry.energy;
  document.getElementById('pain').value = entry.pain;
  document.getElementById('painVal').textContent = entry.pain;
  document.getElementById('sleep').value = entry.sleep;
  document.getElementById('sleepVal').textContent = entry.sleep;
  document.getElementById('notes').value = entry.notes || '';
  updateSuggestion();
}

function updateSuggestion() {
  const energy = Number(document.getElementById('energy').value);
  const pain = Number(document.getElementById('pain').value);
  const sleep = Number(document.getElementById('sleep').value);
  const box = document.getElementById('suggestion');

  const tips = [];
  if (pain >= 3) tips.push('Dolor alto: cambia a Plan B y avisa al instructor. Solo drilling, sin sparring.');
  if (energy <= 2) tips.push('Energia baja: salta Advanced. Si es dia DOBLE, haz solo la primera sesion.');
  if (sleep < 6) tips.push('Sueno bajo: descansa fuerza/HIIT manana. Acuestate antes esta noche.');
  if (energy === 5 && pain === 0) tips.push('Estas a tope: aprovecha para sparring, pero no sobrepases tus rondas.');

  if (tips.length === 0) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  box.innerHTML = tips.map((t) => `- ${t}`).join('<br>');
}

function flashSaved() {
  const btn = document.querySelector('#feedbackForm .save-btn');
  const original = btn.textContent;
  btn.textContent = 'Guardado!';
  btn.style.background = 'var(--success)';
  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = '';
  }, 1200);
}

function renderHistory() {
  const container = document.getElementById('history');
  const entries = Object.entries(state.feedback).sort((a, b) => b[0].localeCompare(a[0]));
  if (entries.length === 0) {
    container.innerHTML = '<div class="empty">Aun no has guardado feedback. Hazlo al final del dia.</div>';
    return;
  }
  container.innerHTML = entries.slice(0, 10).map(([date, e]) => `
    <div class="history-entry">
      <div class="date">
        <span>${date} - Plan ${e.plan}</span>
        <button class="delete-entry" data-date="${date}" title="Borrar">&times;</button>
      </div>
      <div class="stats">Energia ${e.energy}/5 - Dolor ${e.pain}/5 - Sueno ${e.sleep}h</div>
      ${e.notes ? `<div class="note">${escapeHtml(e.notes)}</div>` : ''}
    </div>
  `).join('');

  container.querySelectorAll('.delete-entry').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.date;
      if (confirm(`Borrar entrada del ${d}?`)) {
        delete state.feedback[d];
        saveState();
        renderHistory();
        if (d === todayDateKey()) loadTodayFeedback();
      }
    });
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Modal sesion ---------- */
let activeSession = null;

function openModal(session) {
  activeSession = session;
  const backdrop = document.getElementById('modalBackdrop');
  const color = TYPES[session.type]?.color || 'var(--accent)';
  document.querySelector('.modal').style.setProperty('--type-color', color);

  document.getElementById('modalTitle').textContent = session.title;
  document.getElementById('modalMeta').textContent =
    `${session.start} - ${session.end}` +
    (session.location ? ` - ${session.location}` : '') +
    ` - ${TYPES[session.type]?.label || session.type}`;

  const noteEl = document.getElementById('modalNote');
  noteEl.textContent = session.note || '';

  const sessionNoteEl = document.getElementById('sessionNote');
  sessionNoteEl.value = state.sessionNotes[session.id] || '';

  const currentStatus = state.sessionStatus[session.id] || '';
  document.querySelectorAll('.status-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.status === currentStatus);
  });

  backdrop.hidden = false;
}

function closeModal() {
  document.getElementById('modalBackdrop').hidden = true;
  activeSession = null;
}

function setupModalListeners() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  document.querySelectorAll('.status-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!activeSession) return;
      const status = btn.dataset.status;
      if (status) state.sessionStatus[activeSession.id] = status;
      else delete state.sessionStatus[activeSession.id];
      saveState();
      renderWeek();
      document.querySelectorAll('.status-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.status === status && status !== '');
      });
    });
  });

  document.getElementById('saveSessionBtn').addEventListener('click', () => {
    if (!activeSession) return;
    const note = document.getElementById('sessionNote').value.trim();
    if (note) state.sessionNotes[activeSession.id] = note;
    else delete state.sessionNotes[activeSession.id];
    saveState();
    closeModal();
  });
}

/* ---------- Plan toggle ---------- */
function setupPlanToggle() {
  document.querySelectorAll('.plan-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      if (plan === state.currentPlan) return;
      state.currentPlan = plan;
      document.querySelectorAll('.plan-btn').forEach((b) => {
        const active = b.dataset.plan === plan;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', String(active));
      });
      saveState();
      renderWeek();
      renderToday();
    });
  });

  document.querySelectorAll('.plan-btn').forEach((b) => {
    const active = b.dataset.plan === state.currentPlan;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
}

/* ---------- Reset ---------- */
function setupReset() {
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Borrar TODOS los datos guardados (status, notas, feedback)? No se puede deshacer.')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

/* ---------- Init ---------- */
function init() {
  loadState();
  setupPlanToggle();
  setupModalListeners();
  setupFeedbackListeners();
  setupReset();
  renderFilters();
  renderWeek();
  renderToday();
  loadTodayFeedback();
  renderHistory();

  setInterval(renderToday, 60_000);
}

document.addEventListener('DOMContentLoaded', init);
