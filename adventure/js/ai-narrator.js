(function () {
    const endpoint = window.ADVENTURE_AI_ENDPOINT || '';

    window.adventureNarrator = {
        async next(request) {
            if (!endpoint) return request.fallback;
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sceneId: request.sceneId,
                        decision: request.decision || null,
                        path: request.path,
                        profile: request.profile,
                        scene: request.scene,
                        approvedFacts: request.approvedFacts
                    })
                });
                if (!response.ok) return request.fallback;
                const generated = await response.json();
                return isSafeScene(generated, request.scene)
                    ? mergeWithBlueprint(generated, request.scene)
                    : request.fallback;
            } catch (error) {
                return request.fallback;
            }
        }
    };

    function isSafeScene(scene, blueprint) {
        return Boolean(
            scene &&
            Array.isArray(scene.paragraphs) &&
            scene.paragraphs.length > 0 && scene.paragraphs.length <= 8 &&
            scene.paragraphs.every((paragraph) => typeof paragraph === 'string') &&
            Array.isArray(scene.factIds) &&
            scene.factIds.every((factId) => Boolean(window.adventureContent.facts[factId]) && blueprint.factIds.includes(factId)) &&
            (!scene.choiceLabels || Object.keys(scene.choiceLabels).every((id) => (
                blueprint.choices.some((choice) => choice.id === id) && typeof scene.choiceLabels[id] === 'string'
            )))
        );
    }

    // The AI can rewrite prose and labels, but the authored graph remains authoritative.
    function mergeWithBlueprint(generated, blueprint) {
        return {
            ...blueprint,
            paragraphs: generated.paragraphs,
            factIds: generated.factIds,
            eyebrow: typeof generated.eyebrow === 'string' ? generated.eyebrow : blueprint.eyebrow,
            choices: blueprint.choices.map((choice) => ({
                ...choice,
                label: generated.choiceLabels && generated.choiceLabels[choice.id]
                    ? generated.choiceLabels[choice.id]
                    : choice.label
            }))
        };
    }
})();
