import React, { useState, useEffect, useCallback, useRef } from "react";

// Type definitions
type DemoStatus = "Applied" | "Interview" | "Offer" | "Rejected";

interface DemoEntry {
  id: number;
  company: string;
  role: string;
  salary: string;
  status: DemoStatus;
  notes: string;
}

interface DemoFormState {
  company: string;
  role: string;
  salary: string;
  status: DemoStatus;
  notes: string;
}

/**
 * TrackR Landing Page Component
 * A complete conversion of the original HTML/CSS/JS page into a React functional component.
 * Includes all styles, animations, interactive demo modal, scroll reveals, and navbar behavior.
 */
const TrackRLanding: React.FC = () => {
  // State for demo modal visibility
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  // State for demo entries array
  const [demoEntries, setDemoEntries] = useState<DemoEntry[]>([]);

  // State for demo form fields
  const [demoForm, setDemoForm] = useState<DemoFormState>({
    company: "",
    role: "",
    salary: "",
    status: "Applied",
    notes: "",
  });

  // State for navbar scroll effect
  const [isNavScrolled, setIsNavScrolled] = useState<boolean>(false);

  // Ref for the navbar element to apply class
  const navbarRef = useRef<HTMLElement>(null);

  // --- Helper: Add demo entry ---
  const addDemoEntry = useCallback((): void => {
    const { company, role, salary, status, notes } = demoForm;
    if (!company.trim() || !role.trim()) {
      // Focus on company field if validation fails
      const companyInput = document.getElementById(
        "d-company",
      ) as HTMLInputElement | null;
      if (companyInput) companyInput.focus();
      return;
    }

    const newEntry: DemoEntry = {
      id: Date.now(),
      company: company.trim(),
      role: role.trim(),
      salary: salary.trim(),
      status,
      notes: notes.trim(),
    };

    setDemoEntries((prev) => [newEntry, ...prev]);

    // Reset form fields
    setDemoForm({
      company: "",
      role: "",
      salary: "",
      status: "Applied",
      notes: "",
    });
  }, [demoForm]);

  // --- Helper: Remove demo entry ---
  const removeDemoEntry = useCallback((id: number): void => {
    setDemoEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  // --- Handle demo form input changes ---
  const handleDemoInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { id, value } = e.target;
    // Map input IDs to state keys
    const keyMap: Record<string, keyof DemoFormState> = {
      "d-company": "company",
      "d-role": "role",
      "d-salary": "salary",
      "d-status": "status",
      "d-notes": "notes",
    };
    const stateKey = keyMap[id];
    if (stateKey) {
      setDemoForm((prev) => ({
        ...prev,
        [stateKey]: stateKey === "status" ? (value as DemoStatus) : value,
      }));
    }
  };

  // --- Modal controls ---
  const openDemoModal = useCallback((): void => {
    setIsDemoModalOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeDemoModal = useCallback((): void => {
    setIsDemoModalOpen(false);
    document.body.style.overflow = "";
  }, []);

  // --- Handle escape key to close modal ---
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && isDemoModalOpen) {
        closeDemoModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isDemoModalOpen, closeDemoModal]);

  // --- Navbar scroll effect ---
  useEffect(() => {
    const handleScroll = (): void => {
      setIsNavScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- Intersection Observer for reveal animations ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    const revealElements = document.querySelectorAll(".reveal");
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []); // Empty dependency array ensures this runs once after mount

  // --- Status badge class mapper ---
  const getStatusBadgeClass = (status: DemoStatus): string => {
    const map: Record<DemoStatus, string> = {
      Applied: "badge-applied",
      Interview: "badge-interview",
      Offer: "badge-offer",
      Rejected: "badge-rejected",
    };
    return map[status] || "badge-applied";
  };

  return (
    <>
      {/* Inject global styles */}
      <style>{`
        :root {
          --bg: #09090b;
          --bg-2: #111113;
          --bg-3: #18181b;
          --border: #27272a;
          --border-2: #3f3f46;
          --text: #fafafa;
          --text-2: #a1a1aa;
          --text-3: #71717a;
          --accent: #4ade80;
          --accent-dim: #22c55e;
          --accent-glow: rgba(74, 222, 128, 0.15);
          --accent-glow-2: rgba(74, 222, 128, 0.06);
          --red: #f87171;
          --yellow: #fbbf24;
          --blue: #60a5fa;
          --purple: #a78bfa;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* ── NOISE OVERLAY ── */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1000;
          opacity: 0.4;
        }

        /* ── TYPOGRAPHY ── */
        .font-display { font-family: 'Syne', sans-serif; }
        .font-mono    { font-family: 'DM Mono', monospace; }

        /* ── NAV ── */
        nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 3rem;
          border-bottom: 1px solid transparent;
          transition: border-color 0.3s, background 0.3s, backdrop-filter 0.3s;
        }
        nav.scrolled {
          background: rgba(9,9,11,0.85);
          backdrop-filter: blur(16px);
          border-color: var(--border);
        }
        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.35rem;
          letter-spacing: -0.02em;
          color: var(--text);
          text-decoration: none;
        }
        .nav-logo span { color: var(--accent); }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
          list-style: none;
        }
        .nav-links a {
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem;
          color: var(--text-2);
          text-decoration: none;
          letter-spacing: 0.04em;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--text); }
        .nav-cta {
          background: var(--accent);
          color: #000 !important;
          padding: 0.5rem 1.25rem !important;
          border-radius: 6px;
          font-weight: 500 !important;
          transition: background 0.2s, transform 0.15s !important;
        }
        .nav-cta:hover { background: #6ee7a0 !important; transform: translateY(-1px); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 7rem 3rem 5rem;
          position: relative;
          overflow: hidden;
        }
        .hero::after {
          content: '';
          position: absolute;
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -55%);
          pointer-events: none;
        }
        .hero-inner {
          max-width: 900px;
          width: 100%;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 0.35rem 1rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          color: var(--accent);
          letter-spacing: 0.06em;
          margin-bottom: 2.5rem;
          animation: fadeUp 0.6s ease both;
        }
        .hero-badge::before {
          content: '';
          width: 6px; height: 6px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent);
          animation: pulse 2s ease infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(3.2rem, 8vw, 6.5rem);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.04em;
          margin-bottom: 1.75rem;
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .hero-title .line-2 {
          display: block;
          color: transparent;
          -webkit-text-stroke: 1px rgba(250,250,250,0.25);
        }
        .hero-title .accent-word { color: var(--accent); }
        .hero-sub {
          font-size: 1.15rem;
          color: var(--text-2);
          max-width: 560px;
          margin: 0 auto 3rem;
          line-height: 1.7;
          font-weight: 300;
          animation: fadeUp 0.6s 0.2s ease both;
        }
        .hero-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          animation: fadeUp 0.6s 0.3s ease both;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: var(--accent);
          color: #000;
          font-family: 'DM Mono', monospace;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          padding: 0.85rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 0 20px rgba(74,222,128,0.2);
        }
        .btn-primary:hover {
          background: #6ee7a0;
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(74,222,128,0.35);
        }
        .btn-primary svg { width: 16px; height: 16px; }
        .btn-demo {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          background: transparent;
          color: var(--text);
          font-family: 'DM Mono', monospace;
          font-size: 0.85rem;
          letter-spacing: 0.02em;
          padding: 0.85rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          border: 1px solid var(--border-2);
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .btn-demo:hover {
          border-color: var(--accent);
          background: var(--accent-glow-2);
          transform: translateY(-2px);
          color: var(--accent);
        }
        .btn-demo svg { width: 16px; height: 16px; }
        .hero-mockup {
          margin: 5rem auto 0;
          max-width: 900px;
          animation: fadeUp 0.8s 0.4s ease both;
          position: relative;
          z-index: 1;
        }
        .mockup-window {
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--border), 0 0 60px rgba(74,222,128,0.04);
        }
        .mockup-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.25rem;
          background: var(--bg-3);
          border-bottom: 1px solid var(--border);
        }
        .mockup-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
        }
        .dot-red    { background: #f87171; }
        .dot-yellow { background: #fbbf24; }
        .dot-green  { background: #4ade80; }
        .mockup-url {
          flex: 1;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 0.3rem 0.75rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: var(--text-3);
          margin-left: 0.5rem;
        }
        .mockup-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .mock-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }
        .mock-stat {
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem;
        }
        .mock-stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: var(--text-3);
          letter-spacing: 0.06em;
          margin-bottom: 0.4rem;
        }
        .mock-stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 1;
        }
        .mock-stat-val.green  { color: var(--accent); }
        .mock-stat-val.yellow { color: var(--yellow); }
        .mock-stat-val.blue   { color: var(--blue); }
        .mock-stat-val.purple { color: var(--purple); }
        .mock-table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1.5fr 1fr 1.2fr;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: var(--text-3);
          letter-spacing: 0.06em;
          border-bottom: 1px solid var(--border);
        }
        .mock-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1.5fr 1fr 1.2fr;
          gap: 0.5rem;
          padding: 0.65rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          align-items: center;
          transition: background 0.15s;
          animation: rowSlide 0.5s ease both;
        }
        .mock-row:hover { background: var(--bg-3); }
        .mock-row:nth-child(1) { animation-delay: 0.6s; }
        .mock-row:nth-child(2) { animation-delay: 0.75s; }
        .mock-row:nth-child(3) { animation-delay: 0.9s; }
        .mock-row:nth-child(4) { animation-delay: 1.05s; }
        .mock-row:nth-child(5) { animation-delay: 1.2s; }
        @keyframes rowSlide {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .mock-company { font-weight: 500; }
        .mock-role    { color: var(--text-2); font-size: 0.75rem; }
        .mock-salary  { font-family: 'DM Mono', monospace; font-size: 0.72rem; color: var(--text-3); }
        .mock-date    { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: var(--text-3); }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.6rem;
          border-radius: 100px;
          font-size: 0.65rem;
          font-family: 'DM Mono', monospace;
          font-weight: 500;
          width: fit-content;
        }
        .badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; }
        .badge-applied      { background: rgba(96,165,250,0.12); color: #60a5fa; border: 1px solid rgba(96,165,250,0.2); }
        .badge-applied::before  { background: #60a5fa; }
        .badge-interview    { background: rgba(251,191,36,0.12);  color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
        .badge-interview::before { background: #fbbf24; }
        .badge-offer        { background: rgba(74,222,128,0.12); color: var(--accent); border: 1px solid rgba(74,222,128,0.2); }
        .badge-offer::before     { background: var(--accent); }
        .badge-rejected     { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }
        .badge-rejected::before  { background: #f87171; }
        section { padding: 7rem 3rem; max-width: 1100px; margin: 0 auto; }
        .section-tag {
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          color: var(--accent);
          text-transform: uppercase;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .section-tag::before {
          content: '';
          width: 24px;
          height: 1px;
          background: var(--accent);
        }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 1.25rem;
        }
        .section-sub {
          font-size: 1.05rem;
          color: var(--text-2);
          max-width: 520px;
          line-height: 1.75;
          font-weight: 300;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          margin-top: 4rem;
        }
        .feature-card {
          background: var(--bg);
          padding: 2.25rem;
          transition: background 0.2s;
          position: relative;
        }
        .feature-card:hover {
          background: var(--bg-2);
        }
        .feature-card:hover .feature-icon {
          box-shadow: 0 0 20px var(--accent-glow);
          border-color: rgba(74,222,128,0.3);
        }
        .feature-icon {
          width: 42px; height: 42px;
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 10px;
          display: grid;
          place-items: center;
          margin-bottom: 1.25rem;
          font-size: 1.1rem;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .feature-name {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin-bottom: 0.5rem;
        }
        .feature-desc {
          font-size: 0.875rem;
          color: var(--text-2);
          line-height: 1.65;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 4rem;
        }
        .stat-box {
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
        }
        .stat-box-num {
          font-family: 'Syne', sans-serif;
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--accent);
          line-height: 1;
          margin-bottom: 0.5rem;
        }
        .stat-box-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          color: var(--text-3);
          letter-spacing: 0.06em;
        }
        .stack-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          margin-top: 4rem;
        }
        .stack-item {
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1.5rem 1rem;
          text-align: center;
          transition: border-color 0.2s, transform 0.2s;
        }
        .stack-item:hover {
          border-color: var(--border-2);
          transform: translateY(-3px);
        }
        .stack-icon {
          font-size: 1.75rem;
          margin-bottom: 0.6rem;
        }
        .stack-name {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: var(--text-2);
          letter-spacing: 0.04em;
        }
        .cta-section {
          padding: 7rem 3rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .cta-inner {
          max-width: 640px;
          margin: 0 auto;
          position: relative;
        }
        .cta-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.05;
          margin-bottom: 1.5rem;
        }
        .cta-sub {
          font-size: 1.05rem;
          color: var(--text-2);
          margin-bottom: 2.5rem;
          font-weight: 300;
        }
        .cta-btns {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        footer {
          border-top: 1px solid var(--border);
          padding: 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .footer-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.02em;
        }
        .footer-logo span { color: var(--accent); }
        .footer-copy {
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          color: var(--text-3);
        }
        .footer-links {
          display: flex;
          gap: 1.5rem;
          list-style: none;
        }
        .footer-links a {
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          color: var(--text-3);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--text); }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, var(--border), transparent);
          margin: 0 3rem;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          z-index: 500;
          display: grid;
          place-items: center;
          padding: 1.5rem;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .modal-backdrop.open {
          opacity: 1;
          pointer-events: all;
        }
        .modal {
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: 100%;
          max-width: 680px;
          overflow: hidden;
          transform: scale(0.96) translateY(10px);
          transition: transform 0.3s;
          box-shadow: 0 40px 80px rgba(0,0,0,0.5);
        }
        .modal-backdrop.open .modal {
          transform: scale(1) translateY(0);
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        .modal-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: -0.02em;
        }
        .modal-close {
          width: 30px; height: 30px;
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 6px;
          display: grid;
          place-items: center;
          cursor: pointer;
          color: var(--text-2);
          font-size: 1rem;
          transition: background 0.15s, color 0.15s;
        }
        .modal-close:hover { background: var(--border); color: var(--text); }
        .modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .demo-notice {
          background: var(--accent-glow-2);
          border: 1px solid rgba(74,222,128,0.15);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          color: var(--accent);
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
        }
        .demo-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .demo-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .demo-field label {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: var(--text-3);
          letter-spacing: 0.06em;
        }
        .demo-field input, .demo-field select {
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 7px;
          padding: 0.6rem 0.85rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: var(--text);
          transition: border-color 0.2s;
          outline: none;
        }
        .demo-field input:focus, .demo-field select:focus {
          border-color: rgba(74,222,128,0.4);
          box-shadow: 0 0 0 3px rgba(74,222,128,0.08);
        }
        .demo-field select option { background: var(--bg-3); }
        .demo-field.full { grid-column: 1 / -1; }
        .demo-submit {
          width: 100%;
          background: var(--accent);
          color: #000;
          border: none;
          border-radius: 8px;
          padding: 0.85rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          letter-spacing: 0.02em;
        }
        .demo-submit:hover { background: #6ee7a0; transform: translateY(-1px); }
        .demo-results {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 240px;
          overflow-y: auto;
        }
        .demo-entry {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          animation: rowSlide 0.3s ease both;
        }
        .demo-entry-info { display: flex; flex-direction: column; gap: 0.2rem; }
        .demo-entry-company { font-weight: 500; font-size: 0.9rem; }
        .demo-entry-role { font-size: 0.75rem; color: var(--text-2); }
        .demo-entry-del {
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 5px;
          color: var(--text-3);
          font-size: 0.7rem;
          padding: 0.25rem 0.6rem;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .demo-entry-del:hover { background: rgba(248,113,113,0.1); color: var(--red); border-color: var(--red); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--bg); }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        @media (max-width: 768px) {
          nav { padding: 1rem 1.5rem; }
          .nav-links { display: none; }
          .hero { padding: 6rem 1.5rem 4rem; }
          section { padding: 5rem 1.5rem; }
          .features-grid { grid-template-columns: 1fr; }
          .mock-stats { grid-template-columns: repeat(2, 1fr); }
          .mock-table-header, .mock-row { display: none; }
          .stack-grid { grid-template-columns: repeat(3, 1fr); }
          .stats-row { grid-template-columns: 1fr; }
          .cta-section { padding: 5rem 1.5rem; }
          footer { flex-direction: column; text-align: center; padding: 2rem 1.5rem; }
          .demo-fields { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Navbar */}
      <nav ref={navbarRef} className={isNavScrolled ? "scrolled" : ""}>
        <a href="#" className="nav-logo">
          Track<span>R</span>
        </a>
        <ul className="nav-links">
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
              href="https://track-r-nine.vercel.app"
              className="nav-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get Started
            </a>
          </li>
        </ul>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-badge">Open Source · Free to Self-Host</div>
          <h1 className="hero-title font-display">
            Your job search,
            <br />
            <span className="line-2">
              finally <span className="accent-word">in order</span>
            </span>
          </h1>
          <p className="hero-sub">
            TrackR is a full-stack job application tracker built for job seekers
            who take their search seriously — real-time stats, bulk actions,
            undo history, and more.
          </p>
          <div className="hero-actions">
            <a
              href="https://track-r-nine.vercel.app"
              className="btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 3v10M3 8l5 5 5-5" />
              </svg>
              Start Tracking Free
            </a>
            <button className="btn-demo" onClick={openDemoModal}>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5,3 13,8 5,13" />
              </svg>
              Try the Demo
            </button>
          </div>

          {/* Mockup Window */}
          <div className="hero-mockup">
            <div className="mockup-window">
              <div className="mockup-bar">
                <span className="mockup-dot dot-red"></span>
                <span className="mockup-dot dot-yellow"></span>
                <span className="mockup-dot dot-green"></span>
                <span className="mockup-url">
                  track-r-nine.vercel.app/dashboard
                </span>
              </div>
              <div className="mockup-body">
                <div className="mock-stats">
                  <div className="mock-stat">
                    <div className="mock-stat-label">APPLICATIONS</div>
                    <div className="mock-stat-val green">24</div>
                  </div>
                  <div className="mock-stat">
                    <div className="mock-stat-label">INTERVIEWS</div>
                    <div className="mock-stat-val yellow">6</div>
                  </div>
                  <div className="mock-stat">
                    <div className="mock-stat-label">RESPONSE RATE</div>
                    <div className="mock-stat-val blue">42%</div>
                  </div>
                  <div className="mock-stat">
                    <div className="mock-stat-label">OFFERS</div>
                    <div className="mock-stat-val purple">2</div>
                  </div>
                </div>
                <div>
                  <div className="mock-table-header">
                    <span>COMPANY</span>
                    <span>ROLE</span>
                    <span>SALARY</span>
                    <span>DATE</span>
                    <span>STATUS</span>
                  </div>
                  <div className="mock-row">
                    <span className="mock-company">Stripe</span>
                    <span className="mock-role">Frontend Engineer</span>
                    <span className="mock-salary">£75,000</span>
                    <span className="mock-date">28 May</span>
                    <span className="badge badge-interview">Interview</span>
                  </div>
                  <div className="mock-row">
                    <span className="mock-company">Linear</span>
                    <span className="mock-role">Product Designer</span>
                    <span className="mock-salary">$95,000</span>
                    <span className="mock-date">26 May</span>
                    <span className="badge badge-applied">Applied</span>
                  </div>
                  <div className="mock-row">
                    <span className="mock-company">Vercel</span>
                    <span className="mock-role">DX Engineer</span>
                    <span className="mock-salary">€82,000</span>
                    <span className="mock-date">21 May</span>
                    <span className="badge badge-offer">Offer</span>
                  </div>
                  <div className="mock-row">
                    <span className="mock-company">Notion</span>
                    <span className="mock-role">Full-Stack Dev</span>
                    <span className="mock-salary">$110,000</span>
                    <span className="mock-date">18 May</span>
                    <span className="badge badge-rejected">Rejected</span>
                  </div>
                  <div className="mock-row">
                    <span className="mock-company">Figma</span>
                    <span className="mock-role">SWE II</span>
                    <span className="mock-salary">$120,000</span>
                    <span className="mock-date">12 May</span>
                    <span className="badge badge-interview">Interview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="divider"></div>

      {/* Features Section */}
      <section id="features">
        <div className="reveal">
          <div className="section-tag">Features</div>
          <h2 className="section-title font-display">
            Everything your job hunt needs
          </h2>
          <p className="section-sub">
            Built from real experience in the job market. Every feature exists
            because it was missed.
          </p>
        </div>
        <div className="features-grid reveal">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div className="feature-name">Live Statistics</div>
            <p className="feature-desc">
              Real-time counters for total applications, response rate,
              interview count, and offers — updated the moment data changes.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">↩️</div>
            <div className="feature-name">Undo / Redo History</div>
            <p className="feature-desc">
              Made a mistake? Session-scoped history stack lets you undo or redo
              any action with{" "}
              <code style={{ color: "var(--accent)", fontSize: "0.8em" }}>
                ⌘Z
              </code>
              .
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">☑️</div>
            <div className="feature-name">Bulk Actions</div>
            <p className="feature-desc">
              Select multiple applications and update their status, append
              notes, or delete them all in a single step.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗑️</div>
            <div className="feature-name">Trash & Restore</div>
            <p className="feature-desc">
              Deleted entries go to a recoverable trash bin. Nothing is
              permanently lost until you say so.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💱</div>
            <div className="feature-name">Multi-Currency</div>
            <p className="feature-desc">
              View salaries in GBP, USD, CAD, AUD, EUR, or BRL. Your preference
              is persisted automatically.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <div className="feature-name">Secure by Default</div>
            <p className="feature-desc">
              Google OAuth with PKCE, Row Level Security on every query, and
              optional TOTP two-factor authentication.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <div className="feature-name">Search & Filter</div>
            <p className="feature-desc">
              Full-text search across company and role fields with one-click
              status filtering and flexible sort options.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <div className="feature-name">Onboarding Tour</div>
            <p className="feature-desc">
              An 8-step interactive overlay guides new users around the app.
              Always restartable from the avatar menu.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <div className="feature-name">Fully Responsive</div>
            <p className="feature-desc">
              Mobile-first layout with a collapsible activity sidebar. Manage
              your pipeline from any device.
            </p>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* Stats Section */}
      <section>
        <div
          className="reveal"
          style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}
        >
          <div className="section-tag" style={{ justifyContent: "center" }}>
            Built for real job seekers
          </div>
          <h2 className="section-title font-display">
            Numbers that matter to your search
          </h2>
        </div>
        <div className="stats-row reveal">
          <div className="stat-box">
            <div className="stat-box-num">100%</div>
            <div className="stat-box-label">Free to use & self-host</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-num">6</div>
            <div className="stat-box-label">Supported currencies</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-num">∞</div>
            <div className="stat-box-label">Applications you can track</div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* Stack Section */}
      <section id="stack">
        <div className="reveal">
          <div className="section-tag">Tech Stack</div>
          <h2 className="section-title font-display">Thoughtfully assembled</h2>
          <p className="section-sub">
            Each technology was chosen deliberately — React for the UI, Supabase
            for everything backend, TypeScript for safety.
          </p>
        </div>
        <div className="stack-grid reveal">
          <div className="stack-item">
            <div className="stack-icon">⚛️</div>
            <div className="stack-name">React 18</div>
          </div>
          <div className="stack-item">
            <div className="stack-icon">🔷</div>
            <div className="stack-name">TypeScript</div>
          </div>
          <div className="stack-item">
            <div className="stack-icon">🟢</div>
            <div className="stack-name">Supabase</div>
          </div>
          <div className="stack-item">
            <div className="stack-icon">🌊</div>
            <div className="stack-name">Tailwind CSS</div>
          </div>
          <div className="stack-item">
            <div className="stack-icon">⚡</div>
            <div className="stack-name">Vite</div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-inner reveal">
          <h2 className="cta-title font-display">
            Stop losing track.
            <br />
            <span style={{ color: "var(--accent)" }}>Start tracking.</span>
          </h2>
          <p className="cta-sub">
            TrackR is free, open-source, and ready for your next application.
            Sign in with Google and get going in under a minute.
          </p>
          <div className="cta-btns">
            <a
              href="https://track-r-nine.vercel.app"
              className="btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 16, height: 16 }}
              >
                <path d="M8 3v10M3 8l5 5 5-5" />
              </svg>
              Launch TrackR
            </a>
            <button className="btn-demo" onClick={openDemoModal}>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 16, height: 16 }}
              >
                <polygon points="5,3 13,8 5,13" />
              </svg>
              Try Demo First
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div className="footer-logo font-display">
          Track<span>R</span>
        </div>
        <ul className="footer-links">
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
              href="https://track-r-nine.vercel.app"
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
        <span className="footer-copy">
          MIT License · Built with ♥ for job seekers
        </span>
      </footer>

      {/* Demo Modal */}
      <div
        className={`modal-backdrop ${isDemoModalOpen ? "open" : ""}`}
        onClick={closeDemoModal}
      >
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title font-display">
              Try TrackR — No Sign In Needed
            </span>
            <button className="modal-close" onClick={closeDemoModal}>
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="demo-notice">
              <span>⚡</span>
              <span>
                This is a local demo — your data lives in this session only.
                Sign up for the real thing to persist your pipeline.
              </span>
            </div>

            {/* Demo Form */}
            <div className="demo-fields">
              <div className="demo-field">
                <label>COMPANY</label>
                <input
                  type="text"
                  id="d-company"
                  placeholder="e.g. Stripe"
                  value={demoForm.company}
                  onChange={handleDemoInputChange}
                />
              </div>
              <div className="demo-field">
                <label>ROLE</label>
                <input
                  type="text"
                  id="d-role"
                  placeholder="e.g. Frontend Engineer"
                  value={demoForm.role}
                  onChange={handleDemoInputChange}
                />
              </div>
              <div className="demo-field">
                <label>SALARY</label>
                <input
                  type="text"
                  id="d-salary"
                  placeholder="e.g. £75,000"
                  value={demoForm.salary}
                  onChange={handleDemoInputChange}
                />
              </div>
              <div className="demo-field">
                <label>STATUS</label>
                <select
                  id="d-status"
                  value={demoForm.status}
                  onChange={handleDemoInputChange}
                >
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="demo-field full">
                <label>NOTES (optional)</label>
                <input
                  type="text"
                  id="d-notes"
                  placeholder="Any notes about this application..."
                  value={demoForm.notes}
                  onChange={handleDemoInputChange}
                />
              </div>
            </div>
            <button className="demo-submit" onClick={addDemoEntry}>
              + Log Application
            </button>

            {/* Demo Entries List */}
            <div className="demo-results">
              {demoEntries.map((entry) => (
                <div key={entry.id} className="demo-entry">
                  <div className="demo-entry-info">
                    <span className="demo-entry-company">{entry.company}</span>
                    <span className="demo-entry-role">
                      {entry.role}
                      {entry.salary && ` · ${entry.salary}`}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                    }}
                  >
                    <span
                      className={`badge ${getStatusBadgeClass(entry.status)}`}
                    >
                      {entry.status}
                    </span>
                    <button
                      className="demo-entry-del"
                      onClick={() => removeDemoEntry(entry.id)}
                    >
                      del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TrackRLanding;
