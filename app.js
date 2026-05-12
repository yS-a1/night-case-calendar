const Core = window.NightCaseCore;
const STORAGE_KEY = 'nightCaseCalendarV4';
let state = loadState();
let cursor = new Date();
let currentView = 'month';
let currentModule = 'dashboard';
let timerSeconds = 25 * 60;
let timerHandle = null;
let draggedEventId = null;
let selectedDay = Core.isoDate(new Date());

const MODULE_META = {
  dashboard: { label: 'Heute', icon: 'dashboard' },
  calendar: { label: 'Kalender', icon: 'planner' },
  tasks: { label: 'Aufgaben', icon: 'task' },
  school: { label: 'Schule', icon: 'school' },
  notes: { label: 'Notizen', icon: 'note' },
  stats: { label: 'Statistiken', icon: 'stats' },
  settings: { label: 'Einstellungen', icon: 'settings' }
};

const ICON_LIBRARY = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11 12 4l8 7"></path><path d="M6 10v10h12V10"></path><path d="M9 20v-6h6v6"></path></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z"></path></svg>`,
  planner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M8 3v4M16 3v4M3 10h18"></path><path d="M8 14h3M13 14h3M8 18h3"></path></svg>`,
  case: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="5.5"></circle><path d="M14.5 14.5 20 20"></path><path d="M7.8 10h4.4"></path></svg>`,
  task: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M8 12.4 10.6 15 16 9"></path></svg>`,
  school: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8 12 4l8 4-8 4-8-4Z"></path><path d="M7 10.2V15c0 1.8 2.2 3 5 3s5-1.2 5-3v-4.8"></path></svg>`,
  exam: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v8.4L6 18a2.8 2.8 0 0 0 2.4 4h7.2A2.8 2.8 0 0 0 18 18l-4-6.6V3"></path><path d="M9 14h6"></path></svg>`,
  habit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 2.8c1.6 3-.8 4.5-.3 6.6.5 1.9 2.3 2.8 2.3 5a4.5 4.5 0 1 1-9 0c0-2.7 1.7-4.1 3.3-5.7 1.6-1.6 2.8-3.2 3.7-5.9Z"></path><path d="M10.7 15.2c0 1.2.7 2.1 1.8 2.8"></path></svg>`,
  stats: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"></path><path d="M7 20v-7"></path><path d="M12 20v-11"></path><path d="M17 20v-4"></path></svg>`,
  note: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"></path><path d="M15 3v5h4"></path><path d="M9 12h6M9 16h6"></path></svg>`,
  privacy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 1 1 8 0v3"></path><circle cx="12" cy="16" r="1.2"></circle></svg>`,
  sport: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4M6 8v8M18 8v8M21 10v4"></path><path d="M6 12h12"></path></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="3"></rect><path d="M8 3v4M16 3v4M4 10h16"></path></svg>`,
  archive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16v4H4z"></path><path d="M6 11h12v8H6z"></path><path d="M10 15h4"></path></svg>`,
  timer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="7"></circle><path d="M12 14V10M9 3h6M12 7V5"></path></svg>`,
  backup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v10"></path><path d="m8.5 9.5 3.5 3.5 3.5-3.5"></path><path d="M5 15v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3"></path></svg>`
};

const ICON_OPTIONS = [
  { id: 'case', label: 'Fall' },
  { id: 'planner', label: 'Plan' },
  { id: 'task', label: 'Task' },
  { id: 'school', label: 'Schule' },
  { id: 'exam', label: 'Prüfung' },
  { id: 'habit', label: 'Habit' },
  { id: 'sport', label: 'Sport' },
  { id: 'note', label: 'Notiz' },
  { id: 'privacy', label: 'Privat' }
];

function loadState() {
  try {
    return { ...Core.createDefaultState(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return Core.createDefaultState();
  }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderAll(); }
const $ = id => document.getElementById(id);
const fmtDate = d => new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(Core.parseDate(d));
const fmtTime = d => new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(Core.parseDate(d));
const inputDateTime = d => { const x = Core.parseDate(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
const monthName = d => new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(d);

function normalizeIconName(value) {
  const map = {
    '🕵️': 'case', '🗓️': 'planner', '✅': 'task', '🎒': 'school', '📚': 'school', '🧪': 'exam', '🔥': 'habit',
    '📊': 'stats', '📝': 'note', '🔒': 'privacy', '🏋️': 'sport', '📁': 'calendar', '📐': 'school', '📖': 'note',
    '🌍': 'school', '🦇': 'privacy'
  };
  const key = map[value] || value;
  return ICON_LIBRARY[key] ? key : 'case';
}
function iconMarkup(name, color = 'currentColor', extra = '') {
  const normalized = normalizeIconName(name);
  return `<span class="icon-mark ${extra}" style="color:${escapeAttr(color)}">${ICON_LIBRARY[normalized]}</span>`;
}
function buttonIconLabel(iconId, label) {
  return `${iconMarkup(iconId, 'var(--gold)', 'tab-mark')}<span class="module-label">${escapeHtml(label)}</span>`;
}
function decorateStaticUi() {
  document.querySelectorAll('#moduleTabs button').forEach(btn => {
    const meta = MODULE_META[btn.dataset.module];
    if (meta) {
      btn.classList.add('module-btn');
      btn.innerHTML = buttonIconLabel(meta.icon, meta.label);
    }
  });
  if ($('heroStrip')) $('heroStrip').innerHTML = [
    ['dashboard', 'Heute'], ['planner', 'Kalender'], ['task', 'Aufgaben'], ['school', 'Schule'], ['note', 'Notizen'], ['settings', 'Settings']
  ].map(([iconId, label]) => `<div class="hero-chip">${iconMarkup(iconId, 'var(--gold)')}<span>${label}</span></div>`).join('');
}

function init() {
  state.meta = { theme: 'noir', iphoneMode: false, startView: 'dashboard', defaultCalendarView: 'month', defaultReminder: 15, ...(state.meta || {}) };
  currentModule = state.meta.startView || 'dashboard';
  currentView = state.meta.defaultCalendarView || 'month';
  state.moods = state.moods || [];
  state.matrix = state.matrix || [];
  state.snoozes = state.snoozes || {};
  if (state.meta && 'xp' in state.meta) delete state.meta.xp;
  decorateStaticUi();
  applyTheme();
  applyDeviceMode();
  if (!state.events.length && !state.tasks.length) seedStarterData(false);
  bindEvents();
  renderAll();
  checkReminders();
  setInterval(checkReminders, 30000);
}

function on(id, event, handler) {
  const el = $(id);
  if (el) el.addEventListener(event, handler);
}

function bindEvents() {
  on('quickAddTopBtn', 'click', () => openEventDialog());
  on('newEventBtn', 'click', () => openEventDialog());
  on('newTaskBtn', 'click', () => openTaskDialog());
  on('dashNewEventBtn', 'click', () => openEventDialog());
  on('dashNewTaskBtn', 'click', () => openTaskDialog());
  on('dashCalendarBtn', 'click', () => switchModule('calendar'));
  on('todayBtn', 'click', () => { cursor = new Date(); switchModule('dashboard'); });
  on('prevBtn', 'click', () => shiftCursor(-1));
  on('nextBtn', 'click', () => shiftCursor(1));
  const viewTabs = $('viewTabs');
  if (viewTabs) viewTabs.onclick = e => {
    const btn = e.target.closest('button[data-view]');
    if (btn) { currentView = btn.dataset.view; state.meta.defaultCalendarView = currentView; saveState(); }
  };
  const moduleTabs = $('moduleTabs');
  if (moduleTabs) moduleTabs.onclick = e => {
    const btn = e.target.closest('button[data-module]');
    if (btn) switchModule(btn.dataset.module);
  };
  const bottomNav = $('bottomNav');
  if (bottomNav) bottomNav.onclick = e => {
    const btn = e.target.closest('button[data-module]');
    if (!btn) return;
    e.preventDefault();
    if (btn.dataset.module === 'more') { document.body.classList.toggle('more-open'); return; }
    document.body.classList.remove('more-open');
    switchModule(btn.dataset.module);
  };
  document.addEventListener('click', e => {
    const nav = $('bottomNav');
    if (nav && !nav.contains(e.target)) document.body.classList.remove('more-open');
  });
  on('searchInput', 'input', () => { renderCalendar(); renderDashboard(); renderNotes(); });
  on('categoryFilter', 'change', () => { renderCalendar(); renderDashboard(); });
  on('addCalendarBtn', 'click', addCalendar);
  on('openTaskDialogBtn', 'click', openTaskDialog);
  on('cancelTaskDialogBtn', 'click', () => $('taskDialog')?.close());
  on('saveTaskBtn', 'click', saveTask);
  on('openNoteDialogBtn', 'click', openNoteDialog);
  on('cancelNoteDialogBtn', 'click', () => $('noteDialog')?.close());
  on('taskFilter', 'change', renderTasks);
  on('taskSort', 'change', renderTasks);
  on('seedSchoolBtn', 'click', () => { seedSchoolWeek(); saveState(); });
  on('addHabitBtn', 'click', addHabit);
  on('timerStart', 'click', toggleTimer);
  on('timerReset', 'click', resetTimer);
  on('saveNoteBtn', 'click', saveNote);
  on('noteSearch', 'input', renderNotes);
  on('exportJsonBtn', 'click', exportJSON);
  on('exportIcsBtn', 'click', exportICS);
  on('exportPdfBtn', 'click', () => window.print());
  on('backupBtn', 'click', exportJSON);
  on('clearTrashBtn', 'click', () => { state.trash = []; saveState(); });
  on('togglePrivacyBtn', 'click', togglePrivacy);
  on('importFile', 'change', importFile);
  on('themeSelect', 'change', () => { state.meta.theme = $('themeSelect').value; saveState(); });
  on('startViewSelect', 'change', () => { state.meta.startView = $('startViewSelect').value; saveState(); });
  on('defaultCalendarView', 'change', () => { state.meta.defaultCalendarView = $('defaultCalendarView').value; currentView = state.meta.defaultCalendarView; saveState(); });
  on('defaultReminderSelect', 'change', () => { state.meta.defaultReminder = Number($('defaultReminderSelect').value); saveState(); });
  on('iphoneModeToggle', 'change', () => { state.meta.iphoneMode = $('iphoneModeToggle').checked; saveState(); });
  on('notifyBtn', 'click', requestNotifications);
  on('protectedExportBtn', 'click', exportEncryptedJSON);
  on('pwaHelpBtn', 'click', showPwaHelp);
  on('saveMoodBtn', 'click', saveMood);
  on('addMatrixBtn', 'click', addMatrixItem);
  on('cancelDialogBtn', 'click', () => $('eventDialog').close());
  on('deleteEventBtn', 'click', deleteCurrentEvent);
  const eventForm = $('eventForm');
  if (eventForm) eventForm.onsubmit = e => { e.preventDefault(); saveEventFromDialog(); };
}

function switchModule(module) {
  currentModule = module;
  state.meta.lastModule = module;
  document.querySelectorAll('#moduleTabs button, #bottomNav button').forEach(b => b.classList.toggle('active', b.dataset.module === module));
  document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
  const target = $(`${module}Module`);
  if (target) target.classList.add('active');
  if (module === 'calendar') renderCalendar();
  renderAll();
}

function shiftCursor(dir) {
  if (currentView === 'day') cursor = Core.addDays(cursor, dir);
  else if (currentView === 'week') cursor = Core.addDays(cursor, dir * 7);
  else if (currentView === 'year') cursor = Core.addYears(cursor, dir);
  else cursor = Core.addMonths(cursor, dir);
  renderAll();
}

function renderAll() {
  document.body.classList.toggle('private-blur', state.meta.privacy);
  applyTheme();
  applyDeviceMode();
  renderNavigation();
  renderCalendars();
  renderSelects();
  renderDashboard();
  renderCalendar();
  renderTasks();
  renderSchool();
  renderHabits();
  renderStats();
  renderNotes();
  renderMoods();
  renderMatrix();
  renderSettings();
  renderPrivacy();
  renderTimer();
}

function renderCalendars() {
  $('calendarList').innerHTML = state.calendars.map(c => `
    <label class="calendar-toggle">
      <input type="checkbox" ${c.visible ? 'checked' : ''} data-cal="${c.id}">
      ${iconMarkup(c.icon || 'calendar', c.color)}
      <span>${escapeHtml(c.name)}</span>
    </label>`).join('');
  document.querySelectorAll('[data-cal]').forEach(el => el.onchange = () => {
    const c = state.calendars.find(x => x.id === el.dataset.cal);
    c.visible = el.checked;
    saveState();
  });
}

function renderSelects() {
  $('eventCalendar').innerHTML = state.calendars.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  const cats = state.categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  $('eventCategory').innerHTML = cats;
  $('categoryFilter').innerHTML = '<option value="all">Alle Kategorien</option>' + cats;
  $('eventIcon').innerHTML = ICON_OPTIONS.map(opt => `<option value="${opt.id}">${opt.label}</option>`).join('');
}

function visibleEventsForSpan(start, end) {
  let events = Core.getVisibleEvents(state, start, end);
  const q = $('searchInput').value.trim().toLowerCase();
  const cat = $('categoryFilter').value;
  if (cat !== 'all') events = events.filter(e => e.categoryId === cat);
  if (q) events = events.filter(e => [e.title, e.description, e.location, e.icon, e.emoji].join(' ').toLowerCase().includes(q));
  if (state.meta.privacy) events = events.map(e => e.private ? { ...e, title: 'Privater Fall', description: '', location: '' } : e);
  return events;
}

function renderCalendar() {
  if (!$('calendarView')) return;
  document.querySelectorAll('#viewTabs button').forEach(b => b.classList.toggle('active', b.dataset.view === currentView));
  if (currentView === 'month') renderMonth();
  if (currentView === 'week') renderWeek();
  if (currentView === 'day') renderDay();
  if (currentView === 'year') renderYear();
  if (currentView === 'agenda') renderAgenda();
}

function renderMonth() {
  $('currentTitle').textContent = monthName(cursor);
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = Core.addDays(first, -((first.getDay() + 6) % 7));
  const end = Core.addDays(start, 41);
  const events = visibleEventsForSpan(start, end);
  const heads = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => `<div class="day-head">${d}</div>`).join('');
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const day = Core.addDays(start, i);
    const key = Core.isoDate(day);
    const dayEvents = events.filter(e => Core.isoDate(e.start) === key);
    const label = dayEvents.length ? `${dayEvents.length} Termin${dayEvents.length === 1 ? '' : 'e'}` : '';
    cells += `<div class="day-cell ${day.getMonth() !== cursor.getMonth() ? 'other' : ''} ${Core.sameDay(day,new Date())?'today':''} ${key === selectedDay ? 'selected' : ''}" data-day="${key}"><div class="day-number">${day.getDate()}</div>${dayEvents.slice(0,1).map(eventHtml).join('')}${dayEvents.length>1?`<small>${label}</small>`:(label&&!dayEvents.length?`<small>${label}</small>`:'')}</div>`;
  }
  const selectedDate = Core.parseDate(selectedDay);
  const selectedEvents = visibleEventsForSpan(Core.startOfDay(selectedDate), Core.endOfDay(selectedDate));
  const selectedHtml = selectedEvents.map(e => `<div class="list-row" data-event="${e.originalId || e.id}"><b>${e.allDay ? 'Tag' : fmtTime(e.start)}</b><span>${escapeHtml(e.title)}${e.location ? ' · '+escapeHtml(e.location) : ''}</span></div>`).join('') || '<p>Keine Termine an diesem Tag.</p>';
  $('calendarView').innerHTML = `<div class="calendar-layout"><div class="calendar-grid compact-month">${heads}${cells}</div><aside class="selected-day card"><p class="eyebrow">Ausgewählter Tag</p><h2>${fmtDate(selectedDate)}</h2>${selectedHtml}</aside></div>`;
  wireCalendarClicks();
}


function renderWeek() {
  const start = Core.addDays(cursor, -((cursor.getDay() + 6) % 7));
  const end = Core.addDays(start, 6);
  $('currentTitle').textContent = `${fmtDate(start)} – ${fmtDate(end)}`;
  const events = visibleEventsForSpan(start, Core.endOfDay(end));
  let html = '<div class="week-grid"><div></div>' + Array.from({ length: 7 }, (_, i) => `<b>${fmtDate(Core.addDays(start, i))}</b>`).join('');
  for (let h = 6; h <= 22; h++) {
    html += `<div class="time-slot">${String(h).padStart(2, '0')}:00</div>`;
    for (let d = 0; d < 7; d++) {
      const day = Core.addDays(start, d);
      const ev = events.filter(e => Core.isoDate(e.start) === Core.isoDate(day) && Core.parseDate(e.start).getHours() === h);
      html += `<div class="timeline-day" data-day="${Core.isoDate(day)}">${ev.map(eventHtml).join('')}</div>`;
    }
  }
  $('calendarView').innerHTML = html + '</div>';
  wireCalendarClicks();
}

function renderDay() {
  $('currentTitle').textContent = fmtDate(cursor);
  const events = visibleEventsForSpan(Core.startOfDay(cursor), Core.endOfDay(cursor));
  let html = '<div class="day-grid">';
  for (let h = 5; h <= 23; h++) {
    const ev = events.filter(e => Core.parseDate(e.start).getHours() === h || e.allDay);
    html += `<div class="time-slot">${String(h).padStart(2, '0')}:00</div><div class="timeline-day" data-day="${Core.isoDate(cursor)}">${ev.map(eventHtml).join('')}</div>`;
  }
  $('calendarView').innerHTML = html + '</div>';
  wireCalendarClicks();
}

function renderAgenda() {
  const start = Core.startOfDay(cursor), end = Core.addDays(start, 60);
  $('currentTitle').textContent = 'Agenda der nächsten 60 Tage';
  const events = visibleEventsForSpan(start, end);
  $('calendarView').innerHTML = `<div class="agenda-list">${events.map(e => `<div class="agenda-item ${e.private ? 'private-item' : ''}" data-event="${e.originalId || e.id}"><strong>${fmtDate(e.start)}<br>${e.allDay ? 'ganztägig' : fmtTime(e.start) + ' – ' + fmtTime(e.end)}</strong><div>${eventHtml(e)}<small>${escapeHtml(e.location || '')}</small></div><button data-edit="${e.originalId || e.id}">Bearbeiten</button></div>`).join('') || '<div class="card">Keine Fälle gefunden.</div>'}</div>`;
  wireCalendarClicks();
}

function renderYear() {
  $('currentTitle').textContent = String(cursor.getFullYear());
  let html = '<div class="year-grid">';
  for (let m = 0; m < 12; m++) {
    const first = new Date(cursor.getFullYear(), m, 1);
    const days = new Date(cursor.getFullYear(), m + 1, 0).getDate();
    const ev = visibleEventsForSpan(first, new Date(cursor.getFullYear(), m, days));
    html += `<div class="mini-month"><b>${monthName(first)}</b><div class="mini-days">${Array.from({ length: days }, (_, i) => {
      const k = Core.isoDate(new Date(cursor.getFullYear(), m, i + 1));
      return `<span class="${ev.some(e => Core.isoDate(e.start) === k) ? 'has' : ''}">${i + 1}</span>`;
    }).join('')}</div></div>`;
  }
  $('calendarView').innerHTML = html + '</div>';
}

function eventHtml(e) {
  const iconId = normalizeIconName(e.icon || e.emoji || state.categories.find(c => c.id === e.categoryId)?.icon || 'case');
  return `<div class="event-pill ${e.private ? 'private-item' : ''}" draggable="true" data-event="${e.originalId || e.id}" style="border-left-color:${escapeAttr(e.color || '#ffd84d')}">${iconMarkup(iconId, e.color || 'var(--gold)')}<span>${escapeHtml(e.title)}</span></div>`;
}

function wireCalendarClicks() {
  document.querySelectorAll('[data-day]').forEach(cell => { cell.ondblclick = () => openEventDialog({ start: `${cell.dataset.day}T09:00` }); cell.onclick = e => { if (!e.target.closest('[data-event]')) { selectedDay = cell.dataset.day; cursor = Core.parseDate(selectedDay); renderCalendar(); } }; });
  document.querySelectorAll('[data-event],[data-edit]').forEach(el => el.onclick = e => {
    e.stopPropagation();
    openEventDialog(state.events.find(x => x.id === (el.dataset.event || el.dataset.edit)));
  });
  document.querySelectorAll('.event-pill[data-event]').forEach(el => {
    el.ondragstart = e => { draggedEventId = el.dataset.event; e.dataTransfer.setData('text/plain', draggedEventId); };
  });
  document.querySelectorAll('[data-day]').forEach(cell => {
    cell.ondragover = e => e.preventDefault();
    cell.ondrop = e => { e.preventDefault(); moveEventToDate(e.dataTransfer.getData('text/plain') || draggedEventId, cell.dataset.day); };
  });
}

function openEventDialog(event = {}) {
  const start = event.start ? Core.parseDate(event.start) : new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 9, 0);
  const end = event.end ? Core.parseDate(event.end) : new Date(start.getTime() + 60 * 60000);
  $('dialogTitle').textContent = event.id ? 'Fallakte bearbeiten' : 'Fallakte erstellen';
  $('eventId').value = event.id || '';
  $('eventTitle').value = event.title || '';
  $('eventDescription').value = event.description || '';
  $('eventLocation').value = event.location || '';
  if ($('eventStatus')) $('eventStatus').value = event.status || 'planned';
  if ($('eventNotes')) $('eventNotes').value = event.notes || '';
  $('eventStart').value = inputDateTime(start);
  $('eventEnd').value = inputDateTime(end);
  $('eventAllDay').checked = !!event.allDay;
  $('eventIcon').value = normalizeIconName(event.icon || event.emoji || state.categories.find(c => c.id === event.categoryId)?.icon || 'case');
  $('eventCalendar').value = event.calendarId || 'main';
  $('eventCategory').value = event.categoryId || 'case';
  $('eventColor').value = event.color || '#ffd84d';
  $('eventRepeat').value = event.recurrence?.frequency || 'none';
  $('eventInterval').value = event.recurrence?.interval || 1;
  $('eventUntil').value = event.recurrence?.until || '';
  Array.from($('eventReminders').options).forEach(o => o.selected = (event.reminders || []).includes(Number(o.value)));
  $('eventPrivate').checked = !!event.private;
  $('deleteEventBtn').style.display = event.id ? 'inline-block' : 'none';
  $('eventDialog').showModal();
}

function saveEventFromDialog() {
  const repeat = $('eventRepeat').value;
  const iconId = $('eventIcon').value || 'case';
  Core.upsertEvent(state, {
    id: $('eventId').value || undefined,
    title: $('eventTitle').value,
    description: $('eventDescription').value,
    location: $('eventLocation').value,
    start: $('eventStart').value,
    end: $('eventEnd').value,
    allDay: $('eventAllDay').checked,
    icon: iconId,
    emoji: iconId,
    calendarId: $('eventCalendar').value,
    categoryId: $('eventCategory').value,
    color: $('eventColor').value,
    private: $('eventPrivate').checked,
    status: $('eventStatus')?.value || 'planned',
    notes: $('eventNotes')?.value || '',
    reminders: Array.from($('eventReminders').selectedOptions).map(o => Number(o.value)),
    recurrence: repeat === 'none' ? null : { frequency: repeat, interval: Number($('eventInterval').value || 1), until: $('eventUntil').value || null }
  });
  $('eventDialog').close();
  saveState();
}

function deleteCurrentEvent() {
  if ($('eventId').value && confirm('Termin löschen?')) {
    Core.deleteEvent(state, $('eventId').value);
    $('eventDialog').close();
    saveState();
  }
}

function addCalendar() {
  const name = prompt('Name des lokalen Kalenders:');
  if (!name) return;
  state.calendars.push({ id: Core.uid('cal'), name, color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'), icon: 'calendar', visible: true, locked: false });
  saveState();
}

function openTaskDialog(){ $('taskDialog')?.showModal(); setTimeout(()=>$('taskTitle')?.focus(), 50); }
function saveTask(e) {
  if (e) e.preventDefault();
  if (!$('taskTitle').value.trim()) return;
  Core.upsertTask(state, { title: $('taskTitle').value, deadline: $('taskDeadline').value, priority: $('taskPriority').value });
  $('taskTitle').value = '';
  if ($('taskDeadline')) $('taskDeadline').value = '';
  $('taskDialog')?.close();
  saveState();
}

function renderTasks() {
  let items = state.tasks.filter(t => !t.archived);
  const filter = $('taskFilter')?.value || 'all';
  const sort = $('taskSort')?.value || 'date';
  if (filter === 'open') items = items.filter(t => !t.done);
  if (filter === 'done') items = items.filter(t => t.done);
  if (filter === 'deadline') items = items.filter(t => !!t.deadline);
  const priorityScore = { high: 0, medium: 1, low: 2 };
  items = items.sort((a, b) => sort === 'priority' ? (priorityScore[a.priority] ?? 9) - (priorityScore[b.priority] ?? 9) : (a.done - b.done) || String(a.deadline || '9999').localeCompare(String(b.deadline || '9999')));
  $('taskList').innerHTML = items.map(t => `
    <div class="task-card ${t.done ? 'done' : ''} priority-${t.priority}">
      <input type="checkbox" ${t.done ? 'checked' : ''} data-task="${t.id}">
      <div>
        <div class="task-head">${iconMarkup('task', t.color || 'var(--gold)')}<b>${escapeHtml(t.title)}</b></div>
        <small>${t.deadline ? `Deadline: ${escapeHtml(t.deadline)}` : 'ohne Deadline'} · Priorität: ${escapeHtml(t.priority)}</small>
      </div>
      <button data-archive="${t.id}" class="ghost">${iconMarkup('archive', 'var(--gold)')}Archiv</button>
    </div>`).join('') || '<p>Keine Aufgaben.</p>';
  document.querySelectorAll('[data-task]').forEach(el => el.onchange = () => { if(Core.toggleTask(state, el.dataset.task)){ } saveState(); });
  document.querySelectorAll('[data-archive]').forEach(el => el.onclick = () => { const t = state.tasks.find(x => x.id === el.dataset.archive); t.archived = true; saveState(); });
}

function seedSchoolWeek() {
  const base = Core.addDays(new Date(), -((new Date().getDay() + 6) % 7));
  [['Mathe', 'school', '#31d6ff', 0, 8], ['Deutsch', 'note', '#ffd84d', 1, 10], ['Englisch', 'school', '#7bffb0', 2, 9], ['Sport', 'sport', '#b98cff', 3, 13], ['Klassenarbeit', 'exam', '#ff4d4d', 4, 11]].forEach(([title, icon, color, day, h]) => {
    const s = new Date(base);
    s.setDate(base.getDate() + day);
    s.setHours(h, 0, 0, 0);
    Core.upsertEvent(state, { title, icon, color, start: s, end: new Date(s.getTime() + 90 * 60000), calendarId: 'school', categoryId: title === 'Klassenarbeit' ? 'exam' : 'school', location: 'Raum ' + (100 + day) });
  });
  Core.upsertTask(state, { title: 'Hausaufgaben kontrollieren', deadline: Core.isoDate(Core.addDays(new Date(), 2)), priority: 'high', categoryId: 'school' });
}

function renderSchool() {
  const start = Core.addDays(new Date(), -((new Date().getDay() + 6) % 7));
  const end = Core.addDays(start, 6);
  const ev = Core.getVisibleEvents(state, start, Core.endOfDay(end)).filter(e => e.calendarId === 'school' || ['school', 'exam'].includes(e.categoryId));
  $('schoolTimetable').innerHTML = ev.map(e => `<div class="event-pill" style="border-left-color:${escapeAttr(e.color || '#ffd84d')}">${iconMarkup(e.icon || e.emoji || 'school', e.color || 'var(--gold)')}<span>${fmtDate(e.start)} ${fmtTime(e.start)} · ${escapeHtml(e.title)} <small>${escapeHtml(e.location || '')}</small></span></div>`).join('') || '<p>Noch kein Stundenplan. Demo-Woche anlegen.</p>';
  $('schoolSummary').innerHTML = `<div class="school-kpis"><span><b>${state.tasks.filter(t => !t.done && !t.archived && t.categoryId === 'school').length}</b> offene Hausaufgaben</span><span><b>${ev.filter(e => e.categoryId === 'exam').length}</b> Prüfungen</span></div><p>Nächster Lernblock: <b>${ev[0] ? fmtDate(ev[0].start)+' · '+escapeHtml(ev[0].title) : 'keiner'}</b></p>`;
  if ($('subjectList')) $('subjectList').innerHTML = state.categories.filter(c => ['school','exam','sport'].includes(c.id)).map(c => `<div class="task-card"><div>${iconMarkup(c.icon,c.color)}</div><div><b>${escapeHtml(c.name)}</b><br><small>Farbe / Kategorie</small></div></div>`).join('');
  if ($('examCountdown')) { const exam = ev.filter(e => e.categoryId === 'exam').sort((a,b)=>Core.parseDate(a.start)-Core.parseDate(b.start))[0]; $('examCountdown').innerHTML = exam ? `<div class="stat"><strong>${Math.max(0, Math.ceil((Core.parseDate(exam.start)-new Date())/86400000))}</strong>Tage bis ${escapeHtml(exam.title)}</div>` : '<p>Keine Prüfung geplant.</p>'; }
}

function addHabit() {
  const name = $('habitName').value.trim();
  if (!name) return;
  state.habits.push({ id: Core.uid('habit'), name, streak: 0, dates: [] });
  $('habitName').value = '';
  saveState();
}

function renderHabits() {
  if (!$('habitList')) return;
  $('habitList').innerHTML = state.habits.map(h => `
    <div class="task-card">
      <div>${iconMarkup('habit', 'var(--gold)')}</div>
      <div><b>${escapeHtml(h.name)}</b><br><small>Streak: ${h.streak || 0}</small></div>
      <button data-habit="${h.id}">Heute erledigt</button>
    </div>`).join('') || '<p>Noch keine Habits.</p>';
  document.querySelectorAll('[data-habit]').forEach(el => el.onclick = () => {
    const h = state.habits.find(x => x.id === el.dataset.habit);
    const today = Core.isoDate(new Date());
    if (!h.dates.includes(today)) { h.dates.push(today); h.streak = (h.streak || 0) + 1; }
    saveState();
  });
}

function renderTimer() {
  if (!$('timerDisplay')) return;
  const m = Math.floor(timerSeconds / 60), s = timerSeconds % 60;
  $('timerDisplay').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function toggleTimer() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; $('timerStart').textContent = 'Start'; return; }
  $('timerStart').textContent = 'Pause';
  timerHandle = setInterval(() => {
    timerSeconds--;
    if (timerSeconds <= 0) {
      clearInterval(timerHandle);
      timerHandle = null;
      alert('Pomodoro abgeschlossen. Pause einlegen.');
      resetTimer();
    }
    renderTimer();
  }, 1000);
}
function resetTimer() { timerSeconds = 25 * 60; if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } $('timerStart').textContent = 'Start'; renderTimer(); }

function openNoteDialog(){ $('noteDialog')?.showModal(); setTimeout(()=>$('noteTitle')?.focus(), 50); }
function saveNote(e) {
  if (e) e.preventDefault();
  const text = $('quickNote')?.value.trim();
  if (!text) return;
  state.notes.unshift({ id: Core.uid('note'), title: $('noteTitle')?.value.trim() || 'Notiz', text, category: $('noteCategory')?.value || 'general', createdAt: new Date().toISOString(), private: $('noteCategory')?.value === 'private' });
  if ($('quickNote')) $('quickNote').value = '';
  if ($('noteTitle')) $('noteTitle').value = '';
  $('noteDialog')?.close();
  saveState();
}
function renderNotes() {
  if (!$('notesList')) return;
  const q = ($('noteSearch')?.value || '').toLowerCase();
  const notes = (state.notes || []).filter(n => !q || [n.title, n.text, n.category].join(' ').toLowerCase().includes(q));
  $('notesList').innerHTML = notes.map(n => `<article class="note ${n.private ? 'private-item' : ''}"><h3>${escapeHtml(n.title || 'Notiz')}</h3><small>${escapeHtml(n.category || 'Allgemein')} · ${new Intl.DateTimeFormat('de-DE',{day:'2-digit', month:'long'}).format(Core.parseDate(n.createdAt))}</small><p>${escapeHtml(n.text)}</p></article>`).join('') || '<p>Keine Notizen.</p>';
}


function renderStats() {
  if (!$('statsPanel') || !$('heatmap')) return;
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1), end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const st = Core.stats(state, start, Core.endOfDay(end));
  const done = Number(st.tasksDone || 0), open = Number(st.tasksOpen || 0);
  const progress = done + open ? Math.round(done / (done + open) * 100) : 100;
  $('statsPanel').innerHTML = `<div class="stat soft-stat"><span>Heute</span><strong>${visibleEventsForSpan(Core.startOfDay(new Date()), Core.endOfDay(new Date())).length}</strong>Termine</div><div class="stat soft-stat"><span>Aufgaben</span><strong>${open}</strong>offen</div><div class="stat soft-stat"><span>Fortschritt</span><strong>${progress}%</strong>Monat</div><div class="stat soft-stat"><span>Fokus</span><strong>${Math.round(Object.values(st.minutesByCategory || {}).reduce((a,b)=>a+b,0))}m</strong>Zeit</div>`;
  renderReportBars(st);
  $('heatmap').innerHTML = Array.from({ length: 31 }, (_, i) => {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), i + 1);
    const count = visibleEventsForSpan(Core.startOfDay(date), Core.endOfDay(date)).length;
    return `<div class="heat l${Math.min(3, count)}" title="${i + 1}: ${count} Termine"></div>`;
  }).join('');
}


function renderPrivacy() {
  if (!$('privacyState')) return;
  $('privacyState').innerHTML = `<p>Privatmodus: <b>${state.meta.privacy ? 'aktiv' : 'aus'}</b></p><p>Papierkorb: ${state.trash.length} Elemente</p>`;
}
function togglePrivacy() { state.meta.privacy = !state.meta.privacy; saveState(); }
function exportJSON() { download(`night-case-backup-${Date.now()}.json`, JSON.stringify(state, null, 2), 'application/json'); }
function exportICS() { const events = Core.getVisibleEvents(state, new Date(2000, 0, 1), new Date(2100, 0, 1)); download(`night-case-${Date.now()}.ics`, Core.exportICS(events), 'text/calendar'); }
function download(filename, content, type) { const blob = new Blob([content], { type }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href); }
function importFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      if (file.name.endsWith('.ncsec')) { alert('Verschlüsselte Datei: nutze Export-Passwort in Version 3. Import folgt als nächster Schritt.'); return; }
      if (file.name.endsWith('.json')) state = { ...Core.createDefaultState(), ...JSON.parse(reader.result) };
      else state.events.push(...Core.importICS(reader.result));
      saveState();
    } catch (err) {
      alert('Import fehlgeschlagen: ' + err.message);
    }
  };
  reader.readAsText(file);
}
function checkReminders() {
  const now = new Date();
  const soon = Core.addDays(now, 1);
  Core.getVisibleEvents(state, now, soon).forEach(e => {
    (e.reminders || []).forEach(min => {
      const key = `rem_${e.id}_${e.occurrenceDate || ''}_${min}`;
      const normalTrigger = new Date(Core.parseDate(e.start).getTime() - min * 60000);
      const trigger = state.snoozes[key] ? Core.parseDate(state.snoozes[key]) : normalTrigger;
      if (Math.abs(now - trigger) < 30000 && !sessionStorage.getItem(key + '_' + trigger.toISOString())) {
        sessionStorage.setItem(key + '_' + trigger.toISOString(), '1');
        notifyUser('Night Case Erinnerung', `${e.title} in ${min} Minuten`);
        if (confirm(`Erinnerung: ${e.title}\n10 Minuten snoozen?`)) {
          state.snoozes[key] = new Date(Date.now() + 10 * 60000).toISOString();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
      }
    });
  });
}

function seedStarterData(save = true) {
  const now = new Date();
  Core.upsertEvent(state, { title: 'Geheimer Lernblock', description: 'Mathe wiederholen, Checkliste vorbereiten', location: 'Zimmer', icon: 'case', color: '#ffd84d', start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0), end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30), reminders: [15], calendarId: 'school', categoryId: 'school' });
  Core.upsertTask(state, { title: 'Rucksack packen', deadline: Core.isoDate(now), priority: 'medium', categoryId: 'school' });
  state.habits.push({ id: Core.uid('habit'), name: '20 Minuten lesen', streak: 0, dates: [] });
  state.notes.push({ id: Core.uid('note'), text: 'Willkommen in der Night Case Zentrale. Alles ist offline lokal gespeichert.', createdAt: new Date().toISOString() });
  if (save) saveState();
}

function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function escapeAttr(s) { return escapeHtml(String(s)); }


function renderNavigation() {
  const bottom = $('bottomNav');
  if (!bottom) return;
  const primary = [
    ['dashboard', MODULE_META.dashboard],
    ['calendar', MODULE_META.calendar],
    ['tasks', MODULE_META.tasks],
    ['school', MODULE_META.school],
    ['more', { label: 'Mehr', icon: 'settings' }]
  ];
  const moreItems = [
    ['notes', MODULE_META.notes],
    ['stats', MODULE_META.stats],
    ['settings', MODULE_META.settings]
  ];
  bottom.innerHTML = primary.map(([key, meta]) => `<button type="button" data-module="${key}" class="${currentModule === key || (key === 'more' && ['notes','stats','settings'].includes(currentModule)) ? 'active' : ''}">${iconMarkup(meta.icon, 'var(--gold)')}<span>${meta.label}</span></button>`).join('') +
    `<div class="more-menu">${moreItems.map(([key, meta]) => `<button type="button" data-module="${key}">${iconMarkup(meta.icon, 'var(--gold)')}<span>${meta.label}</span></button>`).join('')}</div>`;
  document.querySelectorAll('#moduleTabs button').forEach(b => b.classList.toggle('active', b.dataset.module === currentModule));
}


function renderDashboard() {
  if (!$('todayEvents')) return;
  const todayStart = Core.startOfDay(new Date());
  const todayEnd = Core.endOfDay(new Date());
  const weekEnd = Core.addDays(todayStart, 7);
  const todayEvents = visibleEventsForSpan(todayStart, todayEnd);
  const weekEvents = visibleEventsForSpan(todayStart, weekEnd);
  const openTasks = state.tasks.filter(t => !t.archived && !t.done);
  const todayTasks = openTasks.filter(t => !t.deadline || t.deadline === Core.isoDate(new Date()));
  const schoolTasks = openTasks.filter(t => t.categoryId === 'school' || /hausaufgabe/i.test(t.title));
  const exams = weekEvents.filter(e => e.categoryId === 'exam' || /test|prüfung|klassenarbeit/i.test(e.title)).sort((a,b)=>Core.parseDate(a.start)-Core.parseDate(b.start));
  const doneToday = state.tasks.filter(t => t.done && Core.isoDate(t.updatedAt || t.createdAt || new Date()) === Core.isoDate(new Date())).length;
  const totalToday = todayTasks.length + doneToday;
  const progress = totalToday ? Math.round(doneToday / totalToday * 100) : 100;
  const dateLong = new Intl.DateTimeFormat('de-DE', { weekday:'long', day:'2-digit', month:'long' }).format(new Date());
  $('dashboardDateTitle').textContent = dateLong;
  $('dashboardSubtitle').textContent = `Heute hast du ${todayEvents.length} Termin${todayEvents.length === 1 ? '' : 'e'} und ${openTasks.length} offene Aufgabe${openTasks.length === 1 ? '' : 'n'}.`;
  const next = todayEvents[0] || weekEvents[0];
  $('todayEvents').innerHTML = next ? `<div class="focus-time">${next.allDay ? 'Ganztägig' : fmtTime(next.start)}</div><h3>${escapeHtml(next.title)}</h3><p>${fmtDate(next.start)}${next.location ? ' · ' + escapeHtml(next.location) : ''}</p>` : `<div class="focus-time">Frei</div><h3>Kein Termin geplant</h3><p>Du hast Raum für Lernen, Pause oder Planung.</p>`;
  $('todayTasks').innerHTML = `<div class="metric-value">${openTasks.length}</div><p>offen</p>`;
  $('dayProgress').innerHTML = `<div class="metric-value">${progress}%</div><p>Tagesfortschritt</p><div class="xpbar"><span style="width:${progress}%"></span></div>`;
  $('weekPreview').innerHTML = weekEvents.slice(0,5).map(e => `<div class="list-row" data-event="${e.originalId || e.id}"><b>${new Intl.DateTimeFormat('de-DE',{weekday:'short'}).format(Core.parseDate(e.start))}</b><span>${e.allDay ? 'ganztägig' : fmtTime(e.start)} · ${escapeHtml(e.title)}</span></div>`).join('') || '<p>Diese Woche ist frei.</p>';
  $('schoolPreview').innerHTML = `<div class="school-kpis"><span><b>${schoolTasks.length}</b> Hausaufgaben</span><span><b>${exams.length}</b> Prüfungen</span></div><p>Nächste Klassenarbeit: <b>${exams[0] ? escapeHtml(exams[0].title) : 'keine'}</b></p>`;
  if ($('nextReminder')) $('nextReminder').innerHTML = weekEvents.find(e => (e.reminders || []).length)?.title || '';
  renderMiniCalendar();
  wireCalendarClicks();
}


function renderMiniCalendar() {
  if (!$('miniCalendar')) return;
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const ev = visibleEventsForSpan(first, new Date(cursor.getFullYear(), cursor.getMonth(), days));
  $('miniCalendar').innerHTML = `<div class="mini-month"><b>${monthName(first)}</b><div class="mini-days">${Array.from({length:days},(_,i)=>{ const k=Core.isoDate(new Date(cursor.getFullYear(),cursor.getMonth(),i+1)); return `<span class="${ev.some(e=>Core.isoDate(e.start)===k)?'has':''}">${i+1}</span>`; }).join('')}</div></div>`;
}

function renderSettings() {
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone;
  if ($('pwaStatus')) $('pwaStatus').textContent = standalone ? 'Installiert: läuft als Home-Screen-App.' : 'Safari öffnen → Teilen → Zum Home-Bildschirm.';
  document.body.classList.toggle('pwa-standalone', Boolean(standalone));
  if ($('startViewSelect')) $('startViewSelect').value = state.meta.startView || 'dashboard';
  if ($('defaultCalendarView')) $('defaultCalendarView').value = state.meta.defaultCalendarView || currentView || 'month';
  if ($('defaultReminderSelect')) $('defaultReminderSelect').value = String(state.meta.defaultReminder || 15);
}

function showPwaHelp() {
  alert('So installierst du Night Case auf dem iPhone:\n\n1. App-Link in Safari öffnen.\n2. Teilen-Button antippen.\n3. „Zum Home-Bildschirm“ wählen.\n4. „Hinzufügen“ tippen.\n\nWichtig: Service Worker und Offline-Cache funktionieren nicht direkt aus einer lokalen file:// Datei, sondern über HTTPS oder localhost.');
}

function applyTheme() {
  const theme = state.meta?.theme || 'noir';
  document.body.dataset.theme = theme;
  if ($('themeSelect')) $('themeSelect').value = theme;
  const themeColors = { noir: '#09090f', light: '#f4efe4', crimson: '#2a0b12', cyan: '#071820', 'matte-red': '#0a0a0c' };
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme] || '#09090f');
}

function applyDeviceMode() {
  const active = Boolean(state.meta?.iphoneMode);
  document.body.classList.toggle('iphone-mode', active);
  if ($('iphoneModeToggle')) $('iphoneModeToggle').checked = active;
}
function moveEventToDate(id, dateStr) {
  const event = state.events.find(e => e.id === id);
  if (!event || !dateStr) return;
  const start = Core.parseDate(event.start);
  const end = Core.parseDate(event.end);
  const duration = end - start;
  const [y, m, d] = dateStr.split('-').map(Number);
  const nextStart = new Date(start);
  nextStart.setFullYear(y, m - 1, d);
  const nextEnd = new Date(nextStart.getTime() + duration);
  event.start = nextStart.toISOString();
  event.end = nextEnd.toISOString();
  event.updatedAt = new Date().toISOString();
  saveState();
}
function renderReportBars(st) {
  const cats = state.categories.map(c => ({...c, minutes: Math.round((st.minutesByCategory[c.id] || 0))})).filter(c => c.minutes > 0);
  const max = Math.max(1, ...cats.map(c => c.minutes));
  $('reportBars').innerHTML = cats.map(c => `<div class="report-row"><span>${iconMarkup(c.icon, c.color)} ${escapeHtml(c.name)}</span><div><i style="width:${Math.max(5, c.minutes / max * 100)}%"></i></div><b>${c.minutes}m</b></div>`).join('') || '<p>Keine Zeitdaten.</p>';
}
function saveMood() {
  const mood = $('moodSelect').value;
  const note = $('moodNote').value.trim();
  state.moods.unshift({ id: Core.uid('mood'), mood, note, createdAt: new Date().toISOString() });
  $('moodNote').value = '';
  saveState();
}
function renderMoods() {
  if (!$('moodList')) return;
  const labels = { focus: 'Fokussiert', calm: 'Ruhig', tired: 'Müde', stress: 'Stress', happy: 'Gut' };
  $('moodList').innerHTML = (state.moods || []).slice(0, 8).map(m => `<div class="note"><small>${fmtDate(m.createdAt)} ${fmtTime(m.createdAt)}</small><p><b>${labels[m.mood] || m.mood}</b> ${escapeHtml(m.note || '')}</p></div>`).join('') || '<p>Noch keine Mood-Einträge.</p>';
}
function addMatrixItem() {
  const title = $('matrixTask').value.trim();
  if (!title) return;
  state.matrix.push({ id: Core.uid('matrix'), title, quadrant: $('matrixQuadrant').value, done: false });
  $('matrixTask').value = '';
  saveState();
}
function renderMatrix() {
  if (!$('matrixBoard')) return;
  const q = { do: 'Jetzt', plan: 'Planen', delegate: 'Kurz', drop: 'Weg' };
  $('matrixBoard').innerHTML = Object.keys(q).map(key => `<div class="matrix-cell"><b>${q[key]}</b>${(state.matrix || []).filter(i => i.quadrant === key).map(i => `<button data-matrix="${i.id}">${escapeHtml(i.title)}</button>`).join('') || '<small>leer</small>'}</div>`).join('');
  document.querySelectorAll('[data-matrix]').forEach(btn => btn.onclick = () => { state.matrix = state.matrix.filter(i => i.id !== btn.dataset.matrix); saveState(); });
}
function requestNotifications() {
  if (!('Notification' in window)) { alert('Dieser Browser unterstützt keine Notifications.'); return; }
  Notification.requestPermission().then(p => alert(p === 'granted' ? 'Benachrichtigungen aktiv.' : 'Nicht erlaubt.'));
}
function notifyUser(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body });
}
async function exportEncryptedJSON() {
  if (!crypto?.subtle) { alert('Verschlüsselung wird von diesem Browser nicht unterstützt.'); return; }
  const password = prompt('Passwort für verschlüsselten Export:');
  if (!password) return;
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(state)));
  const pack = { version: 1, alg: 'AES-GCM', kdf: 'PBKDF2-SHA256', iterations: 120000, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(cipher)) };
  download(`night-case-secure-${Date.now()}.ncsec`, JSON.stringify(pack), 'application/json');
}
function b64(bytes) {
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}

init();
