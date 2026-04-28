// Persists the role chosen on /auth across an OAuth redirect.
// Google OAuth strips custom data, so we stash it in localStorage and read it
// back after the SIGNED_IN event fires post-callback.

const KEY = "tinywatch.pendingRole";

export type PendingRole = "parent" | "sitter";

export function setPendingRole(role: PendingRole) {
  try {
    localStorage.setItem(KEY, role);
  } catch {
    /* ignore */
  }
}

export function getPendingRole(): PendingRole | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "sitter" || v === "parent" ? v : null;
  } catch {
    return null;
  }
}

export function clearPendingRole() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
