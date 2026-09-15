import { useApp, useInput } from "ink";

export class CancelledError extends Error {
  constructor() {
    super("Cancelled.");
    this.name = "CancelledError";
  }
}

/**
 * Ink's default exitOnCtrlC swallows Ctrl+C before any useInput handler sees it, so screens
 * rendered with { exitOnCtrlC: false } use this instead, to exit with a distinguishable error
 * (rather than the ambiguous "resolves with undefined" of the default handling).
 */
export function useCancelOnCtrlC(): void {
  const { exit } = useApp();
  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit(new CancelledError());
    }
  });
}
