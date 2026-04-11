import { useState, useRef, useEffect, useCallback } from "react";
import type { Status } from "../types/types";
import { StatCard } from "../components/dashboard/Atoms";
import { ApplicationsTable } from "../components/dashboard/AplicationsTable";
import { AddApplicationModal } from "../components/dashboard/AddApplicationModal";
import { Sidebar } from "../components/dashboard/Sidebar";
import { SettingsModal } from "../components/dashboard/SettingsModal";
import { TourOverlay } from "../components/dashboard/TourOverlay";
import type { TourStep } from "../components/dashboard/TourOverlay";
import { useApplications } from "../hooks/useApplications";
import { useAuth } from "../hooks/useAuth";
import { useTour } from "../hooks/useTour";
import {
  useHistory,
  type MutatorFns,
  type AppSnapshot,
} from "../hooks/useHistory";
import { useTrash } from "../hooks/useTrash";
import toast, { Toaster } from "react-hot-toast";

const STATUSES = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Ghosted",
  "Withdrawn",
] as const;

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='brand']",
    title: "Welcome to TrackR 👋",
    description:
      "Your personal job application tracker. Let's walk you through the key features in under a minute.",
    placement: "bottom",
  },
  {
    target: "[data-tour='stat-cards']",
    title: "At-a-Glance Stats",
    description:
      "See your total applications, response rate, interview count, and offers — updated in real time as you make changes.",
    placement: "bottom",
  },
  {
    target: "[data-tour='add-btn']",
    title: "Add Applications",
    description:
      "Click here to log a new job application. Fill in the company, role, salary, and more.",
    placement: "bottom",
  },
  {
    target: "[data-tour='sort-select']",
    title: "Sort Your List",
    description:
      "Sort by most recent, salary, or company name to find what you need quickly.",
    placement: "bottom",
  },
  {
    target: "[data-tour='filter-btn']",
    title: "Filter by Status",
    description:
      "Narrow down by Applied, Interview, Offer, Rejected, Ghosted, or Withdrawn to focus on what matters.",
    placement: "bottom",
  },
  {
    target: "[data-tour='select-all']",
    title: "Bulk Actions",
    description:
      "Select multiple applications to set their status, append a note, or delete them all at once.",
    placement: "right",
  },
  {
    target: "[data-tour='undo-btn']",
    title: "Undo & Redo",
    description:
      "Made a mistake? Press Ctrl+Z (or ⌘Z) to undo your last action. Full history is kept for the session.",
    placement: "bottom",
  },
  {
    target: "[data-tour='avatar']",
    title: "Settings & Trash",
    description:
      "Access your profile settings and the trash bin here — deleted applications can always be restored.",
    placement: "left",
  },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { apps, loading, error, addApp, changeStatus, changeNotes, removeApp } =
    useApplications();

  const history = useHistory();
  const {
    trash,
    moveToTrash,
    restoreFromTrash,
    permanentlyDelete,
    emptyTrash,
  } = useTrash();

  const tour = useTour();

  // ── UI state ──
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "All">("All");
  const [sortKey, setSortKey] = useState<"applied" | "salary" | "company">(
    "applied",
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState<boolean>(
    !!user?.user_metadata?.skip_confirm,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string>(
    (user?.user_metadata?.full_name as string) ?? "",
  );

  // ── Bulk selection state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkNoteOpen, setBulkNoteOpen] = useState(false);
  const [bulkNoteValue, setBulkNoteValue] = useState("");

  // ── Guard: true while an undo/redo mutation is in flight ──
  // Wrapped handlers check this synchronously at entry and bail out immediately,
  // so they never push a duplicate history entry for an undo/redo operation.
  const isUndoRedoing = useRef(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };
  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 150);
  };

  const initials = (() => {
    const name = displayName || (user?.user_metadata?.full_name as string);
    if (!name) return "?";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  })();

  // ── Stable mutators ref ──
  // Storing mutators in a ref (rather than a plain object literal) prevents
  // handleUndo/handleRedo from capturing stale closures via useCallback deps.
  // The ref is kept current whenever the underlying hook fns change.
  // Raw mutators own the isUndoRedoing flag entirely: they set it synchronously
  // before calling the async hook fn, and clear it in finally(). Wrapped
  // handlers never touch the flag — they simply bail out if it's already set.
  const mutatorsRef = useRef<MutatorFns>({} as MutatorFns);

  useEffect(() => {
    mutatorsRef.current = {
      rawAdd: (app: AppSnapshot) => {
        isUndoRedoing.current = true;
        addApp(app).finally(() => {
          isUndoRedoing.current = false;
        });
      },
      rawDelete: (id: string) => {
        isUndoRedoing.current = true;
        removeApp(id).finally(() => {
          isUndoRedoing.current = false;
        });
      },
      rawStatusChange: (id: string, status: Status) => {
        isUndoRedoing.current = true;
        changeStatus(id, status).finally(() => {
          isUndoRedoing.current = false;
        });
      },
      rawNotesChange: (id: string, notes: string) => {
        isUndoRedoing.current = true;
        changeNotes(id, notes).finally(() => {
          isUndoRedoing.current = false;
        });
      },
    };
  }, [addApp, removeApp, changeStatus, changeNotes]);

  // ── Wrapped handlers ──
  // Each one checks isUndoRedoing.current synchronously at the top — before
  // any await — so the flag is read while it's still in its set state.
  // If the flag is set, the raw mutator is already handling the operation and
  // we must not push another history entry.
  const handleAddApp = useCallback(
    async (app: Parameters<typeof addApp>[0]) => {
      if (isUndoRedoing.current) return await addApp(app);
      try {
        const added = await addApp(app);
        if (added) history.pushAction({ type: "ADD", app: added });
        return added;
      } catch {
        toast.error("Couldn't add application — please try again.");
      }
    },
    [addApp, history],
  );

  const handleRemoveApp = useCallback(
    async (id: string) => {
      if (isUndoRedoing.current) {
        await removeApp(id);
        return;
      }
      const app = apps.find((a) => a.id === id);
      if (!app) return;
      moveToTrash(app);
      try {
        await removeApp(id);
        history.pushAction({ type: "DELETE", app });
        setSelectedIds((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      } catch {
        toast.error("Couldn't delete application — it's been restored.");
      }
    },
    [apps, removeApp, moveToTrash, history],
  );

  const handleStatusChange = useCallback(
    async (id: string, next: Status) => {
      if (isUndoRedoing.current) {
        await changeStatus(id, next);
        return;
      }
      const app = apps.find((a) => a.id === id);
      if (!app) return;
      history.pushAction({ type: "STATUS_CHANGE", id, prev: app.status, next });
      try {
        await changeStatus(id, next);
      } catch {
        toast.error("Couldn't update status — change was reverted.");
      }
    },
    [apps, changeStatus, history],
  );

  const handleNotesChange = useCallback(
    async (id: string, next: string) => {
      if (isUndoRedoing.current) {
        await changeNotes(id, next);
        return;
      }
      const app = apps.find((a) => a.id === id);
      if (!app) return;
      history.pushAction({
        type: "NOTES_CHANGE",
        id,
        prev: app.notes ?? "",
        next,
      });
      try {
        await changeNotes(id, next);
      } catch {
        toast.error("Couldn't save note — change was reverted.");
      }
    },
    [apps, changeNotes, history],
  );

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds];
    const snaps = ids
      .map((id) => apps.find((a) => a.id === id))
      .filter(Boolean) as AppSnapshot[];
    snaps.forEach((a) => moveToTrash(a));
    try {
      await Promise.all(ids.map((id) => removeApp(id)));
      history.pushAction({ type: "BULK_DELETE", apps: snaps });
      setSelectedIds(new Set());
    } catch {
      toast.error("Couldn't delete some applications — please try again.");
    }
  }, [selectedIds, apps, removeApp, moveToTrash, history]);

  const handleBulkStatusChange = useCallback(
    async (next: Status) => {
      const ids = [...selectedIds];
      const prevStatuses: Record<string, Status> = {};
      ids.forEach((id) => {
        const app = apps.find((a) => a.id === id);
        if (app) prevStatuses[id] = app.status;
      });
      try {
        await Promise.all(ids.map((id) => changeStatus(id, next)));
        history.pushAction({
          type: "BULK_STATUS_CHANGE",
          ids,
          prevStatuses,
          next,
        });
        setBulkStatusOpen(false);
        setSelectedIds(new Set());
      } catch {
        toast.error("Couldn't update statuses — changes were reverted.");
      }
    },
    [selectedIds, apps, changeStatus, history],
  );

  const handleBulkNotesChange = useCallback(
    async (next: string) => {
      const ids = [...selectedIds];
      const prevNotes: Record<string, string> = {};
      ids.forEach((id) => {
        const app = apps.find((a) => a.id === id);
        if (app) prevNotes[id] = app.notes ?? "";
      });
      try {
        await Promise.all(ids.map((id) => changeNotes(id, next)));
        history.pushAction({ type: "BULK_NOTES_CHANGE", ids, prevNotes, next });
        setBulkNoteOpen(false);
        setBulkNoteValue("");
        setSelectedIds(new Set());
      } catch {
        toast.error("Couldn't save notes — changes were reverted.");
      }
    },
    [selectedIds, apps, changeNotes, history],
  );

  // ── Undo / Redo ──
  // Pass the stable ref's current value so these callbacks never go stale.
  const handleUndo = useCallback(() => {
    history.undo(mutatorsRef.current);
  }, [history]);

  const handleRedo = useCallback(() => {
    history.redo(mutatorsRef.current);
  }, [history]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndo, handleRedo]);

  // ── Restore from trash ──
  const handleRestore = useCallback(
    async (id: string) => {
      const app = restoreFromTrash(id);
      if (!app) return;
      const appData = {
        id: app.id,
        company: app.company,
        role: app.role,
        salary: app.salary,
        status: app.status,
        applied: app.applied,
        notes: app.notes,
        url: app.url,
        logo: null,
      };
      const restored = await addApp(appData);
      if (restored) history.pushAction({ type: "ADD", app: restored });
    },
    [restoreFromTrash, addApp, history],
  );

  // ── Filtered / sorted list ──
  const filtered = apps
    .filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q);
      const matchFilter = filterStatus === "All" || a.status === filterStatus;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortKey === "company") return a.company.localeCompare(b.company);
      if (sortKey === "salary")
        return (
          parseInt(b.salary.replace(/\D/g, "")) -
          parseInt(a.salary.replace(/\D/g, ""))
        );
      return 0;
    });

  const stats = {
    total: apps.length,
    responseRate:
      apps.length === 0
        ? 0
        : Math.round(
            (apps.filter(
              (a) => a.status !== "Applied" && a.status !== "Ghosted",
            ).length /
              apps.length) *
              100,
          ),
    interviews: apps.filter((a) => a.status === "Interview").length,
    offers: apps.filter((a) => a.status === "Offer").length,
  };

  // ── Selection helpers ──
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((s) => {
        const n = new Set(s);
        filtered.forEach((a) => n.delete(a.id));
        return n;
      });
    } else {
      setSelectedIds((s) => {
        const n = new Set(s);
        filtered.forEach((a) => n.add(a.id));
        return n;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((s) => {
      const n = new Set(s);
      if (n.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  };

  return (
    <div
      className="min-h-screen bg-zinc-950 text-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#18181b", // zinc-900
            color: "#e4e4e7", // zinc-200
            border: "1px solid #3f3f46", // zinc-700
            fontSize: "13px",
          },
        }}
      />
      {/* ── Nav ── */}
      <nav className="w-full h-14 md:h-16 flex items-center border-b border-zinc-800/60 px-3 md:px-6 gap-2 md:gap-3">
        <span
          data-tour="brand"
          className="text-xl md:text-2xl font-bold tracking-tight flex-shrink-0"
        >
          TrackR
        </span>

        {/* Search */}
        <div
          className={`relative flex-1 max-w-xs ${someSelected ? "hidden sm:block" : ""}`}
        >
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 rounded-lg pl-8 pr-3 py-2 w-full focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Undo */}
          <button
            data-tour="undo-btn"
            onClick={handleUndo}
            disabled={!history.canUndo}
            title="Undo (⌘Z)"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a4 4 0 0 1 0 8H9M3 10l3-3M3 10l3 3"
              />
            </svg>
          </button>

          {/* Redo */}
          <button
            onClick={handleRedo}
            disabled={!history.canRedo}
            title="Redo (⌘⇧Z)"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10H11a4 4 0 0 0 0 8h4M21 10l-3-3m3 3l-3 3"
              />
            </svg>
          </button>

          {/* Activity — mobile only */}
          <button
            onClick={() => setShowSidebar(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </button>

          {/* Add button */}
          <button
            data-tour="add-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-white text-zinc-950 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">Add</span>
          </button>

          {/* Avatar */}
          <div
            data-tour="avatar"
            className="relative"
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-200 select-none cursor-pointer hover:border-zinc-500 transition-colors">
              {initials}
            </div>
            {menuOpen && (
              <div
                onMouseEnter={openMenu}
                onMouseLeave={closeMenu}
                className="absolute right-0 top-10 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 p-2 w-48 z-50"
              >
                <div className="absolute -top-3 left-0 right-0 h-3" />
                <span className="text-[11px] text-zinc-600 px-3 py-1 truncate">
                  {user?.email}
                </span>
                <div className="h-px bg-zinc-800 my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowSettings(true);
                  }}
                  className="text-left text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                  {trash.length > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-zinc-700 text-zinc-300 rounded-full px-1.5 py-0.5">
                      {trash.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    tour.restart();
                  }}
                  className="text-left text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
                    />
                  </svg>
                  Take the tour
                </button>
                <button
                  onClick={signOut}
                  className="text-left text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Stat cards ── */}
      <div
        data-tour="stat-cards"
        className="flex overflow-x-auto border-b border-zinc-800/60 scrollbar-none"
      >
        <StatCard value={stats.total} label="Total Applications" />
        <StatCard value={`${stats.responseRate}%`} label="Response Rate" />
        <StatCard value={stats.interviews} label="Interviews" />
        <StatCard value={stats.offers} label="Offers" accent />
      </div>

      {/* ── Main content ── */}
      <div className="flex" style={{ minHeight: "calc(100vh - 56px - 80px)" }}>
        <div className="flex-1 flex flex-col min-w-0">
          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between px-3 md:px-6 py-3 border-b border-zinc-800/50 gap-2">
            {/* Left side */}
            <div className="flex items-center gap-2 min-w-0">
              <input
                data-tour="select-all"
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded accent-white cursor-pointer flex-shrink-0"
              />
              {someSelected ? (
                <span className="text-xs font-semibold text-zinc-300">
                  {selectedIds.size} selected
                </span>
              ) : (
                <h2 className="text-sm md:text-base font-bold tracking-tight truncate">
                  All Applications
                </h2>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {someSelected ? (
                <>
                  {/* Bulk set status */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setBulkStatusOpen((v) => !v);
                        setBulkNoteOpen(false);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-600 transition-colors"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <span className="hidden sm:inline">Set status</span>
                    </button>
                    {bulkStatusOpen && (
                      <div className="absolute right-0 top-9 z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 p-1.5 w-40 flex flex-col gap-0.5">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleBulkStatusChange(s)}
                            className="text-left text-xs px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bulk add note */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setBulkNoteOpen((v) => !v);
                        setBulkStatusOpen(false);
                      }}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white hover:border-zinc-600 transition-colors"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      <span className="hidden sm:inline">Add note</span>
                    </button>
                    {bulkNoteOpen && (
                      <div className="absolute right-0 top-9 z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 p-3 w-64 flex flex-col gap-2">
                        <p className="text-[11px] text-zinc-500">
                          Append note to {selectedIds.size} application
                          {selectedIds.size !== 1 ? "s" : ""}
                        </p>
                        <textarea
                          value={bulkNoteValue}
                          onChange={(e) => setBulkNoteValue(e.target.value)}
                          placeholder="Note text…"
                          rows={3}
                          className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 placeholder:text-zinc-600 rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 resize-none transition-colors"
                        />
                        <button
                          onClick={() => handleBulkNotesChange(bulkNoteValue)}
                          disabled={!bulkNoteValue.trim()}
                          className="self-end text-xs font-semibold px-4 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bulk delete */}
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-red-400 hover:text-red-300 hover:border-red-800/40 transition-colors"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span className="hidden sm:inline">Delete</span>
                  </button>

                  {/* Clear selection */}
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-zinc-600 hover:text-zinc-400 px-2 py-1.5 transition-colors"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <select
                      data-tour="sort-select"
                      value={sortKey}
                      onChange={(e) =>
                        setSortKey(e.target.value as typeof sortKey)
                      }
                      className="appearance-none bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-semibold px-3 py-2 pr-6 rounded-lg focus:outline-none focus:border-zinc-600 cursor-pointer transition-colors"
                    >
                      <option value="applied">Recent</option>
                      <option value="salary">Salary</option>
                      <option value="company">Company</option>
                    </select>
                    <svg
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <div className="relative">
                    <button
                      data-tour="filter-btn"
                      onClick={() => setShowFilter(!showFilter)}
                      className={`flex items-center gap-1 border text-xs font-semibold px-2.5 py-2 rounded-lg transition-colors ${filterStatus !== "All" ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"}`}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4h18M7 8h10M10 12h4"
                        />
                      </svg>
                      <span className="hidden sm:inline">
                        {filterStatus === "All" ? "Filter" : filterStatus}
                      </span>
                    </button>
                    {showFilter && (
                      <div className="absolute right-0 top-10 z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 p-2 w-40 flex flex-col gap-0.5">
                        {(["All", ...STATUSES] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setFilterStatus(s);
                              setShowFilter(false);
                            }}
                            className={`text-left text-xs px-3 py-2 rounded-lg transition-colors ${filterStatus === s ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Table ── */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-zinc-600">
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span className="text-sm">Loading applications…</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <ApplicationsTable
              applications={filtered}
              onStatusChange={handleStatusChange}
              onNotesChange={handleNotesChange}
              onDelete={handleRemoveApp}
              total={apps.length}
              skipConfirm={skipConfirm}
              onSkipConfirmChange={setSkipConfirm}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          )}

          <div className="px-3 md:px-6 py-2.5 border-t border-zinc-800/40 flex items-center justify-between">
            <span className="text-xs text-zinc-600">
              {filtered.length} of {apps.length} applications
            </span>
            <span className="text-xs text-zinc-700">TrackR v1.0</span>
          </div>
        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden lg:flex w-64 xl:w-72 flex-shrink-0 border-l border-zinc-800/60">
          <Sidebar applications={apps} />
        </div>
      </div>

      {/* ── Mobile sidebar drawer ── */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
          <div
            className="relative w-80 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col"
            style={{ animation: "slideInRight 0.2s ease-out" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
              <span className="text-sm font-bold">Activity & Pipeline</span>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar applications={apps} />
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {showAddModal && (
        <AddApplicationModal
          onAdd={handleAddApp}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {showSettings && user && (
        <SettingsModal
          user={user}
          skipConfirm={skipConfirm}
          onSkipConfirmChange={setSkipConfirm}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={(name) => setDisplayName(name)}
          trash={trash}
          onRestore={handleRestore}
          onPermanentDelete={permanentlyDelete}
          onEmptyTrash={emptyTrash}
        />
      )}

      {/* ── Tour ── */}
      {tour.active && (
        <TourOverlay
          steps={TOUR_STEPS}
          step={tour.step}
          onNext={tour.next}
          onPrev={tour.prev}
          onFinish={tour.finish}
        />
      )}
    </div>
  );
}
