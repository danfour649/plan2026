export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function pad(value: string, width: number): string {
  if (value.length >= width) return value.slice(0, width);
  return value + " ".repeat(width - value.length);
}

/** Simple fixed-width table (works on Windows + Unix terminals). */
export function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.min(48, Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length))),
  );

  const line = (cols: string[]) =>
    cols.map((c, i) => pad(c.replace(/\s+/g, " ").trim(), widths[i]!)).join("  ");

  process.stdout.write(`${line(headers)}\n`);
  process.stdout.write(`${widths.map((w) => "-".repeat(w)).join("  ")}\n`);
  for (const row of rows) {
    process.stdout.write(`${line(row)}\n`);
  }
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}
