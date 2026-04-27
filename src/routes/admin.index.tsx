import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Save, BadgeCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchSitters, type SitterRow } from "@/lib/sitters";

export const Route = createFileRoute("/admin/")({
  component: AdminSitters,
});

function AdminSitters() {
  const { data: sitters = [], isLoading } = useQuery({
    queryKey: ["admin-sitters"],
    queryFn: fetchSitters,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={18} className="mr-2 animate-spin" /> Loading sitters…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Sitter catalog</h2>
          <p className="text-sm text-muted-foreground">{sitters.length} sitters in the directory</p>
        </div>
      </div>

      <div className="space-y-3">
        {sitters.map((sitter) => (
          <SitterRowEditor key={sitter.id} sitter={sitter} />
        ))}
      </div>
    </div>
  );
}

function SitterRowEditor({ sitter }: { sitter: SitterRow }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState({
    hourly_rate: sitter.hourly_rate,
    postal_code: sitter.postal_code,
    is_verified: sitter.is_verified,
  });

  const dirty =
    draft.hourly_rate !== sitter.hourly_rate ||
    draft.postal_code !== sitter.postal_code ||
    draft.is_verified !== sitter.is_verified;

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("sitters")
        .update({
          hourly_rate: draft.hourly_rate,
          postal_code: draft.postal_code,
          is_verified: draft.is_verified,
        })
        .eq("id", sitter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${sitter.name} updated`);
      qc.invalidateQueries({ queryKey: ["admin-sitters"] });
      qc.invalidateQueries({ queryKey: ["sitters"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <img src={sitter.photo_url} alt={sitter.name} className="h-12 w-12 rounded-xl object-cover" />
      <div className="min-w-[140px] flex-1">
        <p className="font-display font-semibold text-card-foreground">{sitter.name}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Star size={11} className="fill-warmth text-warmth" /> {sitter.rating} · {sitter.years_experience}y exp
        </p>
      </div>

      <label className="flex flex-col text-xs text-muted-foreground">
        Postal code
        <input
          value={draft.postal_code}
          onChange={(e) => setDraft({ ...draft, postal_code: e.target.value })}
          className="mt-1 w-28 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
        />
      </label>

      <label className="flex flex-col text-xs text-muted-foreground">
        Hourly rate
        <input
          type="number"
          value={draft.hourly_rate}
          onChange={(e) => setDraft({ ...draft, hourly_rate: Number(e.target.value) })}
          className="mt-1 w-24 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
        />
      </label>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.is_verified}
          onChange={(e) => setDraft({ ...draft, is_verified: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
        <span className="flex items-center gap-1 text-card-foreground">
          <BadgeCheck size={14} className="text-trust" />
          Verified
        </span>
      </label>

      <button
        disabled={!dirty || save.isPending}
        onClick={() => save.mutate()}
        className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
      >
        {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save
      </button>
    </div>
  );
}
