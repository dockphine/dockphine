# Changelog

All notable changes to this project are documented here.

## [1.2.0]

### Added — new terminal UI (Ink/React rewrite)
- Replaced the `inquirer` + `chalk` + `ora` + `cli-progress` interactive layer with a custom UI
  built on [Ink](https://github.com/vadimdemedes/ink)/React + `@inkjs/ui`:
  - `WelcomeBanner` — large gradient block-letter wordmark (via `cfonts`), centered, borderless
  - `StepList` — sidebar showing wizard progress; completed steps get a green checkmark and an
    indented "chip" revealing the answer given (e.g. `— [PostgreSQL]`)
  - `SelectQuestion` — custom single-select (`▣`/`☐` indicators, active option in green, others
    in white) replacing `@inkjs/ui`'s default `Select` (its pointer glyph isn't themeable)
  - `MultiSelectQuestion` — custom multi-select (`☑`/`☐` checkboxes, same color scheme)
  - `TextQuestion` — bordered input box with a `→` prefix
  - `ConfirmQuestion` — yes/no prompts via `@inkjs/ui`'s `ConfirmInput`
  - `GenerationChecklist` — live spinner → checkmark progression per generation step (scaffold,
    write files, write env, build), shown while the project is actually being generated
  - `OverwriteConfirm` — dedicated screen listing conflicting files before overwriting anything
  - `Summary` — final screen with the generated file list, next steps, and deploy-target steps
- New "Add deploy config?" yes/no step before the deploy-target list. Answering no skips
  deployment config entirely via a new no-op `none` deploy adapter, instead of forcing a choice
  among 9 targets you might not want yet
- Docker availability pre-check (`src/core/docker-check.ts`) — warns clearly and falls back to
  scaffold-only when Docker isn't installed or isn't running, instead of failing mid-build after
  the project has already been scaffolded
- Centralized friendly error-message formatting (`src/utils/error-message.ts`) for `execa`/Docker/
  network failures, instead of dumping raw command output
- Real `docs/demo.gif`, generated from an actual recorded terminal session, plus a reusable
  recorder script (`docs/record-demo.mjs`: `node-pty` → asciinema cast → GIF via `agg`) — replaces
  the never-verified VHS-based `docs/demo.tape`
- This `CHANGELOG.md`

### Changed
- Package renamed `create-dockphine-strapi` → `dockphine`. Primary invocation is now
  `npx dockphine` or a global install (`npm install -g dockphine` → `dockphine`); the
  `npm create dockphine-strapi` shorthand was dropped since it only resolves for packages
  literally named `create-<x>`
- Claude Code's generated file moved from a plain `CLAUDE.md` to a real, invokable Skill at
  `.claude/skills/dockphine/SKILL.md` with proper Skill frontmatter (`name` + `description`)
- README "Why Dockphine" section redesigned as a two-column card grid (HTML table); corrected a
  stale line still describing the old inquirer/chalk/ora/cli-progress stack
- README now documents the global-install workflow alongside `npx`

### Removed
- Dependencies: `inquirer`, `ora`, `cli-progress`, `chalk` (superseded by the Ink-based UI)
- `src/prompts/index.ts` — superseded by `src/ui/Wizard.tsx`
- `src/utils/logger.ts` — superseded by Ink components
- `docs/demo.tape` — superseded by `docs/record-demo.mjs`

## [1.0.0] (as `create-dockphine-strapi`) — initial release

- Interactive CLI scaffolding a Dockerized Strapi project, or Dockerizing an existing one
- Dual mode: new project (host-side `create-strapi-app`) or existing project (detect
  `@strapi/strapi` in `package.json`)
- Database choice (PostgreSQL/MySQL/SQLite) with auto-generated credentials
- Deploy config generation for Generic VPS, DigitalOcean, Hetzner, AWS, Contabo, Fly.io, Railway,
  Render, and Dokploy (config-only, no provisioning)
- Auto-generated real secrets in `.env`, placeholder secrets in `.env.example`
- AI-agent project-context file generation for Cursor, GitHub Copilot, Windsurf, Codex, Gemini CLI
- Automatic containerized fallback when the host Node.js version doesn't satisfy Strapi's engine
  requirements
