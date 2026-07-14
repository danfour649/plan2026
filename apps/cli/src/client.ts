import type { CliConfig } from "./config.js";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`API ${status}: ${body}`);
    this.name = "ApiError";
  }
}

export async function apiFetch(
  config: CliConfig,
  pathname: string,
  options: {
    method?: string;
    query?: Record<string, string | undefined>;
    body?: unknown;
    auth?: boolean;
  } = {},
): Promise<unknown> {
  const url = new URL(pathname.replace(/^\//, ""), `${config.baseUrl}/`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.auth !== false) {
    if (!config.token) {
      throw new Error(
        "Missing PLAN2026_API_TOKEN. Set it in the environment or repo-root .env (Settings → API access).",
      );
    }
    headers.Authorization = `Bearer ${config.token}`;
  }

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new ApiError(response.status, text || response.statusText);
  }

  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
