import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPendingRole, clearPendingRole } from "@/lib/pending-role";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up listener FIRST, then read existing session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      // After OAuth (or any sign-in), claim the pending sitter role if requested.
      if (event === "SIGNED_IN" && nextSession) {
        const pending = getPendingRole();
        if (pending === "sitter") {
          // Defer to avoid running inside the auth callback
          setTimeout(() => {
            void claimSitterRole(nextSession.access_token).finally(() => {
              clearPendingRole();
              queryClient.invalidateQueries({ queryKey: ["is-sitter"] });
              queryClient.invalidateQueries({ queryKey: ["my-sitter"] });
            });
          }, 0);
        } else if (pending === "parent") {
          clearPendingRole();
        }
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

async function claimSitterRole(accessToken: string) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-sitter-role`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("claim-sitter-role failed:", res.status, text);
    }
  } catch (e) {
    console.error("claim-sitter-role error:", e);
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
