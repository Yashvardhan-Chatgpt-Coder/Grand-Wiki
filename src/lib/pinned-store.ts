export interface PinnedCommand {
  orgKey: string;
  category: string;
  group: string;
  command: string;
}

export interface PinnedGroup {
  orgKey: string;
  category: string;
  group: string;
}

const PINNED_COMMANDS_KEY = "grandrp-pinned-commands";
const PINNED_GROUPS_KEY = "grandrp-pinned-groups";

export function getPinnedCommands(): PinnedCommand[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(PINNED_COMMANDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePinnedCommands(cmds: PinnedCommand[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PINNED_COMMANDS_KEY, JSON.stringify(cmds));
  } catch {}
}

export function getPinnedGroups(): PinnedGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(PINNED_GROUPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePinnedGroups(groups: PinnedGroup[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PINNED_GROUPS_KEY, JSON.stringify(groups));
  } catch {}
}

export function isCommandPinned(orgKey: string, category: string, group: string, command: string): boolean {
  const cmds = getPinnedCommands();
  return cmds.some(
    c => c.orgKey === orgKey && c.category === category && c.group === group && c.command === command
  );
}

export function isGroupPinned(orgKey: string, category: string, group: string): boolean {
  const groups = getPinnedGroups();
  return groups.some(g => g.orgKey === orgKey && g.category === category && g.group === group);
}

export function togglePinCommand(orgKey: string, category: string, group: string, command: string): boolean {
  const cmds = getPinnedCommands();
  const exists = cmds.some(
    c => c.orgKey === orgKey && c.category === category && c.group === group && c.command === command
  );

  let newCmds;
  if (exists) {
    newCmds = cmds.filter(
      c => !(c.orgKey === orgKey && c.category === category && c.group === group && c.command === command)
    );
  } else {
    newCmds = [...cmds, { orgKey, category, group, command }];
  }
  savePinnedCommands(newCmds);
  return !exists; // returns true if pinned, false if unpinned
}

export function togglePinGroup(orgKey: string, category: string, group: string): boolean {
  const groups = getPinnedGroups();
  const exists = groups.some(g => g.orgKey === orgKey && g.category === category && g.group === group);

  let newGroups;
  if (exists) {
    newGroups = groups.filter(g => !(g.orgKey === orgKey && g.category === category && g.group === group));
  } else {
    newGroups = [...groups, { orgKey, category, group }];
  }
  savePinnedGroups(newGroups);
  return !exists; // returns true if pinned, false if unpinned
}
