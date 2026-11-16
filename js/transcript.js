/* What the reader made is theirs to take away. The tour keeps its story in
   sessionStorage; this reads it back, renders it, and hands it over as a file.
   Nothing here talks to a server - the transcript never leaves the tab. */
(function () {
  'use strict';

  var KEY = 'esa-tour-session';
  var SCHEMA = 1;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  function read() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || s.v !== SCHEMA) return null;
      if (!Array.isArray(s.transcript) || !s.transcript.length) return null;
      return s;
    } catch (e) { return null; }
  }

  function isRecord(line) {
    if (!line) return false;
    return !!((line.facts && line.facts.length) || (line.words && line.words.length));
  }
  function isQuestion(line) {
    if (!line) return false;
    return /\byou\b/.test(line.cls || '');
  }

  function stats(s) {
    var t = (s && s.transcript) || [];
    if (!Array.isArray(t)) t = [];
    return {
      lines: t.length,
      records: t.filter(isRecord).length,
      questions: t.filter(isQuestion).length,
      projects: ((s && s.seenProjects) || []).length,
      visited: ((s && s.visited) || []).length
    };
  }

  // startedAt, then savedAt, then now - and each candidate has to actually be a date
  // before it wins, or a corrupt startedAt silently swallows a good savedAt.
  function when(s) {
    var tries = [s && s.startedAt, s && s.savedAt];
    for (var i = 0; i < tries.length; i++) {
      if (!tries[i]) continue;
      var d = new Date(tries[i]);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }
  function longDate(d) {
    if (!d || isNaN(d.getTime())) d = new Date();
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function isoDate(d) {
    var m = String(d.getMonth() + 1), day = String(d.getDate());
    return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
  }

  // Wrap on word boundaries only, and carry the prefix's width into the
  // continuation lines so a marked line stays visibly marked all the way down.
  function wrap(text, width, prefix) {
    var pad = prefix.replace(/[^\s]/g, ' ');
    var words = String(text == null ? '' : text).split(/\s+/).filter(Boolean);
    var out = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var next = line ? line + ' ' + words[i] : words[i];
      if (next.length + prefix.length > width && line) { out.push((out.length ? pad : prefix) + line); line = words[i]; }
      else { line = next; }
    }
    if (line) out.push((out.length ? pad : prefix) + line);
    return out.length ? out.join('\n') : prefix;
  }

  // Every drawing the visitor was shown, kept as its own section: the caption
  // told them what they were looking at, and the description is the drawing for
  // anyone who could not see it. Both travel out with the transcript.
  // Sessions saved before drawings were recorded carry no `drawings` key at all,
  // so absent has to read as none rather than as an error.
  var DRAWINGS_TITLE = 'Drawings you were shown';
  var NO_ALT = 'No description recorded.';

  // Strings and finite numbers are text. Anything else - object, array, boolean -
  // would stringify into noise like "[object Object]", so it becomes nothing.
  function asText(v) {
    if (typeof v === 'string') return v;
    if (typeof v === 'number' && isFinite(v)) return String(v);
    return '';
  }
  function repeat(ch, n) {
    var out = '';
    for (var i = 0; i < n; i++) out += ch;
    return out;
  }

  // `when` is an ISO-ish date whose first four characters are the year - but only
  // when it is really shaped like one, or a stray value prints as a fake year.
  function drawingYear(d) {
    var at = asText(d && d.when);
    return /^\d{4}/.test(at) ? at.slice(0, 4) : '';
  }
  function drawingMeta(d) {
    return [d.project, d.year].filter(Boolean).join(' · ');
  }

  // One entry, normalised to strings so no caller has to re-check it. Returns
  // null for anything that is not an entry at all.
  function drawing(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
    var id = asText(d.id).trim();
    var label = asText(d.label).trim();
    return {
      id: id,
      label: label || id || 'Untitled drawing',
      // Printed exactly as the tour recorded it. If that is an id slug it stays
      // an id slug: inventing a title would put a name in the visitor's keepsake
      // that they never saw on screen.
      project: (asText(d.projectTitle) || asText(d.project)).trim(),
      year: drawingYear(d),
      // Trimmed at the ends only. The description is the whole point of the
      // section, so it is never shortened here or in any export.
      alt: asText(d.alt).trim()
    };
  }

  function drawings(s) {
    var list = s && s.drawings;
    if (!Array.isArray(list)) return [];
    var out = [], seen = {};
    for (var i = 0; i < list.length; i++) {
      var d = drawing(list[i]);
      if (!d) continue;
      // The tour dedupes by id before saving; the guard is repeated here so a
      // double-recorded drawing cannot appear twice in someone's transcript. The
      // 'id:' prefix keeps inherited names like "constructor" out of the way.
      if (d.id) {
        if (seen['id:' + d.id]) continue;
        seen['id:' + d.id] = true;
      }
      out.push(d);
    }
    return out;
  }

  // Plain text: an underlined heading, then one numbered entry per drawing, its
  // description wrapped to the width of the story and indented under its label.
  function drawingsText(s) {
    var list = drawings(s);
    if (!list.length) return '';
    var blocks = list.map(function (d, i) {
      var num = (i + 1) + '. ';
      var meta = drawingMeta(d);
      return wrap(d.label + (meta ? ' · ' + meta : ''), 78, num) + '\n' +
        wrap(d.alt || NO_ALT, 78, repeat(' ', num.length));
    });
    return DRAWINGS_TITLE + '\n' + repeat('-', DRAWINGS_TITLE.length) + '\n\n' +
      blocks.join('\n\n');
  }

  // Markdown, as lines ready to splice in. Descriptions are left unwrapped and
  // unedited, exactly like the story lines above them.
  function drawingsMarkdown(s) {
    var list = drawings(s);
    if (!list.length) return [];
    var out = ['## ' + DRAWINGS_TITLE, ''];
    list.forEach(function (d, i) {
      var meta = drawingMeta(d);
      out.push('**' + (i + 1) + '. ' + d.label + '**' + (meta ? ' — ' + meta : ''));
      out.push('');
      out.push(d.alt || '_' + NO_ALT + '_');
      out.push('');
    });
    return out;
  }

  function header(s) {
    var head = ['Where You Arrive — a tour of Ethan Shig Anderson’s work'];
    var where = [s && s.place, s && s.region].filter(Boolean).join(' · ');
    if (where) head.push(where);
    head.push(longDate(when(s)));
    return head;
  }

  function toText(s) {
    var t = (s && s.transcript) || [];
    if (!t.length) return '';
    var st = stats(s);
    var body = t.map(function (l) {
      var prefix = isRecord(l) ? '• ' : (isQuestion(l) ? '> ' : '');
      return wrap(l.text, 78, prefix);
    });
    var foot = ['— ' + st.lines + ' line' + (st.lines === 1 ? '' : 's') + ', ' +
      st.records + ' from Ethan’s records.', 'www.ethanshig.design'];
    var draw = drawingsText(s);
    return header(s).join('\n') + '\n\n' + body.join('\n\n') + '\n\n' +
      (draw ? draw + '\n\n' : '') + foot.join('\n') + '\n';
  }

  function toMarkdown(s) {
    var t = (s && s.transcript) || [];
    if (!t.length) return '';
    var st = stats(s);
    var where = [s.place, s.region].filter(Boolean).join(' · ');
    var out = ['# Where You Arrive'];
    out.push('*' + [where, longDate(when(s))].filter(Boolean).join(' · ') + '*');
    out.push('');
    t.forEach(function (l) {
      if (isRecord(l)) out.push('- ' + l.text + '  _(from Ethan’s records)_');
      else if (isQuestion(l)) out.push('> ' + l.text);
      else out.push(l.text);
      out.push('');
    });
    drawingsMarkdown(s).forEach(function (line) { out.push(line); });
    out.push('---');
    out.push('*' + st.lines + ' lines, ' + st.records + ' from Ethan’s records. ' +
      '[www.ethanshig.design](https://www.ethanshig.design)*');
    return out.join('\n') + '\n';
  }

  function slug(str) {
    return String(str || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function filename(s, ext) {
    var parts = ['esa-tour'];
    var place = slug(s && s.place);
    if (place) parts.push(place);
    parts.push(isoDate(when(s)));
    return parts.join('-') + '.' + (ext || 'txt');
  }

  function download(s, format) {
    if (!s) return false;
    try {
      var md = format === 'md';
      var blob = new Blob([md ? toMarkdown(s) : toText(s)],
        { type: (md ? 'text/markdown' : 'text/plain') + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename(s, md ? 'md' : 'txt');
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return true;
    } catch (e) { return false; }
  }

  function copy(s, format) {
    var text = format === 'md' ? toMarkdown(s) : toText(s);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function () { return true; },
          function () { return legacyCopy(text); });
      }
    } catch (e) { /* fall through */ }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-2000px;opacity:0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy');
      ta.remove();
      return !!ok;
    } catch (e) { return false; }
  }

  window.Transcript = {
    read: read, stats: stats, toText: toText, toMarkdown: toMarkdown,
    filename: filename, download: download, copy: copy,
    isRecord: isRecord, isQuestion: isQuestion, drawings: drawings,
    longDate: longDate, when: when
  };
})();
