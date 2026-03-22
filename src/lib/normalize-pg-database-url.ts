/**
 * pg-connection-string warns when sslmode is prefer, require, or verify-ca because
 * those are currently treated like verify-full but will match libpq semantics in pg v9.
 * Setting sslmode=verify-full explicitly preserves current behavior and silences the warning.
 */
export function normalizePgDatabaseUrl(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    const mode = url.searchParams.get("sslmode")?.toLowerCase();
    if (mode === "prefer" || mode === "require" || mode === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
      return url.href;
    }
  } catch {
    // Non-URL strings (e.g. unix socket paths) — use as-is.
  }
  return connectionString;
}
