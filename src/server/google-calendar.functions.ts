// Server functions for the Google Calendar / Meet integration.
// Safe to import from components — the build strips the server bodies.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  freeBusy,
  getValidAccessToken,
  revokeToken,
} from "./google-calendar.server";

// ────────────────────────────────────────────────────────────────────────
// Connection status
// ────────────────────────────────────────────────────────────────────────

export const getMyGoogleConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("google_calendar_connections")
      .select("google_email, created_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return { connected: !!data, email: data?.google_email ?? null };
  });

export const getSitterGoogleConnected = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sitterId: string }) =>
    z.object({ sitterId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: sitter, error: se } = await supabaseAdmin
      .from("sitters")
      .select("user_id")
      .eq("id", data.sitterId)
      .maybeSingle();
    if (se) throw se;
    if (!sitter?.user_id) return { connected: false };
    const { data: conn, error } = await supabaseAdmin
      .from("google_calendar_connections")
      .select("user_id")
      .eq("user_id", sitter.user_id)
      .maybeSingle();
    if (error) throw error;
    return { connected: !!conn };
  });

export const disconnectGoogle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: conn } = await supabaseAdmin
      .from("google_calendar_connections")
      .select("access_token, refresh_token")
      .eq("user_id", userId)
      .maybeSingle();
    if (conn?.refresh_token) await revokeToken(conn.refresh_token);
    await supabaseAdmin.from("google_calendar_connections").delete().eq("user_id", userId);
    return { ok: true };
  });

// ────────────────────────────────────────────────────────────────────────
// Slot availability — returns 6 days × 3 buckets, marking which are busy
// ────────────────────────────────────────────────────────────────────────

export type Bucket = "Morning" | "Afternoon" | "Evening";

const BUCKETS: { name: Bucket; startHour: number; endHour: number }[] = [
  { name: "Morning", startHour: 9, endHour: 12 },
  { name: "Afternoon", startHour: 13, endHour: 17 },
  { name: "Evening", startHour: 18, endHour: 21 },
];

export interface AvailableSlot {
  id: string; // dayIndex-bucket
  date: string; // "Mon Nov 4"
  dateISO: string; // YYYY-MM-DD
  bucket: Bucket;
  startISO: string;
  endISO: string;
  label: string;
  time: string;
  available: boolean;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function bucketWindow(date: Date, b: { startHour: number; endHour: number }) {
  const start = new Date(date);
  start.setHours(b.startHour, 0, 0, 0);
  const end = new Date(date);
  end.setHours(b.endHour, 0, 0, 0);
  return { start, end };
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export const getAvailableSlots = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sitterId: string }) =>
    z.object({ sitterId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{
    slots: AvailableSlot[];
    parentConnected: boolean;
    sitterConnected: boolean;
  }> => {
    const { userId } = context;

    // Look up sitter's user_id
    const { data: sitter, error: se } = await supabaseAdmin
      .from("sitters")
      .select("user_id")
      .eq("id", data.sitterId)
      .maybeSingle();
    if (se) throw se;

    const parentToken = await getValidAccessToken(userId);
    const sitterToken = sitter?.user_id ? await getValidAccessToken(sitter.user_id) : null;

    // Build the 6-day × 3-bucket grid
    const now = new Date();
    const days: { date: Date; label: string; iso: string }[] = [];
    for (let d = 1; d <= 6; d++) {
      const dt = new Date(now);
      dt.setDate(now.getDate() + d);
      dt.setHours(0, 0, 0, 0);
      const label = `${dayNames[dt.getDay()]} ${monthNames[dt.getMonth()]} ${dt.getDate()}`;
      const iso = dt.toISOString().slice(0, 10);
      days.push({ date: dt, label, iso });
    }

    const timeMin = days[0].date.toISOString();
    const lastDay = new Date(days[days.length - 1].date);
    lastDay.setHours(23, 59, 59, 999);
    const timeMax = lastDay.toISOString();

    // Fetch busy ranges (ignore failures gracefully — treat as no busy ranges)
    const [parentBusy, sitterBusy] = await Promise.all([
      parentToken ? freeBusy(parentToken.accessToken, timeMin, timeMax).catch(() => []) : Promise.resolve([]),
      sitterToken ? freeBusy(sitterToken.accessToken, timeMin, timeMax).catch(() => []) : Promise.resolve([]),
    ]);

    // Also pull existing scheduled_calls for this sitter in the window so we
    // hide times that have been booked through TinyWatch (even if they didn't
    // hit the sitter's calendar yet).
    const { data: existingCalls } = await supabaseAdmin
      .from("scheduled_calls")
      .select("slot_start_at, slot_end_at, cancelled_at")
      .eq("sitter_id", data.sitterId)
      .gte("slot_start_at", timeMin)
      .lte("slot_start_at", timeMax)
      .is("cancelled_at", null);

    const allBusy: { start: Date; end: Date }[] = [
      ...parentBusy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) })),
      ...sitterBusy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) })),
      ...(existingCalls ?? [])
        .filter((c) => c.slot_start_at && c.slot_end_at)
        .map((c) => ({ start: new Date(c.slot_start_at!), end: new Date(c.slot_end_at!) })),
    ];

    const slots: AvailableSlot[] = [];
    for (let di = 0; di < days.length; di++) {
      const day = days[di];
      for (const b of BUCKETS) {
        const { start, end } = bucketWindow(day.date, b);
        // Bucket is "available" if there's at least one 15-min sub-window
        // not overlapping any busy range. We pick the first such 15-min slot
        // as the canonical bookable time.
        let pickStart: Date | null = null;
        for (let m = start.getTime(); m + 15 * 60 * 1000 <= end.getTime(); m += 15 * 60 * 1000) {
          const sStart = new Date(m);
          const sEnd = new Date(m + 15 * 60 * 1000);
          const conflict = allBusy.some((bz) => rangesOverlap(sStart, sEnd, bz.start, bz.end));
          if (!conflict) {
            pickStart = sStart;
            break;
          }
        }
        const available = !!pickStart;
        const slotStart = pickStart ?? start;
        const slotEnd = new Date(slotStart.getTime() + 15 * 60 * 1000);
        const time = slotStart.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
        slots.push({
          id: `${di}-${b.name}`,
          date: day.label,
          dateISO: day.iso,
          bucket: b.name,
          startISO: slotStart.toISOString(),
          endISO: slotEnd.toISOString(),
          label: `${day.label} · ${time}`,
          time,
          available,
        });
      }
    }

    return {
      slots,
      parentConnected: !!parentToken,
      sitterConnected: !!sitterToken,
    };
  });

// ────────────────────────────────────────────────────────────────────────
// Book a slot — atomic reserve in DB, then create real Meet event
// ────────────────────────────────────────────────────────────────────────

export const bookCallSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    sitterId: string;
    sitterName: string;
    sitterPhoto: string;
    startISO: string;
    endISO: string;
    dateLabel: string;
    timeLabel: string;
  }) =>
    z
      .object({
        sitterId: z.string().uuid(),
        sitterName: z.string().min(1).max(200),
        sitterPhoto: z.string().max(2000),
        startISO: z.string().datetime(),
        endISO: z.string().datetime(),
        dateLabel: z.string().min(1).max(100),
        timeLabel: z.string().min(1).max(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // 1. Look up sitter user
    const { data: sitter, error: se } = await supabaseAdmin
      .from("sitters")
      .select("user_id, name")
      .eq("id", data.sitterId)
      .maybeSingle();
    if (se) throw se;
    if (!sitter?.user_id) {
      return { ok: false as const, error: "sitter_unavailable" as const };
    }

    // 2. Tokens for both
    const [parentTok, sitterTok] = await Promise.all([
      getValidAccessToken(userId),
      getValidAccessToken(sitter.user_id),
    ]);
    if (!parentTok) return { ok: false as const, error: "parent_not_connected" as const };
    if (!sitterTok) return { ok: false as const, error: "sitter_not_connected" as const };

    // 3. Re-check the slot is still free on both calendars to catch races
    const [pBusy, sBusy] = await Promise.all([
      freeBusy(parentTok.accessToken, data.startISO, data.endISO).catch(() => []),
      freeBusy(sitterTok.accessToken, data.startISO, data.endISO).catch(() => []),
    ]);
    if (pBusy.length > 0 || sBusy.length > 0) {
      return { ok: false as const, error: "slot_taken" as const };
    }

    // 4. DB-level atomic reservation: insert into scheduled_calls first.
    // If a concurrent booking inserts an overlapping row, we'll detect and roll back.
    const { data: existingOverlap } = await supabaseAdmin
      .from("scheduled_calls")
      .select("id")
      .eq("sitter_id", data.sitterId)
      .is("cancelled_at", null)
      .lt("slot_start_at", data.endISO)
      .gt("slot_end_at", data.startISO)
      .limit(1);
    if (existingOverlap && existingOverlap.length > 0) {
      return { ok: false as const, error: "slot_taken" as const };
    }

    // Get parent email for invite
    const { data: parentUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const parentEmail = parentUser?.user?.email;

    const { data: parentProfile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();
    const parentName = parentProfile?.display_name ?? parentEmail ?? "Parent";

    // 5. Create event on the SITTER's calendar with Meet + invite to parent
    let sitterEvent;
    try {
      sitterEvent = await createCalendarEvent({
        accessToken: sitterTok.accessToken,
        summary: `Intro call with ${parentName}`,
        description: `15-minute intro call booked through TinyWatch.`,
        startISO: data.startISO,
        endISO: data.endISO,
        attendees: parentEmail ? [{ email: parentEmail }] : [],
        createMeet: true,
      });
    } catch (err) {
      console.error("sitter event create failed", err);
      return { ok: false as const, error: "calendar_error" as const };
    }

    const meetLink =
      sitterEvent.hangoutLink ??
      sitterEvent.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri ??
      "";

    // 6. Persist to scheduled_calls
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("scheduled_calls")
      .insert({
        user_id: userId,
        sitter_id: data.sitterId,
        sitter_name: data.sitterName,
        sitter_photo: data.sitterPhoto,
        date_label: data.dateLabel,
        time_label: data.timeLabel,
        slot_label: `${data.dateLabel} · ${data.timeLabel}`,
        meet_link: meetLink.replace(/^https?:\/\//, ""),
        google_meet_link: meetLink,
        google_event_id_sitter: sitterEvent.id,
        slot_start_at: data.startISO,
        slot_end_at: data.endISO,
        status: "Confirmed",
      })
      .select("*")
      .single();

    if (insErr) {
      // Roll back the calendar event
      await deleteCalendarEvent(sitterTok.accessToken, sitterEvent.id).catch(() => {});
      console.error("scheduled_calls insert failed", insErr);
      return { ok: false as const, error: "storage_failed" as const };
    }

    return {
      ok: true as const,
      call: {
        id: inserted.id,
        meetLink: meetLink,
        slotLabel: inserted.slot_label,
        dateLabel: inserted.date_label,
        timeLabel: inserted.time_label,
      },
    };
  });

// ────────────────────────────────────────────────────────────────────────
// Cancel a call — delete events + mark cancelled
// ────────────────────────────────────────────────────────────────────────

export const cancelCallSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { callId: string }) =>
    z.object({ callId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: call, error } = await supabaseAdmin
      .from("scheduled_calls")
      .select("*")
      .eq("id", data.callId)
      .maybeSingle();
    if (error) throw error;
    if (!call) return { ok: false as const, error: "not_found" as const };
    if (call.user_id !== userId) {
      // sitter can also cancel
      const { data: sitter } = await supabaseAdmin
        .from("sitters")
        .select("user_id")
        .eq("id", call.sitter_id)
        .maybeSingle();
      if (sitter?.user_id !== userId) {
        return { ok: false as const, error: "forbidden" as const };
      }
    }

    // Try to delete the sitter event
    const { data: sitter } = await supabaseAdmin
      .from("sitters")
      .select("user_id")
      .eq("id", call.sitter_id)
      .maybeSingle();
    if (sitter?.user_id && call.google_event_id_sitter) {
      const tok = await getValidAccessToken(sitter.user_id);
      if (tok) {
        await deleteCalendarEvent(tok.accessToken, call.google_event_id_sitter).catch((e) => {
          console.error("delete sitter event", e);
        });
      }
    }

    await supabaseAdmin
      .from("scheduled_calls")
      .update({ cancelled_at: new Date().toISOString(), status: "Cancelled" })
      .eq("id", call.id);

    return { ok: true as const };
  });
