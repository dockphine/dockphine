# Demo assets

`demo.gif` is a real recording of the wizard (generated with `record-demo.mjs`, see below), not
hand-drawn — it walks through: new project → Strapi v5 → PostgreSQL → default port → deploy
config yes → Generic VPS → **build mode: Scaffold only** (deliberately, so the recording doesn't
sit through a live multi-minute `docker compose up --build`) → AI agent files yes → Claude Code.

## Regenerating it

`record-demo.mjs` drives a real `dockphine` session with scripted keystrokes via
[`node-pty`](https://github.com/microsoft/node-pty), records it as an
[asciinema cast](https://docs.asciinema.org/manual/asciicast/v2/), then converts that to a GIF
with [`agg`](https://github.com/asciinema/agg) (a static, dependency-free binary — no `ttyd`,
browser, or `ffmpeg` needed, unlike VHS).

1. Build and link the CLI locally: `npm run build && npm link` (from the repo root)
2. Install `node-pty` next to this script: `cd docs && npm init -y && npm install node-pty`
3. Download `agg` for your platform from its
   [releases page](https://github.com/asciinema/agg/releases) and make it executable
4. Run it:
   ```bash
   AGG_BIN=/path/to/agg node docs/record-demo.mjs docs/demo.gif
   ```
   (omit `AGG_BIN` if `agg` is already on your `PATH`)

If the wizard's prompts or step order change, update the scripted keystroke sequence near the
bottom of `record-demo.mjs` to match — it's a plain array of `[label, key]` pairs sent to the pty
with a fixed delay between each.

Once `docs/demo.gif` exists, the root README's demo section renders it automatically — no other
change needed.
