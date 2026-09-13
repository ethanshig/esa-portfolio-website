// Voice rules for the adventure narrator. Source of truth: New Portfolio/_system/VOICE.md.
// Shared by the narrator endpoint (prompt + runtime rejection) and scripts/voice-lint.js.

const BANNED_WORDS = [
    'journey', 'tapestry', 'testament', 'delve', 'delves', 'unfolds', 'unfolding',
    'resonate', 'resonates', 'evoke', 'evokes', 'elevate', 'elevates', 'vibrant', 'seamless',
    'seamlessly', 'holistic', 'profound', 'nuanced', 'innovative'
];
const BANNED_PHRASES = [
    'a sense of', 'speaks to', 'at the intersection of', 'invites you to', 'serves as a reminder',
    'the road remains open'
];

const VOICE_PROMPT = [
    'VOICE. Plain, concrete and unhurried: the register of weather, geology and bodies. Name the real materials, units, places and numbers that the facts give you. Mix one longer sentence with short ones. Use parentheses for asides.',
    'GRAMMAR FOLLOWS WHO DID IT. A person or institution that decided gets the active voice and a name ("Ethan chose two lemniscates", "the municipality kept its data"). An animal, plant or force that makes something gets the active voice as a maker ("beavers build", "the west wind piles sand into dunes"). Change with no nameable cause gets the middle voice, with the changing thing as subject ("the water dropped", "the wire bends, then holds").',
    'Never write a passive that hides a doer ("the pamphlet is placed in your hands", "it was designed"). Never use the middle voice to hide a human decision ("the marsh drained" when people drained it).',
    'NARRATION. Write like a Choose Your Own Adventure book: second person, present tense. The visitor is "you", the protagonist, who acts, notices, asks and decides, and things happen to you. Keep each sentence able to stand alone on its own screen (under about 25 words). The narrator never says "I". Ethan is "Ethan", seen doing specific things; Ethan may speak in quotation marks only to say what the facts say. Places, animals and forces may act or speak; nothing about Ethan may be invented.',
    'Tailor which details come first to the visitor profile. Do not flatter the visitor, do not praise Ethan, and use the visitor\'s name at most once.',
    `FORBIDDEN: em dashes and en dashes; "not X, it is Y" constructions and "not just"; these words: ${BANNED_WORDS.join(', ')}; these phrases: ${BANNED_PHRASES.join('; ')}; closing lines that summarize or promise. End on a concrete detail or a real turn.`
].join('\n');

const NOT_PARTICIPLES = new Set(['often', 'even', 'open', 'seven', 'eleven', 'heaven', 'garden', 'golden', 'wooden', 'children', 'ten', 'when', 'then', 'been', 'need', 'indeed', 'red', 'bed', 'shed', 'seed', 'feed', 'speed', 'hundred', 'kindred', 'sacred', 'naked', 'wicked', 'rugged', 'ragged', 'jagged', 'crooked', 'beloved', 'aged', 'dogged', 'learned', 'interested', 'tired', 'excited', 'surprised', 'supposed', 'used', 'based', 'related', 'worried', 'scared', 'bored', 'pleased', 'prepared', 'unmarked', 'marked']);
const IRREGULAR = 'built|made|drawn|held|left|set|put|shown|seen|known|given|taken|laid|placed|kept|found|brought|thrown|cut|bent|sent|told|spent|won|lost|paid|sold|bought|caught|taught|meant|shut|split|spread|grown|worn|torn|woven|sewn|chosen|written|hidden|broken|frozen|stolen|spoken|driven|ridden|eaten|fallen|beaten|forgotten|gotten';
const PASSIVE = new RegExp(`\\b(?:am|is|are|was|were|be|been|being|gets|got)\\s+(?:(?:not|never|also|then|still|just|already|slowly|carefully|quickly|first|once|later)\\s+)?(\\w+ed|${IRREGULAR})\\b(?!\\s+by\\b)`, 'gi');
const CAUSE_VERBS = /\b(became|becomes|become|emerged|emerges|arose|arises|shifted|shifts|grew|grows|spread|spreads|collapsed|collapses|formed|forms|settled|settles|drained|drains|disappeared|disappears|appeared|appears|vanished|developed|turned into|turns into)\b/gi;
const NEGATION = /\b(?:is|are|was|were|does|do|did)\s+not\b|\b(?:isn|aren|wasn|weren|doesn|don|didn)['’]t\b/i;
const PRONOUN_BE = /^\s*(?:it|this|that|they|he|she)(?:['’]s\b|\s+(?:is|are|was|were)\b)/i;
const ABSTRACT = '\\w+(?:tion|sion|ity|ness|ism|ence|ance|ment)s?';
const ABSTRACT_LIST = new RegExp(`\\b${ABSTRACT},\\s+${ABSTRACT},?\\s+(?:and|or)\\s+\\w+`, 'gi');

function sentences(text) {
    return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

// Returns [{ level: 'error' | 'review', rule, match, hint }]. Errors break the voice; reviews need a person to look.
function voiceIssues(text) {
    if (typeof text !== 'string' || !text.trim()) return [];
    const issues = [];
    const add = (level, rule, match, hint) => issues.push({ level, rule, match: match.trim().slice(0, 80), hint });

    // An en dash closed up between two words or numbers is a range (8–14, February–March), not a prose dash.
    for (const m of text.matchAll(/[^.!?]*(?:—|\s–|–\s)[^.!?]*/g)) add('error', 'dash', m[0], 'Use parentheses, a comma, a semicolon or a full stop.');
    for (const m of text.matchAll(/\S+\s-\s\S+/g)) add('error', 'dash', m[0], 'A spaced hyphen reads as a dash.');
    for (const m of text.matchAll(/\bnot\s+(?:just|only|merely|simply)\b/gi)) add('error', 'not-x-but-y', m[0], 'Say the thing it is.');
    for (const m of text.matchAll(/\b(?:rather|more)\s+than\s+(?:just|merely|simply)\b/gi)) add('error', 'not-x-but-y', m[0], 'Say the thing it is.');
    const list = sentences(text);
    list.forEach((s, i) => {
        if (!NEGATION.test(s)) return;
        const sameSentence = /[,;:]\s*(?:it|this|that|they)(?:['’]s\b|\s+(?:is|are|was|were)\b)/i.test(s.split(NEGATION)[1] || '');
        if (sameSentence || (list[i + 1] && PRONOUN_BE.test(list[i + 1]))) add('error', 'not-x-but-y', s + (sameSentence ? '' : ' ' + list[i + 1]), 'Argues with a claim nobody made. Say the second half only.');
        else if (list[i + 1] && /^\s*(?:it|this|that|they)\s+\w+/i.test(list[i + 1])) add('review', 'not-x-but-y', s + ' ' + list[i + 1], 'A denial followed by a correction. Could the second sentence stand alone?');
    });
    const lower = text.toLowerCase();
    for (const w of BANNED_WORDS) if (new RegExp(`\\b${w}\\b`, 'i').test(text)) add('error', 'banned-word', w, 'Generated-prose vocabulary. Name the object or the action instead.');
    for (const p of BANNED_PHRASES) if (lower.includes(p)) add('error', 'banned-phrase', p, 'Generated-prose phrase.');

    for (const m of text.matchAll(PASSIVE)) {
        if (NOT_PARTICIPLES.has(m[1].toLowerCase())) continue;
        add('review', 'by-test', m[0], 'Does "by X" fit? Then someone is hidden: name them, or say they are unknown.');
    }
    for (const m of text.matchAll(CAUSE_VERBS)) add('review', 'cause-test', m[0], 'Is there a nameable party behind this change? If so, name them.');
    for (const m of text.matchAll(ABSTRACT_LIST)) add('review', 'abstract-list', m[0], 'A list of abstractions. Is there an object to name instead?');
    return issues;
}

function hasVoiceErrors(texts) {
    return texts.some((text) => voiceIssues(text).some((issue) => issue.level === 'error'));
}

module.exports = { VOICE_PROMPT, BANNED_WORDS, BANNED_PHRASES, voiceIssues, hasVoiceErrors };
