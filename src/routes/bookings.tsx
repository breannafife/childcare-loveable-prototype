import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { GoogleConnectBanner } from "@/components/GoogleConnectBanner";
import { Video, Calendar, Clock, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";
import { fetchMyCalls, type ScheduledCall } from "@/lib/bookings-store";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
  head: () => ({
    meta: [
      { title: "My Bookings — TinyWatch" },
      { name: "description", content: "View your upcoming video calls and confirmed babysitter bookings." },
    ],
  }),
});

const statusColors: Record<string, string> = {
  Requested: "bg-warmth/15 text-warmth-foreground",
  Confirmed: "bg-trust/15 text-trust",
  Completed: "bg-muted text-muted-foreground",
};

function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/bookings" }, replace: true });
    }
  }, [user, authLoading, navigate]);

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ["my-calls"],
    queryFn: fetchMyCalls,
    enabled: !!user,
  });

  const upcomingCalls = calls.filter((c) => c.status !== "Completed");
  const pastCalls = calls.filter((c) => c.status === "Completed");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          Back to sitters
        </Link>

        <h1 className="font-display text-3xl font-bold text-foreground">My Bookings</h1>
        <p className="mt-1 mb-8 text-muted-foreground">Your scheduled calls and confirmed bookings</p>

        <GoogleConnectBanner audience="parent" />

        <section className="mt-2">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Video size={20} className="text-primary" />
            Upcoming Calls
          </h2>

          {authLoading || isLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-12 text-muted-foreground">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Loading…
            </div>
          ) : upcomingCalls.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card py-12 text-center">
              <Video size={32} className="mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No upcoming calls yet</p>
              <Link to="/" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
                Browse sitters
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingCalls.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Confirmed Bookings
          </h2>
          <div className="rounded-2xl border border-border bg-card py-12 text-center">
            <Calendar size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">No confirmed bookings yet</p>
          </div>
        </section>

        {pastCalls.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">Past Calls</h2>
            <div className="space-y-4">
              {pastCalls.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function CallCard({ call }: { call: ScheduledCall }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <img
        src={call.sitterPhoto}
        alt={call.sitterName}
        className="h-14 w-14 rounded-xl object-cover"
        loading="lazy"
        width={56}
        height={56}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-display font-semibold text-card-foreground">{call.sitterName}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[call.status]}`}>
            {call.status}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {call.label}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            15 min
          </span>
        </div>
        <a
          href={`https://${call.meetLink}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Video size={12} />
          {call.meetLink}
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}
