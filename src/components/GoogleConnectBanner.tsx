import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useSearch } from "@tanstack/react-router";
import { Link2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getMyGoogleConnection, disconnectGoogle } from "@/server/google-calendar.functions";

interface Props {
  /** When true, copy emphasises sitter-side reasons. */
  audience?: "parent" | "sitter";
}

/**
 * Inline banner that lets the signed-in user connect/disconnect their Google
 * Calendar. Shows toast feedback when redirected back from the OAuth callback.
 */
export function GoogleConnectBanner({ audience = "parent" }: Props) {
  const { user, session } = useAuth();
  const qc = useQueryClient();
  const search = useSearch({ strict: false }) as Record<string, string | undefined>;

  const getMyGoogleConnectionFn = useServerFn(getMyGoogleConnection);
  const disconnectGoogleFn = useServerFn(disconnectGoogle);

  const conn = useQuery({
    queryKey: ["my-google-connection", user?.id],
    enabled: !!user,
    queryFn: () => getMyGoogleConnectionFn(),
  });

  const disconnectMut = useMutation({
    mutationFn: () => disconnectGoogleFn(),
    onSuccess: () => {
      toast.success("Google Calendar disconnected");
      qc.invalidateQueries({ queryKey: ["my-google-connection"] });
    },
    onError: () => toast.error("Couldn't disconnect — try again"),
  });

  // Toast based on ?google=connected or google_error from the OAuth callback.
  useEffect(() => {
    if (search.google === "connected") {
      toast.success("Google Calendar connected");
      qc.invalidateQueries({ queryKey: ["my-google-connection"] });
    } else if (search.google_error) {
      const messages: Record<string, string> = {
        access_denied: "You declined the Google permissions.",
        missing_refresh_token:
          "Google didn't return a refresh token. Revoke TinyWatch in your Google account settings, then try connecting again.",
        storage_failed: "We couldn't save your Google connection. Try again.",
      };
      toast.error(messages[search.google_error] ?? `Google error: ${search.google_error}`);
    }
    // We intentionally only react when the search keys change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.google, search.google_error]);

  if (!user) return null;

  function handleConnect() {
    if (!session) return;
    const redirect = window.location.pathname;
    window.location.href = `/api/public/google/oauth/start?token=${encodeURIComponent(
      session.access_token,
    )}&redirect=${encodeURIComponent(redirect)}`;
  }

  if (conn.isLoading) return null;

  if (conn.data?.connected) {
    return (
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-trust/30 bg-trust/5 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <CheckCircle2 size={18} className="text-trust flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">
              Google Calendar connected
            </p>
            <p className="text-xs text-muted-foreground truncate">{conn.data.email}</p>
          </div>
        </div>
        <button
          onClick={() => disconnectMut.mutate()}
          disabled={disconnectMut.isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
        >
          <X size={12} />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <Link2 size={18} className="mt-0.5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-card-foreground">
          Connect your Google Calendar
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {audience === "sitter"
            ? "Parents can only book intro calls when your calendar is connected. Meet links are created automatically."
            : "We'll check your availability and add Meet events to your calendar automatically."}
        </p>
      </div>
      <button
        onClick={handleConnect}
        className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 flex-shrink-0"
      >
        Connect
      </button>
    </div>
  );
}
