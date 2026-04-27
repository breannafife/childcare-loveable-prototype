// Bookings store — backed by Supabase. Slot generation stays client-side
// because the prototype mocks sitter availability rather than reading it
// from a real calendar.
import { supabase } from "@/integrations/supabase/client";

export type CallStatus = "Requested" | "Confirmed" | "Completed";

export interface ScheduledCall {
  id: string;
  sitterId: string;
  sitterName: string;
  sitterPhoto: string;
  date: string;
  time: string;
  label: string;
  meetLink: string;
  status: CallStatus;
}

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  label: string;
  block: "Morning" | "Afternoon" | "Evening";
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function generateWeekSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  for (let d = 1; d <= 6; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    const dayLabel = `${dayNames[date.getDay()]} ${monthNames[date.getMonth()]} ${date.getDate()}`;
    const blocks: { block: TimeSlot["block"]; times: string[] }[] = [
      { block: "Morning", times: ["9:00 AM", "10:30 AM"] },
      { block: "Afternoon", times: ["1:00 PM", "3:00 PM"] },
      { block: "Evening", times: ["6:00 PM", "7:30 PM"] },
    ];
    for (const b of blocks) {
      for (const time of b.times) {
        slots.push({
          id: `${d}-${time}`,
          date: dayLabel,
          time,
          label: `${dayLabel} · ${time}`,
          block: b.block,
        });
      }
    }
  }
  return slots;
}

interface ScheduleArgs {
  sitterId: string;
  sitterName: string;
  sitterPhoto: string;
  slot: TimeSlot;
}

function rowToCall(row: {
  id: string;
  sitter_id: string;
  sitter_name: string;
  sitter_photo: string;
  date_label: string;
  time_label: string;
  slot_label: string;
  meet_link: string;
  status: string;
}): ScheduledCall {
  return {
    id: row.id,
    sitterId: row.sitter_id,
    sitterName: row.sitter_name,
    sitterPhoto: row.sitter_photo,
    date: row.date_label,
    time: row.time_label,
    label: row.slot_label,
    meetLink: row.meet_link,
    status: (row.status as CallStatus) ?? "Requested",
  };
}

export async function scheduleCall(args: ScheduleArgs): Promise<ScheduledCall> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const userId = userRes.user?.id;
  if (!userId) throw new Error("You need to sign in to schedule a call.");

  const meetLink = "meet.google.com/abc-defg-hij";
  const { data, error } = await supabase
    .from("scheduled_calls")
    .insert({
      user_id: userId,
      sitter_id: args.sitterId,
      sitter_name: args.sitterName,
      sitter_photo: args.sitterPhoto,
      date_label: args.slot.date,
      time_label: args.slot.time,
      slot_label: args.slot.label,
      meet_link: meetLink,
      status: "Requested",
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToCall(data);
}

export async function fetchMyCalls(): Promise<ScheduledCall[]> {
  const { data, error } = await supabase
    .from("scheduled_calls")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToCall);
}
