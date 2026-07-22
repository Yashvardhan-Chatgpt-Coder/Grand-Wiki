import { useCallback, useEffect, useState } from "react";
import {
  authApi,
  getStoredUser,
  clearStoredUser,
  getUserInitials,
  persistUser,
  type ApiUser,
} from "@/lib/api";

export function useCurrentUser(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await authApi.getProfile();
      persistUser(profile);
      setUser(profile);
    } catch {
      clearStoredUser();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    setUser(getStoredUser());
    refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;
    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ApiUser>).detail;
      if (detail) setUser(detail);
      else setUser(getStoredUser());
    };
    window.addEventListener("esports:user-updated", onUpdated);
    return () => window.removeEventListener("esports:user-updated", onUpdated);
  }, [enabled]);

  const displayName = user?.name?.trim() || "";
  const initials = getUserInitials(displayName);
  const avatarUrl = user?.avatar?.trim() || null;
  const organization = user?.organization?.name?.trim() || "LSPD";

  return {
    user,
    loading,
    displayName,
    initials,
    avatarUrl,
    organization,
    refresh,
  };
}
