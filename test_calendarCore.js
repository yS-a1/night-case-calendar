const assert = require('assert');
const Core = require('../src/calendarCore');

function test(name, fn){ try { fn(); console.log('✓', name); } catch (err) { console.error('✗', name); throw err; } }

test('default state has local calendars and categories', () => {
  const s = Core.createDefaultState();
  assert.ok(s.calendars.length >= 3);
  assert.ok(s.categories.some(c => c.id === 'school'));
});

test('creates single and multi day event', () => {
  const s = Core.createDefaultState();
  const e = Core.upsertEvent(s, { title: 'Projekt', start: '2026-01-01T10:00', end: '2026-01-03T12:00' });
  const visible = Core.getVisibleEvents(s, '2026-01-02T00:00', '2026-01-02T23:59');
  assert.equal(e.title, 'Projekt');
  assert.equal(visible.length, 1);
});

test('daily recurrence supports interval, until and exceptions', () => {
  const s = Core.createDefaultState();
  Core.upsertEvent(s, { title: 'Training', start: '2026-01-01T08:00', end: '2026-01-01T09:00', recurrence: { frequency:'daily', interval:2, until:'2026-01-10' }, exceptions:['2026-01-05'] });
  const ev = Core.getVisibleEvents(s, '2026-01-01T00:00', '2026-01-10T23:59');
  assert.deepEqual(ev.map(e => e.occurrenceDate), ['2026-01-01','2026-01-03','2026-01-07','2026-01-09']);
});

test('weekly recurrence can target weekdays', () => {
  const s = Core.createDefaultState();
  Core.upsertEvent(s, { title: 'Lernen', start: '2026-01-05T16:00', end: '2026-01-05T17:00', recurrence: { frequency:'daily', interval:1, until:'2026-01-11', byWeekdays:[1,3,5] } });
  const ev = Core.getVisibleEvents(s, '2026-01-01', '2026-01-12');
  assert.deepEqual(ev.map(e => e.occurrenceDate), ['2026-01-05','2026-01-07','2026-01-09']);
});

test('hidden calendars do not appear', () => {
  const s = Core.createDefaultState();
  s.calendars.find(c => c.id === 'private').visible = false;
  Core.upsertEvent(s, { title: 'Privat', calendarId:'private', start:'2026-02-01T10:00', end:'2026-02-01T11:00' });
  assert.equal(Core.getVisibleEvents(s, '2026-02-01', '2026-02-02').length, 0);
});

test('tasks can be created and toggled', () => {
  const s = Core.createDefaultState();
  const t = Core.upsertTask(s, { title:'Hausaufgabe', priority:'high' });
  assert.equal(t.done, false);
  assert.equal(Core.toggleTask(s, t.id), true);
  assert.equal(s.tasks[0].done, true);
});

test('stats detect overload and count done tasks', () => {
  const s = Core.createDefaultState();
  Core.upsertEvent(s, { title:'Marathon', start:'2026-03-01T08:00', end:'2026-03-01T20:00' });
  Core.upsertTask(s, { title:'Done', done:true });
  const st = Core.stats(s, '2026-03-01', '2026-03-02');
  assert.equal(st.events, 1);
  assert.equal(st.tasksDone, 1);
  assert.equal(st.overloadDays.length, 1);
});

test('ICS export and import roundtrip basics', () => {
  const s = Core.createDefaultState();
  Core.upsertEvent(s, { title:'Export Test', description:'Beschreibung', location:'Raum 1', start:'2026-04-01T10:00', end:'2026-04-01T11:00' });
  const ics = Core.exportICS(s.events);
  const imported = Core.importICS(ics);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.equal(imported[0].title, 'Export Test');
});

console.log('\nAlle Night Case Tests bestanden.');
