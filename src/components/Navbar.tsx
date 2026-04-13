import { Link } from "@tanstack/react-router";
import { Heart, Menu } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <button className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Sign Up
          </button>
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
          <button className="w-full rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            Sign Up
          </button>
        </div>
      )}
    </nav>
  );
}
