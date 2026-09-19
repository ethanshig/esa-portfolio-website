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
    return !!((line.facts && line.facts.length) || (line.words && line.words.length));
  }
  function isQuestion(line) {
    return /\byou\b/.test(line.cls || '');
  }

  function stats(s) {
    var t = (s && s.transcript) || [];
    return {
      lines: t.length,
      records: t.filter(isRecord).length,
      questions: t.filter(isQuestion).length,
      projects: ((s && s.seenProjects) || []).length,
      visited: ((s && s.visited) || []).length
    };
  }

  function when(s) {
    var iso = (s && (s.startedAt || s.savedAt)) || null;
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return d;
  }
  function longDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function isoDate(d) {
    var m = String(d.getMonth() + 1), day = String(d.getDate());
    return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
  }

  // Wrap on word boundaries only, and carry the prefix's width into the
  // continuation lines so a marked line stays visibly marked all the way down.
  function wrap(text, width, prefix) {
    var pad = prefix.replace(/[^\s]/g, ' ');
    var words = String(text).split(/\s+/).filter(Boolean);
    var out = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var next = line ? line + ' ' + words[i] : words[i];
      if (next.length + prefix.length > width && line) { out.push((out.length ? pad : prefix) + line); line = words[i]; }
      else { line = next; }
    }
    if (line) out.push((out.length ? pad : prefix) + line);
    return out.length ? out.join('\n') : prefix;
  }

  function header(s) {
    var head = ['Where You Arrive — a tour of Ethan Shig Anderson’s work'];
    var where = [s && s.place, s && s.region].filter(Boolean).join(' · ');
    if (where) head.push(where);
    head.push(longDate(when(s)));
    return head;
  }

  function toText(s) {
    if (!s) return '';
    var st = stats(s);
    var body = s.transcript.map(function (l) {
      var prefix = isRecord(l) ? '• ' : (isQuestion(l) ? '> ' : '');
      return wrap(l.text, 78, prefix);
    });
    var foot = ['— ' + st.lines + ' line' + (st.lines === 1 ? '' : 's') + ', ' +
      st.records + ' from Ethan’s records.', 'www.ethanshig.design'];
    return header(s).join('\n') + '\n\n' + body.join('\n\n') + '\n\n' + foot.join('\n') + '\n';
  }

  function toMarkdown(s) {
    if (!s) return '';
    var st = stats(s);
    var where = [s.place, s.region].filter(Boolean).join(' · ');
    var out = ['# Where You Arrive'];
    out.push('*' + [where, longDate(when(s))].filter(Boolean).join(' · ') + '*');
    out.push('');
    s.transcript.forEach(function (l) {
      if (isRecord(l)) out.push('- ' + l.text + '  _(from Ethan’s records)_');
      else if (isQuestion(l)) out.push('> ' + l.text);
      else out.push(l.text);
      out.push('');
    });
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
    isRecord: isRecord, isQuestion: isQuestion, longDate: longDate, when: when
  };
})();
