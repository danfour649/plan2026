/**
 * In-process memo in front of `use cache` + Prisma. Next dev can load this module more
 * than once (separate bundles); state lives on `globalThis` so all copies share one store.
 * Cleared alongside `revalidateTag` via `revalidate-app-data.ts`.
 *
 * If Next logs "server caches disabled" on navigation, Chrome DevTools often has
 * "Disable cache" checked (while open) — that bypasses framework caches; turn it off to
 * test caching. This memo still helps across navigations on the same Node process.
 */

export type NavCountsMemo = {
  remainingTaskCount: number;
  activePlanCount: number;
  suppliesCount: number;
};

/** Matches the subset of session payload we store from DB (see auth.getSessionByToken). */
export type AuthSessionMemo = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    preferredLocale: string | null;
    preferredTheme: string | null;
  };
  expires: string;
};

/** In-process memo for page/nav payloads; minimum 15 minutes per project cache policy. */
const MEMO_SAFETY_TTL_MS = 15 * 60_000;

type ExpEntry<T> = { v: T; exp: number };

const STORE_KEY = "__plan2026RuntimeMemoStore_v2" as const;

type MemoStore = {
  nav: Map<string, ExpEntry<NavCountsMemo>>;
  navPending: Map<string, Promise<NavCountsMemo>>;
  planList: Map<string, ExpEntry<{ id: string; name: string }[]>>;
  planListPending: Map<string, Promise<{ id: string; name: string }[]>>;
  tasksPage: Map<string, ExpEntry<unknown>>;
  tasksPagePending: Map<string, Promise<unknown>>;
  plansPage: Map<string, ExpEntry<unknown>>;
  plansPagePending: Map<string, Promise<unknown>>;
  actionsPage: Map<string, ExpEntry<unknown>>;
  actionsPagePending: Map<string, Promise<unknown>>;
  suppliesPage: Map<string, ExpEntry<unknown>>;
  suppliesPagePending: Map<string, Promise<unknown>>;
  authSession: Map<string, ExpEntry<AuthSessionMemo | null>>;
  authSessionPending: Map<string, Promise<AuthSessionMemo | null>>;
};

function getStore(): MemoStore {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: MemoStore };
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      nav: new Map(),
      navPending: new Map(),
      planList: new Map(),
      planListPending: new Map(),
      tasksPage: new Map(),
      tasksPagePending: new Map(),
      plansPage: new Map(),
      plansPagePending: new Map(),
      actionsPage: new Map(),
      actionsPagePending: new Map(),
      suppliesPage: new Map(),
      suppliesPagePending: new Map(),
      authSession: new Map(),
      authSessionPending: new Map(),
    };
  }
  return g[STORE_KEY];
}

function deleteKeysWithPrefix(map: Map<string, ExpEntry<unknown>>, prefix: string) {
  for (const k of [...map.keys()]) {
    if (k.startsWith(prefix)) map.delete(k);
  }
}

export function memoNavGet(userId: string): NavCountsMemo | undefined {
  const e = getStore().nav.get(userId);
  if (!e || e.exp <= Date.now()) return undefined;
  return e.v;
}

export function memoNavSet(userId: string, v: NavCountsMemo) {
  getStore().nav.set(userId, { v, exp: Date.now() + MEMO_SAFETY_TTL_MS });
}

export function memoNavClear(userId: string) {
  const s = getStore();
  s.nav.delete(userId);
  s.navPending.delete(userId);
}

export async function memoNavResolve(
  userId: string,
  fetcher: () => Promise<NavCountsMemo>,
): Promise<NavCountsMemo> {
  const hit = memoNavGet(userId);
  if (hit) return hit;
  const s = getStore();
  let p = s.navPending.get(userId);
  if (!p) {
    p = fetcher().then((v) => {
      memoNavSet(userId, v);
      s.navPending.delete(userId);
      return v;
    });
    s.navPending.set(userId, p);
  }
  return p;
}

export function memoPlanListGet(userId: string): { id: string; name: string }[] | undefined {
  const e = getStore().planList.get(userId);
  if (!e || e.exp <= Date.now()) return undefined;
  return e.v;
}

export function memoPlanListSet(userId: string, v: { id: string; name: string }[]) {
  getStore().planList.set(userId, { v, exp: Date.now() + MEMO_SAFETY_TTL_MS });
}

export function memoPlanListClear(userId: string) {
  const s = getStore();
  s.planList.delete(userId);
  s.planListPending.delete(userId);
}

export async function memoPlanListResolve(
  userId: string,
  fetcher: () => Promise<{ id: string; name: string }[]>,
): Promise<{ id: string; name: string }[]> {
  const hit = memoPlanListGet(userId);
  if (hit) return hit;
  const s = getStore();
  let p = s.planListPending.get(userId);
  if (!p) {
    p = fetcher().then((v) => {
      memoPlanListSet(userId, v);
      s.planListPending.delete(userId);
      return v;
    });
    s.planListPending.set(userId, p);
  }
  return p;
}

export function memoTasksPageKey(userId: string, page: number, limit: number, completedPage: number) {
  return `tp:${userId}:${page}:${limit}:${completedPage}`;
}

export function memoTasksPageGet<T>(key: string): T | undefined {
  const e = getStore().tasksPage.get(key);
  if (!e || e.exp <= Date.now()) return undefined;
  return e.v as T;
}

export function memoTasksPageSet(key: string, v: unknown) {
  getStore().tasksPage.set(key, { v, exp: Date.now() + MEMO_SAFETY_TTL_MS });
}

export function memoTasksPageClearForUser(userId: string) {
  const s = getStore();
  const prefix = `tp:${userId}:`;
  deleteKeysWithPrefix(s.tasksPage as Map<string, ExpEntry<unknown>>, prefix);
  for (const k of [...s.tasksPagePending.keys()]) {
    if (k.startsWith(prefix)) s.tasksPagePending.delete(k);
  }
}

export async function memoTasksPageResolve<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = memoTasksPageGet<T>(key);
  if (hit !== undefined) return hit;
  const s = getStore();
  let p = s.tasksPagePending.get(key) as Promise<T> | undefined;
  if (!p) {
    p = fetcher().then((v) => {
      memoTasksPageSet(key, v);
      s.tasksPagePending.delete(key);
      return v;
    }) as Promise<T>;
    s.tasksPagePending.set(key, p);
  }
  return p;
}

export function memoPlansPageKey(userId: string, page: number, limit: number) {
  return `pp:${userId}:${page}:${limit}`;
}

export function memoPlansPageGet<T>(key: string): T | undefined {
  const e = getStore().plansPage.get(key);
  if (!e || e.exp <= Date.now()) return undefined;
  return e.v as T;
}

export function memoPlansPageSet(key: string, v: unknown) {
  getStore().plansPage.set(key, { v, exp: Date.now() + MEMO_SAFETY_TTL_MS });
}

export function memoPlansPageClearForUser(userId: string) {
  const s = getStore();
  const prefix = `pp:${userId}:`;
  deleteKeysWithPrefix(s.plansPage as Map<string, ExpEntry<unknown>>, prefix);
  for (const k of [...s.plansPagePending.keys()]) {
    if (k.startsWith(prefix)) s.plansPagePending.delete(k);
  }
}

export async function memoPlansPageResolve<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = memoPlansPageGet<T>(key);
  if (hit !== undefined) return hit;
  const s = getStore();
  let p = s.plansPagePending.get(key) as Promise<T> | undefined;
  if (!p) {
    p = fetcher().then((v) => {
      memoPlansPageSet(key, v);
      s.plansPagePending.delete(key);
      return v;
    }) as Promise<T>;
    s.plansPagePending.set(key, p);
  }
  return p;
}

export function memoActionsPageKey(userId: string, dateKey: string) {
  return `ap:${userId}:${dateKey}`;
}

export function memoActionsPageGet<T>(key: string): T | undefined {
  const e = getStore().actionsPage.get(key);
  if (!e || e.exp <= Date.now()) return undefined;
  return e.v as T;
}

export function memoActionsPageSet(key: string, v: unknown) {
  getStore().actionsPage.set(key, { v, exp: Date.now() + MEMO_SAFETY_TTL_MS });
}

export function memoActionsPageClearForUser(userId: string) {
  const s = getStore();
  const prefix = `ap:${userId}:`;
  deleteKeysWithPrefix(s.actionsPage as Map<string, ExpEntry<unknown>>, prefix);
  for (const k of [...s.actionsPagePending.keys()]) {
    if (k.startsWith(prefix)) s.actionsPagePending.delete(k);
  }
}

export async function memoActionsPageResolve<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = memoActionsPageGet<T>(key);
  if (hit !== undefined) return hit;
  const s = getStore();
  let p = s.actionsPagePending.get(key) as Promise<T> | undefined;
  if (!p) {
    p = fetcher().then((v) => {
      memoActionsPageSet(key, v);
      s.actionsPagePending.delete(key);
      return v;
    }) as Promise<T>;
    s.actionsPagePending.set(key, p);
  }
  return p;
}

export function memoSuppliesPageGet<T>(userId: string): T | undefined {
  const e = getStore().suppliesPage.get(userId);
  if (!e || e.exp <= Date.now()) return undefined;
  return e.v as T;
}

export function memoSuppliesPageSet(userId: string, v: unknown) {
  getStore().suppliesPage.set(userId, { v, exp: Date.now() + MEMO_SAFETY_TTL_MS });
}

export function memoSuppliesPageClear(userId: string) {
  const s = getStore();
  s.suppliesPage.delete(userId);
  s.suppliesPagePending.delete(userId);
}

export async function memoSuppliesPageResolve<T>(userId: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = memoSuppliesPageGet<T>(userId);
  if (hit !== undefined) return hit;
  const s = getStore();
  let p = s.suppliesPagePending.get(userId) as Promise<T> | undefined;
  if (!p) {
    p = fetcher().then((v) => {
      memoSuppliesPageSet(userId, v);
      s.suppliesPagePending.delete(userId);
      return v;
    }) as Promise<T>;
    s.suppliesPagePending.set(userId, p);
  }
  return p;
}

/** Auth session memo TTL (minimum 15 minutes; capped by session expiry). */
const AUTH_MEMO_POSITIVE_MS = 15 * 60_000;
/** Short negative cache for invalid sessions — not extended with page data caches. */
const AUTH_MEMO_NEGATIVE_MS = 10_000;

export function memoAuthSessionGet(sessionToken: string): AuthSessionMemo | null | undefined {
  const e = getStore().authSession.get(sessionToken);
  if (!e || e.exp <= Date.now()) return undefined;
  return e.v;
}

export function memoAuthSessionSetFromRow(sessionToken: string, session: AuthSessionMemo, sessionExpires: Date) {
  const staleAt = Math.min(Date.now() + AUTH_MEMO_POSITIVE_MS, sessionExpires.getTime());
  getStore().authSession.set(sessionToken, { v: session, exp: staleAt });
}

export function memoAuthSessionSetNegative(sessionToken: string) {
  getStore().authSession.set(sessionToken, { v: null, exp: Date.now() + AUTH_MEMO_NEGATIVE_MS });
}

export function memoAuthSessionClear(sessionToken: string) {
  const s = getStore();
  s.authSession.delete(sessionToken);
  s.authSessionPending.delete(sessionToken);
}

export async function memoAuthSessionResolve(
  sessionToken: string,
  fetcher: () => Promise<AuthSessionMemo | null>,
): Promise<AuthSessionMemo | null> {
  const hit = memoAuthSessionGet(sessionToken);
  if (hit !== undefined) return hit;
  const s = getStore();
  let p = s.authSessionPending.get(sessionToken);
  if (!p) {
    p = fetcher().then((v) => {
      if (v) {
        memoAuthSessionSetFromRow(sessionToken, v, new Date(v.expires));
      } else {
        memoAuthSessionSetNegative(sessionToken);
      }
      s.authSessionPending.delete(sessionToken);
      return v;
    });
    s.authSessionPending.set(sessionToken, p);
  }
  return p;
}
