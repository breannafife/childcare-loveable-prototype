// Simple in-memory bookings store (mock)
export type CallStatus = "Requested" | "Confirmed" | "Completed";

export interface ScheduledCall {
  id: string;
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

// Generate mock slots for current week
export function generateWeekSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let d = 1; d <= 6; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    const dayLabel = `${dayNames[date.getDay()]} ${monthNames[date.getMonth()]} ${date.getDate()}`;

    const blocks: { block: "Morning" | "Afternoon" | "Evening"; times: string[] }[] = [
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

// Simple global state (replaced by real store in production)
let scheduledCalls: ScheduledCall[] = [];
let listeners: (() => void)[] = [];

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeToBookings(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getScheduledCalls() {
  return scheduledCalls;
}

export function scheduleCall(sitterName: string, sitterPhoto: string, slot: TimeSlot): ScheduledCall {
  const call: ScheduledCall = {
    id: `call-${Date.now()}`,
    sitterName,
    sitterPhoto,
    date: slot.date,
    time: slot.time,
    label: slot.label,
    meetLink: "https://meet.google.com/abc-defg-hij",
    status: "Requested",
  };
  scheduledCalls = [...scheduledCalls, call];
  notify();
  return call;
}
