import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookings,
});

interface AdminCall {
  id: string;
  user_id: string;
  sitter_name: string;
  sitter_photo: string;
  slot_label: string;
  status: string;
  meet_link: string;
  created_at: string;
}

function AdminBookings() {
  const { data: calls = [], isLoading } = useQuery({
    queryKey: ["admin-calls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_calls")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminCall[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={18} className="mr-2 animate-spin" /> Loading bookings…
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-foreground">All scheduled calls</h2>
      <p className="mb-4 text-sm text-muted-foreground">{calls.length} total across all parents</p>

      {calls.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-12 text-center text-muted-foreground">
          No bookings yet.
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((c) => (
            <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <img src={c.sitter_photo} alt={c.sitter_name} className="h-12 w-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-display font-semibold text-card-foreground">{c.sitter_name}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {c.status}
                  </span>
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar size={11} /> {c.slot_label}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Video size={11} /> {c.meet_link}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">
                  parent: {c.user_id.slice(0, 8)}…
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
