import { useRef, useState, useCallback } from "react";
import type { Status } from "../types/types";

export interface AppSnapshot {
  id: string;
  company: string;
  role: string;
  salary: string;
  status: Status;
  applied: string;
  url?: string;
  notes: string | null;   // ← must match Application
  logo: string | null;    // ← required, not optional (no `?`)
}

export type HistoryAction =
  | { type: "ADD"; app: AppSnapshot }
  | { type: "DELETE"; app: AppSnapshot }
  | { type: "BULK_DELETE"; apps: AppSnapshot[] }
  | { type: "STATUS_CHANGE"; id: string; prev: Status; next: Status }
  | { type: "BULK_STATUS_CHANGE"; ids: string[]; prevStatuses: Record<string, Status>; next: Status }
  | { type: "NOTES_CHANGE"; id: string; prev: string; next: string }
  | { type: "BULK_NOTES_CHANGE"; ids: string[]; prevNotes: Record<string, string>; next: string };

export interface MutatorFns {
  rawAdd: (app: AppSnapshot) => void;
  rawDelete: (id: string) => void;
  rawStatusChange: (id: string, status: Status) => void;
  rawNotesChange: (id: string, notes: string) => void;
}

// Stacks live in refs so every callback always reads the latest value
// without needing to be listed in useCallback dep arrays.
// This is the core fix for stale-closure duplicates.
export function useHistory() {
  const pastRef = useRef<HistoryAction[]>([]);
  const futureRef = useRef<HistoryAction[]>([]);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => t + 1), []);

  const pushAction = useCallback((action: HistoryAction) => {
    pastRef.current = [...pastRef.current, action];
    futureRef.current = [];
    bump();
  }, [bump]);

  const applyInverse = (action: HistoryAction, fns: MutatorFns) => {
    switch (action.type) {
      case "ADD":              fns.rawDelete(action.app.id); break;
      case "DELETE":           fns.rawAdd(action.app); break;
      case "BULK_DELETE":      action.apps.forEach((a) => fns.rawAdd(a)); break;
      case "STATUS_CHANGE":    fns.rawStatusChange(action.id, action.prev); break;
      case "BULK_STATUS_CHANGE":
        action.ids.forEach((id) => fns.rawStatusChange(id, action.prevStatuses[id]));
        break;
      case "NOTES_CHANGE":     fns.rawNotesChange(action.id, action.prev); break;
      case "BULK_NOTES_CHANGE":
        action.ids.forEach((id) => fns.rawNotesChange(id, action.prevNotes[id]));
        break;
    }
  };

  const applyForward = (action: HistoryAction, fns: MutatorFns) => {
    switch (action.type) {
      case "ADD":              fns.rawAdd(action.app); break;
      case "DELETE":           fns.rawDelete(action.app.id); break;
      case "BULK_DELETE":      action.apps.forEach((a) => fns.rawDelete(a.id)); break;
      case "STATUS_CHANGE":    fns.rawStatusChange(action.id, action.next); break;
      case "BULK_STATUS_CHANGE":
        action.ids.forEach((id) => fns.rawStatusChange(id, action.next));
        break;
      case "NOTES_CHANGE":     fns.rawNotesChange(action.id, action.next); break;
      case "BULK_NOTES_CHANGE":
        action.ids.forEach((id) => fns.rawNotesChange(id, action.next));
        break;
    }
  };

  const undo = useCallback((fns: MutatorFns) => {
    const past = pastRef.current;
    if (past.length === 0) return;
    const last = past[past.length - 1];
    pastRef.current = past.slice(0, -1);
    futureRef.current = [last, ...futureRef.current];
    applyInverse(last, fns);
    bump();
  }, [bump]);

  const redo = useCallback((fns: MutatorFns) => {
    const future = futureRef.current;
    if (future.length === 0) return;
    const next = future[0];
    futureRef.current = future.slice(1);
    pastRef.current = [...pastRef.current, next];
    applyForward(next, fns);
    bump();
  }, [bump]);

  return {
    pushAction,
    undo,
    redo,
    get canUndo() { return pastRef.current.length > 0; },
    get canRedo() { return futureRef.current.length > 0; },
  };
}