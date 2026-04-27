import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useIsSitter } from "@/hooks/use-is-sitter";

export const Route = createFileRoute("/sitter")({
  component: SitterLayout,
  head: () => ({
    meta: [
      { title: "Sitter Dashboard — TinyWatch" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function SitterLayout() {
  const { user, loading: authLoading } = useAuth();
  const { isSitter, isLoading: roleLoading } = useIsSitter();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/sitter" }, replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || roleLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32 text-muted-foreground">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (!isSitter) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-md px-6 pt-32 text-center">
          <ShieldAlert size={36} className="mx-auto mb-3 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold text-foreground">Sitters only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is for accounts registered as babysitters.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 pt-24 pb-16">
        <div className="mb-6 flex items-center gap-4 border-b border-border pb-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Sitter dashboard</h1>
          <nav className="flex gap-2 text-sm">
            <Link
              to="/sitter"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              My profile
            </Link>
            <Link
              to="/sitter/requests"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              Call requests
            </Link>
          </nav>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
