import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [
      { title: "Admin — TinyWatch" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { redirect: "/admin" }, replace: true });
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-md px-6 pt-32 text-center">
          <ShieldAlert size={36} className="mx-auto mb-3 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold text-foreground">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have permission to view this area.
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
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="mb-6 flex items-center gap-4 border-b border-border pb-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Admin</h1>
          <nav className="flex gap-2 text-sm">
            <Link
              to="/admin"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              Sitters
            </Link>
            <Link
              to="/admin/bookings"
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              Bookings
            </Link>
          </nav>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
