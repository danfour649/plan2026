import { NextResponse } from "next/server";
import { google } from "googleapis";

import { getCurrentUserId } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Strip HTML tags for plain-text description. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isGoogleNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === 404
  );
}

export async function POST(_req: Request, { params }: Params) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.access_token) {
    return NextResponse.json(
      { error: "Google account not linked or missing calendar permission. Sign out and sign in again with Google." },
      { status: 403 }
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google Calendar is not configured" },
      { status: 503 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${baseUrl}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Refresh token if expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    if (!account.refresh_token) {
      return NextResponse.json(
        { error: "Google Calendar access expired. Sign out and sign in again with Google to reconnect Calendar." },
        { status: 403 }
      );
    }

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      if (credentials.access_token) {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            access_token: credentials.access_token,
            expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
          },
        });
      }
    } catch {
      return NextResponse.json(
        { error: "Google Calendar access expired. Sign out and sign in again with Google to reconnect Calendar." },
        { status: 403 }
      );
    }
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const dueAt = task.dueAt;
  const description = task.content ? stripHtml(task.content) : undefined;

  let start: { date?: string; dateTime?: string };
  let end: { date?: string; dateTime?: string };

  if (dueAt) {
    const startDate = new Date(dueAt);
    const endDate = new Date(dueAt);
    endDate.setHours(endDate.getHours() + 1);
    start = { dateTime: startDate.toISOString() };
    end = { dateTime: endDate.toISOString() };
  } else {
    const today = new Date();
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);
    start = { date: formatDateOnly(today) };
    // Google Calendar expects all-day event end dates to be exclusive.
    end = { date: formatDateOnly(nextDay) };
  }

  const requestBody = {
    summary: task.title,
    description: description ?? undefined,
    start,
    end,
  };

  try {
    let event;
    let created = false;

    if (task.googleCalendarEventId) {
      try {
        event = await calendar.events.update({
          calendarId: "primary",
          eventId: task.googleCalendarEventId,
          requestBody,
        });
      } catch (err) {
        if (!isGoogleNotFoundError(err)) {
          throw err;
        }
      }
    }

    if (!event) {
      event = await calendar.events.insert({
        calendarId: "primary",
        requestBody,
      });
      created = true;
    }

    const eventId = event.data.id ?? null;
    const htmlLink = event.data.htmlLink ?? null;

    await prisma.task.update({
      where: { id: task.id },
      data: {
        googleCalendarEventId: eventId,
        googleCalendarEventUrl: htmlLink,
      },
    });

    return NextResponse.json(
      { ok: true, created, eventId: eventId ?? undefined, htmlLink: htmlLink ?? undefined },
      { status: created ? 201 : 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create calendar event";
    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
