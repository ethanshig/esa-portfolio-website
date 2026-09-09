# Adventure Framework

`adventure.html` is a separate, non-destructive narrative portfolio experience for the portfolio. The existing portfolio pages remain unchanged. It uses an authored CYOA graph underneath an optional AI narrator, so personalization can change the telling without changing the route or project facts.

## Content model

Story content lives in `content/story.js`:

- `startScenes` lists valid opening scene IDs. Add multiple IDs when alternate openings are ready.
- `scenes` maps each scene ID to its chapter label, narrative paragraphs, artifacts, and choices.
- Use `lines` on a scene when sentence breaks and pacing need to be intentional; otherwise the engine derives lines from `paragraphs`.
- Each choice points to another scene with `next`.
- Artifacts can include a `source` link to an existing portfolio page.
- `facts` is the approved fact registry that generated scenes must reference.
- `beats` describes what a scene must accomplish before the AI writes its prose.

The reader displays one line at a time. Right/down arrow keys move forward, left/up arrow keys move backward, and choices appear after the final line.

## AI narrator contract

The browser uses the local scene as a fallback. Setting `window.ADVENTURE_AI_ENDPOINT` before `adventure/js/ai-narrator.js` loads enables a server endpoint. The endpoint receives the current scene ID, the visitor's choice, and the path so far.

Generated responses must return JSON with:

```json
{
  "eyebrow": "A FIRST ENCOUNTER",
  "paragraphs": ["..."],
  "choices": [{"label": "...", "next": "scene-id"}],
  "factIds": ["pltResearch"]
}
```

The current client also accepts optional `eyebrow` and `choiceLabels`. Choice labels may be rewritten, but their IDs and destinations remain authored in the local scene. See `AI-INTEGRATION.md` for the endpoint contract and server guidance.

The server should retrieve only approved facts and project records, constrain choices to known scene IDs, and return `factIds` for every factual claim used. The client rejects responses that do not pass the structural and fact-ID checks, but the server remains responsible for model safety and prompt-injection protection.

## Adding a project later

1. Confirm the project's facts, images, dates, locations, and approved language.
2. Add the project to the existing portfolio pages first if it is not already documented there.
3. Add one or more story scenes to `content/story.js`.
4. Introduce the project through an artifact, setting, or encounter rather than a category label.
5. Link factual source material from the artifact with `source`.
6. Add choices that connect the project to other scenes without forcing a single route.

The narrative may be surreal; project facts and source links must remain literal and verified.
