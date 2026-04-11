import { useState, useCallback, useEffect } from "react";
import type { Status } from "../types/types";

const TRASH_KEY = "trackr_trash";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface TrashedApp {
  id: string;
  company: string;
  role: string;
  salary: string;
  status: Status;
  applied: string;
  notes: string | null;  // ← was `string`, must match Application
  logo?: string | null;  // ← add this so it can round-trip with Application
  url?: string;
  deletedAt: number;
}
function loadTrash(): TrashedApp[] {
  try {
    const raw = localStorage.getItem(TRASH_KEY);
    if (!raw) return [];
    const items: TrashedApp[] = JSON.parse(raw);
    // Filter out anything older than 7 days immediately
    const now = Date.now();
    return items.filter((a) => now - a.deletedAt < SEVEN_DAYS_MS);
  } catch {
    return [];
  }
}

function saveTrash(items: TrashedApp[]) {
  try {
    localStorage.setItem(TRASH_KEY, JSON.stringify(items));
  } catch {
    // Ignore
  }
}

export function useTrash() {
// When initializing state, filter immediately:
const [trash, setTrash] = useState<TrashedApp[]>(() => {
  const saved = loadTrash();
  const now = Date.now();
  return saved.filter((a) => now - a.deletedAt < SEVEN_DAYS_MS);
});

// Remove the useEffect that calls setTrash on mount entirely
  // Persist on every change
  useEffect(() => {
    saveTrash(trash);
  }, [trash]);

  // Auto-purge stale items on mount

  const moveToTrash = useCallback(
    (app: Omit<TrashedApp, "deletedAt">) => {
      const entry: TrashedApp = { ...app, deletedAt: Date.now() };
      setTrash((t) => [entry, ...t]);
    },
    []
  );

  const restoreFromTrash = useCallback((id: string): TrashedApp | null => {
    let found: TrashedApp | null = null;
    setTrash((t) => {
      found = t.find((a) => a.id === id) ?? null;
      return t.filter((a) => a.id !== id);
    });
    return found;
  }, []);

  const permanentlyDelete = useCallback((id: string) => {
    setTrash((t) => t.filter((a) => a.id !== id));
  }, []);

  const emptyTrash = useCallback(() => {
    setTrash([]);
  }, []);

  const addToTrashDirectly = useCallback((app: TrashedApp) => {
    setTrash((t) => [app, ...t.filter((a) => a.id !== app.id)]);
  }, []);

  const removeFromTrashById = useCallback((id: string) => {
    setTrash((t) => t.filter((a) => a.id !== id));
  }, []);

  return {
    trash,
    moveToTrash,
    restoreFromTrash,
    permanentlyDelete,
    emptyTrash,
    addToTrashDirectly,
    removeFromTrashById,
  };
}