/**
 * API service layer for communicating with the backend.
 */

import type { GameFormat, ScoringFieldKey } from "@/lib/tournament-formats";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

const ONLINE_ROUTE_PREFIXES = ["/auth", "/donations", "/admin", "/support", "/notifications"];

function shouldUseOffline(path: string): boolean {
  if (import.meta.env.VITE_OFFLINE_MODE === "false") return false;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return !ONLINE_ROUTE_PREFIXES.some((prefix) => cleanPath.startsWith(prefix));
}

const DEFAULT_GAMES: ApiCatalogGame[] = [
  { _id: "bgmi-id", name: "BGMI", maps: ["Erangel", "Miramar", "Sanhok", "Vikendi"], modes: ["Squad", "Duo", "Solo"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: "valorant-id", name: "Valorant", maps: ["Bind", "Haven", "Split", "Ascent", "Icebox", "Breeze", "Fracture", "Pearl", "Lotus", "Sunset"], modes: ["Standard", "Spike Rush", "Deathmatch"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: "freefire-id", name: "Free Fire", maps: ["Bermuda", "Purgatory", "Kalahari", "Alpine"], modes: ["Squad", "Duo", "Solo"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const DEFAULT_RULES: ApiScoringRule[] = [
  {
    _id: "rule-1",
    name: "Standard BGMI Points Table",
    format: "Squad",
    gameName: "BGMI",
    isGeneric: false,
    killPoints: 1,
    placementPoints: {
      "1": 15, "2": 12, "3": 10, "4": 8, "5": 6, "6": 4, "7": 2, "8": 1, "9": 1, "10": 1, "11": 0, "12": 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_TEAMS: ApiTeam[] = [
  { _id: "team-1", name: "Team Soul", tags: ["BGMI", "Esports"], players: [{ playerId: "p1", name: "Mortal" }, { playerId: "p2", name: "Viper" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: "team-2", name: "GodLike Esports", tags: ["BGMI"], players: [{ playerId: "p3", name: "Jonathan" }, { playerId: "p4", name: "Neyo" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: "team-3", name: "Global Esports", tags: ["Valorant"], players: [{ playerId: "p5", name: "Skrossi" }, { playerId: "p6", name: "Lightningfast" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const DEFAULT_EVENTS: ApiEvent[] = [
  {
    _id: "event-1",
    name: "Grand Esports BGMI Championship",
    game: "BGMI",
    format: "Squad",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    status: "Ongoing",
    scoringRuleId: "rule-1",
    teams: ["team-1", "team-2"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_MATCHES: ApiMatch[] = [
  { _id: "match-1", eventId: "event-1", name: "Match 1", map: "Erangel", status: "Pending Results", order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const DEFAULT_RESULTS: ApiMatchResult[] = [];


function getLocalItem<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function setLocalItem<T>(key: string, val: T): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(val));
  }
}

function getStorageArray<T>(key: string, defaults: T[]): T[] {
  return getLocalItem<T[]>(key, defaults);
}

function saveStorageArray<T>(key: string, arr: T[]): void {
  setLocalItem(key, arr);
}

async function handleOfflineRequest<T>(path: string, options: RequestInit): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const parts = cleanPath.split("?");
  const pathname = parts[0];
  const searchParams = new URLSearchParams(parts[1] || "");
  
  let body: any = {};
  if (options.body && typeof options.body === "string") {
    try {
      body = JSON.parse(options.body);
    } catch {}
  } else if (options.body instanceof FormData) {
    const fd = options.body;
    fd.forEach((value, key) => {
      if (key === "players" || key === "tags" || key === "organization" || key === "integrations") {
        try {
          body[key] = JSON.parse(value as string);
        } catch {
          body[key] = value;
        }
      } else {
        body[key] = value;
      }
    });
  }

  // 1. Auth Profile
  if (pathname === "/auth/profile") {
    if (method === "GET") {
      const rawUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (!rawUser) {
        throw new Error("Unauthorized - No active user session.");
      }
      const user = JSON.parse(rawUser) as ApiUser;
      if (user.email?.toLowerCase().includes("admin")) {
        user.role = "admin" as any;
      }
      return user as unknown as T;
    }
    if (method === "PUT") {
      const rawUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (!rawUser) {
        throw new Error("Unauthorized - No active user session.");
      }
      const existingUser = JSON.parse(rawUser) as ApiUser;
      const { inGameScreenshot, ...profileData } = body;
      const updatedUser: ApiUser = {
        ...existingUser,
        ...profileData,
        ...(inGameScreenshot
          ? {
              inGameScreenshotUrl: existingUser.inGameScreenshotUrl || "offline-uploaded-proof",
              approvalStatus: "pending" as const,
            }
          : {}),
      };
      setLocalItem("user", updatedUser);
      window.dispatchEvent(new CustomEvent("esports:user-updated", { detail: updatedUser }));
      return updatedUser as unknown as T;
    }
  }

  // 2. Auth Login / Register / Logout
  if (pathname === "/auth/login") {
    const loginEmail = (body.email || "").trim().toLowerCase();
    const loginPassword = body.password || "";

    if (!loginEmail || !loginPassword) {
      throw new Error("Email and password are required.");
    }

    // Admin bypass
    const isAdmin = loginEmail === "admin@grandwiki.com";
    if (isAdmin) {
      const adminUser: ApiUser = {
        _id: "admin-user-id",
        name: "Administrator",
        email: "admin@grandwiki.com",
        role: "admin",
        approvalStatus: "approved",
        appearanceMode: "light",
        token: "admin-token-session"
      };
      persistUser(adminUser);
      return adminUser as unknown as T;
    }

    // Check registered users in localStorage
    const registeredUsers: Array<{ email: string; password: string; name: string; _id: string; role: string; approvalStatus: string; appearanceMode: string }> =
      getLocalItem("esports_registered_users", []);
    const matchedUser = registeredUsers.find((u) => u.email.toLowerCase() === loginEmail);

    if (!matchedUser) {
      throw new Error("No account found with this email address.");
    }

    if (matchedUser.password !== loginPassword) {
      throw new Error("Invalid email or password.");
    }

    const loggedInUser: ApiUser = {
      _id: matchedUser._id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: (matchedUser.role || "organizer") as ApiUser["role"],
      approvalStatus: (matchedUser.approvalStatus || "not_submitted") as ApiUser["approvalStatus"],
      appearanceMode: (matchedUser.appearanceMode || "light") as ApiUser["appearanceMode"],
      token: `token-${Date.now()}`
    };
    persistUser(loggedInUser);
    return loggedInUser as unknown as T;
  }
  if (pathname === "/auth/register") {
    const regEmail = (body.email || "").trim().toLowerCase();
    const regName = (body.name || "User").trim();
    const regPassword = body.password || "";
    const userId = `usr-${Date.now()}`;

    // Persist to registered users list for login lookup
    const registeredUsers = getLocalItem<Array<Record<string, string>>>("esports_registered_users", []);
    const alreadyExists = registeredUsers.some((u) => u.email?.toLowerCase() === regEmail);
    if (alreadyExists) {
      throw new Error("An account with this email already exists.");
    }
    registeredUsers.push({
      _id: userId,
      name: regName,
      email: regEmail,
      password: regPassword,
      role: "organizer",
      approvalStatus: "not_submitted",
      appearanceMode: "light",
    });
    setLocalItem("esports_registered_users", registeredUsers);

    const registeredUser: ApiUser = {
      _id: userId,
      name: regName,
      email: regEmail,
      role: "organizer",
      approvalStatus: "not_submitted",
      appearanceMode: "light",
      token: `token-${Date.now()}`
    };
    persistUser(registeredUser);
    return registeredUser as unknown as T;
  }
  if (pathname === "/auth/logout") {
    clearStoredUser();
    return { message: "Logged out successfully" } as unknown as T;
  }
  if (pathname === "/auth/send-otp") {
    return { message: "OTP sent successfully" } as unknown as T;
  }
  if (pathname === "/auth/password") {
    return { message: "Password updated successfully" } as unknown as T;
  }

  // 3. Catalog Games
  if (pathname === "/catalog/games") {
    return DEFAULT_GAMES as unknown as T;
  }

  // 4. Teams API
  if (pathname === "/teams") {
    const teams = getStorageArray<ApiTeam>("esports_teams", DEFAULT_TEAMS);
    if (method === "GET") {
      return teams as unknown as T;
    }
    if (method === "POST") {
      const newTeam: ApiTeam = {
        _id: `team-${Date.now()}`,
        name: body.name,
        tags: body.tags || [],
        contactMobile: body.contactMobile || "",
        notes: body.notes || "",
        players: body.players || [],
        isPoolTeam: body.isPoolTeam !== undefined ? body.isPoolTeam : true,
        source: body.source || "pool",
        sourceEventId: body.sourceEventId || null,
        sourceEventName: body.sourceEventName || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (body.logo) {
        newTeam.logoUrl = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=120&q=80";
      }
      teams.push(newTeam);
      saveStorageArray("esports_teams", teams);
      return newTeam as unknown as T;
    }
  }
  if (pathname.startsWith("/teams/")) {
    const parts = pathname.split("/");
    const teamId = parts[2];
    const teams = getStorageArray<ApiTeam>("esports_teams", DEFAULT_TEAMS);
    const index = teams.findIndex(t => t._id === teamId);
    
    if (method === "GET") {
      return teams[index] as unknown as T;
    }
    if (method === "PUT") {
      if (index !== -1) {
        const updated = { ...teams[index], ...body, updatedAt: new Date().toISOString() };
        teams[index] = updated;
        saveStorageArray("esports_teams", teams);
        return updated as unknown as T;
      }
    }
    if (method === "DELETE") {
      if (index !== -1) {
        teams.splice(index, 1);
        saveStorageArray("esports_teams", teams);
        return { message: "Deleted" } as unknown as T;
      }
    }
  }

  // 5. Events API
  if (pathname === "/events") {
    const events = getStorageArray<ApiEvent>("esports_events", DEFAULT_EVENTS);
    if (method === "GET") {
      const teams = getStorageArray<ApiTeam>("esports_teams", DEFAULT_TEAMS);
      const resolved = events.map(e => ({
        ...e,
        teams: e.teams.map(tid => teams.find(t => t._id === tid) || tid)
      }));
      return resolved as unknown as T;
    }
    if (method === "POST") {
      const newEvent: ApiEvent = {
        _id: `event-${Date.now()}`,
        name: body.name,
        gameId: body.gameId || null,
        game: body.game,
        format: body.format,
        startDate: body.startDate || new Date().toISOString(),
        endDate: body.endDate || new Date().toISOString(),
        status: body.status || "Draft",
        scoringRuleId: body.scoringRuleId || null,
        teams: body.teams || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      events.push(newEvent);
      saveStorageArray("esports_events", events);
      return newEvent as unknown as T;
    }
  }

  if (pathname === "/events/setup") {
    const events = getStorageArray<ApiEvent>("esports_events", DEFAULT_EVENTS);
    const rules = getStorageArray<ApiScoringRule>("esports_scoring_rules", DEFAULT_RULES);
    const teams = getStorageArray<ApiTeam>("esports_teams", DEFAULT_TEAMS);

    const ruleId = `rule-${Date.now()}`;
    const newRule: ApiScoringRule = {
      _id: ruleId,
      ...body.scoringRule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    rules.push(newRule);
    saveStorageArray("esports_scoring_rules", rules);

    const createdTeamIds: string[] = [];
    if (body.teams && Array.isArray(body.teams)) {
      body.teams.forEach((t: any, idx: number) => {
        const teamId = t.id || `team-${Date.now()}-${idx}`;
        createdTeamIds.push(teamId);
        const exists = teams.some(team => team._id === teamId);
        if (!exists) {
          const playersList = Array.isArray(t.players) ? t.players.map((pname: string, pidx: number) => ({
            playerId: `player-${Date.now()}-${idx}-${pidx}`,
            name: pname
          })) : [];
          
          teams.push({
            _id: teamId,
            name: t.name || `Team ${idx + 1}`,
            logoUrl: t.logo || null,
            tags: t.tags || [],
            players: playersList,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      });
      saveStorageArray("esports_teams", teams);
    }

    const newEvent: ApiEvent = {
      _id: `event-${Date.now()}`,
      ...body.event,
      scoringRuleId: ruleId,
      teams: createdTeamIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    events.push(newEvent);
    saveStorageArray("esports_events", events);

    return newEvent as unknown as T;
  }

  if (pathname.startsWith("/events/")) {
    const parts = pathname.split("/");
    const eventId = parts[2];
    const events = getStorageArray<ApiEvent>("esports_events", DEFAULT_EVENTS);
    const index = events.findIndex(e => e._id === eventId);

    if (method === "GET") {
      const e = events[index];
      if (e) {
        const teams = getStorageArray<ApiTeam>("esports_teams", DEFAULT_TEAMS);
        const resolved = {
          ...e,
          teams: e.teams.map(tid => teams.find(t => t._id === tid) || tid)
        };
        return resolved as unknown as T;
      }
    }
    if (method === "PUT") {
      if (index !== -1) {
        const updated = { ...events[index], ...body, updatedAt: new Date().toISOString() };
        events[index] = updated;
        saveStorageArray("esports_events", events);
        return updated as unknown as T;
      }
    }
    if (method === "DELETE") {
      if (index !== -1) {
        events.splice(index, 1);
        saveStorageArray("esports_events", events);
        return { message: "Deleted" } as unknown as T;
      }
    }
  }

  // 6. Scoring Rules API
  if (pathname === "/scoring-rules") {
    const rules = getStorageArray<ApiScoringRule>("esports_scoring_rules", DEFAULT_RULES);
    if (method === "GET") {
      return rules as unknown as T;
    }
    if (method === "POST") {
      const newRule: ApiScoringRule = {
        _id: `rule-${Date.now()}`,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      rules.push(newRule);
      saveStorageArray("esports_scoring_rules", rules);
      return newRule as unknown as T;
    }
  }
  if (pathname.startsWith("/scoring-rules/")) {
    const parts = pathname.split("/");
    const ruleId = parts[2];
    const rules = getStorageArray<ApiScoringRule>("esports_scoring_rules", DEFAULT_RULES);
    const index = rules.findIndex(r => r._id === ruleId);

    if (pathname.endsWith("/usage")) {
      const events = getStorageArray<ApiEvent>("esports_events", DEFAULT_EVENTS);
      const count = events.filter(e => e.scoringRuleId === ruleId).length;
      return { eventCount: count } as unknown as T;
    }

    if (method === "GET") {
      return rules[index] as unknown as T;
    }
    if (method === "PUT") {
      if (index !== -1) {
        const updated = { ...rules[index], ...body, updatedAt: new Date().toISOString() };
        rules[index] = updated;
        saveStorageArray("esports_scoring_rules", rules);
        return updated as unknown as T;
      }
    }
    if (method === "DELETE") {
      if (index !== -1) {
        rules.splice(index, 1);
        saveStorageArray("esports_scoring_rules", rules);
        return { message: "Deleted" } as unknown as T;
      }
    }
  }

  // 7. Matches API
  if (pathname === "/matches") {
    const matches = getStorageArray<ApiMatch>("esports_matches", DEFAULT_MATCHES);
    if (method === "POST") {
      const newMatch: ApiMatch = {
        _id: `match-${Date.now()}`,
        eventId: body.eventId,
        name: body.name,
        map: body.map || "",
        status: "Pending Results",
        order: body.order ?? matches.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      matches.push(newMatch);
      saveStorageArray("esports_matches", matches);
      return newMatch as unknown as T;
    }
  }
  if (pathname.startsWith("/matches/event/")) {
    const parts = pathname.split("/");
    const eventId = parts[3];
    const isLeaderboard = parts[4] === "leaderboard";
    const isStandings = parts[4] === "standings";

    const matches = getStorageArray<ApiMatch>("esports_matches", DEFAULT_MATCHES);
    const eventMatches = matches.filter(m => m.eventId === eventId);

    if (isLeaderboard) {
      const events = getStorageArray<ApiEvent>("esports_events", DEFAULT_EVENTS);
      const event = events.find(e => e._id === eventId);
      const rules = getStorageArray<ApiScoringRule>("esports_scoring_rules", DEFAULT_RULES);
      const rule = rules.find(r => r._id === event?.scoringRuleId);
      
      const allResults = getStorageArray<ApiMatchResult>("esports_match_results", DEFAULT_RESULTS);
      const teams = getStorageArray<ApiTeam>("esports_teams", DEFAULT_TEAMS);

      const resolvedTeams = event?.teams.map(tid => teams.find(t => t._id === tid) || tid).filter((t): t is ApiTeam => typeof t !== "string") || [];

      const leaderboardMap = new Map<string, ApiLeaderboardRow>();
      resolvedTeams.forEach(team => {
        leaderboardMap.set(team._id, {
          rank: 1,
          team,
          totalMatches: 0,
          totalKills: 0,
          positionPoints: 0,
          killPoints: 0,
          totalPoints: 0,
          wwcd: 0
        });
      });

      eventMatches.forEach(m => {
        if (m.status === "Completed") {
          const matchResults = allResults.filter(r => r.matchId === m._id);
          matchResults.forEach(r => {
            const teamId = typeof r.teamId === "string" ? r.teamId : r.teamId._id;
            const entry = leaderboardMap.get(teamId);
            if (entry) {
              entry.totalMatches += 1;
              entry.totalKills += r.kills;
              const killPts = r.kills * (rule?.killPoints ?? 1);
              const posPts = rule?.placementPoints[String(r.placement)] ?? 0;
              entry.killPoints += killPts;
              entry.positionPoints += posPts;
              entry.totalPoints += (killPts + posPts);
              if (r.placement === 1) {
                entry.wwcd += 1;
              }
            }
          });
        }
      });

      const boardRows = Array.from(leaderboardMap.values());
      boardRows.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.killPoints !== a.killPoints) return b.killPoints - a.killPoints;
        if (b.wwcd !== a.wwcd) return b.wwcd - a.wwcd;
        return b.totalKills - a.totalKills;
      });

      boardRows.forEach((row, idx) => {
        row.rank = idx + 1;
      });

      return boardRows as unknown as T;
    }

    if (isStandings) {
      const type = searchParams.get("type") || "points";
      const view = searchParams.get("view") || "till-match";
      const matchNumber = Number(searchParams.get("matchNumber") || "1");

      const events = getStorageArray<ApiEvent>("esports_events", DEFAULT_EVENTS);
      const event = events.find(e => e._id === eventId);
      const rules = getStorageArray<ApiScoringRule>("esports_scoring_rules", DEFAULT_RULES);
      const rule = rules.find(r => r._id === event?.scoringRuleId);
      
      const allResults = getStorageArray<ApiMatchResult>("esports_match_results", DEFAULT_RESULTS);
      const teams = getStorageArray<ApiTeam>("esports_teams", DEFAULT_TEAMS);

      const resolvedTeams = event?.teams.map(tid => teams.find(t => t._id === tid) || tid).filter((t): t is ApiTeam => typeof t !== "string") || [];

      const sortedMatches = [...eventMatches].sort((a, b) => a.order - b.order);
      const targetMatches = view === "single-match" 
        ? [sortedMatches[matchNumber - 1]].filter(Boolean)
        : sortedMatches.slice(0, matchNumber);

      if (type === "points") {
        const stats = new Map<string, { matches: number; wins: number; killPoints: number; posPoints: number }>();
        resolvedTeams.forEach(t => {
          stats.set(t._id, { matches: 0, wins: 0, killPoints: 0, posPoints: 0 });
        });

        targetMatches.forEach(m => {
          if (m.status === "Completed") {
            const results = allResults.filter(r => r.matchId === m._id);
            results.forEach(r => {
              const tid = typeof r.teamId === "string" ? r.teamId : r.teamId._id;
              const s = stats.get(tid);
              if (s) {
                s.matches += 1;
                s.killPoints += r.kills * (rule?.killPoints ?? 1);
                s.posPoints += rule?.placementPoints[String(r.placement)] ?? 0;
                if (r.placement === 1) s.wins += 1;
              }
            });
          }
        });

        const rows = resolvedTeams.map(t => {
          const s = stats.get(t._id) || { matches: 0, wins: 0, killPoints: 0, posPoints: 0 };
          return {
            rank: 1,
            team: t.name,
            matchesPlayed: s.matches,
            wins: s.wins,
            positionPoints: s.posPoints,
            killPoints: s.killPoints,
            totalPoints: s.posPoints + s.killPoints
          } as ApiStandingsPointRow;
        });

        rows.sort((a, b) => b.totalPoints - a.totalPoints || b.killPoints - a.killPoints || b.wins - a.wins);
        rows.forEach((r, i) => { r.rank = i + 1; r.position = i + 1; });
        return rows as unknown as T;
      } else {
        const playerStats = new Map<string, { name: string; team: string; matches: number; kills: number }>();
        resolvedTeams.forEach(t => {
          t.players?.forEach(p => {
            playerStats.set(`${t._id}-${p.name}`, { name: p.name, team: t.name, matches: 0, kills: 0 });
          });
        });

        targetMatches.forEach(m => {
          if (m.status === "Completed") {
            const results = allResults.filter(r => r.matchId === m._id);
            results.forEach(r => {
              const tid = typeof r.teamId === "string" ? r.teamId : r.teamId._id;
              resolvedTeams.find(t => t._id === tid)?.players?.forEach(p => {
                const s = playerStats.get(`${tid}-${p.name}`);
                if (s) s.matches += 1;
              });

              if (r.playerKills) {
                Object.entries(r.playerKills).forEach(([playerName, kills]) => {
                  const s = playerStats.get(`${tid}-${playerName}`);
                  if (s) s.kills += kills;
                });
              }
            });
          }
        });

        const rows = Array.from(playerStats.values()).map(s => ({
          rank: 1,
          player: s.name,
          team: s.team,
          matchesPlayed: s.matches,
          kills: s.kills,
          averageKills: s.matches > 0 ? Number((s.kills / s.matches).toFixed(2)) : 0
        } as ApiStandingsFraggerRow));

        rows.sort((a, b) => b.kills - a.kills || b.averageKills - a.averageKills);
        rows.forEach((r, i) => r.rank = i + 1);
        return rows.slice(0, 10) as unknown as T;
      }
    }

    if (method === "GET") {
      return eventMatches as unknown as T;
    }
  }

  if (pathname.startsWith("/matches/")) {
    const parts = pathname.split("/");
    const matchId = parts[2];
    const isResults = parts[3] === "results";

    const matches = getStorageArray<ApiMatch>("esports_matches", DEFAULT_MATCHES);
    const index = matches.findIndex(m => m._id === matchId);

    if (isResults) {
      const allResults = getStorageArray<ApiMatchResult>("esports_match_results", DEFAULT_RESULTS);
      if (method === "GET") {
        const results = allResults.filter(r => r.matchId === matchId);
        return results as unknown as T;
      }
      if (method === "POST") {
        const filteredResults = allResults.filter(r => r.matchId !== matchId);
        const payloadResults = body.results || [];
        
        const newResults = payloadResults.map((r: any, idx: number) => ({
          _id: `result-${matchId}-${idx}-${Date.now()}`,
          matchId,
          teamId: r.teamId,
          placement: r.placement,
          kills: r.kills,
          playerKills: r.playerKills || {},
          isBanned: r.isBanned || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        const updatedResults = [...filteredResults, ...newResults];
        saveStorageArray("esports_match_results", updatedResults);

        if (index !== -1) {
          matches[index].status = "Completed";
          saveStorageArray("esports_matches", matches);
        }

        return newResults as unknown as T;
      }
    }

    if (method === "GET") {
      return matches[index] as unknown as T;
    }
    if (method === "PUT") {
      if (index !== -1) {
        const updated = { ...matches[index], ...body, updatedAt: new Date().toISOString() };
        matches[index] = updated;
        saveStorageArray("esports_matches", matches);
        return updated as unknown as T;
      }
    }
    if (method === "DELETE") {
      if (index !== -1) {
        matches.splice(index, 1);
        saveStorageArray("esports_matches", matches);
        
        const allResults = getStorageArray<ApiMatchResult>("esports_match_results", DEFAULT_RESULTS);
        const filteredResults = allResults.filter(r => r.matchId !== matchId);
        saveStorageArray("esports_match_results", filteredResults);

        return { message: "Deleted" } as unknown as T;
      }
    }
  }

  // 8. Audit Logs API
  if (pathname.startsWith("/audit-logs/event/")) {
    const parts = pathname.split("/");
    const eventId = parts[3];
    const logs = getStorageArray<ApiAuditLog>("esports_audit_logs", []);
    
    if (method === "GET") {
      return logs.filter(l => l.eventId === eventId) as unknown as T;
    }
    if (method === "POST") {
      const newLog: ApiAuditLog = {
        _id: `log-${Date.now()}`,
        eventId,
        userId: "dummy-user-id",
        userName: "Organizer",
        category: body.category,
        action: body.action,
        message: body.message,
        changes: body.changes || [],
        metadata: body.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      logs.push(newLog);
      saveStorageArray("esports_audit_logs", logs);
      return newLog as unknown as T;
    }
  }

  // 9. Support API
  if (pathname === "/support") {
    const support = getStorageArray<ApiSupportRequest>("esports_support_requests", []);
    const currentUser = getStoredUser();
    if (method === "GET") {
      return support as unknown as T;
    }
    const newReq: ApiSupportRequest = {
      _id: `support-${Date.now()}`,
      userId: currentUser ? { _id: currentUser._id, name: currentUser.name, email: currentUser.email } : null,
      name: currentUser?.name || body.name || "Unknown",
      email: currentUser?.email || body.email || "unknown@example.com",
      subject: body.subject,
      message: body.message,
      status: "New",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    support.push(newReq);
    saveStorageArray("esports_support_requests", support);
    return newReq as unknown as T;
  }

  // 10. Admin Users API
  if (pathname === "/admin/users") {
    let users = getStorageArray<ApiUser>("esports_admin_users", DEFAULT_USERS);
    const deletedList = getStorageArray<string>("esports_deleted_users", []);
    users = users.filter(
      (u) =>
        !deletedList.includes(u._id) &&
        !deletedList.includes(u.email?.toLowerCase() || "")
    );

    const currentUser = getStoredUser();
    if (
      currentUser &&
      currentUser.email &&
      !deletedList.includes(currentUser.email.toLowerCase()) &&
      !deletedList.includes(currentUser._id)
    ) {
      const exists = users.some(
        (u) =>
          (u._id && u._id === currentUser._id) ||
          (u.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      if (!exists) {
        users = [
          ...users,
          {
            ...currentUser,
            _id: currentUser._id || (currentUser as any).id || `usr-${Date.now()}`,
            approvalStatus: currentUser.approvalStatus || "approved",
          },
        ];
        saveStorageArray("esports_admin_users", users);
      }
    }
    if (method === "GET") {
      return users as unknown as T;
    }
  }

  if (pathname.startsWith("/admin/users/")) {
    const parts = pathname.split("/");
    const rawUserId = parts[3];
    const userId = decodeURIComponent(rawUserId);
    const isApproval = parts[4] === "approval";
    let users = getStorageArray<ApiUser>("esports_admin_users", DEFAULT_USERS);

    const index = users.findIndex(
      (u) =>
        u._id === userId ||
        u._id === rawUserId ||
        (u.email && u.email.toLowerCase() === userId.toLowerCase())
    );

    if (isApproval && method === "PUT") {
      let targetUser: ApiUser | null = null;
      if (index !== -1) {
        users[index].approvalStatus = body.status;
        if (body.reason) users[index].rejectionReason = body.reason;
        saveStorageArray("esports_admin_users", users);
        targetUser = users[index];
      }

      const userEmail = targetUser?.email || userId;
      if (userEmail) {
        localStorage.setItem(`grand_wiki_onboarding_${userEmail}`, body.status);

        const registeredUsers = getLocalItem<Array<Record<string, string>>>("esports_registered_users", []);
        const registeredIndex = registeredUsers.findIndex(
          (entry) =>
            entry._id === userId ||
            (entry.email && entry.email.toLowerCase() === userEmail.toLowerCase()),
        );
        if (registeredIndex !== -1) {
          registeredUsers[registeredIndex].approvalStatus = body.status;
          saveStorageArray("esports_registered_users", registeredUsers);
        }
      }

      const currentUser = getStoredUser();
      if (
        currentUser &&
        (currentUser._id === userId ||
          currentUser.email?.toLowerCase() === userEmail.toLowerCase())
      ) {
        currentUser.approvalStatus = body.status;
        if (body.reason) currentUser.rejectionReason = body.reason;
        localStorage.setItem("user", JSON.stringify(currentUser));
      }

      return (targetUser || { _id: userId, approvalStatus: body.status }) as unknown as T;
    }

    if (method === "DELETE") {
      const deletedList = getStorageArray<string>("esports_deleted_users", []);
      if (userId && !deletedList.includes(userId.toLowerCase())) {
        deletedList.push(userId.toLowerCase());
      }
      if (rawUserId && !deletedList.includes(rawUserId.toLowerCase())) {
        deletedList.push(rawUserId.toLowerCase());
      }

      if (index !== -1) {
        const deleted = users.splice(index, 1)[0];
        if (deleted?.email && !deletedList.includes(deleted.email.toLowerCase())) {
          deletedList.push(deleted.email.toLowerCase());
        }
        if (deleted?._id && !deletedList.includes(deleted._id)) {
          deletedList.push(deleted._id);
        }
        saveStorageArray("esports_admin_users", users);
        if (deleted?.email) {
          localStorage.removeItem(`grand_wiki_onboarding_${deleted.email}`);
          localStorage.removeItem(`grand_wiki_proof_image_${deleted.email}`);
        }
      } else {
        const filtered = users.filter(
          (u) =>
            u._id !== userId &&
            u._id !== rawUserId &&
            u.email?.toLowerCase() !== userId.toLowerCase()
        );
        saveStorageArray("esports_admin_users", filtered);
        localStorage.removeItem(`grand_wiki_onboarding_${userId}`);
      }

      saveStorageArray("esports_deleted_users", deletedList);

      const currentUser = getStoredUser();
      if (
        currentUser &&
        (currentUser._id === userId ||
          currentUser.email?.toLowerCase() === userId.toLowerCase())
      ) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }

      return { message: "User deleted successfully" } as unknown as T;
    }
  }

  throw new Error(`Offline route not mapped: ${method} ${path}`);
}

const DEFAULT_USERS: ApiUser[] = [
  {
    _id: "usr-101",
    name: "Marcus Vale",
    email: "marcus.vale@grandrp.org",
    server: "ENGLISH #1",
    inGameId: "4021",
    badgeNumber: "102",
    organization: { name: "LSPD - Los Santos Police Department" },
    approvalStatus: "pending",
    inGameScreenshotUrl: "/Login/Sample.png",
    createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    role: "organizer",
  },
  {
    _id: "usr-102",
    name: "Elena Rostova",
    email: "elena.r@grandrp.org",
    server: "ENGLISH #2",
    inGameId: "8912",
    badgeNumber: "504",
    organization: { name: "FIB - Federal Investigation Bureau" },
    approvalStatus: "pending",
    inGameScreenshotUrl: "/Login/Sample.png",
    createdAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    role: "organizer",
  },
  {
    _id: "usr-103",
    name: "Devon Vance",
    email: "devon.v@grandrp.org",
    server: "ENGLISH #1",
    inGameId: "2019",
    badgeNumber: "301",
    organization: { name: "SAHP - San Andreas Highway Patrol" },
    approvalStatus: "approved",
    inGameScreenshotUrl: "/Login/Sample.png",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    role: "organizer",
  },
];

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (shouldUseOffline(path)) {
    return handleOfflineRequest<T>(path, options);
  }
  const isFormData = options.body instanceof FormData;
  const headers = authHeaders(isFormData ? {} : { "Content-Type": "application/json" });

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });

    if (res.status === 401 && typeof window !== "undefined") {
      clearStoredUser();
      const loginPath = "/login";
      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath;
      }
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message =
        (body as { message?: string; error?: string }).message ||
        (body as { message?: string; error?: string }).error ||
        `Request failed: ${res.status}`;
      throw new Error(message);
    }

    return (await res.json()) as Promise<T>;
  } catch (err) {
    // If backend endpoint is offline or unreachable, fall back to mock handler
    console.warn(`API request to ${path} failed/offline, using offline handler`, err);
    return handleOfflineRequest<T>(path, options);
  }
}

// ---------- Auth / user ----------

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  phone?: string;
  dob?: string | null;
  gender?: string;
  timezone?: string;
  organization?: {
    name?: string;
    logo?: string;
  };
  appearanceMode?: "system" | "light" | "dark";
  integrations?: {
    discordWebhookUrl?: string;
    twitchChannelUrl?: string;
  };
  role: "organizer" | "admin" | "ADMIN";
  server?: string;
  inGameId?: string;
  badgeNumber?: string;
  approvalStatus?: "not_submitted" | "pending" | "approved" | "rejected";
  rejectionReason?: string;
  inGameScreenshotUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  token?: string;
  avatarFile?: File | null;
  organizationLogoFile?: File | null;
  inGameScreenshotFile?: File | null;
  pinnedCommands?: any[];
  pinnedGroups?: any[];
}

export const authApi = {
  sendOtp: (email: string) =>
    request<{ message: string }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  register: (data: { name: string; email: string; password: string; otp: string }) =>
    request<ApiUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<ApiUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getProfile: () => request<ApiUser>("/auth/profile"),
  updateProfile: (data: Partial<ApiUser>) => {
    if (data.avatarFile || data.organizationLogoFile || data.inGameScreenshotFile) {
      const form = new FormData();
      if (data.name !== undefined) form.append("name", data.name);
      if (data.email !== undefined) form.append("email", data.email);
      if (data.phone !== undefined) form.append("phone", data.phone || "");
      if (data.dob !== undefined) form.append("dob", data.dob || "");
      if (data.gender !== undefined) form.append("gender", data.gender || "");
      if (data.timezone !== undefined) form.append("timezone", data.timezone || "");
      if (data.server !== undefined) form.append("server", data.server || "");
      if (data.inGameId !== undefined) form.append("inGameId", data.inGameId || "");
      if (data.badgeNumber !== undefined) form.append("badgeNumber", data.badgeNumber || "");
      if (data.organization !== undefined)
        form.append("organization", JSON.stringify(data.organization));
      if (data.appearanceMode !== undefined)
        form.append("appearanceMode", data.appearanceMode || "system");
      if (data.integrations !== undefined)
        form.append("integrations", JSON.stringify(data.integrations));
      if (data.avatarFile) form.append("avatar", data.avatarFile);
      if (data.organizationLogoFile) form.append("organizationLogo", data.organizationLogoFile);
      if (data.inGameScreenshotFile) form.append("inGameScreenshot", data.inGameScreenshotFile);
      return request<ApiUser>("/auth/profile", { method: "PUT", body: form });
    }
    const { avatarFile, organizationLogoFile, inGameScreenshotFile, ...payload } = data;
    return request<ApiUser>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>("/auth/password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  logout: () =>
    request<{ message: string }>("/auth/logout", {
      method: "POST",
    }),
  updatePinned: (data: { pinnedCommands: any[]; pinnedGroups: any[] }) =>
    request<{ pinnedCommands: any[]; pinnedGroups: any[] }>("/auth/pinned", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export function persistUser(user: ApiUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
  if (user.token) localStorage.setItem("token", user.token);
  if (user.pinnedCommands) localStorage.setItem("grandrp-pinned-commands", JSON.stringify(user.pinnedCommands));
  if (user.pinnedGroups) localStorage.setItem("grandrp-pinned-groups", JSON.stringify(user.pinnedGroups));
  window.dispatchEvent(new CustomEvent("esports:user-updated", { detail: user }));
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("grandrp-pinned-commands");
  localStorage.removeItem("grandrp-pinned-groups");
  window.dispatchEvent(new CustomEvent("esports:user-updated", { detail: null }));
}

export function getStoredUser(): ApiUser | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");
    if (!token || !raw) return null;
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || "U").toUpperCase();
}

// ---------- Types matching backend models ----------

export interface ApiPlayer {
  playerId: string;
  name: string;
  inGameId?: string;
}

export interface ApiTeam {
  _id: string;
  name: string;
  logoUrl?: string;
  tags: string[];
  contactMobile?: string;
  notes?: string;
  players: ApiPlayer[];
  isPoolTeam?: boolean;
  source?: "pool" | "event";
  sourceEventId?: string | null;
  sourceEventName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiEvent {
  _id: string;
  name: string;
  gameId?: ApiCatalogGame | string | null;
  game: string;
  format: string;
  startDate?: string;
  endDate?: string;
  status: "Draft" | "Ongoing" | "Completed";
  organizerId?: Pick<ApiUser, "_id" | "name" | "email"> | string | null;
  scoringRuleId?: ApiScoringRule | string | null;
  teams: (ApiTeam | string)[];
  matchCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiScoringRule {
  _id: string;
  name: string;
  format?: string;
  gameId?: ApiCatalogGame | string | null;
  gameName?: string;
  isGeneric?: boolean;
  scoringFields?: ScoringFieldKey[];
  description?: string;
  killPoints: number;
  winPoints?: number;
  drawPoints?: number;
  lossPoints?: number;
  isTemplate?: boolean;
  isPlatform?: boolean;
  placementPoints: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCatalogGame {
  _id: string;
  name: string;
  logo?: string | null;
  logoLight?: string | null;
  logoDark?: string | null;
  maps: string[];
  modes: string[];
  formats?: GameFormat[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiSupportRequest {
  _id: string;
  userId?: Pick<ApiUser, "_id" | "name" | "email"> | string | null;
  name: string;
  email: string;
  subject: "Suggestion" | "Bug Report";
  message: string;
  status: "New" | "In review" | "Resolved";
  createdAt: string;
  updatedAt: string;
}

export interface ApiMatch {
  _id: string;
  eventId: string;
  name: string;
  map?: string;
  status: "Pending Results" | "Completed";
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMatchResult {
  _id: string;
  matchId: string;
  teamId: string | ApiTeam;
  placement: number;
  kills: number;
  playerKills: Record<string, number>;
  totalPoints: number;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLeaderboardRow {
  rank: number;
  team: ApiTeam;
  totalMatches: number;
  totalKills: number;
  positionPoints: number;
  killPoints: number;
  totalPoints: number;
  wwcd: number;
}

export interface ApiStandingsPointRow {
  rank: number;
  team: string;
  matchesPlayed: number;
  wins: number;
  position?: number;
  positionPoints: number;
  killPoints: number;
  totalPoints: number;
}

export interface ApiStandingsFraggerRow {
  rank: number;
  player: string;
  team: string;
  matchesPlayed: number;
  kills: number;
  averageKills: number;
}

export interface ApiAuditChange {
  field: string;
  label: string;
  type?: "changed" | "added" | "removed";
  message?: string;
  previousValue: unknown;
  newValue: unknown;
}

export interface ApiAuditLog {
  _id: string;
  eventId: string;
  userId: string;
  userName: string;
  category: "event" | "team" | "match" | "result" | "scoring" | "export";
  action: string;
  message: string;
  changes: ApiAuditChange[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type CreateAuditLogInput = {
  category: ApiAuditLog["category"];
  action: string;
  message: string;
  changes?: ApiAuditChange[];
  metadata?: Record<string, unknown>;
};

export type ApiUserLogCategory = "login" | "activity" | "account";

export interface ApiUserLogChange {
  field: string;
  label: string;
  type?: "changed" | "added" | "removed";
  message?: string;
  previousValue: unknown;
  newValue: unknown;
}

export interface ApiUserLog {
  _id: string;
  userId: string;
  userName: string;
  actorId?: string;
  actorName?: string;
  category: ApiUserLogCategory;
  action: string;
  message: string;
  changes: ApiUserLogChange[];
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  eventsCount: number;
  scoringRulesCount: number;
  teamsCount: number;
  recentEvents: ApiEvent[];
}

// ---------- Teams API ----------

export const teamsApi = {
  getAll: (options?: { includeEventTeams?: boolean }) =>
    request<ApiTeam[]>(`/teams${options?.includeEventTeams ? "?includeEventTeams=true" : ""}`),
  getPlayerSuggestions: (options?: { limit?: number }) =>
    request<string[]>(
      `/teams/players/suggestions${options?.limit ? `?limit=${options.limit}` : ""}`,
    ),
  getById: (id: string) => request<ApiTeam>(`/teams/${id}`),
  create: (data: {
    name: string;
    tags?: string[];
    contactMobile?: string;
    notes?: string;
    players?: ApiPlayer[];
    isPoolTeam?: boolean;
    source?: "pool" | "event";
    sourceEventId?: string | null;
    sourceEventName?: string;
  }) =>
    request<ApiTeam>("/teams", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createWithLogo: (data: {
    name: string;
    tags?: string[];
    contactMobile?: string;
    notes?: string;
    players?: ApiPlayer[];
    logoFile?: File | null;
    isPoolTeam?: boolean;
    source?: "pool" | "event";
    sourceEventId?: string | null;
    sourceEventName?: string;
  }) => {
    const form = new FormData();
    form.append("name", data.name);
    form.append("tags", JSON.stringify(data.tags ?? []));
    if (data.contactMobile !== undefined) form.append("contactMobile", data.contactMobile);
    if (data.notes !== undefined) form.append("notes", data.notes);
    form.append("players", JSON.stringify(data.players ?? []));
    if (data.isPoolTeam !== undefined) form.append("isPoolTeam", String(data.isPoolTeam));
    if (data.source) form.append("source", data.source);
    if (data.sourceEventId) form.append("sourceEventId", data.sourceEventId);
    if (data.sourceEventName) form.append("sourceEventName", data.sourceEventName);
    if (data.logoFile) form.append("logo", data.logoFile);
    return request<ApiTeam>("/teams", { method: "POST", body: form });
  },
  update: (
    id: string,
    data: Partial<{
      name: string;
      tags: string[];
      contactMobile: string;
      notes: string;
      players: ApiPlayer[];
      isPoolTeam: boolean;
      source: "pool" | "event";
      sourceEventId: string | null;
      sourceEventName: string;
    }> & {
      logoFile?: File | null;
    },
  ) => {
    if (data.logoFile) {
      const form = new FormData();
      if (data.name) form.append("name", data.name);
      if (data.tags) form.append("tags", JSON.stringify(data.tags));
      if (data.contactMobile !== undefined) form.append("contactMobile", data.contactMobile);
      if (data.notes !== undefined) form.append("notes", data.notes);
      if (data.players) form.append("players", JSON.stringify(data.players));
      if (data.isPoolTeam !== undefined) form.append("isPoolTeam", String(data.isPoolTeam));
      if (data.source) form.append("source", data.source);
      if (data.sourceEventId !== undefined && data.sourceEventId)
        form.append("sourceEventId", data.sourceEventId);
      if (data.sourceEventName !== undefined) form.append("sourceEventName", data.sourceEventName);
      form.append("logo", data.logoFile);
      return request<ApiTeam>(`/teams/${id}`, { method: "PUT", body: form });
    }
    return request<ApiTeam>(`/teams/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete: (id: string) =>
    request<{ message: string; removedFromPoolOnly?: boolean }>(`/teams/${id}`, {
      method: "DELETE",
    }),
};

// ---------- Events API ----------

export const eventsApi = {
  getAll: () => request<ApiEvent[]>("/events"),
  getById: (id: string) => request<ApiEvent>(`/events/${id}`),
  create: (data: {
    name: string;
    gameId?: string | null;
    game: string;
    format: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    scoringRuleId?: string;
    teams?: string[];
  }) =>
    request<ApiEvent>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createWithSetup: (data: {
    event: {
      name: string;
      gameId?: string | null;
      game: string;
      format: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    };
    scoringRule: {
      name: string;
      format: string;
      gameId?: string | null;
      gameName?: string;
      isGeneric?: boolean;
      scoringFields?: ScoringFieldKey[];
      description?: string;
      killPoints: number;
      winPoints?: number;
      drawPoints?: number;
      lossPoints?: number;
      isTemplate?: boolean;
      placementPoints: Record<string, number>;
    };
    teams?: Array<{
      id?: string;
      name?: string;
      logo?: string | null;
      tags?: string[];
      addToDatabase?: boolean;
      players?: string[];
    }>;
  }) =>
    request<ApiEvent>("/events/setup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      gameId: string | null;
      game: string;
      format: string;
      startDate: string;
      endDate: string;
      status: string;
      scoringRuleId: string;
      teams: string[];
    }>,
  ) =>
    request<ApiEvent>(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<{ message: string }>(`/events/${id}`, { method: "DELETE" }),
  getDashboardStats: async (): Promise<DashboardStats> => {
    const [events, teams, rules] = await Promise.all([
      eventsApi.getAll(),
      teamsApi.getAll(),
      scoringRulesApi.getAll(),
    ]);
    return {
      eventsCount: events.filter((e) => e.status === "Ongoing").length,
      scoringRulesCount: rules.length,
      teamsCount: teams.length,
      recentEvents: events.slice(0, 5),
    };
  },
};

// ---------- Matches API ----------

export const matchesApi = {
  getByEvent: (eventId: string) => request<ApiMatch[]>(`/matches/event/${eventId}`),
  create: (data: { eventId: string; name: string; map?: string; order?: number }) =>
    request<ApiMatch>("/matches", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ApiMatch>) =>
    request<ApiMatch>(`/matches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) => request<{ message: string }>(`/matches/${id}`, { method: "DELETE" }),
  getResults: (matchId: string) => request<ApiMatchResult[]>(`/matches/${matchId}/results`),
  saveResults: (
    matchId: string,
    results: Array<{
      teamId: string;
      placement: number;
      kills: number;
      playerKills?: Record<string, number>;
      isBanned?: boolean;
    }>,
  ) =>
    request<ApiMatchResult[]>(`/matches/${matchId}/results`, {
      method: "POST",
      body: JSON.stringify({ results }),
    }),
  getLeaderboard: (eventId: string) =>
    request<ApiLeaderboardRow[]>(`/matches/event/${eventId}/leaderboard`),
  getStandings: (
    eventId: string,
    options: {
      view: "single-match" | "till-match";
      type: "points" | "fraggers";
      matchNumber: number;
    },
  ) =>
    request<Array<ApiStandingsPointRow | ApiStandingsFraggerRow>>(
      `/matches/event/${eventId}/standings?view=${encodeURIComponent(options.view)}&type=${encodeURIComponent(options.type)}&matchNumber=${options.matchNumber}`,
    ),
};

// ---------- Audit Logs API ----------

export const auditLogsApi = {
  getByEvent: (eventId: string) => request<ApiAuditLog[]>(`/audit-logs/event/${eventId}`),
  create: (eventId: string, data: CreateAuditLogInput) =>
    request<ApiAuditLog>(`/audit-logs/event/${eventId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ---------- Support API ----------

export const supportApi = {
  create: (data: Pick<ApiSupportRequest, "subject" | "message">) =>
    request<ApiSupportRequest>("/support", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAll: () => request<ApiSupportRequest[]>("/support"),
};

// ---------- Scoring Rules API ----------

export const scoringRulesApi = {
  getAll: () => request<ApiScoringRule[]>("/scoring-rules"),
  getById: (id: string) => request<ApiScoringRule>(`/scoring-rules/${id}`),
  getUsage: (id: string) => request<{ eventCount: number }>(`/scoring-rules/${id}/usage`),
  create: (data: {
    name: string;
    format?: string;
    gameId?: string | null;
    gameName?: string;
    isGeneric?: boolean;
    scoringFields?: ScoringFieldKey[];
    description?: string;
    killPoints: number;
    winPoints?: number;
    drawPoints?: number;
    lossPoints?: number;
    isTemplate?: boolean;
    placementPoints: Record<string, number>;
  }) =>
    request<ApiScoringRule>("/scoring-rules", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (
    id: string,
    data: Partial<{
      name: string;
      format: string;
      gameId: string | null;
      gameName: string;
      isGeneric: boolean;
      scoringFields: ScoringFieldKey[];
      description: string;
      killPoints: number;
      winPoints: number;
      drawPoints: number;
      lossPoints: number;
      isTemplate: boolean;
      placementPoints: Record<string, number>;
    }>,
    options?: { applyToEvents?: boolean },
  ) =>
    request<ApiScoringRule>(`/scoring-rules/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...data,
        applyToEvents: options?.applyToEvents,
      }),
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/scoring-rules/${id}`, { method: "DELETE" }),
};

export const catalogApi = {
  getGames: () => request<ApiCatalogGame[]>("/catalog/games"),
};

// ---------- Admin API ----------

export const adminApi = {
  getUsers: () => request<ApiUser[]>("/admin/users"),
  updateApproval: (id: string, status: "approved" | "rejected" | "pending", reason?: string) =>
    request<ApiUser>(`/admin/users/${id}/approval`, {
      method: "PUT",
      body: JSON.stringify({ status, reason }),
    }),
  deleteUser: (id: string) =>
    request<{ message: string }>(`/admin/users/${id}`, { method: "DELETE" }),
  getDonations: () => request<any[]>("/donations/admin/all"),
  createDonation: (data: any) =>
    request<any>("/donations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateDonation: (id: string, data: any) =>
    request<any>(`/donations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteDonation: (id: string) =>
    request<{ message: string }>(`/donations/${id}`, { method: "DELETE" }),
};

export const donationsApi = {
  getPublic: () => request<any[]>("/donations"),
};

export const notificationsApi = {
  getActive: () => request<ApiNotification[]>("/notifications"),
  getAll: () => request<ApiNotification[]>("/notifications/admin/all"),
  create: (data: {
    title: string;
    description: string;
    icon?: string;
    stopAfter: number;
    stopAfterUnit: "Mins" | "Hours" | "Days";
    color?: string;
    link?: string;
    status?: "draft" | "active";
  }) =>
    request<ApiNotification>("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<{
    title: string;
    description: string;
    icon: string;
    stopAfter: number;
    stopAfterUnit: "Mins" | "Hours" | "Days";
    color: string;
    link: string;
    status: "draft" | "active" | "expired";
  }>) =>
    request<ApiNotification>(`/notifications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/notifications/${id}`, { method: "DELETE" }),
};

export interface ApiNotification {
  _id: string;
  id: string;
  title: string;
  description: string;
  icon: string;
  stopAfter: number;
  stopAfterUnit: "Mins" | "Hours" | "Days";
  color: string;
  link: string;
  status: "draft" | "active" | "expired";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
