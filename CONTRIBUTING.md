# Contributing to Dockphine

Thanks for considering a contribution — bug reports, new deploy target adapters, additional AI
agent formats, and documentation fixes are all welcome.

## Getting set up

```bash
git clone https://github.com/dockphine/dockphine.git
cd dockphine
npm install
npm run build
npm link
```

`npm link` makes `create-dockphine-strapi` resolve to your local build globally, so you can run
it exactly as an end user would while iterating.

```bash
npm run typecheck   # tsc --noEmit
npm run dev          # tsup --watch, rebuilds on save
```

After any change, `npm run build` and re-run the linked command — no need to re-link.

## Project layout

- `src/prompts/` — the interactive CLI flow
- `src/core/` — scaffolding, secrets, env writing, Docker generation, file writing
- `src/core/deploy-adapters/` — one module per deploy target, common interface
- `templates/` — Handlebars templates for every generated file (Dockerfiles, compose files,
  deploy configs, AI agent context files)

## Adding a new deploy target

1. Add the target to the `DeployTarget` union in `src/core/types.ts`
2. Add its template(s) under `templates/deploy/<target>/`
3. Create `src/core/deploy-adapters/<target>.ts` implementing the `DeployAdapter` interface
   (`generate` + `nextSteps`)
4. Register it in `src/core/deploy-adapters/index.ts` and in the prompt choices in
   `src/prompts/index.ts`

## Adding a new AI agent format

1. Add the agent to the `AiAgent` union in `src/core/types.ts`
2. Add `templates/agents/<agent>.hbs` (wrap the shared `{{> sharedContent}}` partial in that
   agent's native format/frontmatter)
3. Register the output path in `AGENT_FILES` in `src/core/ai-agent-generator.ts`
4. Add it to the prompt choices in `src/prompts/index.ts`

## Testing changes

There's no full test suite yet (contributions welcome here too). Before opening a PR:

- `npm run typecheck` passes
- `npm run build` succeeds and `npm pack --dry-run` includes everything under `dist/`
- Manually run the linked CLI through the path you changed, including an actual
  `docker compose up --build` if you touched Docker/compose templates

## Pull requests

- Keep PRs focused — one deploy target, one bug fix, one doc improvement at a time
- Describe what you tested, not just what you changed
- Be patient — this is a young project maintained on a best-effort basis
