/**
 * Extracts a clean, user-facing message from an error — prefers a failing subprocess's own
 * stderr (most useful, e.g. npm's or docker's own error output), then execa's shortMessage,
 * then the plain Error message, rather than dumping the full raw error (which for execa
 * includes the full command line, exit code, and combined stdout/stderr).
 */
export function friendlyErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { stderr?: unknown; shortMessage?: unknown; message?: unknown };
    if (typeof e.stderr === "string" && e.stderr.trim()) return e.stderr.trim();
    if (typeof e.shortMessage === "string" && e.shortMessage.trim()) return e.shortMessage.trim();
    if (typeof e.message === "string" && e.message.trim()) return e.message.trim();
  }
  return String(err);
}
