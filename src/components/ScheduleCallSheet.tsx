import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Video, Clock, Calendar, CheckCircle, ExternalLink, X, Loader2, AlertCircle, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getAvailableSlots,
  bookCallSlot,
  getMyGoogleConnection,
  type AvailableSlot,
} from "@/server/google-calendar.functions";

interface ScheduleCallSheetProps {
  open: boolean;
  onClose: () => void;
  sitterId: string;
  sitterName: string;
  sitterPhoto: string;
}

type Step = "select" | "confirmed";

export function ScheduleCallSheet({ open, onClose, sitterId, sitterName, sitterPhoto }: ScheduleCallSheetProps) {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("select");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [confirmedMeetLink, setConfirmedMeetLink] = useState("");
  const [confirmedLabel, setConfirmedLabel] = useState("");

  const getAvailableSlotsFn = useServerFn(getAvailableSlots);
  const getMyGoogleConnectionFn = useServerFn(getMyGoogleConnection);
  const bookCallSlotFn = useServerFn(bookCallSlot);

  const conn = useQuery({
    queryKey: ["my-google-connection", user?.id],
    enabled: !!user && open,
    queryFn: () =>
      getMyGoogleConnectionFn({ data: { token: session?.access_token } }),
  });

  const slotsQuery = useQuery({
    queryKey: ["available-slots", sitterId, user?.id],
    enabled: !!user && open && (conn.data?.connected ?? false),
    queryFn: () => getAvailableSlotsFn({ data: { sitterId } }),
  });

  const slotsByDay = useMemo(() => {
    const grouped: Record<string, AvailableSlot[]> = {};
    for (const s of slotsQuery.data?.slots ?? []) {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    }
    return grouped;
  }, [slotsQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) throw new Error("Pick a time first.");
      const res = await bookCallSlotFn({
        data: {
          sitterId,
          sitterName,
          sitterPhoto,
          startISO: selectedSlot.startISO,
          endISO: selectedSlot.endISO,
          dateLabel: selectedSlot.date,
          timeLabel: selectedSlot.time,
        },
      });
      if (!res.ok) {
        const messages: Record<string, string> = {
          slot_taken: "This slot was just taken — please choose another time",
          parent_not_connected: "Connect your Google Calendar to book a call.",
          sitter_not_connected: "This sitter hasn't connected their Google Calendar yet.",
          sitter_unavailable: "This sitter isn't available right now.",
          calendar_error: "Google Calendar wouldn't accept the booking. Try a different slot.",
          storage_failed: "Couldn't save the booking. Try again.",
        };
        throw new Error(messages[res.error] ?? "Could not schedule the call.");
      }
      return res.call;
    },
    onSuccess: (call) => {
      setConfirmedMeetLink(call.meetLink.replace(/^https?:\/\//, ""));
      setConfirmedLabel(call.slotLabel);
      setStep("confirmed");
      qc.invalidateQueries({ queryKey: ["my-calls"] });
      qc.invalidateQueries({ queryKey: ["available-slots", sitterId] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not schedule the call."),
  });

  function handleConfirm() {
    if (!user) {
      onClose();
      navigate({ to: "/auth", search: { redirect: window.location.pathname } });
      toast.message("Sign in to book an intro call.");
      return;
    }
    mutation.mutate();
  }

  function handleConnectGoogle() {
    if (!session) return;
    const redirect = window.location.pathname + window.location.search;
    const url = `/api/public/google/oauth/start?token=${encodeURIComponent(session.access_token)}&redirect=${encodeURIComponent(redirect)}`;
    window.location.href = url;
  }

  function handleClose() {
    setStep("select");
    setSelectedSlot(null);
    onClose();
  }

  if (!open) return null;

  const needsParentConnect = !!user && conn.isFetched && !conn.data?.connected;
  const sitterNotConnected =
    slotsQuery.data && !slotsQuery.data.sitterConnected;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg animate-in slide-in-from-bottom duration-300">
        <div className="rounded-t-3xl border border-border bg-card shadow-2xl">
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1.5 w-10 rounded-full bg-muted" />
          </div>

          <div className="flex items-center justify-between px-6 pb-4">
            <div className="flex items-center gap-2">
              <Video size={20} className="text-primary" />
              <h3 className="font-display text-lg font-semibold text-card-foreground">
                {step === "select" ? `Schedule a call with ${sitterName}` : "Call confirmed!"}
              </h3>
            </div>
            <button onClick={handleClose} className="rounded-full p-1.5 hover:bg-muted transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          {step === "select" ? (
            <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Pick a time for a 15-minute video pre-screening call via Google Meet.
                {!user && " You'll be asked to sign in to confirm."}
              </p>

              {!user ? (
                <button
                  onClick={handleConfirm}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Sign in to confirm
                </button>
              ) : needsParentConnect ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <Link2 size={18} className="mt-0.5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-card-foreground">Connect your Google Calendar</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        We'll check your availability and add the Meet event to your calendar automatically.
                      </p>
                      <button
                        onClick={handleConnectGoogle}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Connect Google Calendar
                      </button>
                    </div>
                  </div>
                </div>
              ) : conn.isLoading || slotsQuery.isLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Loading availability…
                </div>
              ) : sitterNotConnected ? (
                <div className="rounded-xl border border-warmth/40 bg-warmth/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="mt-0.5 text-warmth-foreground" />
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">
                        {sitterName} hasn't connected their calendar yet
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Try another sitter, or check back later.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {Object.entries(slotsByDay).map(([day, daySlots]) => {
                    const anyAvailable = daySlots.some((s) => s.available);
                    if (!anyAvailable) return null;
                    return (
                      <div key={day} className="mb-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {daySlots.map((slot) => {
                            const isSelected = selectedSlot?.id === slot.id;
                            if (!slot.available) {
                              return (
                                <div
                                  key={slot.id}
                                  className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground/50"
                                >
                                  <span className="block">{slot.bucket}</span>
                                  <span className="mt-0.5 block text-[10px]">Busy</span>
                                </div>
                              );
                            }
                            return (
                              <button
                                key={slot.id}
                                onClick={() => setSelectedSlot(slot)}
                                className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                                    : "border-border bg-card text-card-foreground hover:border-primary/40 hover:bg-accent"
                                }`}
                              >
                                <span className="block">{slot.time}</span>
                                <span className={`mt-0.5 block text-[10px] ${isSelected ? "text-primary/70" : "text-muted-foreground"}`}>
                                  {slot.bucket}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {Object.values(slotsByDay).every((d) => !d.some((s) => s.available)) && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No open times in the next 6 days. Check back soon.
                    </p>
                  )}

                  <button
                    onClick={handleConfirm}
                    disabled={!selectedSlot || mutation.isPending}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    Confirm call
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="px-6 pb-8">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-trust/15">
                  <CheckCircle size={28} className="text-trust" />
                </div>
                <p className="text-sm text-muted-foreground">Your call has been booked</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-accent/50 p-5">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="text-sm font-medium text-card-foreground">{confirmedLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium text-card-foreground">15 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Video size={16} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Google Meet</p>
                    <a
                      href={`https://${confirmedMeetLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {confirmedMeetLink}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="mt-5 w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
