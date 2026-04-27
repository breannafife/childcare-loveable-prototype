import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sitter/requests")({
  component: SitterRequests,
});

interface CallRow {
  id: string;
  slot_label: string;
  status: string;
  meet_link: string;
  created_at: string;
  user_id: string;
}

function SitterRequests() {
  const { data: calls = [], isLoading } = useQuery({
    queryKey: ["sitter-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_calls")
        .select("id, slot_label, status, meet_link, created_at, user_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CallRow[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={18} className="mr-2 animate-spin" /> Loading requests…
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-foreground">Incoming call requests</h2>
      <p className="mb-4 text-sm text-muted-foreground">{calls.length} families have scheduled with you</p>

      {calls.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-12 text-center text-muted-foreground">
          No requests yet. They'll show up here when a parent books a video intro.
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {c.status}
                </span>
                <p className="font-mono text-[10px] text-muted-foreground/70">
                  parent: {c.user_id.slice(0, 8)}…
                </p>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-card-foreground">
                <Calendar size={13} /> {c.slot_label}
              </p>
              <a
                href={`https://${c.meet_link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Video size={11} /> {c.meet_link}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
