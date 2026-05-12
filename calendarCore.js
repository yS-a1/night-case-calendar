(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NightCaseCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const DAY = 24 * 60 * 60 * 1000;
  const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  const pad = n => String(n).padStart(2, '0');
  const isoDate = value => { const d = parseDate(value); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const parseDate = value => {
    if (value instanceof Date) return new Date(value.getTime());
    if (!value) return new Date(NaN);
    const clean = String(value).length === 10 ? `${value}T00:00:00` : String(value);
    return new Date(clean);
  };
  const startOfDay = value => { const d = parseDate(value); d.setHours(0, 0, 0, 0); return d; };
  const endOfDay = value => { const d = parseDate(value); d.setHours(23, 59, 59, 999); return d; };
  const addDays = (date, days) => { const d = parseDate(date); d.setDate(d.getDate() + days); return d; };
  const addMonths = (date, months) => { const d = parseDate(date); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth()+1, 0).getDate())); return d; };
  const addYears = (date, years) => addMonths(date, years * 12);
  const sameDay = (a, b) => isoDate(parseDate(a)) === isoDate(parseDate(b));
  const overlaps = (itemStart, itemEnd, rangeStart, rangeEnd) => parseDate(itemStart) <= parseDate(rangeEnd) && parseDate(itemEnd || itemStart) >= parseDate(rangeStart);
  const clampText = (text, max = 2000) => String(text || '').slice(0, max);

  function createDefaultState() {
    return {
      meta: { version: 2, createdAt: new Date().toISOString(), theme: 'noirAnime', fontScale: 'normal', privacy: false, locked: false, pinHash: '' },
      calendars: [
        { id: 'main', name: 'Fallakte', color: '#ffd84d', icon: 'case', visible: true, locked: false },
        { id: 'school', name: 'Schule', color: '#31d6ff', icon: 'school', visible: true, locked: false },
        { id: 'private', name: 'Privat', color: '#ff4d8d', icon: 'privacy', visible: true, locked: false }
      ],
      categories: [
        { id: 'case', name: 'Termin', color: '#ffd84d', icon: 'case' },
        { id: 'school', name: 'Schule', color: '#31d6ff', icon: 'school' },
        { id: 'exam', name: 'Prüfung', color: '#ff4d4d', icon: 'exam' },
        { id: 'habit', name: 'Routine', color: '#7bffb0', icon: 'habit' },
        { id: 'sport', name: 'Sport', color: '#b98cff', icon: 'sport' }
      ],
      events: [], tasks: [], habits: [], notes: [], subjects: [], trash: [], settings: { defaultDuration: 60, defaultReminder: 15, compact: false, sound: false, morningReminder: '07:00', eveningReminder: '20:00' }
    };
  }

  function normalizeEvent(input) {
    const start = parseDate(input.start || input.date || new Date());
    const end = input.allDay ? endOfDay(input.end || input.start || start) : parseDate(input.end || new Date(start.getTime() + 60 * 60 * 1000));
    if (isNaN(start) || isNaN(end) || end < start) throw new Error('Ungültige Start- oder Endzeit');
    return {
      id: input.id || uid('evt'),
      calendarId: input.calendarId || 'main',
      title: clampText(input.title || 'Unbenannte Fallakte', 120),
      description: clampText(input.description),
      location: clampText(input.location, 300),
      categoryId: input.categoryId || 'case',
      color: input.color || '#ffd84d',
      icon: input.icon || input.emoji || 'case',
      emoji: input.emoji || input.icon || 'case',
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: Boolean(input.allDay),
      private: Boolean(input.private),
      status: input.status || 'planned',
      notes: clampText(input.notes, 4000),
      checklist: Array.isArray(input.checklist) ? input.checklist : [],
      attachments: Array.isArray(input.attachments) ? input.attachments : [],
      reminders: Array.isArray(input.reminders) ? input.reminders.map(Number).filter(n => !Number.isNaN(n)) : [],
      recurrence: input.recurrence || null,
      exceptions: Array.isArray(input.exceptions) ? input.exceptions : [],
      seriesId: input.seriesId || null,
      createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString()
    };
  }

  function upsertEvent(state, input) {
    const event = normalizeEvent(input);
    const idx = state.events.findIndex(e => e.id === event.id);
    if (idx >= 0) state.events[idx] = { ...state.events[idx], ...event, updatedAt: new Date().toISOString() };
    else state.events.push(event);
    return event;
  }

  function deleteEvent(state, id, scope = 'single') {
    const idx = state.events.findIndex(e => e.id === id);
    if (idx < 0) return false;
    const event = state.events[idx];
    if (scope === 'series' && event.seriesId) {
      const removed = state.events.filter(e => e.seriesId === event.seriesId || e.id === event.seriesId);
      state.trash.push(...removed.map(e => ({ type: 'event', item: e, deletedAt: new Date().toISOString() })));
      state.events = state.events.filter(e => !(e.seriesId === event.seriesId || e.id === event.seriesId));
      return true;
    }
    state.trash.push({ type: 'event', item: event, deletedAt: new Date().toISOString() });
    state.events.splice(idx, 1);
    return true;
  }

  function occurrenceDates(event, rangeStart, rangeEnd) {
    const result = [];
    const rec = event.recurrence;
    const baseStart = parseDate(event.start);
    const baseEnd = parseDate(event.end);
    const duration = baseEnd - baseStart;
    const exceptions = new Set(event.exceptions || []);
    if (!rec || rec.frequency === 'none') {
      if (overlaps(baseStart, baseEnd, rangeStart, rangeEnd)) result.push({ ...event, occurrenceId: event.id, occurrenceDate: isoDate(baseStart), start: baseStart.toISOString(), end: baseEnd.toISOString(), isOccurrence: false });
      return result;
    }
    const interval = Math.max(1, Number(rec.interval || 1));
    const until = rec.until ? endOfDay(rec.until) : parseDate(rangeEnd);
    const maxCount = rec.count ? Number(rec.count) : 1000;
    let cursor = new Date(baseStart);
    let generated = 0;
    let safety = 0;
    while (cursor <= rangeEnd && cursor <= until && generated < maxCount && safety < 1500) {
      const dowOk = !rec.byWeekdays || !rec.byWeekdays.length || rec.byWeekdays.map(Number).includes(cursor.getDay());
      if (dowOk && !exceptions.has(isoDate(cursor))) {
        const occEnd = new Date(cursor.getTime() + duration);
        if (overlaps(cursor, occEnd, rangeStart, rangeEnd)) result.push({ ...event, occurrenceId: `${event.id}__${isoDate(cursor)}`, occurrenceDate: isoDate(cursor), start: cursor.toISOString(), end: occEnd.toISOString(), isOccurrence: true, originalId: event.id });
        generated++;
      }
      if (rec.frequency === 'daily') cursor = addDays(cursor, interval);
      else if (rec.frequency === 'weekly') cursor = addDays(cursor, 7 * interval);
      else if (rec.frequency === 'monthly') cursor = addMonths(cursor, interval);
      else if (rec.frequency === 'yearly') cursor = addYears(cursor, interval);
      else break;
      safety++;
    }
    return result;
  }

  function getVisibleEvents(state, rangeStart, rangeEnd) {
    const visible = new Set(state.calendars.filter(c => c.visible).map(c => c.id));
    return state.events.flatMap(e => visible.has(e.calendarId) ? occurrenceDates(e, parseDate(rangeStart), parseDate(rangeEnd)) : [])
      .sort((a, b) => parseDate(a.start) - parseDate(b.start));
  }

  function createTask(input) {
    return { id: input.id || uid('task'), title: clampText(input.title || 'Neue Aufgabe', 120), description: clampText(input.description), deadline: input.deadline || '', priority: input.priority || 'medium', categoryId: input.categoryId || 'case', color: input.color || '#ffd84d', done: Boolean(input.done), archived: Boolean(input.archived), checklist: Array.isArray(input.checklist) ? input.checklist : [], subtasks: Array.isArray(input.subtasks) ? input.subtasks : [], createdAt: input.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
  function upsertTask(state, input) { const task = createTask(input); const i = state.tasks.findIndex(t => t.id === task.id); if (i >= 0) state.tasks[i] = { ...state.tasks[i], ...task }; else state.tasks.push(task); return task; }
  function toggleTask(state, id) { const t = state.tasks.find(x => x.id === id); if (!t) return false; t.done = !t.done; t.updatedAt = new Date().toISOString(); return true; }

  function stats(state, rangeStart, rangeEnd) {
    const events = getVisibleEvents(state, rangeStart, rangeEnd);
    const tasks = state.tasks.filter(t => !t.archived);
    const minutesByCategory = {};
    events.forEach(e => { const key = e.categoryId || 'case'; minutesByCategory[key] = (minutesByCategory[key] || 0) + Math.max(0, (parseDate(e.end) - parseDate(e.start)) / 60000); });
    return { events: events.length, tasksOpen: tasks.filter(t => !t.done).length, tasksDone: tasks.filter(t => t.done).length, minutesByCategory, overloadDays: Object.entries(events.reduce((acc, e) => { const k = isoDate(e.start); acc[k] = (acc[k] || 0) + (parseDate(e.end) - parseDate(e.start)) / 3600000; return acc; }, {})).filter(([, h]) => h > 9).map(([date, hours]) => ({ date, hours })) };
  }

  function exportICS(events) {
    const fmt = value => parseDate(value).toISOString().replace(/[-:]/g, '').replace('.000', '');
    const esc = value => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Night Case Calendar//DE', ...events.flatMap(e => ['BEGIN:VEVENT',`UID:${e.id}@nightcase.local`,`DTSTAMP:${fmt(new Date())}`,`DTSTART:${fmt(e.start)}`,`DTEND:${fmt(e.end)}`,`SUMMARY:${esc(e.title)}`,`DESCRIPTION:${esc(e.description)}`,`LOCATION:${esc(e.location)}`,'END:VEVENT']), 'END:VCALENDAR'].join('\r\n');
  }

  function importICS(text) {
    const blocks = String(text || '').split('BEGIN:VEVENT').slice(1);
    return blocks.map(block => {
      const read = key => ((block.match(new RegExp(`${key}(?:;[^:]*)?:(.*)`)) || [])[1] || '').trim();
      const parseIcsDate = raw => { const s = raw.replace('Z',''); if (s.length >= 15) return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}Z`); return new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T00:00:00`); };
      const start = parseIcsDate(read('DTSTART'));
      const end = parseIcsDate(read('DTEND') || read('DTSTART'));
      return normalizeEvent({ title: read('SUMMARY') || 'Importierter Termin', description: read('DESCRIPTION'), location: read('LOCATION'), start, end, calendarId: 'main' });
    }).filter(e => e.title);
  }

  return { DAY, uid, isoDate, parseDate, startOfDay, endOfDay, addDays, addMonths, addYears, sameDay, overlaps, createDefaultState, normalizeEvent, upsertEvent, deleteEvent, occurrenceDates, getVisibleEvents, createTask, upsertTask, toggleTask, stats, exportICS, importICS };
});
