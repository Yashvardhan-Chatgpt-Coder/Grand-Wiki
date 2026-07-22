import { useCallback, useEffect, useState } from "react";
import { getUserInitials } from "@/lib/api";

// LocalStorage user data structure for public users
export interface LocalUser {
  name: string;
  organization: string;
  inGameId: string;
  badgeNumber: string;
  appearanceMode?: "system" | "light" | "dark";
}

const LOCAL_USER_KEY = "grandwiki_user_preferences";

function getLocalUser(): LocalUser {
  if (typeof window === "undefined") {
    return {
      name: "",
      organization: "LSPD",
      inGameId: "",
      badgeNumber: "",
      appearanceMode: "light"
    };
  }
  
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) {
      // Return defaults with light mode
      return {
        name: "",
        organization: "LSPD",
        inGameId: "",
        badgeNumber: "",
        appearanceMode: "light"
      };
    }
    return JSON.parse(raw) as LocalUser;
  } catch {
    return {
      name: "",
      organization: "LSPD",
      inGameId: "",
      badgeNumber: "",
      appearanceMode: "light"
    };
  }
}

function saveLocalUser(user: LocalUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("grandwiki:user-updated", { detail: user }));
}

export function useCurrentUser(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [user, setUser] = useState<LocalUser>(getLocalUser());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!enabled) return;
    setUser(getLocalUser());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    setUser(getLocalUser());
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<LocalUser>).detail;
      if (detail) setUser(detail);
      else setUser(getLocalUser());
    };
    window.addEventListener("grandwiki:user-updated", onUpdated);
    return () => window.removeEventListener("grandwiki:user-updated", onUpdated);
  }, [enabled]);

  const displayName = user.name.trim() || "User";
  const initials = getUserInitials(displayName);
  const avatarUrl = null; // No avatar for public users
  const organization = user.organization.trim() || "LSPD";

  return {
    user,
    loading,
    displayName,
    initials,
    avatarUrl,
    organization,
    inGameId: user.inGameId,
    badgeNumber: user.badgeNumber,
    refresh,
    updateUser: saveLocalUser,
  };
}
