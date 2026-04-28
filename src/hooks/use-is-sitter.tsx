import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Returns whether the current user is a sitter.
 * A user counts as a sitter if EITHER:
 *   - they have the 'sitter' role in user_roles, OR
 *   - they own a row in the sitters table (linked via user_id)
 *
 * The fallback to the sitters table makes the check resilient to transient
 * backend errors on the user_roles query, and to historical accounts that
 * were provisioned before the role enum included 'sitter'.
 */
export function useIsSitter() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["is-sitter", user?.id],
    enabled: !!user,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    staleTime: 60_000,
    queryFn: async () => {
      if (!user) return false;

      // Run both checks in parallel — if either says yes, the user is a sitter.
      const [rolesRes, sitterRes] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "sitter")
          .maybeSingle(),
        supabase
          .from("sitters")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const hasRole = !rolesRes.error && !!rolesRes.data;
      const hasSitterRow = !sitterRes.error && !!sitterRes.data;

      // If both queries errored, surface the error so the caller can react.
      if (rolesRes.error && sitterRes.error) {
        throw rolesRes.error;
      }

      return hasRole || hasSitterRow;
    },
  });

  return { isSitter: data ?? false, isLoading, error, refetch };
}
