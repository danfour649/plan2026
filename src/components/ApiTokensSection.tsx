"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { useAppLocale, useTranslations } from "@/components/TranslationsProvider";
import { createApiToken, revokeApiToken } from "@/lib/actions/api-tokens";
import type { CreateApiTokenResult, RevokeApiTokenResult } from "@/lib/actions/api-tokens";
import { formatShortDate } from "@/lib/format";
import { API_TOKEN_NAME_MAX_LENGTH } from "@/lib/validations/api-token";

export type ApiTokenListItem = {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

function CreateTokenButton() {
  const t = useTranslations();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? t.settings.creatingApiToken : t.settings.createApiToken}
    </button>
  );
}

function RevokeTokenButton() {
  const t = useTranslations();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70"
    >
      {pending ? t.settings.revokingApiToken : t.settings.revokeApiToken}
    </button>
  );
}

function NewTokenNotice({ token, name }: { token: string; name: string }) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast.success(t.settings.apiTokenCopied);
    } catch {
      toast.error(t.settings.apiTokenCopyFailed);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
        {t.settings.apiTokenCreated.replace("{name}", name)}
      </p>
      <p className="text-sm text-emerald-700 dark:text-emerald-300">{t.settings.apiTokenShownOnce}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-white/80 px-3 py-2 font-mono text-xs text-emerald-900 dark:bg-zinc-900/70 dark:text-emerald-200">
          {token}
        </code>
        <button
          type="button"
          onClick={copyToken}
          className="shrink-0 rounded-xl border border-emerald-300 bg-white/80 px-3 py-2 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-zinc-900/70 dark:text-emerald-200 dark:hover:bg-emerald-950"
        >
          {copied ? t.settings.apiTokenCopied : t.settings.copyApiToken}
        </button>
      </div>
    </div>
  );
}

function TokenRow({ token }: { token: ApiTokenListItem }) {
  const t = useTranslations();
  const locale = useAppLocale();
  const [state, formAction] = useActionState(
    (_prev: RevokeApiTokenResult | null, formData: FormData) => revokeApiToken(formData),
    null as RevokeApiTokenResult | null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(t.settings.apiTokenRevoked);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t.settings.apiTokenRevoked]);

  const lastUsed = token.lastUsedAt
    ? t.settings.apiTokenLastUsed.replace("{date}", formatShortDate(new Date(token.lastUsedAt), locale))
    : t.settings.apiTokenNeverUsed;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-white/70 p-4 dark:bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-blue-950 dark:text-zinc-100">{token.name}</span>
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {token.tokenPrefix}…
          </code>
        </div>
        <p className="text-xs text-tertiary">
          {t.settings.apiTokenCreatedOn.replace(
            "{date}",
            formatShortDate(new Date(token.createdAt), locale),
          )}
          {" · "}
          {lastUsed}
        </p>
      </div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(t.settings.revokeApiTokenConfirm.replace("{name}", token.name))) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="tokenId" value={token.id} />
        <RevokeTokenButton />
      </form>
    </div>
  );
}

export function ApiTokensSection({ tokens }: { tokens: ApiTokenListItem[] }) {
  const t = useTranslations();
  const [state, formAction] = useActionState(
    (_prev: CreateApiTokenResult | null, formData: FormData) => createApiToken(formData),
    null as CreateApiTokenResult | null,
  );

  useEffect(() => {
    if (state && !state.success && state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-blue-50/40 p-5 dark:bg-zinc-800/50">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-blue-950 dark:text-zinc-100">{t.settings.apiAccess}</h2>
        <p className="text-sm text-tertiary">{t.settings.apiAccessDescription}</p>
      </div>

      {state?.success ? <NewTokenNotice token={state.token} name={state.name} /> : null}

      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          name="name"
          required
          maxLength={API_TOKEN_NAME_MAX_LENGTH}
          placeholder={t.settings.apiTokenNamePlaceholder}
          aria-label={t.settings.apiTokenName}
          className="min-w-0 flex-1 rounded-xl border border-border bg-white/80 px-3 py-2 text-sm text-blue-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-zinc-900/70 dark:text-zinc-100"
        />
        <CreateTokenButton />
      </form>

      {tokens.length > 0 ? (
        <div className="space-y-3">
          {tokens.map((token) => (
            <TokenRow key={token.id} token={token} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-tertiary">{t.settings.apiNoTokens}</p>
      )}
    </div>
  );
}
