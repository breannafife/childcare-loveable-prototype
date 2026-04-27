import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, Clock, Calendar, CheckCircle, ExternalLink, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateWeekSlots, scheduleCall, fetchMyCalls, type TimeSlot } from "@/lib/bookings-store";
import { useAuth } from "@/hooks/use-auth";

interface ScheduleCallSheetProps {
  open: boolean;
  onClose: () => void;
  sitterId: string;
  sitterName: string;
  sitterPhoto: string;
}

type Step = "select" | "confirmed";

export function ScheduleCallSheet({ open, onClose, sitterId, sitterName, sitterPhoto }: ScheduleCallSheetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("select");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [confirmedMeetLink, setConfirmedMeetLink] = useState("");
  const [confirmedLabel, setConfirmedLabel] = useState("");

  const slots = useMemo(() => generateWeekSlots(), []);
  const slotsByDay = useMemo(() => {
    const grouped: Record<string, TimeSlot[]> = {};
    for (const s of slots) {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    }
    return grouped;
  }, [slots]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedSlot) throw new Error("Pick a time first.");
      return scheduleCall({ sitterId, sitterName, sitterPhoto, slot: selectedSlot });
    },
    onSuccess: (call) => {
      setConfirmedMeetLink(call.meetLink);
      setConfirmedLabel(call.label);
      setStep("confirmed");
      qc.invalidateQueries({ queryKey: ["my-calls"] });
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

  function handleClose() {
    setStep("select");
    setSelectedSlot(null);
    onClose();
  }

  if (!open) return null;

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

              {Object.entries(slotsByDay).map(([day, daySlots]) => (
                <div key={day} className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {daySlots.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
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
                            {slot.block}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                onClick={handleConfirm}
                disabled={!selectedSlot || mutation.isPending}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {user ? "Confirm call" : "Sign in to confirm"}
              </button>
            </div>
          ) : (
            <div className="px-6 pb-8">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-trust/15">
                  <CheckCircle size={28} className="text-trust" />
                </div>
                <p className="text-sm text-muted-foreground">Your call has been requested</p>
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
