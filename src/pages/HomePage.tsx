import { useState, useEffect, useCallback } from "react";

type DemoStatus =
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Ghosted"
  | "Withdrawn";

interface DemoEntry {
  id: number;
  company: string;
  role: string;
  salary: string;
  status: DemoStatus;
  notes: string;
  date: string;
}

interface DemoFormState {
  company: string;
  role: string;
  salary: string;
  status: DemoStatus;
  notes: string;
}

const STATUS_STYLES: Record<
  DemoStatus,
  { bg: string; text: string; dot: string }
> = {
  Applied: { bg: "rgba(96,165,250,0.1)", text: "#60a5fa", dot: "#60a5fa" },
  Interview: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24", dot: "#fbbf24" },
  Offer: { bg: "rgba(74,222,128,0.1)", text: "#4ade80", dot: "#4ade80" },
  Rejected: { bg: "rgba(248,113,113,0.1)", text: "#f87171", dot: "#f87171" },
  Ghosted: { bg: "rgba(161,161,170,0.1)", text: "#a1a1aa", dot: "#a1a1aa" },
  Withdrawn: { bg: "rgba(251,146,60,0.1)", text: "#fb923c", dot: "#fb923c" },
};

const DEMO_SEED: DemoEntry[] = [
  {
    id: 1,
    company: "Stripe",
    role: "Frontend Engineer",
    salary: "£75,000",
    status: "Interview",
    notes: "",
    date: "28 May",
  },
  {
    id: 2,
    company: "Linear",
    role: "Product Designer",
    salary: "$95,000",
    status: "Applied",
    notes: "",
    date: "26 May",
  },
  {
    id: 3,
    company: "Vercel",
    role: "DX Engineer",
    salary: "€82,000",
    status: "Offer",
    notes: "",
    date: "21 May",
  },
  {
    id: 4,
    company: "Notion",
    role: "Full-Stack Dev",
    salary: "$110,000",
    status: "Rejected",
    notes: "",
    date: "18 May",
  },
  {
    id: 5,
    company: "Figma",
    role: "SWE II",
    salary: "$120,000",
    status: "Ghosted",
    notes: "",
    date: "12 May",
  },
];

function StatusBadge({ status }: { status: DemoStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.dot}33`,
        borderRadius: 9999,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}

const TODAY = new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "short",
});

export default function TrackRLanding() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [entries, setEntries] = useState<DemoEntry[]>(DEMO_SEED);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DemoStatus | "All">("All");
  const [showFilter, setShowFilter] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<DemoFormState>({
    company: "",
    role: "",
    salary: "",
    status: "Applied",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (demoOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [demoOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDemoOpen(false);
        setShowAddModal(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stats = {
    total: entries.length,
    responseRate:
      entries.length === 0
        ? 0
        : Math.round(
            (entries.filter(
              (e) => e.status !== "Applied" && e.status !== "Ghosted",
            ).length /
              entries.length) *
              100,
          ),
    interviews: entries.filter((e) => e.status === "Interview").length,
    offers: entries.filter((e) => e.status === "Offer").length,
  };

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      e.company.toLowerCase().includes(q) || e.role.toLowerCase().includes(q);
    const matchFilter = filter === "All" || e.status === filter;
    return matchSearch && matchFilter;
  });

  const allSelected =
    filtered.length > 0 && filtered.every((e) => selected.has(e.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((s) => {
        const n = new Set(s);
        filtered.forEach((e) => n.delete(e.id));
        return n;
      });
    } else {
      setSelected((s) => {
        const n = new Set(s);
        filtered.forEach((e) => n.add(e.id));
        return n;
      });
    }
  };

  const addEntry = useCallback(() => {
    if (!form.company.trim() || !form.role.trim()) {
      setFormError("Company and role are required.");
      return;
    }
    setFormError("");
    setEntries((prev) => [
      {
        id: Date.now(),
        company: form.company.trim(),
        role: form.role.trim(),
        salary: form.salary.trim(),
        status: form.status,
        notes: form.notes.trim(),
        date: TODAY,
      },
      ...prev,
    ]);
    setForm({
      company: "",
      role: "",
      salary: "",
      status: "Applied",
      notes: "",
    });
    setShowAddModal(false);
  }, [form]);

  const deleteEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelected((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  const deleteSelected = () => {
    setEntries((prev) => prev.filter((e) => !selected.has(e.id)));
    setSelected(new Set());
  };

  const STATUSES: DemoStatus[] = [
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
    "Ghosted",
    "Withdrawn",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #09090b;
          color: #fafafa;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* NAV */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.5rem; height: 56px;
          border-bottom: 1px solid transparent;
          transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
        }
        .lp-nav.scrolled {
          background: rgba(9,9,11,0.9);
          backdrop-filter: blur(12px);
          border-color: #27272a;
        }
        .lp-nav-brand { font-size: 1.2rem; font-weight: 800; letter-spacing: -0.03em; color: #fafafa; text-decoration: none; }
        .lp-nav-links { display: flex; align-items: center; gap: 0.25rem; list-style: none; }
        .lp-nav-links a {
          font-size: 0.8rem; color: #71717a; text-decoration: none;
          padding: 0.4rem 0.75rem; border-radius: 6px; transition: color 0.15s, background 0.15s;
        }
        .lp-nav-links a:hover { color: #fafafa; background: #18181b; }
        .lp-nav-cta {
          background: #fafafa !important; color: #09090b !important;
          font-weight: 600 !important; font-size: 0.8rem !important;
          padding: 0.45rem 1rem !important; border-radius: 7px !important;
          transition: background 0.15s !important;
        }
        .lp-nav-cta:hover { background: #e4e4e7 !important; color: #09090b !important; }

        /* HERO */
        .lp-hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 8rem 1.5rem 4rem; text-align: center;
          position: relative; overflow: hidden;
        }
        .lp-hero::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%);
          pointer-events: none;
        }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #18181b; border: 1px solid #27272a; border-radius: 9999px;
          padding: 4px 12px; font-size: 0.72rem; color: #71717a;
          font-weight: 500; margin-bottom: 2rem; letter-spacing: 0.02em;
          animation: fadeUp 0.5s ease both;
        }
        .lp-badge-dot { width: 6px; height: 6px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 6px #4ade80; animation: pulse 2s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
        .lp-hero-title {
          font-size: clamp(2.8rem, 7vw, 5.5rem); font-weight: 800;
          letter-spacing: -0.04em; line-height: 1;
          margin-bottom: 1.5rem; max-width: 800px;
          animation: fadeUp 0.5s 0.1s ease both;
        }
        .lp-hero-title span { color: #a1a1aa; font-weight: 300; }
        .lp-hero-sub {
          font-size: 1.05rem; color: #71717a; max-width: 500px;
          line-height: 1.75; font-weight: 400; margin-bottom: 2.5rem;
          animation: fadeUp 0.5s 0.2s ease both;
        }
        .lp-hero-actions {
          display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
          justify-content: center; animation: fadeUp 0.5s 0.3s ease both;
        }
        .lp-btn-primary {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fafafa; color: #09090b; font-size: 0.85rem;
          font-weight: 600; padding: 0.7rem 1.5rem; border-radius: 8px;
          border: none; cursor: pointer; text-decoration: none;
          transition: background 0.15s, transform 0.1s;
        }
        .lp-btn-primary:hover { background: #e4e4e7; transform: translateY(-1px); }
        .lp-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; color: #a1a1aa; font-size: 0.85rem;
          font-weight: 500; padding: 0.7rem 1.5rem; border-radius: 8px;
          border: 1px solid #27272a; cursor: pointer; text-decoration: none;
          transition: border-color 0.15s, color 0.15s, transform 0.1s;
        }
        .lp-btn-secondary:hover { border-color: #52525b; color: #fafafa; transform: translateY(-1px); }

        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        /* DASHBOARD PREVIEW */
        .lp-preview {
          width: 100%; max-width: 1000px; margin: 4rem auto 0;
          animation: fadeUp 0.7s 0.4s ease both;
          position: relative; z-index: 1;
        }
        .lp-window {
          background: #09090b; border: 1px solid #27272a; border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px #27272a;
        }
        .lp-window-bar {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 14px; background: #111113; border-bottom: 1px solid #27272a;
        }
        .lp-dot { width: 10px; height: 10px; border-radius: 50%; }
        .lp-dot-r { background: #f87171; } .lp-dot-y { background: #fbbf24; } .lp-dot-g { background: #4ade80; }
        .lp-window-url {
          flex: 1; background: #09090b; border: 1px solid #27272a; border-radius: 5px;
          padding: 3px 10px; font-size: 0.68rem; color: #52525b; font-family: monospace; margin-left: 6px;
        }

        /* MOCK NAV */
        .lp-mock-nav {
          display: flex; align-items: center; height: 56px; border-bottom: 1px solid rgba(39,39,42,0.6);
          padding: 0 16px; gap: 8px;
        }
        .lp-mock-brand { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.03em; flex-shrink: 0; }
        .lp-mock-search {
          position: relative; flex: 1; max-width: 200px;
        }
        .lp-mock-search-icon {
          position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
          width: 12px; height: 12px; color: #52525b;
        }
        .lp-mock-input {
          background: #18181b; border: 1px solid #27272a; border-radius: 7px;
          padding: 6px 8px 6px 26px; font-size: 0.75rem; color: #52525b;
          width: 100%; font-family: inherit;
        }
        .lp-mock-nav-right { display: flex; align-items: center; gap: 6px; margin-left: auto; }
        .lp-mock-icon-btn {
          width: 30px; height: 30px; border: 1px solid #27272a; border-radius: 7px;
          background: transparent; display: flex; align-items: center; justify-content: center;
          color: #52525b; font-size: 0.75rem; flex-shrink: 0;
        }
        .lp-mock-add-btn {
          display: flex; align-items: center; gap: 4px;
          background: #fafafa; color: #09090b; font-size: 0.7rem; font-weight: 700;
          padding: 5px 10px; border-radius: 6px; border: none; flex-shrink: 0;
        }
        .lp-mock-avatar {
          width: 30px; height: 30px; background: #27272a; border: 1px solid #3f3f46;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 700; color: #e4e4e7; flex-shrink: 0;
        }

        /* MOCK STAT CARDS */
        .lp-mock-stats {
          display: flex; border-bottom: 1px solid rgba(39,39,42,0.6);
          overflow: hidden;
        }
        .lp-mock-stat {
          flex: 1; padding: 14px 16px; border-right: 1px solid rgba(39,39,42,0.6);
        }
        .lp-mock-stat:last-child { border-right: none; }
        .lp-mock-stat-label { font-size: 0.65rem; color: #52525b; margin-bottom: 4px; letter-spacing: 0.04em; }
        .lp-mock-stat-val { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; color: #fafafa; }
        .lp-mock-stat-val.accent { color: #fbbf24; }

        /* MOCK MAIN */
        .lp-mock-main { display: flex; }
        .lp-mock-content { flex: 1; min-width: 0; }
        .lp-mock-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px; border-bottom: 1px solid rgba(39,39,42,0.5); gap: 8px;
        }
        .lp-mock-toolbar-left { display: flex; align-items: center; gap: 8px; }
        .lp-mock-checkbox { width: 14px; height: 14px; border: 1px solid #3f3f46; border-radius: 3px; background: transparent; }
        .lp-mock-toolbar-title { font-size: 0.85rem; font-weight: 700; letter-spacing: -0.01em; }
        .lp-mock-toolbar-right { display: flex; align-items: center; gap: 6px; }
        .lp-mock-select {
          background: #18181b; border: 1px solid #27272a; border-radius: 6px;
          padding: 5px 8px; font-size: 0.7rem; color: #a1a1aa; font-family: inherit;
          font-weight: 600;
        }
        .lp-mock-filter-btn {
          background: #18181b; border: 1px solid #27272a; border-radius: 6px;
          padding: 5px 8px; font-size: 0.7rem; color: #a1a1aa; font-weight: 600;
          display: flex; align-items: center; gap: 4px;
        }

        /* MOCK TABLE */
        .lp-mock-table { width: 100%; }
        .lp-mock-th {
          display: grid; grid-template-columns: 28px 1.8fr 1.8fr 1.2fr 80px 90px;
          gap: 8px; padding: 6px 16px;
          font-size: 0.62rem; color: #52525b; letter-spacing: 0.06em;
          border-bottom: 1px solid rgba(39,39,42,0.5);
        }
        .lp-mock-tr {
          display: grid; grid-template-columns: 28px 1.8fr 1.8fr 1.2fr 80px 90px;
          gap: 8px; padding: 10px 16px; align-items: center;
          border-bottom: 1px solid rgba(39,39,42,0.3); font-size: 0.78rem;
        }
        .lp-mock-tr:last-child { border-bottom: none; }
        .lp-mock-company { font-weight: 600; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lp-mock-role { color: #71717a; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lp-mock-salary { font-size: 0.72rem; color: #52525b; font-family: monospace; }
        .lp-mock-date { font-size: 0.7rem; color: #52525b; font-family: monospace; }

        /* MOCK SIDEBAR */
        .lp-mock-sidebar {
          width: 200px; flex-shrink: 0; border-left: 1px solid rgba(39,39,42,0.6);
          padding: 14px;
        }
        .lp-mock-sidebar-title { font-size: 0.65rem; color: #52525b; letter-spacing: 0.06em; margin-bottom: 10px; }
        .lp-mock-sidebar-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 0; border-bottom: 1px solid rgba(39,39,42,0.4);
        }
        .lp-mock-sidebar-item:last-child { border-bottom: none; }
        .lp-mock-sidebar-status { font-size: 0.7rem; color: #a1a1aa; }
        .lp-mock-sidebar-count {
          font-size: 0.68rem; font-weight: 700; background: #18181b;
          border: 1px solid #27272a; border-radius: 4px; padding: 1px 6px; color: #71717a;
        }
        .lp-mock-bar-wrap { margin-top: 16px; }
        .lp-mock-bar-label { display: flex; justify-content: space-between; font-size: 0.62rem; color: #52525b; margin-bottom: 4px; }
        .lp-mock-bar-track { background: #18181b; border-radius: 9999px; height: 4px; overflow: hidden; margin-bottom: 6px; }
        .lp-mock-bar-fill { height: 100%; border-radius: 9999px; }

        /* SECTIONS */
        .lp-section { padding: 6rem 1.5rem; max-width: 1100px; margin: 0 auto; }
        .lp-section-tag {
          font-size: 0.7rem; color: #52525b; letter-spacing: 0.1em;
          text-transform: uppercase; font-weight: 600; margin-bottom: 0.75rem;
          display: flex; align-items: center; gap: 8px;
        }
        .lp-section-tag::before { content:''; width: 20px; height: 1px; background: #3f3f46; }
        .lp-section-title { font-size: clamp(1.75rem, 3.5vw, 2.5rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.15; margin-bottom: 1rem; }
        .lp-section-sub { font-size: 0.95rem; color: #71717a; max-width: 480px; line-height: 1.75; }

        /* FEATURES GRID */
        .lp-features-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1px; background: #27272a;
          border: 1px solid #27272a; border-radius: 12px; overflow: hidden; margin-top: 3rem;
        }
        .lp-feature {
          background: #09090b; padding: 1.75rem;
          transition: background 0.15s;
        }
        .lp-feature:hover { background: #111113; }
        .lp-feature-icon {
          width: 36px; height: 36px; background: #18181b; border: 1px solid #27272a;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          font-size: 1rem; margin-bottom: 1rem;
        }
        .lp-feature-name { font-size: 0.9rem; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 0.4rem; }
        .lp-feature-desc { font-size: 0.8rem; color: #71717a; line-height: 1.65; }

        /* STATS */
        .lp-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-top: 3rem; }
        .lp-stat-box { background: #111113; border: 1px solid #27272a; border-radius: 10px; padding: 1.75rem; text-align: center; }
        .lp-stat-num { font-size: 2.75rem; font-weight: 800; letter-spacing: -0.05em; color: #fafafa; line-height: 1; margin-bottom: 0.5rem; }
        .lp-stat-label { font-size: 0.72rem; color: #52525b; letter-spacing: 0.04em; }

        /* STACK */
        .lp-stack-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 0.75rem; margin-top: 3rem; }
        .lp-stack-item {
          background: #111113; border: 1px solid #27272a; border-radius: 8px;
          padding: 1.25rem 0.75rem; text-align: center;
          transition: border-color 0.15s, transform 0.15s;
        }
        .lp-stack-item:hover { border-color: #3f3f46; transform: translateY(-2px); }
        .lp-stack-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .lp-stack-name { font-size: 0.68rem; color: #71717a; font-weight: 500; }

        /* CTA */
        .lp-cta { padding: 6rem 1.5rem; text-align: center; border-top: 1px solid #18181b; }
        .lp-cta-title { font-size: clamp(2rem, 4.5vw, 3.5rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; margin-bottom: 1.25rem; }
        .lp-cta-sub { font-size: 0.95rem; color: #71717a; margin-bottom: 2rem; }
        .lp-cta-btns { display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; }

        /* DIVIDER */
        .lp-divider { height: 1px; background: linear-gradient(to right, transparent, #27272a, transparent); margin: 0 1.5rem; }

        /* FOOTER */
        footer.lp-footer {
          border-top: 1px solid #18181b; padding: 2rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .lp-footer-brand { font-size: 1rem; font-weight: 800; letter-spacing: -0.03em; }
        .lp-footer-links { display: flex; gap: 1.25rem; list-style: none; }
        .lp-footer-links a { font-size: 0.72rem; color: #52525b; text-decoration: none; transition: color 0.15s; }
        .lp-footer-links a:hover { color: #a1a1aa; }
        .lp-footer-copy { font-size: 0.7rem; color: #3f3f46; }

        /* REVEAL */
        .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        /* DEMO OVERLAY */
        .lp-demo-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          opacity: 0; pointer-events: none; transition: opacity 0.25s;
        }
        .lp-demo-overlay.open { opacity: 1; pointer-events: all; }
        .lp-demo-window {
          background: #09090b; border: 1px solid #27272a; border-radius: 12px;
          width: 100%; max-width: 960px; max-height: 90vh;
          overflow: hidden; display: flex; flex-direction: column;
          box-shadow: 0 40px 80px rgba(0,0,0,0.7);
          transform: scale(0.97) translateY(8px); transition: transform 0.25s;
        }
        .lp-demo-overlay.open .lp-demo-window { transform: scale(1) translateY(0); }

        /* DEMO NAV */
        .lp-demo-nav {
          display: flex; align-items: center; height: 56px;
          border-bottom: 1px solid rgba(39,39,42,0.6);
          padding: 0 16px; gap: 8px; flex-shrink: 0; background: #09090b;
        }
        .lp-demo-brand { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.03em; flex-shrink: 0; }
        .lp-demo-search-wrap { position: relative; flex: 1; max-width: 240px; }
        .lp-demo-search {
          width: 100%; background: #18181b; border: 1px solid #27272a; border-radius: 8px;
          padding: 7px 8px 7px 28px; font-size: 0.8rem; color: #e4e4e7;
          font-family: inherit; outline: none; transition: border-color 0.15s;
        }
        .lp-demo-search:focus { border-color: #3f3f46; }
        .lp-demo-search::placeholder { color: #52525b; }
        .lp-demo-search-icon {
          position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
          width: 13px; height: 13px; color: #52525b; pointer-events: none;
        }
        .lp-demo-nav-right { display: flex; align-items: center; gap: 6px; margin-left: auto; }
        .lp-demo-icon-btn {
          width: 32px; height: 32px; border: 1px solid #27272a; border-radius: 7px;
          background: transparent; display: flex; align-items: center; justify-content: center;
          color: #52525b; cursor: pointer; transition: border-color 0.15s, color 0.15s;
        }
        .lp-demo-icon-btn:hover { border-color: #3f3f46; color: #a1a1aa; }
        .lp-demo-add-btn {
          display: flex; align-items: center; gap: 5px;
          background: #fafafa; color: #09090b; font-size: 0.78rem; font-weight: 700;
          padding: 6px 12px; border-radius: 7px; border: none; cursor: pointer;
          transition: background 0.15s; flex-shrink: 0;
        }
        .lp-demo-add-btn:hover { background: #e4e4e7; }
        .lp-demo-avatar {
          width: 32px; height: 32px; background: #27272a; border: 1px solid #3f3f46;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 700; color: #e4e4e7; flex-shrink: 0; cursor: pointer;
          position: relative;
        }
        .lp-demo-close-label {
          position: absolute; top: -24px; right: 0; font-size: 0.6rem; color: #52525b;
          white-space: nowrap; background: #18181b; border: 1px solid #27272a;
          border-radius: 4px; padding: 2px 6px; pointer-events: none;
        }

        /* DEMO STAT CARDS */
        .lp-demo-stats {
          display: flex; border-bottom: 1px solid rgba(39,39,42,0.6); flex-shrink: 0;
        }
        .lp-demo-stat {
          flex: 1; padding: 14px 20px; border-right: 1px solid rgba(39,39,42,0.6);
          transition: background 0.15s;
        }
        .lp-demo-stat:last-child { border-right: none; }
        .lp-demo-stat-label { font-size: 0.68rem; color: #52525b; margin-bottom: 4px; }
        .lp-demo-stat-val { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.04em; color: #fafafa; }
        .lp-demo-stat-val.accent { color: #fbbf24; }

        /* DEMO BODY */
        .lp-demo-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }
        .lp-demo-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

        /* DEMO TOOLBAR */
        .lp-demo-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px; border-bottom: 1px solid rgba(39,39,42,0.5);
          gap: 8px; flex-shrink: 0;
        }
        .lp-demo-toolbar-left { display: flex; align-items: center; gap: 8px; }
        .lp-demo-check {
          width: 15px; height: 15px; cursor: pointer; accent-color: #fafafa; flex-shrink: 0;
        }
        .lp-demo-toolbar-title { font-size: 0.9rem; font-weight: 700; letter-spacing: -0.02em; }
        .lp-demo-toolbar-right { display: flex; align-items: center; gap: 6px; }
        .lp-demo-select {
          appearance: none; background: #18181b; border: 1px solid #27272a; border-radius: 6px;
          padding: 6px 10px; font-size: 0.75rem; color: #a1a1aa; font-family: inherit;
          font-weight: 600; cursor: pointer; outline: none;
        }
        .lp-demo-filter-btn {
          display: flex; align-items: center; gap: 4px;
          background: #18181b; border: 1px solid #27272a; border-radius: 6px;
          padding: 6px 10px; font-size: 0.75rem; color: #a1a1aa; font-weight: 600;
          cursor: pointer; transition: border-color 0.15s, color 0.15s; position: relative;
        }
        .lp-demo-filter-btn.active { background: #18181b; border-color: #52525b; color: #fafafa; }
        .lp-demo-filter-dropdown {
          position: absolute; right: 0; top: calc(100% + 4px); z-index: 50;
          background: #18181b; border: 1px solid #27272a; border-radius: 10px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5); padding: 6px; width: 140px;
        }
        .lp-demo-filter-opt {
          display: block; width: 100%; text-align: left;
          font-size: 0.75rem; color: #71717a; padding: 7px 10px; border-radius: 6px;
          background: transparent; border: none; cursor: pointer; font-family: inherit;
          transition: background 0.1s, color 0.1s;
        }
        .lp-demo-filter-opt:hover { background: #27272a; color: #fafafa; }
        .lp-demo-filter-opt.active { background: #27272a; color: #fafafa; font-weight: 600; }

        /* DEMO TABLE */
        .lp-demo-table-wrap { flex: 1; overflow-y: auto; }
        .lp-demo-table-wrap::-webkit-scrollbar { width: 4px; }
        .lp-demo-table-wrap::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .lp-demo-th {
          display: grid; grid-template-columns: 32px 1.8fr 1.8fr 1.2fr 100px 32px;
          gap: 8px; padding: 8px 16px;
          font-size: 0.63rem; color: #52525b; letter-spacing: 0.06em;
          border-bottom: 1px solid rgba(39,39,42,0.5); position: sticky; top: 0; background: #09090b; z-index: 1;
        }
        .lp-demo-tr {
          display: grid; grid-template-columns: 32px 1.8fr 1.8fr 1.2fr 100px 32px;
          gap: 8px; padding: 11px 16px; align-items: center;
          border-bottom: 1px solid rgba(39,39,42,0.3);
          transition: background 0.1s;
        }
        .lp-demo-tr:hover { background: #111113; }
        .lp-demo-tr:last-child { border-bottom: none; }
        .lp-demo-company { font-weight: 600; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lp-demo-role { color: #71717a; font-size: 0.77rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lp-demo-salary { font-size: 0.73rem; color: #52525b; font-family: monospace; }
        .lp-demo-del-btn {
          width: 26px; height: 26px; background: transparent; border: 1px solid transparent;
          border-radius: 6px; color: #3f3f46; cursor: pointer; display: flex;
          align-items: center; justify-content: center; font-size: 0.7rem;
          transition: background 0.1s, color 0.1s, border-color 0.1s;
        }
        .lp-demo-del-btn:hover { background: rgba(248,113,113,0.1); color: #f87171; border-color: rgba(248,113,113,0.3); }

        /* DEMO EMPTY STATE */
        .lp-demo-empty {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 12px; padding: 3rem; color: #3f3f46;
          text-align: center;
        }
        .lp-demo-empty-icon { font-size: 2rem; opacity: 0.4; }
        .lp-demo-empty-text { font-size: 0.85rem; }
        .lp-demo-empty-sub { font-size: 0.75rem; color: #27272a; }

        /* DEMO SIDEBAR */
        .lp-demo-sidebar {
          width: 220px; flex-shrink: 0; border-left: 1px solid rgba(39,39,42,0.6);
          padding: 16px; overflow-y: auto;
        }
        .lp-demo-sidebar-section { margin-bottom: 20px; }
        .lp-demo-sidebar-label { font-size: 0.63rem; color: #52525b; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; font-weight: 600; }
        .lp-demo-sidebar-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 5px 0; border-bottom: 1px solid rgba(39,39,42,0.4);
        }
        .lp-demo-sidebar-row:last-child { border-bottom: none; }
        .lp-demo-sidebar-status { font-size: 0.72rem; color: #a1a1aa; }
        .lp-demo-sidebar-count {
          font-size: 0.68rem; font-weight: 700; background: #18181b;
          border: 1px solid #27272a; border-radius: 4px; padding: 1px 7px; color: #71717a;
        }
        .lp-demo-bar-section { margin-top: 20px; }
        .lp-demo-bar-row { margin-bottom: 8px; }
        .lp-demo-bar-meta { display: flex; justify-content: space-between; font-size: 0.62rem; color: #52525b; margin-bottom: 3px; }
        .lp-demo-bar-track { background: #18181b; border-radius: 9999px; height: 3px; overflow: hidden; }
        .lp-demo-bar-fill { height: 100%; border-radius: 9999px; transition: width 0.5s ease; }

        /* DEMO FOOTER BAR */
        .lp-demo-footer-bar {
          border-top: 1px solid rgba(39,39,42,0.4); padding: 8px 16px;
          display: flex; justify-content: space-between; align-items: center;
          flex-shrink: 0; background: #09090b;
        }
        .lp-demo-footer-text { font-size: 0.68rem; color: #3f3f46; }

        /* ADD MODAL */
        .lp-add-modal-backdrop {
          position: absolute; inset: 0; background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px); display: flex; align-items: center;
          justify-content: center; padding: 1rem; z-index: 10;
        }
        .lp-add-modal {
          background: #111113; border: 1px solid #27272a; border-radius: 12px;
          width: 100%; max-width: 480px; box-shadow: 0 32px 64px rgba(0,0,0,0.6);
        }
        .lp-add-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid #27272a;
        }
        .lp-add-modal-title { font-size: 0.95rem; font-weight: 700; letter-spacing: -0.02em; }
        .lp-add-modal-close {
          width: 28px; height: 28px; background: #18181b; border: 1px solid #27272a;
          border-radius: 6px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #71717a; font-size: 0.9rem; transition: background 0.15s, color 0.15s;
        }
        .lp-add-modal-close:hover { background: #27272a; color: #fafafa; }
        .lp-add-modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .lp-add-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .lp-field { display: flex; flex-direction: column; gap: 5px; }
        .lp-field.full { grid-column: 1/-1; }
        .lp-field label { font-size: 0.68rem; color: #71717a; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
        .lp-field input, .lp-field select {
          background: #18181b; border: 1px solid #27272a; border-radius: 7px;
          padding: 8px 10px; font-size: 0.83rem; color: #fafafa; font-family: inherit;
          outline: none; transition: border-color 0.15s;
        }
        .lp-field input:focus, .lp-field select:focus { border-color: #52525b; }
        .lp-field input::placeholder { color: #3f3f46; }
        .lp-field select option { background: #18181b; }
        .lp-add-error { font-size: 0.75rem; color: #f87171; }
        .lp-add-submit {
          width: 100%; background: #fafafa; color: #09090b;
          border: none; border-radius: 7px; padding: 9px;
          font-size: 0.83rem; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: background 0.15s;
        }
        .lp-add-submit:hover { background: #e4e4e7; }

        /* DEMO NOTICE */
        .lp-demo-notice {
          background: #18181b; border-bottom: 1px solid rgba(39,39,42,0.5);
          padding: 8px 16px; font-size: 0.72rem; color: #52525b;
          display: flex; align-items: center; gap: 6px; flex-shrink: 0;
        }

        /* BULK BAR */
        .lp-bulk-bar {
          display: flex; align-items: center; gap: 6px; padding: 10px 16px;
          border-bottom: 1px solid rgba(39,39,42,0.5); background: #111113; flex-shrink: 0;
        }
        .lp-bulk-count { font-size: 0.8rem; font-weight: 700; flex: 1; }
        .lp-bulk-del {
          display: flex; align-items: center; gap: 4px;
          background: #18181b; border: 1px solid #27272a; border-radius: 6px;
          padding: 6px 10px; font-size: 0.75rem; color: #f87171; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: border-color 0.15s;
        }
        .lp-bulk-del:hover { border-color: rgba(248,113,113,0.4); }
        .lp-bulk-clear {
          font-size: 0.75rem; color: #52525b; cursor: pointer; background: none; border: none;
          font-family: inherit; padding: 4px 8px; transition: color 0.15s;
        }
        .lp-bulk-clear:hover { color: #a1a1aa; }

        @media (max-width: 768px) {
          .lp-nav { padding: 0 1rem; }
          .lp-nav-links { display: none; }
          .lp-features-grid { grid-template-columns: 1fr; }
          .lp-stats-row { grid-template-columns: 1fr; }
          .lp-stack-grid { grid-template-columns: repeat(3,1fr); }
          .lp-demo-sidebar { display: none; }
          .lp-mock-sidebar { display: none; }
          .lp-mock-th, .lp-mock-tr { grid-template-columns: 28px 1fr 80px; }
          .lp-mock-th span:nth-child(3), .lp-mock-th span:nth-child(4),
          .lp-mock-tr > *:nth-child(3), .lp-mock-tr > *:nth-child(4) { display: none; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`lp-nav${navScrolled ? " scrolled" : ""}`}>
        <a href="#" className="lp-nav-brand">
          TrackR
        </a>
        <ul className="lp-nav-links">
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#stack">Stack</a>
          </li>
          <li>
            <a
              href="https://github.com/wendell-costa-barreto/TrackR"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://track-r-gold.vercel.app/dashboard"
              className="lp-nav-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Started
            </a>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <header className="lp-hero">
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          Open Source · Free to Self-Host
        </div>
        <h1 className="lp-hero-title">
          Your job search,
          <br />
          <span>finally in order.</span>
        </h1>
        <p className="lp-hero-sub">
          TrackR is a full-stack job application tracker — real-time stats, bulk
          actions, undo history, trash & restore, and multi-currency support.
        </p>
        <div className="lp-hero-actions">
          <a
            href="https://track-r-gold.vercel.app/dashboard"
            className="lp-btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Start Tracking Free
          </a>
          <button
            className="lp-btn-secondary"
            onClick={() => setDemoOpen(true)}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5,3 13,8 5,13" />
            </svg>
            Try Live Demo
          </button>
        </div>

        {/* STATIC PREVIEW MOCKUP */}
        <div className="lp-preview">
          <div className="lp-window">
            <div className="lp-window-bar">
              <span className="lp-dot lp-dot-r" />
              <span className="lp-dot lp-dot-y" />
              <span className="lp-dot lp-dot-g" />
              <span className="lp-window-url">
                track-r-gold.vercel.app/dashboard
              </span>
            </div>
            {/* mock nav */}
            <div className="lp-mock-nav">
              <span className="lp-mock-brand">TrackR</span>
              <div className="lp-mock-search">
                <svg
                  className="lp-mock-search-icon"
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
                <div className="lp-mock-input" style={{ color: "#3f3f46" }}>
                  Search…
                </div>
              </div>
              <div className="lp-mock-nav-right">
                <div className="lp-mock-icon-btn">🌍</div>
                <div className="lp-mock-icon-btn">
                  <svg
                    width="11"
                    height="11"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h10a4 4 0 010 8H9M3 10l3-3M3 10l3 3"
                    />
                  </svg>
                </div>
                <div className="lp-mock-icon-btn">
                  <svg
                    width="11"
                    height="11"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 10H11a4 4 0 000 8h4M21 10l-3-3m3 3l-3 3"
                    />
                  </svg>
                </div>
                <div className="lp-mock-add-btn">
                  <svg
                    width="10"
                    height="10"
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
                  Add
                </div>
                <div className="lp-mock-avatar">JD</div>
              </div>
            </div>
            {/* mock stats */}
            <div className="lp-mock-stats">
              <div className="lp-mock-stat">
                <div className="lp-mock-stat-label">Total Applications</div>
                <div className="lp-mock-stat-val">24</div>
              </div>
              <div className="lp-mock-stat">
                <div className="lp-mock-stat-label">Response Rate</div>
                <div className="lp-mock-stat-val">42%</div>
              </div>
              <div className="lp-mock-stat">
                <div className="lp-mock-stat-label">Interviews</div>
                <div className="lp-mock-stat-val accent">6</div>
              </div>
              <div className="lp-mock-stat">
                <div className="lp-mock-stat-label">Offers</div>
                <div className="lp-mock-stat-val">2</div>
              </div>
            </div>
            {/* mock main */}
            <div className="lp-mock-main">
              <div className="lp-mock-content">
                <div className="lp-mock-toolbar">
                  <div className="lp-mock-toolbar-left">
                    <div className="lp-mock-checkbox" />
                    <span className="lp-mock-toolbar-title">
                      All Applications
                    </span>
                  </div>
                  <div className="lp-mock-toolbar-right">
                    <div className="lp-mock-select">Recent</div>
                    <div className="lp-mock-filter-btn">Filter</div>
                  </div>
                </div>
                <div className="lp-mock-table">
                  <div className="lp-mock-th">
                    <span></span>
                    <span>COMPANY</span>
                    <span>ROLE</span>
                    <span>SALARY</span>
                    <span>DATE</span>
                    <span>STATUS</span>
                  </div>
                  {DEMO_SEED.map((r) => (
                    <div className="lp-mock-tr" key={r.id}>
                      <div className="lp-mock-checkbox" />
                      <span className="lp-mock-company">{r.company}</span>
                      <span className="lp-mock-role">{r.role}</span>
                      <span className="lp-mock-salary">{r.salary}</span>
                      <span className="lp-mock-date">{r.date}</span>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-mock-sidebar">
                <div className="lp-mock-sidebar-title">PIPELINE</div>
                {(
                  [
                    "Applied",
                    "Interview",
                    "Offer",
                    "Rejected",
                    "Ghosted",
                  ] as DemoStatus[]
                ).map((s) => (
                  <div className="lp-mock-sidebar-item" key={s}>
                    <span className="lp-mock-sidebar-status">{s}</span>
                    <span className="lp-mock-sidebar-count">
                      {DEMO_SEED.filter((e) => e.status === s).length}
                    </span>
                  </div>
                ))}
                <div className="lp-mock-bar-wrap">
                  {[
                    { l: "Response", v: 42, c: "#60a5fa" },
                    { l: "Interview", v: 25, c: "#fbbf24" },
                    { l: "Offer", v: 8, c: "#4ade80" },
                  ].map((b) => (
                    <div key={b.l}>
                      <div className="lp-mock-bar-label">
                        <span>{b.l}</span>
                        <span>{b.v}%</span>
                      </div>
                      <div className="lp-mock-bar-track">
                        <div
                          className="lp-mock-bar-fill"
                          style={{ width: `${b.v}%`, background: b.c }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="lp-divider" />

      {/* FEATURES */}
      <section className="lp-section" id="features">
        <div className="reveal">
          <div className="lp-section-tag">Features</div>
          <h2 className="lp-section-title">Everything your job hunt needs</h2>
          <p className="lp-section-sub">
            Built from real experience in the job market. Every feature exists
            because it was missed.
          </p>
        </div>
        <div className="lp-features-grid reveal">
          {[
            [
              "📊",
              "Live Statistics",
              "Real-time counters for total applications, response rate, interview count, and offers — updated instantly.",
            ],
            [
              "↩️",
              "Undo / Redo",
              "Session-scoped history stack. Undo or redo any action with ⌘Z — nothing is ever accidentally lost.",
            ],
            [
              "☑️",
              "Bulk Actions",
              "Select multiple applications to update their status, append notes, or delete them in one step.",
            ],
            [
              "🗑️",
              "Trash & Restore",
              "Deleted entries go to a recoverable bin. Nothing is permanently gone until you say so.",
            ],
            [
              "💱",
              "Multi-Currency",
              "View salaries in GBP, USD, CAD, AUD, EUR, or BRL. Preference is persisted automatically.",
            ],
            [
              "🔒",
              "Secure by Default",
              "Google OAuth with PKCE, Row Level Security on every query, and optional TOTP two-factor auth.",
            ],
            [
              "🔍",
              "Search & Filter",
              "Full-text search across company and role with one-click status filtering and flexible sort options.",
            ],
            [
              "🎓",
              "Onboarding Tour",
              "An 8-step interactive overlay guides new users. Always restartable from the avatar menu.",
            ],
            [
              "📱",
              "Fully Responsive",
              "Mobile-first layout with a collapsible activity sidebar. Manage your pipeline from any device.",
            ],
          ].map(([icon, name, desc]) => (
            <div className="lp-feature" key={name as string}>
              <div className="lp-feature-icon">{icon}</div>
              <div className="lp-feature-name">{name}</div>
              <p className="lp-feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-divider" />

      {/* STATS */}
      <section className="lp-section">
        <div
          className="reveal"
          style={{ textAlign: "center", maxWidth: 500, margin: "0 auto" }}
        >
          <div className="lp-section-tag" style={{ justifyContent: "center" }}>
            Built for real job seekers
          </div>
          <h2 className="lp-section-title">Numbers that matter</h2>
        </div>
        <div className="lp-stats-row reveal">
          <div className="lp-stat-box">
            <div className="lp-stat-num">100%</div>
            <div className="lp-stat-label">Free to use & self-host</div>
          </div>
          <div className="lp-stat-box">
            <div className="lp-stat-num">6</div>
            <div className="lp-stat-label">Supported currencies</div>
          </div>
          <div className="lp-stat-box">
            <div className="lp-stat-num">∞</div>
            <div className="lp-stat-label">Applications you can track</div>
          </div>
        </div>
      </section>

      <div className="lp-divider" />

      {/* STACK */}
      <section className="lp-section" id="stack">
        <div className="reveal">
          <div className="lp-section-tag">Tech Stack</div>
          <h2 className="lp-section-title">Thoughtfully assembled</h2>
          <p className="lp-section-sub">
            Each technology was chosen deliberately — React for the UI, Supabase
            for everything backend, TypeScript for safety.
          </p>
        </div>
        <div className="lp-stack-grid reveal">
          {[
            ["⚛️", "React 18"],
            ["🔷", "TypeScript"],
            ["🟢", "Supabase"],
            ["🌊", "Tailwind CSS"],
            ["⚡", "Vite"],
          ].map(([icon, name]) => (
            <div className="lp-stack-item" key={name as string}>
              <div className="lp-stack-icon">{icon}</div>
              <div className="lp-stack-name">{name}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="lp-divider" />

      {/* CTA */}
      <div className="lp-cta">
        <div className="reveal">
          <h2 className="lp-cta-title">
            Stop losing track.
            <br />
            <span style={{ color: "#71717a", fontWeight: 300 }}>
              Start tracking.
            </span>
          </h2>
          <p className="lp-cta-sub">
            Free, open-source, and ready for your next application. Sign in with
            Google and get going in under a minute.
          </p>
          <div className="lp-cta-btns">
            <a
              href="https://track-r-gold.vercel.app/dashboard"
              className="lp-btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Launch TrackR
            </a>
            <button
              className="lp-btn-secondary"
              onClick={() => setDemoOpen(true)}
            >
              Try Demo First
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <span className="lp-footer-brand">TrackR</span>
        <ul className="lp-footer-links">
          <li>
            <a
              href="https://github.com/wendell-costa-barreto/TrackR"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://track-r-gold.vercel.app/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              App
            </a>
          </li>
          <li>
            <a
              href="https://github.com/wendell-costa-barreto/TrackR/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
          </li>
        </ul>
        <span className="lp-footer-copy">
          MIT License · Built with ♥ for job seekers
        </span>
      </footer>

      {/* LIVE DEMO OVERLAY */}
      <div
        className={`lp-demo-overlay${demoOpen ? " open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDemoOpen(false);
        }}
      >
        <div className="lp-demo-window">
          {/* Demo notice bar */}
          <div className="lp-demo-notice">
            <span>⚡</span>
            <span>
              Live demo — data is local to this session only.{" "}
              <a
                href="https://track-r-gold.vercel.app/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#a1a1aa", textDecoration: "underline" }}
              >
                Sign up
              </a>{" "}
              to persist your pipeline.
            </span>
            <button
              onClick={() => setDemoOpen(false)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: "#52525b",
                cursor: "pointer",
                fontSize: "1rem",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Demo nav */}
          <div className="lp-demo-nav">
            <span className="lp-demo-brand">TrackR</span>
            <div className="lp-demo-search-wrap">
              <svg
                className="lp-demo-search-icon"
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
                className="lp-demo-search"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="lp-demo-nav-right">
              <div className="lp-demo-icon-btn" title="Currency">
                🌍
              </div>
              <div
                className="lp-demo-icon-btn"
                title="Undo (disabled in demo)"
                style={{ opacity: 0.3 }}
              >
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a4 4 0 010 8H9M3 10l3-3M3 10l3 3"
                  />
                </svg>
              </div>
              <div
                className="lp-demo-icon-btn"
                title="Redo (disabled in demo)"
                style={{ opacity: 0.3 }}
              >
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 10H11a4 4 0 000 8h4M21 10l-3-3m3 3l-3 3"
                  />
                </svg>
              </div>
              <button
                className="lp-demo-add-btn"
                onClick={() => setShowAddModal(true)}
              >
                <svg
                  width="12"
                  height="12"
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
                Add
              </button>
              <div className="lp-demo-avatar" style={{ position: "relative" }}>
                JD
              </div>
            </div>
          </div>

          {/* Demo stat cards */}
          <div className="lp-demo-stats">
            <div className="lp-demo-stat">
              <div className="lp-demo-stat-label">Total Applications</div>
              <div className="lp-demo-stat-val">{stats.total}</div>
            </div>
            <div className="lp-demo-stat">
              <div className="lp-demo-stat-label">Response Rate</div>
              <div className="lp-demo-stat-val">{stats.responseRate}%</div>
            </div>
            <div className="lp-demo-stat">
              <div className="lp-demo-stat-label">Interviews</div>
              <div className="lp-demo-stat-val accent">{stats.interviews}</div>
            </div>
            <div className="lp-demo-stat">
              <div className="lp-demo-stat-label">Offers</div>
              <div className="lp-demo-stat-val">{stats.offers}</div>
            </div>
          </div>

          {/* Demo body */}
          <div className="lp-demo-body">
            <div className="lp-demo-main">
              {/* Bulk bar or toolbar */}
              {selected.size > 0 ? (
                <div className="lp-bulk-bar">
                  <input
                    type="checkbox"
                    className="lp-demo-check"
                    checked={allSelected}
                    onChange={toggleAll}
                  />
                  <span className="lp-bulk-count">
                    {selected.size} selected
                  </span>
                  <button className="lp-bulk-del" onClick={deleteSelected}>
                    <svg
                      width="12"
                      height="12"
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
                    Delete
                  </button>
                  <button
                    className="lp-bulk-clear"
                    onClick={() => setSelected(new Set())}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="lp-demo-toolbar">
                  <div className="lp-demo-toolbar-left">
                    <input
                      type="checkbox"
                      className="lp-demo-check"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                    <span className="lp-demo-toolbar-title">
                      All Applications
                    </span>
                  </div>
                  <div className="lp-demo-toolbar-right">
                    <select className="lp-demo-select">
                      <option>Recent</option>
                      <option>Salary</option>
                      <option>Company</option>
                    </select>
                    <div style={{ position: "relative" }}>
                      <button
                        className={`lp-demo-filter-btn${filter !== "All" ? " active" : ""}`}
                        onClick={() => setShowFilter((v) => !v)}
                      >
                        <svg
                          width="11"
                          height="11"
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
                        {filter === "All" ? "Filter" : filter}
                      </button>
                      {showFilter && (
                        <div className="lp-demo-filter-dropdown">
                          {(["All", ...STATUSES] as const).map((s) => (
                            <button
                              key={s}
                              className={`lp-demo-filter-opt${filter === s ? " active" : ""}`}
                              onClick={() => {
                                setFilter(s as DemoStatus | "All");
                                setShowFilter(false);
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="lp-demo-table-wrap">
                {filtered.length === 0 ? (
                  <div className="lp-demo-empty">
                    <div className="lp-demo-empty-icon">📋</div>
                    <div className="lp-demo-empty-text">
                      No applications yet
                    </div>
                    <div className="lp-demo-empty-sub">
                      Click "Add" to log your first one
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="lp-demo-th">
                      <span></span>
                      <span>COMPANY</span>
                      <span>ROLE</span>
                      <span>SALARY</span>
                      <span>STATUS</span>
                      <span></span>
                    </div>
                    {filtered.map((e) => (
                      <div className="lp-demo-tr" key={e.id}>
                        <input
                          type="checkbox"
                          className="lp-demo-check"
                          checked={selected.has(e.id)}
                          onChange={() =>
                            setSelected((s) => {
                              const n = new Set(s);
                              n.has(e.id) ? n.delete(e.id) : n.add(e.id);
                              return n;
                            })
                          }
                        />
                        <span className="lp-demo-company">{e.company}</span>
                        <span className="lp-demo-role">{e.role}</span>
                        <span className="lp-demo-salary">
                          {e.salary || "—"}
                        </span>
                        <StatusBadge status={e.status} />
                        <button
                          className="lp-demo-del-btn"
                          onClick={() => deleteEntry(e.id)}
                          title="Delete"
                        >
                          <svg
                            width="11"
                            height="11"
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
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Footer bar */}
              <div className="lp-demo-footer-bar">
                <span className="lp-demo-footer-text">
                  {filtered.length} of {entries.length} applications
                </span>
                <span className="lp-demo-footer-text">TrackR v1.0</span>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lp-demo-sidebar">
              <div className="lp-demo-sidebar-section">
                <div className="lp-demo-sidebar-label">Pipeline</div>
                {STATUSES.map((s) => {
                  const count = entries.filter((e) => e.status === s).length;
                  return (
                    <div className="lp-demo-sidebar-row" key={s}>
                      <span className="lp-demo-sidebar-status">{s}</span>
                      <span className="lp-demo-sidebar-count">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="lp-demo-bar-section">
                <div className="lp-demo-sidebar-label">Rates</div>
                {[
                  { l: "Response", v: stats.responseRate, c: "#60a5fa" },
                  {
                    l: "Interview",
                    v: entries.length
                      ? Math.round((stats.interviews / entries.length) * 100)
                      : 0,
                    c: "#fbbf24",
                  },
                  {
                    l: "Offer",
                    v: entries.length
                      ? Math.round((stats.offers / entries.length) * 100)
                      : 0,
                    c: "#4ade80",
                  },
                ].map((b) => (
                  <div className="lp-demo-bar-row" key={b.l}>
                    <div className="lp-demo-bar-meta">
                      <span>{b.l}</span>
                      <span>{b.v}%</span>
                    </div>
                    <div className="lp-demo-bar-track">
                      <div
                        className="lp-demo-bar-fill"
                        style={{ width: `${b.v}%`, background: b.c }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add modal */}
          {showAddModal && (
            <div
              className="lp-add-modal-backdrop"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowAddModal(false);
              }}
            >
              <div className="lp-add-modal">
                <div className="lp-add-modal-header">
                  <span className="lp-add-modal-title">Add Application</span>
                  <button
                    className="lp-add-modal-close"
                    onClick={() => setShowAddModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="lp-add-modal-body">
                  <div className="lp-add-modal-grid">
                    <div className="lp-field">
                      <label>Company *</label>
                      <input
                        placeholder="e.g. Stripe"
                        value={form.company}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, company: e.target.value }))
                        }
                      />
                    </div>
                    <div className="lp-field">
                      <label>Role *</label>
                      <input
                        placeholder="e.g. Frontend Engineer"
                        value={form.role}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, role: e.target.value }))
                        }
                      />
                    </div>
                    <div className="lp-field">
                      <label>Salary</label>
                      <input
                        placeholder="e.g. £75,000"
                        value={form.salary}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, salary: e.target.value }))
                        }
                      />
                    </div>
                    <div className="lp-field">
                      <label>Status</label>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            status: e.target.value as DemoStatus,
                          }))
                        }
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="lp-field full">
                      <label>Notes</label>
                      <input
                        placeholder="Any notes…"
                        value={form.notes}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, notes: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  {formError && <div className="lp-add-error">{formError}</div>}
                  <button className="lp-add-submit" onClick={addEntry}>
                    + Log Application
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reveal observer */}
      <RevealObserver />
    </>
  );
}

function RevealObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return null;
}
