import { useCallback, useEffect, useMemo, useState } from "react";
import {
  eventsApi,
  matchesApi,
  teamsApi,
  type ApiEvent,
  type ApiLeaderboardRow,
  type ApiMatch,
  type ApiTeam,
} from "@/lib/api";
import type { ResultEntry, TeamData } from "@/components/dashboard/AddResultModal";
import type { MatchInput } from "@/components/dashboard/AddMatchModal";
import type { EditableMatch } from "@/components/dashboard/EditMatchModal";
import {
  apiMatchResultsToEntries,
  apiTeamsToTeamData,
  formatEventDate,
  getEventGame,
  leaderboardToStandingsPreview,
  resultEntriesToPayload,
} from "@/lib/mappers";
import { queue } from "@/components/ui/Toast";

export type WorkspaceMatch = {
  id: string;
  name: string;
  map: string;
  status: "Pending Results" | "Completed";
  results: ResultEntry[];
  order: number;
};

export type WorkspaceEventTeam = {
  id: string;
  slot: string;
  name: string;
  tags: string[];
  players: string[];
  logo?: string | null;
};

export function useEventWorkspace(eventId: string) {
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [matches, setMatches] = useState<WorkspaceMatch[]>([]);
  const [leaderboard, setLeaderboard] = useState<ApiLeaderboardRow[]>([]);
  const [poolTeams, setPoolTeams] = useState<ApiTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventTeams = useMemo((): ApiTeam[] => {
    if (!event?.teams) return [];
    return event.teams.filter((t): t is ApiTeam => typeof t !== "string");
  }, [event]);

  const matchTeamsData = useMemo(() => apiTeamsToTeamData(eventTeams), [eventTeams]);

  const refreshLeaderboard = useCallback(async () => {
    const rows = await matchesApi.getLeaderboard(eventId);
    setLeaderboard(rows);
  }, [eventId]);

  const loadMatchResults = useCallback(async (matchList: ApiMatch[]) => {
    const withResults = await Promise.all(
      matchList.map(async (m) => {
        let results: ResultEntry[] = [];
        if (m.status === "Completed") {
          try {
            const apiResults = await matchesApi.getResults(m._id);
            results = apiMatchResultsToEntries(apiResults);
          } catch {
            results = [];
          }
        }
        return {
          id: m._id,
          name: m.name,
          map: m.map || "",
          status: m.status,
          results,
          order: m.order ?? 0,
        } satisfies WorkspaceMatch;
      }),
    );
    setMatches(withResults);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventData, matchList, board, allTeams] = await Promise.all([
        eventsApi.getById(eventId),
        matchesApi.getByEvent(eventId),
        matchesApi.getLeaderboard(eventId),
        teamsApi.getAll(),
      ]);
      setEvent(eventData);
      setLeaderboard(board);
      setPoolTeams(allTeams);
      await loadMatchResults(matchList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [eventId, loadMatchResults]);

  const refreshStandings = useCallback(async () => {
    const [matchList, board] = await Promise.all([
      matchesApi.getByEvent(eventId),
      matchesApi.getLeaderboard(eventId),
    ]);
    setLeaderboard(board);
    await loadMatchResults(matchList);
  }, [eventId, loadMatchResults]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const workspaceTeams: WorkspaceEventTeam[] = useMemo(
    () =>
      eventTeams.map((team, index) => ({
        id: team._id,
        slot: String(index + 1).padStart(2, "0"),
        name: team.name,
        tags: team.tags || [],
        players: (team.players || []).map((p) => p.name),
        logo: team.logoUrl || null,
      })),
    [eventTeams],
  );

  const updateEventTeams = async (teamIds: string[]) => {
    const updated = await eventsApi.update(eventId, { teams: teamIds });
    setEvent(updated);
    await refreshLeaderboard();
  };

  const addMatch = async (input: MatchInput) => {
    const created = await matchesApi.create({
      eventId,
      name: input.name,
      map: input.map,
      order: matches.length,
    });
    setMatches((current) => [
      ...current,
      {
        id: created._id,
        name: created.name,
        map: created.map || "",
        status: created.status,
        results: [],
        order: created.order ?? current.length,
      },
    ]);
  };

  const addMatches = async (inputs: MatchInput[]) => {
    const startOrder = matches.length;
    const createdMatches: WorkspaceMatch[] = [];
    for (let i = 0; i < inputs.length; i++) {
      const created = await matchesApi.create({
        eventId,
        name: inputs[i].name,
        map: inputs[i].map,
        order: startOrder + i,
      });
      createdMatches.push({
        id: created._id,
        name: created.name,
        map: created.map || "",
        status: created.status,
        results: [],
        order: created.order ?? startOrder + i,
      });
    }
    setMatches((current) => [...current, ...createdMatches]);
  };

  const saveMatch = async (updated: EditableMatch & { id: string }) => {
    await matchesApi.update(updated.id, {
      name: updated.name,
      map: updated.map,
      status: updated.status,
    });
    setMatches((current) =>
      current.map((m) =>
        m.id === updated.id
          ? { ...m, name: updated.name, map: updated.map, status: updated.status }
          : m,
      ),
    );
  };

  const deleteMatch = async (matchId: string) => {
    await matchesApi.delete(matchId);
    setMatches((current) => current.filter((m) => m.id !== matchId));
    await refreshLeaderboard();
  };

  const persistMatchResults = async (matchId: string, results: ResultEntry[]) => {
    const payload = resultEntriesToPayload(results);
    await matchesApi.saveResults(matchId, payload);
    setMatches((current) =>
      current.map((m) =>
        m.id === matchId
          ? { ...m, results, status: "Completed" as const }
          : m,
      ),
    );
    await refreshLeaderboard();
  };

  const standingsPreview = useMemo(
    () => leaderboardToStandingsPreview(leaderboard),
    [leaderboard],
  );

  const displayEvent = useMemo(() => {
    if (!event) return null;
    const game = getEventGame(event);
    return {
      id: event._id,
      name: event.name,
      game: game.name,
      gameLogo: game.logo,
      format: event.format || "—",
      date: formatEventDate(event.startDate, event.endDate),
      teamsCount: eventTeams.length,
      status: event.status,
    };
  }, [event, eventTeams.length]);

  return {
    event,
    eventTeams,
    displayEvent,
    matches,
    leaderboard,
    standingsPreview,
    matchTeamsData,
    workspaceTeams,
    poolTeams,
    loading,
    error,
    refresh,
    refreshLeaderboard,
    refreshStandings,
    updateEventTeams,
    addMatch,
    addMatches,
    saveMatch,
    deleteMatch,
    persistMatchResults,
    setEvent,
  };
}
