const { facts, scenes } = require('./story-data');

const MAX_BODY_BYTES = 24000;
const MAX_PATH_LENGTH = 40;
const MAX_PROFILE_LENGTH = 500;

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!isAllowedOrigin(req)) return res.status(403).json({ error: 'Origin not allowed' });

    const body = req.body || {};
    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
        return res.status(413).json({ error: 'Request too large' });
    }

    if (!process.env.CS199_RESPONSES_URL) {
        return res.status(500).json({ error: 'Narrator not configured' });
    }

    const sceneId = typeof body.sceneId === 'string' ? body.sceneId : '';
    const scene = scenes[sceneId];
    if (!scene) return res.status(400).json({ error: 'Unknown scene' });

    const path = Array.isArray(body.path) ? body.path.filter((id) => typeof id === 'string').slice(-MAX_PATH_LENGTH) : [];
    const profile = sanitizeProfile(body.profile);
    const approvedFactIds = scene.factIds;
    const blueprint = {
        chapter: safeString(body.scene && body.scene.chapter, 80),
        eyebrow: safeString(body.scene && body.scene.eyebrow, 120),
        beats: safeStringArray(body.scene && body.scene.beats, 300, 8),
        facts: Object.fromEntries(approvedFactIds.map((id) => [id, facts[id]])),
        choices: safeChoices(body.scene && body.scene.choices, scene.choices)
    };

    if (!blueprint.beats.length || !blueprint.choices.length) {
        return res.status(400).json({ error: 'Invalid scene blueprint' });
    }

    const prompt = buildPrompt({ sceneId, decision: safeString(body.decision, 300), path, profile, blueprint });
    try {
        const response = await fetch(process.env.CS199_RESPONSES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.CS199_API_KEY ? { Authorization: `Bearer ${process.env.CS199_API_KEY}` } : {})
            },
            body: JSON.stringify({
                model: process.env.CS199_MODEL || 'gpt-5.6-luna',
                input: prompt,
                temperature: 0.7,
                max_output_tokens: 700,
                text: { format: { type: 'json_object' } }
            }),
            signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
            console.error('Narrator upstream returned status', response.status);
            return res.status(502).json({ error: 'Narrator unavailable' });
        }
        const payload = await response.json();
        const generated = parseModelJson(payload);
        const validated = validateResponse(generated, scene, approvedFactIds);
        if (!validated) return res.status(502).json({ error: 'Narrator returned invalid content' });
        return res.status(200).json(validated);
    } catch (error) {
        console.error('Narrator request failed', error);
        return res.status(502).json({ error: 'Narrator unavailable' });
    }
};

function buildPrompt({ sceneId, decision, path, profile, blueprint }) {
    return [
        'You are the narrator for a personal architecture and sustainable design portfolio presented as a choice-driven novel.',
        'Return only valid JSON with: eyebrow (string), paragraphs (array of 2-6 short strings), factIds (array), and choiceLabels (object keyed by choice id).',
        'Write in second person. Tailor emphasis and imagery to the visitor profile, but do not overuse their name.',
        'Cover every beat in order. Use only facts from the supplied facts object. Never invent dates, credentials, projects, locations, or links.',
        'You may rewrite choice labels, but you must return only the supplied choice IDs. Do not create destinations.',
        `SCENE ID: ${sceneId}`,
        `PREVIOUS PATH: ${JSON.stringify(path)}`,
        `LAST DECISION: ${decision || '(opening scene)'}`,
        `VISITOR PROFILE: ${JSON.stringify(profile)}`,
        `SCENE BLUEPRINT: ${JSON.stringify(blueprint)}`
    ].join('\n');
}

function parseModelJson(payload) {
    if (payload && typeof payload.output_text === 'string') return JSON.parse(payload.output_text);
    const output = payload && Array.isArray(payload.output) ? payload.output : [];
    const text = output.flatMap((item) => item.content || []).find((item) => item.type === 'output_text');
    return JSON.parse(text && text.text ? text.text : '{}');
}

function validateResponse(value, scene, allowedFactIds) {
    if (!value || !Array.isArray(value.paragraphs) || value.paragraphs.length < 2 || value.paragraphs.length > 6) return null;
    if (!value.paragraphs.every((paragraph) => typeof paragraph === 'string' && paragraph.length <= 700)) return null;
    if (!Array.isArray(value.factIds) || !value.factIds.every((id) => allowedFactIds.includes(id))) return null;
    if (typeof value.eyebrow !== 'string' || value.eyebrow.length > 120) return null;
    if (!value.choiceLabels || typeof value.choiceLabels !== 'object' || Array.isArray(value.choiceLabels)) return null;
    if (!Object.keys(value.choiceLabels).every((id) => /^choice-\d+$/.test(id) && Number(id.slice(7)) >= 1 && Number(id.slice(7)) <= scene.choices.length && typeof value.choiceLabels[id] === 'string' && value.choiceLabels[id].length <= 160)) return null;
    return { eyebrow: value.eyebrow, paragraphs: value.paragraphs, factIds: value.factIds, choiceLabels: value.choiceLabels };
}

function safeChoices(candidate, allowedNext) {
    if (!Array.isArray(candidate)) return [];
    return candidate.map((choice, index) => ({
        id: `choice-${index + 1}`,
        label: safeString(choice && choice.label, 160),
        next: choice && allowedNext.includes(choice.next) ? `choice-${index + 1}` : null
    })).filter((choice) => choice.label && choice.next);
}

function sanitizeProfile(profile) {
    if (!profile || typeof profile !== 'object') return {};
    return {
        name: safeString(profile.name, 40),
        role: safeString(profile.role, 80),
        interests: safeStringArray(profile.interests, 40, 6),
        goal: safeString(profile.goal, 100)
    };
}

function safeString(value, max) { return typeof value === 'string' ? value.replace(/[<>]/g, '').slice(0, max) : ''; }
function safeStringArray(value, max, count) { return Array.isArray(value) ? value.filter((item) => typeof item === 'string').map((item) => safeString(item, max)).slice(0, count) : []; }
function isAllowedOrigin(req) {
    const origin = req.headers.origin;
    return !origin || origin === `https://${req.headers.host}` || origin === `http://${req.headers.host}`;
}
