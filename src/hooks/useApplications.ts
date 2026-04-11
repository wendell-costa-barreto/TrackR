import { useState, useEffect, useCallback } from "react";
import type { Application, Status } from "../types/types";
import {
  fetchApplications,
  createApplication,
  updateStatus,
  updateNotes,
  deleteApplication,
} from "../lib/applications";

interface UseApplicationsReturn {
  apps: Application[];
  loading: boolean;
  error: string | null;
  addApp: (partial: Omit<Application, "id">) => Promise<Application | null>;
  changeStatus: (id: string, status: Status) => Promise<void>;
  changeNotes: (id: string, notes: string) => Promise<void>;
  removeApp: (id: string) => Promise<void>;
}

export function useApplications(): UseApplicationsReturn {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApplications();
      setApps(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addApp = useCallback(
    async (partial: Omit<Application, "id">): Promise<Application | null> => {
      const tempId = `optimistic-${Date.now()}`;
      const optimisticApp: Application = { ...partial, id: tempId };

      // 1. Show the row immediately with a fake id
      setApps((prev) => [optimisticApp, ...prev]);

      try {
        const created = await createApplication(partial);
        // 2. Swap fake row for real one once Supabase responds
        setApps((prev) => prev.map((a) => (a.id === tempId ? created : a)));
        return created;
      } catch (err) {
        // 3. Server rejected it — remove the fake row
        setApps((prev) => prev.filter((a) => a.id !== tempId));
        throw err;
      }
    },
    []
  );

  const changeStatus = useCallback(
    async (id: string, status: Status): Promise<void> => {
      // 1. Update UI instantly
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      try {
        await updateStatus(id, status);
      } catch (err) {
        // 2. Supabase failed — roll back to whatever was there before
        setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status: a.status } : a)));
        throw err;
      }
    },
    []
  );

  const changeNotes = useCallback(
    async (id: string, notes: string): Promise<void> => {
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, notes } : a)));
      try {
        await updateNotes(id, notes);
      } catch (err) {
        setApps((prev) => prev.map((a) => (a.id === id ? { ...a, notes: a.notes } : a)));
        throw err;
      }
    },
    []
  );

  const removeApp = useCallback(
    async (id: string): Promise<void> => {
      // Snapshot the row before removing it
      const snapshot = apps.find((a) => a.id === id);
      const snapshotIndex = apps.findIndex((a) => a.id === id);

      // 1. Remove it from the UI immediately
      setApps((prev) => prev.filter((a) => a.id !== id));

      try {
        await deleteApplication(id);
      } catch (err) {
        // 2. Supabase failed — put it back where it was
        if (snapshot) {
          setApps((prev) => {
            const next = [...prev];
            next.splice(snapshotIndex, 0, snapshot);
            return next;
          });
        }
        throw err;
      }
    },
    [apps]
  );

  return { apps, loading, error, addApp, changeStatus, changeNotes, removeApp };
}