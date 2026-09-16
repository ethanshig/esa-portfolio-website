#!/usr/bin/env node
// Lints prose against the portfolio voice (New Portfolio/_system/VOICE.md).
//   bun scripts/voice-lint.js adventure/content/story.js ".../09 - Beavers Burden (Arch 172)/project.md"
// With no arguments, lints the adventure's authored scenes. Exit code 1 when any error is found.

const fs = require('fs');
const path = require('path');
const { voiceIssues } = require('../api/adventure/voice');

const PROSE_SECTIONS = new Set(['one line', 'the story', 'what i did', 'process', 'outcome & evidence', 'reflection']);

function storyTexts(file) {
    const source = fs.readFileSync(file, 'utf8');
    const sandbox = { window: {} };
    new Function('window', source)(sandbox.window);
    const content = sandbox.window.adventureContent || {};
    const out = [];
    for (const [id, scene] of Object.entries(content.scenes || {})) {
        if (scene.eyebrow) out.push({ where: `${id}.eyebrow`, text: scene.eyebrow });
        (scene.paragraphs || []).forEach((p, i) => out.push({ where: `${id}.paragraphs[${i}]`, text: p }));
        (scene.choices || []).forEach((c, i) => out.push({ where: `${id}.choices[${i}]`, text: c.label }));
        (scene.artifacts || []).forEach((a, i) => out.push({ where: `${id}.artifacts[${i}]`, text: a.detail || '' }));
    }
    return out;
}

function markdownTexts(file) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    const out = [];
    let section = null;
    let inFrontmatter = lines[0] === '---';
    lines.forEach((line, i) => {
        if (i > 0 && inFrontmatter && line === '---') { inFrontmatter = false; return; }
        if (inFrontmatter) return;
        const heading = line.match(/^##\s+(.*)/);
        if (heading) { section = heading[1].trim().toLowerCase(); return; }
        if (!PROSE_SECTIONS.has(section) || !line.trim() || /^TODO\(ethan\)/.test(line.trim())) return;
        out.push({ where: `line ${i + 1} (${section})`, text: line.replace(/^\s*[-*]\s+/, '').replace(/\*\*/g, '') });
    });
    return out;
}

const files = process.argv.slice(2);
if (!files.length) files.push(path.join(__dirname, '..', 'adventure', 'content', 'story.js'));

let errors = 0;
let reviews = 0;
for (const file of files) {
    const texts = file.endsWith('.js') ? storyTexts(file) : markdownTexts(file);
    const found = texts.flatMap(({ where, text }) => voiceIssues(text).map((issue) => ({ where, ...issue })));
    errors += found.filter((f) => f.level === 'error').length;
    reviews += found.filter((f) => f.level === 'review').length;
    console.log(`\n${path.basename(path.dirname(file))}/${path.basename(file)}: ${found.length ? '' : 'clean'}`);
    for (const f of found) console.log(`  ${f.level === 'error' ? 'ERROR ' : 'review'} ${f.rule.padEnd(14)} ${f.where}: "${f.match}"\n         ${f.hint}`);
}
console.log(`\n${errors} error(s), ${reviews} to review`);
process.exit(errors ? 1 : 0);
