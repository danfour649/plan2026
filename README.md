# Tasks

`plan2026` is a Next.js App Router task app with Google sign-in, per-user task storage in PostgreSQL, optional rich task notes, urgency levels, due dates, and Google Calendar event creation.

## Features

- Google sign-in with NextAuth v4 and Prisma-backed database sessions
- A single `/tasks` page for day-to-day work
- Optional completed-task visibility with a `showCompleted=1` toggle on the tasks page
- Add and edit tasks in dialogs with:
  - required title
  - optional rich text notes and links
  - optional due date and time
  - urgency from 1 to 7
- Mark tasks done, restore them, or delete them
- Add a task to Google Calendar and keep track of whether it has already been linked
- Settings page to disconnect Google Calendar access
- Server actions for UI mutations and JSON API routes for programmatic access

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma ORM
- PostgreSQL
- NextAuth v4
- Zod
- Tiptap
- Sonner

## Requirements

- Node.js installed
- A PostgreSQL database for local development and testing
- A Google OAuth client with Calendar access enabled

## Environment variables

Set these in `.env` for local development:

- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth secret
- `GOOGLE_CLIENT_ID` - Google OAuth client id
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXTAUTH_URL` - usually `http://localhost:3000` locally

## Local development

This app uses PostgreSQL in every environment, including local development, local testing, and production.

1. Install dependencies:

```bash
npm install
```

2. Configure the environment variables listed above in `.env`, pointing `DATABASE_URL` at your local development or test Postgres database.

3. Run Prisma migrations against your local Postgres database:

```bash
npx prisma migrate dev
```

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

### Before you push

A **pre-push** Git hook (via [Husky](https://typicode.github.io/husky/)) runs `npm run prepush`, which runs **lint** and **build**. That way lint and TypeScript/build failures are caught before pushing, so CI and Vercel are less likely to fail. After `npm install`, the hook is installed automatically. To run the same checks manually: `npm run lint` and `npm run build`.

### Port 3000 already in use

If you see **"Port 3000 is in use"** or **"Unable to acquire lock at .next/dev/lock"**, a previous dev server is still running. On Windows this often happens when the terminal is closed without stopping the server, or when the process doesn’t receive a shutdown signal.

- **Stop the server properly:** Use **Ctrl+C** in the terminal where `npm run dev` is running instead of closing the window.
- **Free the port:** Run `npm run dev:kill` to kill the process on port 3000, then run `npm run dev` again.
- **Manual kill (Windows):** `netstat -ano | findstr :3000`, then `taskkill /PID <pid> /F`. Or use Task Manager → Details → end the `node.exe` process (or "End process tree" on the npm parent).

The root route redirects to `/tasks`.

## Google OAuth setup

In Google Cloud Console:

1. Enable the Google Calendar API for the same project as your OAuth client.
2. Add this local origin:
   - `http://localhost:3000`
3. Add this local redirect URI:
   - `http://localhost:3000/api/auth/callback/google`

The app requests these Google scopes during sign-in:

- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/calendar.events`

Google sign-in forces a fresh Google consent step so revoked Calendar permissions can be granted again on reconnect.

## API

- `GET /api/tasks` - list all tasks for the signed-in user
- `POST /api/tasks` - create a task
- `PATCH /api/tasks/:id` - mark a task complete or restore it
- `DELETE /api/tasks/:id` - delete a task
- `POST /api/tasks/:id/calendar` - create a Google Calendar event for a task

### `POST /api/tasks` body

```json
{
  "title": "Book flights",
  "content": "<p>Use the points portal first.</p>",
  "dueAt": "2026-03-10T14:30"
}
```

Notes:

- `title` is required
- `content` is optional rich text HTML and is sanitized before storing/rendering
- `dueAt` is optional; when present it is converted to a date
- `urgency` is optional and defaults to `4`

### `PATCH /api/tasks/:id` body

```json
{
  "completed": true
}
```

## Deployment

Deployment instructions live in **[DEPLOY.md](./DEPLOY.md)**.

In short:

1. Create a Vercel project.
2. Provision PostgreSQL and set the required env vars.
3. Configure Google OAuth with your production callback URL and Calendar API access.
4. Deploy; the build runs `prisma generate` and `next build`, and migrations are applied with `prisma migrate deploy`.

The database story is intentionally the same in every environment: PostgreSQL for local work and PostgreSQL in production.
