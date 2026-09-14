import * as React from "react";
import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PatientContext } from "../context/PatientContext";
import { useThemeMode } from "../context/ThemeModeContext";
import { clearAccessCode, getWorkspaceCredentials } from "../config/api";
import CommandPalette from "./CommandPalette";

const ICONS = {
  it: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 10h6M9 14h6M9 18h3" />
    </svg>
  ),
  ent: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <path d="M4 12h2M8 5v14M12 2v20M16 7v10M20 10v4" />
    </svg>
  ),
  vision: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  general: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <path d="M12 20.6s-7.4-4.6-9.8-9.2C.8 8.2 2.4 5 5.6 5c1.9 0 3.3 1 4.4 2.5C11.1 6 12.5 5 14.4 5c3.2 0 4.8 3.2 3.4 6.4C15.4 16 12 20.6 12 20.6z" />
      <path d="M4.5 12h3l1.4-2.6L11 14l1.6-2.6H18" />
    </svg>
  ),
  dental: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <path d="M8 3.4c1 0 1.8.7 2.8.7 1 0 1.8-.7 2.8-.7 2.7 0 4.2 3 3.3 6.4-.6 2-1.1 5.7-2.5 7.9-.6 1-1.4.4-1.8-1-.4-1.4-1-3-1.8-3s-1.4 1.6-1.8 3c-.4 1.4-1.2 2-1.8 1-1.4-2.2-1.9-5.9-2.5-7.9C3.8 6.4 5.3 3.4 8 3.4z" />
    </svg>
  ),
  patients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <circle cx="9" cy="8" r="3.1" />
      <path d="M3.6 20c0-3.4 2.4-5.6 5.4-5.6s5.4 2.2 5.4 5.6" />
      <circle cx="17.4" cy="8.4" r="2.3" />
      <path d="M15.3 14.6c2.6.4 4.3 2.4 4.3 5.4" />
    </svg>
  ),
};

const NAV_ITEMS: Array<{ label: string; path: string; icon: keyof typeof ICONS }> = [
  { label: "IT", path: "/it", icon: "it" },
  { label: "ENT", path: "/ent", icon: "ent" },
  { label: "Vision", path: "/vision", icon: "vision" },
  { label: "General", path: "/general", icon: "general" },
  { label: "Dental", path: "/dental", icon: "dental" },
  { label: "Patients List", path: "/patients", icon: "patients" },
];

const CRUMB: Record<string, string> = {
  "/": "IT Dashboard",
  "/it": "IT Dashboard",
  "/ent": "ENT Examination Report",
  "/vision": "Vision Examination Report",
  "/general": "General Examination Report",
  "/dental": "Dental Examination Report",
  "/patients": "Patients List",
};

const CONNECTION_COPY: Record<string, { label: string; className: string }> = {
  connected: { label: "Clinic synced", className: "hf-pill sync done live" },
  connecting: { label: "Connecting…", className: "hf-pill sync progress" },
  error: { label: "Connection lost", className: "hf-pill sync bad" },
};

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * The persistent application chrome: a department sidebar (collapsing to an
 * off-canvas drawer under 880px), a topbar carrying the route title, the
 * live Socket.IO connection status, and the light/dark toggle, plus the
 * Cmd/Ctrl+K jump-to palette. Department pages themselves (via
 * DashboardShell) only render the content that goes inside `.hf-screen-area`.
 */
const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const { connectionStatus } = useContext(PatientContext);
  const { mode, toggleMode } = useThemeMode();
  const credentials = getWorkspaceCredentials();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(open => !open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const lockWorkspace = () => {
    clearAccessCode();
    sessionStorage.removeItem("patientData");
    window.location.reload();
  };

  const crumb = CRUMB[location.pathname] || "Page not found";
  const conn = CONNECTION_COPY[connectionStatus] || CONNECTION_COPY.connecting;
  const userInitials = (credentials.userId.replace(/[^a-zA-Z]/g, "").slice(0, 2) || "DU").toUpperCase();
  const isNavActive = (path: string) =>
    path === "/it" ? location.pathname === "/it" || location.pathname === "/" : location.pathname === path;

  return (
    <div className="hf-shell">
      <a href="#main-content" className="hf-skip-link">Skip to main content</a>

      {sidebarOpen && <div className="hf-sidebar-scrim" onClick={() => setSidebarOpen(false)} />}

      <aside className={`hf-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="hf-brand-row">
          <div className="hf-brand-mark" aria-hidden="true" />
          <div>
            <div className="hf-brand-word">HealthFlow</div>
            <div className="hf-brand-tag font-mono">health-camp workspace</div>
          </div>
        </div>

        <div className="hf-clinic-row" title="Sign in with a different clinic via Lock">
          <span className="hf-ws-dot" />
          <span style={{ minWidth: 0 }}>
            <b>Clinic {credentials.clinicId}</b>
            <span className="hf-ws-sub">{credentials.userId}</span>
          </span>
        </div>

        <nav className="hf-nav" aria-label="Primary">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className="hf-nav-item"
              aria-current={isNavActive(item.path) ? "page" : undefined}
            >
              {ICONS[item.icon]}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hf-sidebar-foot">
          <button type="button" className="hf-cmdk-trigger" onClick={() => setPaletteOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" style={{ width: 15, height: 15 }}>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            Jump to…
            <kbd style={{ marginLeft: "auto" }}>⌘K</kbd>
          </button>
          <div className="hf-user-row">
            <div className="hf-avatar" style={{ "--hf-dc": "rgb(var(--hf-hue-it))" } as React.CSSProperties}>{userInitials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="hf-user-name">{credentials.userId}</div>
              <div className="hf-user-role">HealthFlow user</div>
            </div>
          </div>
          <button type="button" className="hf-nav-item" onClick={lockWorkspace}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
              <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Lock
          </button>
          <a className="hf-ecosystem-link" href="https://github.com/abheet19" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            abheet19 · ecosystem
          </a>
          <div className="hf-sidebar-copyright">© 2026 Abheet Singh</div>
        </div>
      </aside>

      <div className="hf-main-col">
        <header className="hf-topbar">
          <button
            type="button"
            className="hf-icon-btn hf-hamburger"
            aria-label="Open navigation menu"
            onClick={() => setSidebarOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <div className="hf-crumb"><b>{crumb}</b></div>
          <div style={{ flex: 1 }} />
          <button type="button" className={conn.className} title="Live connection to the HealthFlow server">
            <span className="hf-dot" /> {conn.label}
          </button>
          <button
            type="button"
            className="hf-icon-btn"
            aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={toggleMode}
          >
            {mode === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="4.4" /><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M20.6 14.7A8.6 8.6 0 1 1 9.3 3.4a7 7 0 0 0 11.3 11.3z" /></svg>
            )}
          </button>
        </header>

        <main id="main-content" tabIndex={-1} className="hf-screen-area">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default AppShell;
