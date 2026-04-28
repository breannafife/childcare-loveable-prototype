import { Link } from "@tanstack/react-router";
import { Heart, Menu, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useIsSitter } from "@/hooks/use-is-sitter";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isSitter } = useIsSitter();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Heart size={18} fill="currentColor" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">TinyWatch</span>
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Find Sitters
          </Link>
          <Link to="/bookings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            My Bookings
          </Link>
          {isSitter && (
            <Link to="/sitter" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              My Sitter Profile
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Admin
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserIcon size={14} />
                {user.email?.split("@")[0]}
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground hover:bg-accent transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>

        <button
          className="sm:hidden text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu size={22} />
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-card px-6 py-4 sm:hidden space-y-3">
          <Link to="/" className="block text-sm font-medium text-muted-foreground">Find Sitters</Link>
          <Link to="/bookings" className="block text-sm font-medium text-muted-foreground">My Bookings</Link>
          {isSitter && (
            <Link to="/sitter" className="block text-sm font-medium text-primary">My Sitter Profile</Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="block text-sm font-medium text-primary">Admin</Link>
          )}
          {user ? (
            <button
              onClick={() => signOut()}
              className="w-full rounded-xl border border-border bg-card px-5 py-2 text-sm font-semibold text-card-foreground"
            >
              Sign out ({user.email?.split("@")[0]})
            </button>
          ) : (
            <Link
              to="/auth"
              className="block w-full rounded-xl bg-primary px-5 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
