(function () {
    const content = window.adventureContent;
    const narrator = window.adventureNarrator;
    const intro = document.getElementById('reader-intro');
    const readerForm = document.getElementById('reader-form');
    const anonymousButton = document.getElementById('anonymous-button');
    const sceneElement = document.getElementById('scene');
    const choicesElement = document.getElementById('choices');
    const artifactShelf = document.getElementById('artifact-shelf');
    const state = { profile: null, path: [], visited: [], artifacts: [] };
    let transitionToken = 0;
    let activeScene = null;
    let activeLines = [];
    let activeLine = 0;

    async function renderScene(sceneId, decision) {
        const token = ++transitionToken;
        const localScene = content.scenes[sceneId];
        if (!localScene) return;

        state.path.push(sceneId);
        if (!state.visited.includes(sceneId)) state.visited.push(sceneId);
        choicesElement.innerHTML = '';
        choicesElement.setAttribute('aria-busy', 'true');
        artifactShelf.hidden = true;
        sceneElement.classList.add('is-exiting');
        await wait(450);
        if (token !== transitionToken) return;

        const scene = await narrator.next({
            sceneId,
            decision,
            path: state.path.slice(),
            profile: state.profile,
            scene: toBlueprint(localScene),
            approvedFacts: localScene.factIds || [],
            fallback: personalize(localScene)
        });
        if (token !== transitionToken) return;

        activeScene = scene;
        activeLines = getSceneLines(scene);
        activeLine = 0;
        showLine();
    }

    function renderArtifact(artifact) {
        const source = artifact.source ? `<a href="${escapeHtml(artifact.source)}">Open source</a>` : '';
        return `<div class="artifact"><span>${escapeHtml(artifact.type)}</span><strong>${escapeHtml(artifact.title)}</strong><p>${escapeHtml(artifact.detail)}</p>${source}</div>`;
    }

    function getSceneLines(scene) {
        if (Array.isArray(scene.lines)) return scene.lines;
        return scene.paragraphs.flatMap((paragraph) => paragraph.match(/[^.!?]+[.!?]+(?:[”"])?|[^.!?]+$/g) || []);
    }

    function showLine() {
        if (!activeScene || !activeLines.length) return;
        sceneElement.className = 'scene';
        sceneElement.innerHTML = `
            <p class="scene-eyebrow scene-copy">${escapeHtml(activeScene.eyebrow || '')}</p>
            <div class="scene-copy">
                <h1>${escapeHtml(activeLines[activeLine].trim())}</h1>
                <p class="scene-progress">${activeLine + 1} / ${activeLines.length}</p>
            </div>
        `;

        if (activeLine === activeLines.length - 1) {
            if (activeScene.artifacts) {
                artifactShelf.innerHTML = activeScene.artifacts.map(renderArtifact).join('');
                artifactShelf.hidden = false;
            }
            revealChoices();
        } else {
            artifactShelf.hidden = true;
            choicesElement.innerHTML = '';
            choicesElement.setAttribute('aria-busy', 'true');
        }
    }

    function moveLine(direction) {
        if (!activeScene || !activeLines.length) return;
        const nextLine = Math.max(0, Math.min(activeLines.length - 1, activeLine + direction));
        if (nextLine === activeLine) return;
        sceneElement.classList.add('is-exiting');
        window.setTimeout(() => { activeLine = nextLine; showLine(); }, 650);
    }

    function revealChoices() {
        choicesElement.innerHTML = activeScene.choices.map((choice, index) => `
            <button type="button" class="choice" style="--choice-delay: ${index * 100}ms" data-next="${escapeHtml(choice.next)}">
                <span>0${index + 1}</span>${escapeHtml(choice.label)}
            </button>
        `).join('');
        choicesElement.removeAttribute('aria-busy');
        choicesElement.querySelectorAll('[data-next]').forEach((choice) => {
            choice.addEventListener('click', () => renderScene(choice.dataset.next, choice.textContent.trim()));
        });
    }

    function toBlueprint(scene) {
        return {
            chapter: scene.chapter,
            eyebrow: scene.eyebrow,
            beats: scene.beats || [],
            factIds: scene.factIds || [],
            artifacts: scene.artifacts || [],
            choices: (scene.choices || []).map(({ id, label, next }, index) => ({ id: id || `choice-${index + 1}`, label, next }))
        };
    }

    function personalize(scene) {
        const copy = JSON.parse(JSON.stringify(scene));
        const name = state.profile && state.profile.name ? state.profile.name : 'you';
        const interests = state.profile && state.profile.interests.length
            ? state.profile.interests.join(', ')
            : 'the questions in front of you';
        copy.paragraphs = copy.paragraphs.map((paragraph) => paragraph
            .replaceAll('{visitor}', name)
            .replaceAll('{interests}', interests));
        return copy;
    }

    function start(profile) {
        state.profile = profile;
        intro.hidden = true;
        sceneElement.hidden = false;
        renderScene(content.startScenes[Math.floor(Math.random() * content.startScenes.length)]);
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
    }

    function wait(duration) { return new Promise((resolve) => window.setTimeout(resolve, duration)); }

    readerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = new FormData(readerForm);
        start({
            name: String(form.get('name') || '').trim(),
            role: String(form.get('role') || 'curious visitor'),
            interests: form.getAll('interest'),
            goal: String(form.get('goal') || 'understand the work')
        });
    });
    anonymousButton.addEventListener('click', () => start({ name: '', role: 'curious visitor', interests: [], goal: 'understand the work' }));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); moveLine(1); }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); moveLine(-1); }
    });

    sceneElement.hidden = true;
})();
