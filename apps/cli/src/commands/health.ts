import { apiFetch } from "../client.js";
import type { CliConfig } from "../config.js";
import { printJson } from "../format.js";

export async function runHealth(config: CliConfig, options: { json: boolean }): Promise<void> {
  const body = await apiFetch(config, "/health", { auth: false });
  if (options.json) {
    printJson(body);
    return;
  }
  const ok = typeof body === "object" && body !== null && "ok" in body && (body as { ok: unknown }).ok;
  const service =
    typeof body === "object" && body !== null && "service" in body
      ? String((body as { service: unknown }).service)
      : "unknown";
  process.stdout.write(ok ? `ok  ${service}  (${config.baseUrl})\n` : `unhealthy  (${config.baseUrl})\n`);
  if (!ok) process.exitCode = 1;
}
