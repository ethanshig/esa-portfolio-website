/* Tests for portfolio/js/transcript.js — the pure surface only.
 *
 * The module under test is a browser IIFE that assigns `window.Transcript`.
 * It is loaded by direct eval inside `loadTranscript()`, so the `window` and
 * `sessionStorage` vars declared there become the module's environment.
 *
 * download() and copy() are deliberately NOT tested: they need a real DOM and a
 * real clipboard, and a stub that pretends otherwise would assert nothing true.
 *
 * Run: node transcript-export.test.js
 */

// Pinned before the first Date is constructed so date assertions are deterministic.
// The session fixtures also use noon-UTC timestamps, so the calendar-date
// assertions hold even if a host ignores this pin (any offset within +/-11h).
process.env.TZ = 'UTC';

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var util = require('util');

var MODULE_PATH = process.env.TRANSCRIPT_JS ||
  path.join(os.homedir(), 'cs199', 'portfolio', 'js', 'transcript.js');

var EM_DASH = '—';
var APOS = '’';   // right single quotation mark, as used in the module
var MIDDOT = '·';
var BULLET = '•';
var TITLE = 'Where You Arrive ' + EM_DASH + ' a tour of Ethan Shig Anderson' + APOS + 's work';
var SITE = 'www.ethanshig.design';
var WIDTH = 78;

// ---------------------------------------------------------------- loader ----

function loadTranscript(source) {
  // Mutable cell so tests can drive what read() sees.
  var storage = { data: null };

  // `sessionStorage` and `window` are referenced by the module; declaring them
  // here puts them in the scope chain that the eval'd IIFE closes over.
  var sessionStorage = {
    getItem: function (key) {
      return key === 'esa-tour-session' ? storage.data : null;
    },
    setItem: function () {
      throw new Error('transcript.js must not write to sessionStorage');
    },
    removeItem: function () {
      throw new Error('transcript.js must not remove from sessionStorage');
    }
  };
  var window = {};

  // Direct eval (not indirect) so the above locals are visible to the module.
  eval(source);

  if (!window.Transcript || typeof window.Transcript !== 'object') {
    throw new Error('module did not assign an object to window.Transcript');
  }
  return { api: window.Transcript, storage: storage, sessionStorage: sessionStorage };
}

var SOURCE = fs.readFileSync(MODULE_PATH, 'utf8');
var loaded = loadTranscript(SOURCE);
var T = loaded.api;
var storage = loaded.storage;

// --------------------------------------------------------------- harness ----

var passed = 0;
var failures = [];
var probes = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failures.push({ name: name, err: err });
  }
}

function probe(name, fn) {
  try {
    probes.push({ name: name, outcome: 'returned ' + util.inspect(fn(), { depth: 1 }) });
  } catch (err) {
    probes.push({ name: name, outcome: 'THREW ' + err.name + ': ' + err.message });
  }
}

function lines(str) {
  return str.split('\n');
}

/* toText layout is: header lines, '', body (blocks joined by ''), '', 2 footer
 * lines, and a trailing newline. Returns just the body lines. */
function bodyLines(out, headerCount) {
  var all = lines(out);
  return all.slice(headerCount + 1, all.length - 4);
}

/* Split a wrapped block back into its visual lines and strip the prefix/pad. */
function wrappedWords(blockLines) {
  return blockLines
    .map(function (l) { return l.replace(/^(• |> |\s+)/, ''); })
    .join(' ')
    .split(/\s+/)
    .filter(Boolean);
}

// -------------------------------------------------------------- fixtures ----

function fullSession() {
  return {
    v: 1,
    place: 'Río Paraguay',
    region: 'Paraguay',
    startedAt: '2024-03-05T12:00:00Z',
    savedAt: '2025-01-02T12:00:00Z',
    seenProjects: ['p1', 'p2', 'p3'],
    visited: ['v1', 'v2'],
    transcript: [
      { text: 'A plain line of narration.', cls: 'narration' },
      { text: 'A line drawn from the records.', cls: 'fact', facts: ['f1'] },
      { text: 'Another record, by words.', cls: 'word', words: ['w1'] },
      { text: 'What did you notice?', cls: 'ask you' },
      { text: 'Both record and question.', cls: 'you', facts: ['f2'] },
      { text: 'Yourself and youth are not you.', cls: 'yourself youth' },
      { text: 'Empty evidence arrays.', cls: 'plain', facts: [], words: [] }
    ]
  };
}

var WORD_RUN = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet ' +
  'kilo lima mike november oscar papa quebec romeo sierra tango';
var LONG_PROSE = WORD_RUN + ' ' + WORD_RUN;

function oneLineSession(line, extra) {
  var s = {
    place: 'Champaign',
    region: 'Illinois',
    startedAt: '2024-03-05T12:00:00Z',
    transcript: [line]
  };
  if (extra) {
    Object.keys(extra).forEach(function (k) { s[k] = extra[k]; });
  }
  return s;
}

// ------------------------------------------------------- isRecord/isQuestion ----

test('isRecord is true when facts is non-empty', function () {
  assert.strictEqual(T.isRecord({ facts: ['a'] }), true);
});

test('isRecord is true when words is non-empty', function () {
  assert.strictEqual(T.isRecord({ words: ['a'] }), true);
});

test('isRecord is false for empty facts and words arrays', function () {
  assert.strictEqual(T.isRecord({ facts: [], words: [] }), false);
});

test('isRecord is false when neither key is present', function () {
  assert.strictEqual(T.isRecord({ text: 'x' }), false);
});

test('isRecord returns a real boolean, never a length or undefined', function () {
  assert.strictEqual(typeof T.isRecord({ facts: ['a', 'b'] }), 'boolean');
  assert.strictEqual(typeof T.isRecord({}), 'boolean');
});

test('isQuestion matches the standalone token "you" in cls', function () {
  assert.strictEqual(T.isQuestion({ cls: 'you' }), true);
  assert.strictEqual(T.isQuestion({ cls: 'ask you' }), true);
  assert.strictEqual(T.isQuestion({ cls: 'line-you-2' }), true);
});

test('isQuestion does not match "you" inside a longer word', function () {
  assert.strictEqual(T.isQuestion({ cls: 'yourself' }), false);
  assert.strictEqual(T.isQuestion({ cls: 'youth young' }), false);
});

test('isQuestion tolerates a missing or null cls', function () {
  assert.strictEqual(T.isQuestion({}), false);
  assert.strictEqual(T.isQuestion({ cls: null }), false);
  assert.strictEqual(T.isQuestion({ cls: '' }), false);
});

test('isQuestion ignores the line text and reads only cls', function () {
  assert.strictEqual(T.isQuestion({ text: 'what did you see?', cls: 'narration' }), false);
});

// ------------------------------------------------------------------ stats ----

test('stats counts lines, records, questions, projects and visited', function () {
  assert.deepStrictEqual(T.stats(fullSession()), {
    lines: 7,
    records: 3,
    questions: 2,
    projects: 3,
    visited: 2
  });
});

test('stats counts a line that is both a record and a question in both totals', function () {
  var s = { transcript: [{ text: 'x', cls: 'you', facts: ['f'] }] };
  assert.deepStrictEqual(T.stats(s), {
    lines: 1, records: 1, questions: 1, projects: 0, visited: 0
  });
});

test('stats exposes exactly the five documented keys', function () {
  assert.deepStrictEqual(Object.keys(T.stats(fullSession())).sort(),
    ['lines', 'projects', 'questions', 'records', 'visited']);
});

test('stats of a null, undefined or empty session is all zeros', function () {
  var zero = { lines: 0, records: 0, questions: 0, projects: 0, visited: 0 };
  assert.deepStrictEqual(T.stats(null), zero);
  assert.deepStrictEqual(T.stats(undefined), zero);
  assert.deepStrictEqual(T.stats({}), zero);
  assert.deepStrictEqual(T.stats({ transcript: [] }), zero);
});

test('stats tolerates null seenProjects and visited', function () {
  assert.deepStrictEqual(T.stats({ transcript: [], seenProjects: null, visited: null }),
    { lines: 0, records: 0, questions: 0, projects: 0, visited: 0 });
});

// --------------------------------------------------------------- longDate ----

test('longDate renders day, month name and year without zero padding', function () {
  assert.strictEqual(T.longDate(new Date(2024, 0, 1)), '1 January 2024');
  assert.strictEqual(T.longDate(new Date(2023, 11, 31)), '31 December 2023');
  assert.strictEqual(T.longDate(new Date(2024, 6, 4)), '4 July 2024');
});

test('longDate names all twelve months correctly', function () {
  var expected = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  for (var m = 0; m < 12; m++) {
    assert.strictEqual(T.longDate(new Date(2024, m, 15)), '15 ' + expected[m] + ' 2024');
  }
});

test('longDate reads the date in local time, not UTC', function () {
  var d = new Date(2024, 4, 9, 23, 30);
  assert.strictEqual(T.longDate(d), '9 May 2024');
});

// ------------------------------------------------------------------- when ----

test('when prefers startedAt over savedAt', function () {
  var d = T.when({ startedAt: '2024-03-05T12:00:00Z', savedAt: '2025-01-02T12:00:00Z' });
  assert.strictEqual(d.toISOString(), '2024-03-05T12:00:00.000Z');
});

test('when falls back to savedAt when startedAt is absent', function () {
  assert.strictEqual(T.when({ savedAt: '2025-01-02T12:00:00Z' }).toISOString(),
    '2025-01-02T12:00:00.000Z');
  assert.strictEqual(T.when({ startedAt: null, savedAt: '2025-01-02T12:00:00Z' }).toISOString(),
    '2025-01-02T12:00:00.000Z');
  assert.strictEqual(T.when({ startedAt: '', savedAt: '2025-01-02T12:00:00Z' }).toISOString(),
    '2025-01-02T12:00:00.000Z');
});

test('when falls back to now when neither timestamp is present', function () {
  var before = Date.now();
  var d = T.when({});
  assert.ok(d instanceof Date, 'expected a Date');
  assert.ok(!isNaN(d.getTime()), 'expected a valid Date');
  assert.ok(d.getTime() >= before - 1000 && d.getTime() <= Date.now() + 1000,
    'expected ~now, got ' + d.toISOString());
});

test('when falls back to now for a null or undefined session', function () {
  [null, undefined].forEach(function (s) {
    var d = T.when(s);
    assert.ok(!isNaN(d.getTime()), 'expected a valid Date for ' + String(s));
    assert.ok(Math.abs(d.getTime() - Date.now()) < 1000,
      'expected ~now for ' + String(s) + ', got ' + d.toISOString());
  });
});

test('when survives an invalid date string and returns now, never Invalid Date', function () {
  var d = T.when({ startedAt: 'definitely-not-a-date' });
  assert.ok(!isNaN(d.getTime()), 'expected a valid Date, got Invalid Date');
  assert.ok(Math.abs(d.getTime() - Date.now()) < 1000,
    'expected ~now, got ' + d.toISOString());
});

test('when skips an invalid startedAt and falls through to savedAt', function () {
  var d = T.when({ startedAt: 'not-a-date', savedAt: '2026-09-18T12:00:00.000Z' });
  assert.strictEqual(d.toISOString(), '2026-09-18T12:00:00.000Z');
});

// --------------------------------------------------------------- filename ----

test('filename slugifies precomposed diacritics and appends an ISO date', function () {
  assert.strictEqual(T.filename(fullSession(), 'md'),
    'esa-tour-rio-paraguay-2024-03-05.md');
});

test('filename slugifies already-decomposed diacritics identically', function () {
  var s = { place: 'Río Paraguay', startedAt: '2024-03-05T12:00:00Z' };
  assert.strictEqual(T.filename(s, 'md'), 'esa-tour-rio-paraguay-2024-03-05.md');
});

test('filename strips a range of Latin diacritics', function () {
  var at = '2024-03-05T12:00:00Z';
  assert.strictEqual(T.filename({ place: 'Café Münster', startedAt: at }, 'txt'),
    'esa-tour-cafe-munster-2024-03-05.txt');
  assert.strictEqual(T.filename({ place: '  São Paulo  ', startedAt: at }, 'txt'),
    'esa-tour-sao-paulo-2024-03-05.txt');
});

test('filename omits the place segment when place is missing', function () {
  assert.strictEqual(T.filename({ startedAt: '2024-03-05T12:00:00Z' }, 'txt'),
    'esa-tour-2024-03-05.txt');
  assert.strictEqual(T.filename({ place: null, startedAt: '2024-03-05T12:00:00Z' }, 'txt'),
    'esa-tour-2024-03-05.txt');
  assert.strictEqual(T.filename({ place: '', startedAt: '2024-03-05T12:00:00Z' }, 'txt'),
    'esa-tour-2024-03-05.txt');
});

test('filename omits the place segment when it slugifies to nothing', function () {
  assert.strictEqual(T.filename({ place: '!!! ??? ---', startedAt: '2024-03-05T12:00:00Z' }, 'txt'),
    'esa-tour-2024-03-05.txt');
});

test('filename never leaves a leading or trailing dash on the place slug', function () {
  assert.strictEqual(T.filename({ place: '--Róma--', startedAt: '2024-03-05T12:00:00Z' }, 'txt'),
    'esa-tour-roma-2024-03-05.txt');
});

test('filename zero-pads single-digit months and days', function () {
  assert.strictEqual(T.filename({ startedAt: '2024-01-09T12:00:00Z' }, 'txt'),
    'esa-tour-2024-01-09.txt');
  assert.strictEqual(T.filename({ startedAt: '2024-12-25T12:00:00Z' }, 'txt'),
    'esa-tour-2024-12-25.txt');
});

test('filename defaults the extension to txt and passes any other through', function () {
  var s = fullSession();
  assert.strictEqual(T.filename(s), 'esa-tour-rio-paraguay-2024-03-05.txt');
  assert.strictEqual(T.filename(s, undefined), 'esa-tour-rio-paraguay-2024-03-05.txt');
  assert.strictEqual(T.filename(s, 'json'), 'esa-tour-rio-paraguay-2024-03-05.json');
});

test('filename of a null session still produces a valid dated name', function () {
  [null, undefined, {}].forEach(function (s) {
    assert.ok(/^esa-tour-\d{4}-\d{2}-\d{2}\.txt$/.test(T.filename(s)),
      'bad filename for ' + util.inspect(s) + ': ' + T.filename(s));
  });
});

// ----------------------------------------------------------------- toText ----

test('toText renders the header, prefixes and footer of a full session', function () {
  var out = T.toText(fullSession());
  var all = lines(out);

  assert.strictEqual(all[0], TITLE);
  assert.strictEqual(all[1], 'Río Paraguay ' + MIDDOT + ' Paraguay');
  assert.strictEqual(all[2], '5 March 2024');
  assert.strictEqual(all[3], '');

  assert.deepStrictEqual(bodyLines(out, 3), [
    'A plain line of narration.',
    '',
    BULLET + ' A line drawn from the records.',
    '',
    BULLET + ' Another record, by words.',
    '',
    '> What did you notice?',
    '',
    BULLET + ' Both record and question.',
    '',
    'Yourself and youth are not you.',
    '',
    'Empty evidence arrays.'
  ]);

  assert.strictEqual(all[all.length - 3],
    EM_DASH + ' 7 lines, 3 from Ethan' + APOS + 's records.');
  assert.strictEqual(all[all.length - 2], SITE);
  assert.strictEqual(all[all.length - 1], '', 'output should end with a newline');
});

test('toText drops the location header line when place and region are absent', function () {
  var out = T.toText({ startedAt: '2024-03-05T12:00:00Z', transcript: [{ text: 'solo' }] });
  var all = lines(out);
  assert.strictEqual(all[0], TITLE);
  assert.strictEqual(all[1], '5 March 2024');
  assert.strictEqual(all[2], '');
  assert.deepStrictEqual(bodyLines(out, 2), ['solo']);
});

test('toText uses the singular "line" for a one-line transcript', function () {
  var out = T.toText(oneLineSession({ text: 'only one' }));
  assert.ok(out.indexOf(EM_DASH + ' 1 line, 0 from Ethan' + APOS + 's records.') !== -1,
    'expected singular footer, got:\n' + out);
});

test('toText returns empty string for an empty transcript', function () {
  assert.strictEqual(T.toText({ transcript: [] }), '');
  assert.strictEqual(T.toText({}), '');
  assert.strictEqual(T.toText(null), '');
});

test('toText gives a record line the bullet prefix even when it is also a question', function () {
  var out = T.toText(oneLineSession({ text: 'both', cls: 'you', facts: ['f'] }));
  assert.deepStrictEqual(bodyLines(out, 3), [BULLET + ' both']);
});

test('toText returns the empty string for a null or undefined session', function () {
  assert.strictEqual(T.toText(null), '');
  assert.strictEqual(T.toText(undefined), '');
});

// -------------------------------------------------------- toText wrapping ----

test('toText wraps prose at 78 columns without exceeding the width', function () {
  var out = T.toText(oneLineSession({ text: LONG_PROSE }));
  var body = bodyLines(out, 3);
  assert.ok(body.length >= 3, 'expected the prose to wrap onto 3+ lines, got ' + body.length);
  body.forEach(function (l, i) {
    assert.ok(l.length <= WIDTH,
      'body line ' + i + ' is ' + l.length + ' chars (max ' + WIDTH + '): ' + JSON.stringify(l));
  });
});

test('toText never splits a word across wrapped lines', function () {
  var out = T.toText(oneLineSession({ text: LONG_PROSE }));
  assert.deepStrictEqual(wrappedWords(bodyLines(out, 3)), LONG_PROSE.split(' '));
});

test('toText fills each wrapped line greedily up to the width', function () {
  var body = bodyLines(T.toText(oneLineSession({ text: LONG_PROSE })), 3);
  for (var i = 0; i < body.length - 1; i++) {
    var nextWord = body[i + 1].trim().split(' ')[0];
    var wouldBe = body[i].length + 1 + nextWord.length;
    assert.ok(wouldBe > WIDTH,
      'line ' + i + ' (' + body[i].length + ' chars) could still have fitted "' +
      nextWord + '" within ' + WIDTH + ' columns');
  }
});

test('toText indents continuation lines of a record to match the "bullet space" prefix', function () {
  var body = bodyLines(T.toText(oneLineSession({ text: LONG_PROSE, facts: ['f'] })), 3);
  assert.ok(body.length >= 3, 'expected 3+ wrapped lines, got ' + body.length);
  assert.strictEqual(body[0].slice(0, 2), BULLET + ' ',
    'first line should carry the bullet prefix');
  for (var i = 1; i < body.length; i++) {
    assert.strictEqual(body[i].slice(0, 2), '  ',
      'continuation line ' + i + ' should start with two spaces: ' + JSON.stringify(body[i]));
    assert.notStrictEqual(body[i].charAt(2), ' ',
      'continuation line ' + i + ' should be indented exactly 2 columns: ' +
      JSON.stringify(body[i]));
    assert.strictEqual(body[i].indexOf(BULLET), -1,
      'continuation line ' + i + ' should not repeat the bullet');
  }
});

test('toText indents continuation lines of a question to match the "> " prefix', function () {
  var body = bodyLines(T.toText(oneLineSession({ text: LONG_PROSE, cls: 'you' })), 3);
  assert.ok(body.length >= 3, 'expected 3+ wrapped lines, got ' + body.length);
  assert.strictEqual(body[0].slice(0, 2), '> ');
  for (var i = 1; i < body.length; i++) {
    assert.strictEqual(body[i].slice(0, 2), '  ',
      'continuation line ' + i + ' should start with two spaces: ' + JSON.stringify(body[i]));
    assert.notStrictEqual(body[i].charAt(2), ' ');
  }
});

test('toText keeps a record line within 78 columns including its prefix', function () {
  var body = bodyLines(T.toText(oneLineSession({ text: LONG_PROSE, facts: ['f'] })), 3);
  body.forEach(function (l, i) {
    assert.ok(l.length <= WIDTH,
      'record line ' + i + ' is ' + l.length + ' chars: ' + JSON.stringify(l));
  });
});

test('toText emits an over-long single word intact rather than breaking it', function () {
  var giant = 'x'.repeat(100);
  var body = bodyLines(T.toText(oneLineSession({ text: giant + ' tail', facts: ['f'] })), 3);
  assert.deepStrictEqual(body, [BULLET + ' ' + giant, '  tail']);
});

test('toText collapses runs of whitespace and newlines inside a line', function () {
  var body = bodyLines(T.toText(oneLineSession({ text: '  spaced\n\tout   words  ' })), 3);
  assert.deepStrictEqual(body, ['spaced out words']);
});

test('toText renders an empty line text as the bare prefix', function () {
  assert.deepStrictEqual(bodyLines(T.toText(oneLineSession({ text: '', facts: ['f'] })), 3),
    [BULLET + ' ']);
  assert.deepStrictEqual(bodyLines(T.toText(oneLineSession({ text: '' })), 3), ['']);
});

// ------------------------------------------------------------- toMarkdown ----

test('toMarkdown renders headings, list items, blockquotes and the footer', function () {
  assert.deepStrictEqual(lines(T.toMarkdown(fullSession())), [
    '# Where You Arrive',
    '*Río Paraguay ' + MIDDOT + ' Paraguay ' + MIDDOT + ' 5 March 2024*',
    '',
    'A plain line of narration.',
    '',
    '- A line drawn from the records.  _(from Ethan' + APOS + 's records)_',
    '',
    '- Another record, by words.  _(from Ethan' + APOS + 's records)_',
    '',
    '> What did you notice?',
    '',
    '- Both record and question.  _(from Ethan' + APOS + 's records)_',
    '',
    'Yourself and youth are not you.',
    '',
    'Empty evidence arrays.',
    '',
    '---',
    '*7 lines, 3 from Ethan' + APOS + 's records. ' +
      '[' + SITE + '](https://' + SITE + ')*',
    ''
  ]);
});

test('toMarkdown keeps the trailing double space before the italic record note', function () {
  var out = T.toMarkdown(oneLineSession({ text: 'a record', facts: ['f'] }));
  assert.ok(out.indexOf('- a record  _(from Ethan' + APOS + 's records)_') !== -1,
    'expected two spaces before the italic note, got:\n' + out);
});

test('toMarkdown prefers the record form for a line that is also a question', function () {
  var out = T.toMarkdown(oneLineSession({ text: 'both', cls: 'you', facts: ['f'] }));
  assert.ok(out.indexOf('- both  _(from Ethan' + APOS + 's records)_') !== -1,
    'expected the record list item to win, got:\n' + out);
  assert.strictEqual(out.indexOf('> both'), -1, 'should not also emit a blockquote');
});

test('toMarkdown omits the location from the subtitle when absent', function () {
  var out = T.toMarkdown({ startedAt: '2024-03-05T12:00:00Z', transcript: [{ text: 'solo' }] });
  assert.strictEqual(lines(out)[1], '*5 March 2024*');
});

test('toMarkdown does not wrap long lines', function () {
  var out = T.toMarkdown(oneLineSession({ text: LONG_PROSE }));
  assert.ok(lines(out).indexOf(LONG_PROSE) !== -1,
    'expected the prose on one unwrapped line');
});

test('toMarkdown returns the empty string for a null or undefined session', function () {
  assert.strictEqual(T.toMarkdown(null), '');
  assert.strictEqual(T.toMarkdown(undefined), '');
});

test('toMarkdown footer is not singularised for a one-line tour (characterization)', function () {
  var out = T.toMarkdown(oneLineSession({ text: 'only one' }));
  assert.ok(out.indexOf('*1 lines, 0 from Ethan' + APOS + 's records.') !== -1,
    'documented inconsistency with toText, which says "1 line"; got:\n' + out);
});

test('toMarkdown returns empty string for an empty transcript', function () {
  assert.strictEqual(T.toMarkdown({ transcript: [] }), '');
  assert.strictEqual(T.toMarkdown({}), '');
  assert.strictEqual(T.toMarkdown(null), '');
});

// ----------------------------------------------- degenerate / malformed ----

test('an empty session renders without throwing', function () {
  var empty = { transcript: [] };
  assert.doesNotThrow(function () { T.stats(empty); });
  assert.doesNotThrow(function () { T.toText(empty); });
  assert.doesNotThrow(function () { T.toMarkdown(empty); });
  assert.doesNotThrow(function () { T.filename(empty, 'txt'); });
  assert.doesNotThrow(function () { T.when(empty); });
});

test('toText does not throw on a session object with no transcript array', function () {
  assert.doesNotThrow(function () { T.toText({}); });
});

test('toMarkdown does not throw on a session object with no transcript array', function () {
  assert.doesNotThrow(function () { T.toMarkdown({}); });
});

// ------------------------------------------------------------------- read ----
// read() is deterministic against a stubbed sessionStorage - no DOM involved -
// so it is covered here even though it sits outside the named pure set.

test('read returns null when nothing is stored', function () {
  storage.data = null;
  assert.strictEqual(T.read(), null);
});

test('read returns null for unparseable JSON', function () {
  storage.data = '{not json';
  assert.strictEqual(T.read(), null);
});

test('read returns null for a mismatched schema version', function () {
  storage.data = JSON.stringify({ v: 2, transcript: [{ text: 'x' }] });
  assert.strictEqual(T.read(), null);
});

test('read returns null when transcript is missing, not an array, or empty', function () {
  storage.data = JSON.stringify({ v: 1 });
  assert.strictEqual(T.read(), null);
  storage.data = JSON.stringify({ v: 1, transcript: 'nope' });
  assert.strictEqual(T.read(), null);
  storage.data = JSON.stringify({ v: 1, transcript: [] });
  assert.strictEqual(T.read(), null);
});

test('read returns the parsed session when it is well formed', function () {
  var s = { v: 1, place: 'Champaign', transcript: [{ text: 'x', facts: ['f'] }] };
  storage.data = JSON.stringify(s);
  assert.deepStrictEqual(T.read(), s);
});

test('read returns null for a JSON null payload', function () {
  storage.data = 'null';
  assert.strictEqual(T.read(), null);
});

// ----------------------------------------------------- non-failing probes ----
// Robustness limits worth knowing about but outside the stated contract.

probe('stats({transcript: "oops"})', function () { return T.stats({ transcript: 'oops' }); });
probe('stats({transcript: [null]})', function () { return T.stats({ transcript: [null] }); });
probe('isRecord(null)', function () { return T.isRecord(null); });
probe('isQuestion(null)', function () { return T.isQuestion(null); });
probe('toText line with no text field', function () {
  return bodyLines(T.toText(oneLineSession({ facts: ['f'] })), 3);
});
probe('longDate(new Date("bad"))', function () { return T.longDate(new Date('bad')); });

// ----------------------------------------------------------------- report ----

console.log('module under test: ' + MODULE_PATH);
console.log('');
console.log('probes (informational, not pass/fail):');
probes.forEach(function (p) {
  console.log('  - ' + p.name + ' -> ' + p.outcome);
});
console.log('');

failures.forEach(function (f, i) {
  console.log('FAIL ' + (i + 1) + ': ' + f.name);
  console.log('  ' + f.err.message.split('\n').join('\n  '));
  if (Object.prototype.hasOwnProperty.call(f.err, 'expected')) {
    console.log('  expected: ' + util.inspect(f.err.expected, { depth: 4 }));
    console.log('  actual:   ' + util.inspect(f.err.actual, { depth: 4 }));
  }
  if (!(f.err instanceof assert.AssertionError)) {
    console.log('  stack: ' + String(f.err.stack).split('\n').slice(0, 4).join('\n         '));
  }
  console.log('');
});

var total = passed + failures.length;
console.log((failures.length === 0 ? 'PASS' : 'FAIL') +
  ' - ' + passed + '/' + total + ' assertions passed, ' + failures.length + ' failed');
process.exit(failures.length === 0 ? 0 : 1);
