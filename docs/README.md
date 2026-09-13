# Demo assets

`demo.gif` is referenced by the root `README.md` but isn't generated yet — generating it
requires an actual terminal recording, which isn't something that can be produced from source.

To create the real thing:

1. Install [VHS](https://github.com/charmbracelet/vhs) (`brew install vhs` or
   `go install github.com/charmbracelet/vhs@latest`)
2. Build and link the CLI locally: `npm run build && npm link` (from the repo root)
3. Run `vhs demo.tape` from this `docs/` directory — it writes `docs/demo.gif`

`demo.tape` is a best-effort script — inquirer's exact keypresses for each prompt may need
small tweaks to match what you see when you actually run the CLI (list defaults, checkbox
selection, etc.). Run it once, watch the output, adjust the `Down`/`Space`/`Enter` sequence
to match, and re-run.

Once `docs/demo.gif` exists, the root README's demo section will render it — no other change
needed.
