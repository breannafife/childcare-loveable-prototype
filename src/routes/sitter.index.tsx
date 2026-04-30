import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader2, Save, BadgeCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchMySitter, type SitterRow } from "@/lib/sitters";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/sitter/")({
  component: SitterProfileEditor,
});

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SitterProfileEditor() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: sitter, isLoading } = useQuery({
    queryKey: ["my-sitter", user?.id],
    enabled: !!user,
    queryFn: () => fetchMySitter(user!.id),
  });

  const [draft, setDraft] = useState<Partial<SitterRow>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("sitter-photos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("sitter-photos").getPublicUrl(path);
      setDraft((d) => ({ ...d, photo_url: pub.publicUrl }));
      toast.success("Photo uploaded — click Save to publish");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (sitter) {
      setDraft({
        name: sitter.name,
        bio: sitter.bio,
        photo_url: sitter.photo_url,
        hourly_rate: sitter.hourly_rate,
        postal_code: sitter.postal_code,
        years_experience: sitter.years_experience,
        availability: sitter.availability,
        experience_tags: sitter.experience_tags,
        certifications: sitter.certifications,
      });
    }
  }, [sitter]);

  const save = useMutation({
    mutationFn: async () => {
      if (!sitter) throw new Error("No sitter row");
      const { error } = await supabase
        .from("sitters")
        .update(draft)
        .eq("id", sitter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["my-sitter"] });
      qc.invalidateQueries({ queryKey: ["sitters"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={18} className="mr-2 animate-spin" /> Loading your profile…
      </div>
    );
  }

  if (!sitter) {
    return (
      <div className="rounded-2xl border border-border bg-card py-12 text-center text-muted-foreground">
        We couldn't find your sitter profile. Contact support if you signed up as a sitter.
      </div>
    );
  }

  function toggleDay(day: string) {
    const current = draft.availability ?? [];
    setDraft({
      ...draft,
      availability: current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
        <img
          src={draft.photo_url || "/placeholder.svg"}
          alt={draft.name ?? "Sitter"}
          className="h-20 w-20 rounded-2xl object-cover"
        />
        <div className="flex-1">
          <p className="font-display text-lg font-semibold text-card-foreground">{draft.name || "Unnamed sitter"}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck size={13} className="text-trust" /> Verified
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <Field label="Display name">
          <input
            value={draft.name ?? ""}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Photo URL">
          <input
            value={draft.photo_url ?? ""}
            onChange={(e) => setDraft({ ...draft, photo_url: e.target.value })}
            className="input"
            placeholder="https://…"
          />
        </Field>
        <Field label="Postal code">
          <input
            value={draft.postal_code ?? ""}
            onChange={(e) => setDraft({ ...draft, postal_code: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Hourly rate ($)">
          <input
            type="number"
            value={draft.hourly_rate ?? 0}
            onChange={(e) => setDraft({ ...draft, hourly_rate: Number(e.target.value) })}
            className="input"
          />
        </Field>
        <Field label="Years experience">
          <input
            type="number"
            value={draft.years_experience ?? 0}
            onChange={(e) => setDraft({ ...draft, years_experience: Number(e.target.value) })}
            className="input"
          />
        </Field>
        <Field label="Bio" wide>
          <textarea
            value={draft.bio ?? ""}
            onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
            rows={4}
            className="input resize-none"
            placeholder="Tell families about yourself…"
          />
        </Field>

        <Field label="Availability" wide>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const active = (draft.availability ?? []).includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Experience tags (comma-separated)" wide>
          <input
            value={(draft.experience_tags ?? []).join(", ")}
            onChange={(e) =>
              setDraft({
                ...draft,
                experience_tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="input"
            placeholder="Newborns, Toddlers, Special needs"
          />
        </Field>

        <Field label="Certifications (comma-separated)" wide>
          <input
            value={(draft.certifications ?? []).join(", ")}
            onChange={(e) =>
              setDraft({
                ...draft,
                certifications: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="input"
            placeholder="CPR, First Aid, Early Childhood Ed"
          />
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save changes
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          outline: none;
        }
        .input:focus { border-color: hsl(var(--primary)); }
      `}</style>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
