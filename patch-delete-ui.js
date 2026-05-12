(() => {
  const STORAGE_KEY = 'nightCaseCalendarV4';
  const $ = id => document.getElementById(id);

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }
  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.location.reload();
  }
  function ask(text) { return window.confirm(text); }

  function removePhoneToggle() {
    document.querySelector('.top-device-bar')?.remove();
    document.querySelector('.iphone-stage')?.remove();
    document.body.classList.remove('iphone-mode');
    const shell = $('app-shell');
    if (shell) shell.classList.remove('iphone-mode');
    const state = readState();
    if (state.meta) state.meta.iphoneMode = false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function findCard(el) {
    return el.closest('.task-card,.note,.matrix-cell button,.calendar-toggle');
  }

  function ensureButton(container, id, label, className = 'danger tiny-delete') {
    if (!container || container.querySelector(`[data-delete-kind="${id}"]`)) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = label;
    btn.dataset.deleteKind = id;
    container.appendChild(btn);
  }

  function enhanceTasks() {
    document.querySelectorAll('#taskList .task-card').forEach((card, index) => {
      if (card.querySelector('[data-delete-kind="task"]')) return;
      const input = card.querySelector('[data-task]');
      const id = input?.dataset.task || card.querySelector('[data-archive]')?.dataset.archive;
      if (!id) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'danger tiny-delete';
      btn.textContent = 'Löschen';
      btn.dataset.deleteKind = 'task';
      btn.dataset.deleteId = id;
      card.appendChild(btn);
    });
  }

  function enhanceNotes() {
    document.querySelectorAll('#notesList .note').forEach((note, index) => {
      if (note.querySelector('[data-delete-kind="note"]')) return;
      const state = readState();
      const noteData = (state.notes || [])[index];
      if (!noteData?.id) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'danger tiny-delete';
      btn.textContent = 'Löschen';
      btn.dataset.deleteKind = 'note';
      btn.dataset.deleteId = noteData.id;
      note.appendChild(btn);
    });
  }

  function enhanceHabits() {
    document.querySelectorAll('#habitList .task-card').forEach((card, index) => {
      if (card.querySelector('[data-delete-kind="habit"]')) return;
      const habitButton = card.querySelector('[data-habit]');
      const id = habitButton?.dataset.habit;
      if (!id) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'danger tiny-delete';
      btn.textContent = 'Löschen';
      btn.dataset.deleteKind = 'habit';
      btn.dataset.deleteId = id;
      card.appendChild(btn);
    });
  }

  function enhanceMatrix() {
    document.querySelectorAll('#matrixBoard .matrix-cell button').forEach((item, index) => {
      if (item.dataset.deleteKind) return;
      if (item.querySelector('.matrix-delete-x')) return;
      const state = readState();
      const text = item.textContent.trim();
      const found = (state.matrix || []).find(x => x.title === text || x.text === text || x.name === text);
      item.dataset.matrixTitle = text;
      const x = document.createElement('span');
      x.className = 'matrix-delete-x';
      x.textContent = '×';
      item.appendChild(x);
    });
  }

  function enhanceCalendars() {
    document.querySelectorAll('#calendarList .calendar-toggle').forEach(label => {
      const input = label.querySelector('[data-cal]');
      const id = input?.dataset.cal;
      if (!id || label.querySelector('[data-delete-kind="calendar"]')) return;
      if (['main','school','private'].includes(id)) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'danger tiny-delete calendar-delete';
      btn.textContent = '×';
      btn.dataset.deleteKind = 'calendar';
      btn.dataset.deleteId = id;
      label.appendChild(btn);
    });
  }

  function enhanceAll() {
    removePhoneToggle();
    enhanceTasks();
    enhanceNotes();
    enhanceHabits();
    enhanceMatrix();
    enhanceCalendars();
  }

  document.addEventListener('click', event => {
    const del = event.target.closest('[data-delete-kind]');
    if (!del) return;
    event.preventDefault();
    event.stopPropagation();
    const state = readState();
    const kind = del.dataset.deleteKind;
    const id = del.dataset.deleteId;

    if (kind === 'task') {
      if (!ask('Aufgabe wirklich löschen?')) return;
      state.tasks = (state.tasks || []).filter(x => x.id !== id);
      writeState(state);
    }
    if (kind === 'note') {
      if (!ask('Notiz wirklich löschen?')) return;
      state.notes = (state.notes || []).filter(x => x.id !== id);
      writeState(state);
    }
    if (kind === 'habit') {
      if (!ask('Gewohnheit wirklich löschen?')) return;
      state.habits = (state.habits || []).filter(x => x.id !== id);
      writeState(state);
    }
    if (kind === 'calendar') {
      if (!ask('Kalender wirklich löschen? Termine werden in den Hauptkalender verschoben.')) return;
      state.calendars = (state.calendars || []).filter(x => x.id !== id);
      state.events = (state.events || []).map(e => e.calendarId === id ? { ...e, calendarId: 'main' } : e);
      writeState(state);
    }
  }, true);

  document.addEventListener('click', event => {
    const x = event.target.closest('.matrix-delete-x');
    if (!x) return;
    event.preventDefault();
    event.stopPropagation();
    if (!ask('Eisenhower-Eintrag löschen?')) return;
    const btn = x.closest('button');
    const title = btn?.dataset.matrixTitle || btn?.textContent.replace('×','').trim();
    const state = readState();
    let removed = false;
    state.matrix = (state.matrix || []).filter(item => {
      const itemTitle = item.title || item.text || item.name;
      if (!removed && itemTitle === title) { removed = true; return false; }
      return true;
    });
    writeState(state);
  }, true);

  const observer = new MutationObserver(() => enhanceAll());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', enhanceAll);
  setTimeout(enhanceAll, 250);
  setTimeout(enhanceAll, 1000);
})();
