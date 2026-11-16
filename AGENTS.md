## Agent skills

### Issue tracker

Issues live in GitHub Issues on ethanshig/esa-portfolio-website (gh CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: bug, enhancement, needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at the root plus ADRs in `docs/adr/`. See `docs/agents/domain.md`.

## Where the site is now (read before any page work)

- **The project page is the Sheet** (`docs/adr/0007-the-project-page-is-the-drawing-sheet.md`): a canvas of dot paper with the drawings flat and the model in 3D. The scrolling Document is only its story-off panel and the no-WebGL fallback. Don't design, prototype or spec a project page from the generated `projects/*.html`: those are the old shape.
- **Branches are ahead of the main checkout.** `~/cs199/portfolio` sits on `story-layer`, which is behind. The index is on `index-sheet` (worktree `~/cs199/portfolio-index`). The working Sheet pages are on `prototype/grid` (worktree `~/cs199/portfolio-grid`, `prototype/grid/project/three-little-pigs/`). Before page work, run `git branch -a` and read the newest ADRs and open spec issues; the newest decision wins over what a generated page shows.
