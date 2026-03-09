# TECH-0031: AI advice on plans

**Status:** On hold — concerned about costs if API key is stolen or misused (AI calls on an account with payment required). Do not implement until directed.

**Goal:** Integrate an AI “advice bot” that can review a plan, its associated tasks, and suggest next steps or improvements.

---

## 1. Provider and API — analysis and options

**Why it matters:** Choice of provider affects cost, latency, privacy, and how much you need to maintain (e.g. prompt design, rate limits). The API shape determines how easy it is to swap providers later.

**Options:**

| Provider | Pros | Cons | Best for |
|----------|------|------|----------|
| **OpenAI (GPT-4o / GPT-4o mini)** | Strong quality; good tooling (SDK, streaming); widely used. | Paid; data sent to OpenAI (check terms for training). | Fastest path to good advice; you’re okay with cloud API. |
| **Anthropic (Claude)** | Strong quality and safety controls; clear privacy stance. | Paid; another vendor to manage. | If you want an alternative to OpenAI with good docs. |
| **Self-hosted (e.g. Ollama, vLLM + open model)** | Data stays on your infra; no per-token vendor cost. | You run and scale the service; quality depends on model choice. | If plan/task content must not leave your environment. |
| **Vercel AI SDK / Vercel-provided models** | Fits Next.js; can abstract provider. | Still backed by a provider (OpenAI, etc.); you pay per use. | If you want a unified interface and might switch providers. |

**Recommendation:** Start with **OpenAI (GPT-4o mini)** or **Anthropic (Claude Haiku)** for a first version: good quality, simple REST/API usage, and you can add a small abstraction layer (e.g. “advice provider” that takes plan + tasks and returns text) so swapping later is easier. Use a **server action** (or a route handler that only the server calls) so the API key stays on the server. Send a structured prompt that includes plan name, goal, status, and a compact list of tasks (title, due, completed) so the model can suggest next steps, priorities, or risks.

**API shape (conceptual):**

- **Input:** `planId` (or serialized plan + tasks); optionally max tokens.
- **Output:** Plain text or a simple structure (e.g. `{ summary, nextSteps[], risks[] }`) that you can render in the UI.
- **Error handling:** Timeout (e.g. 15–30s), rate limit, and “content filtered” or provider errors; return a user-friendly message and optionally log for debugging.

**Recommended next steps:** (1) Pick one provider (e.g. OpenAI) and add the API key to env (e.g. `OPENAI_API_KEY`); (2) implement a server action `getPlanAdvice(planId)` that loads plan + tasks, builds a prompt, calls the provider, and returns text or structured advice; (3) add a simple rate limit or “N requests per user per day” to avoid cost spikes; (4) document in README that the feature is opt-in and which provider is used.

---

## 2. Safety and privacy

**Why it matters:** Plan and task titles/descriptions may be sensitive. Users need to know what is sent and who can trigger it.

**Options:**

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Opt-in per request** | User clicks “Get AI advice”; only then is data sent. | Clear consent; no background sending. | Slightly more friction. |
| **Feature flag / env** | Advice only available if e.g. `ENABLE_AI_ADVICE=true` and key is set. | Easy to disable in sensitive deployments. | Doesn’t by itself address user consent. |
| **No persistence** | Don’t store advice in DB; show once in UI. | Less data retention. | User can’t “see last advice” unless you re-call. |
| **Persist advice** | Store result with plan or in a separate table. | User can revisit. | Need retention policy and clarity in privacy docs. |

**Recommendation:** **Opt-in per request** + **no persistence** for v1: user explicitly clicks “Get AI advice”; send only the plan and tasks for that request; show the result in the UI without saving it. Add a short disclaimer near the button (e.g. “Plan and task details will be sent to [Provider] to generate advice”). If you later persist advice, document it and consider a retention window.

**Recommended next steps:** (1) Add a clear label/description next to the button that data is sent to the provider; (2) ensure the action is only callable by the plan owner (or shared users, if you decide they can request advice); (3) do not log full plan/task content in app logs; (4) mention in privacy/terms if you have them.

---

## 3. UI and cost control

**Why it matters:** Users need to see that something is happening and then read the advice. You need to avoid runaway cost from repeated or automated calls.

**UI options:**

- **Inline section on plan page:** “Get AI advice” button; on click show loading state (e.g. spinner + “Analyzing your plan…”); then show the advice in a card or expandable section. No navigation away.
- **Modal:** Same flow but in a modal; good if the response can be long and you want focus.

**Recommendation:** **Inline section** on the plan page: button, then loading, then the advice block. Keeps context (user stays on the plan). Use a simple “Copy” or “Dismiss” if you don’t persist.

**Cost control options:**

| Approach | Description | Recommendation |
|----------|-------------|-----------------|
| **Per-user limit** | e.g. 5 or 10 advice requests per user per day. | Implement a simple counter (e.g. in DB or server-side cache) and reject with a friendly message when over. |
| **No history** | Don’t store advice. | Use for v1 to avoid storage and simplify. |
| **Token cap** | Limit max tokens per request. | Set a reasonable max (e.g. 500–1000) in the provider call to cap response size and cost per call. |

**Recommended next steps:** (1) Add “Get AI advice” (and loading + result area) to the plan page; (2) add i18n for button, loading, empty/error states (en, fr, pidgin); (3) enforce a per-user daily limit in the server action; (4) set max_tokens in the provider request.

---

## 4. Summary checklist and order of work

| Step | Description |
|------|-------------|
| 1 | Choose provider (e.g. OpenAI or Anthropic); add API key to env; document in README. |
| 2 | Implement server action: load plan + tasks, build prompt, call provider, return advice; handle errors and timeout. |
| 3 | Add per-user rate limit (e.g. daily cap) and max_tokens. |
| 4 | Add “Get AI advice” UI on plan page (button, loading, result); add privacy disclaimer. |
| 5 | Add i18n for all new copy (en, fr, pidgin). |
| 6 | Update README / AI_PROJECT_CONTEXT with feature description and env vars. |

Do steps 1–2 first so you have an end-to-end call; then add limits (3) and UI (4–5).
