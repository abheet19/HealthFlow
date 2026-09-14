import * as React from "react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PatientContext } from "../context/PatientContext";
import { clearAccessCode } from "../config/api";

interface CommandItem {
  label: string;
  meta?: string;
  group: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const SCREENS: Array<{ label: string; path: string }> = [
  { label: "Go to IT Dashboard", path: "/it" },
  { label: "Go to ENT", path: "/ent" },
  { label: "Go to Vision", path: "/vision" },
  { label: "Go to General", path: "/general" },
  { label: "Go to Dental", path: "/dental" },
  { label: "Go to Patients List", path: "/patients" },
];

/**
 * Cmd/Ctrl+K jump-to palette: department screens, the active in-flight
 * patient draft (when one exists), and workspace-level actions. Pure
 * client-side navigation - it never calls the API, so it's safe to open
 * from anywhere without side effects until an item is actually chosen.
 */
const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { patientData } = useContext(PatientContext);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Kept in sync every render and read from the document-level keydown
  // listener below, so arrow/Enter navigation always sees the current
  // filtered list and selection even though the listener itself is only
  // (re)attached when the palette opens or closes.
  const filteredRef = useRef<CommandItem[]>([]);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const lockWorkspace = () => {
    clearAccessCode();
    sessionStorage.removeItem("patientData");
    window.location.reload();
  };

  const items = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = SCREENS.map(s => ({
      label: s.label,
      group: "Screens",
      action: () => navigate(s.path),
    }));
    if (patientData.patientId) {
      list.push({
        label: patientData.it?.name || "Active patient",
        meta: `${patientData.patientId} · active draft`,
        group: "Active draft",
        action: () => navigate("/it"),
      });
    }
    list.push({ label: "Lock workspace", group: "Account", action: lockWorkspace });
    return list;
  }, [patientData.patientId, patientData.it?.name, navigate]);

  const filtered = useMemo(
    () => (query ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())) : items),
    [items, query],
  );
  filteredRef.current = filtered;
  activeIndexRef.current = activeIndex;

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const choose = (item: CommandItem) => {
    item.action();
    onClose();
  };

  // A document-level (capture-phase) listener rather than an onKeyDown on
  // the input: keeps arrow/Enter/Escape working even if focus ever lands on
  // a result row (hover + Enter) instead of the input itself.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      const list = filteredRef.current;
      if (!list.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex(i => Math.min(i + 1, list.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const item = list[activeIndexRef.current];
        if (item) choose(item);
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const groups: Array<{ group: string; entries: Array<{ item: CommandItem; flatIndex: number }> }> = [];
  filtered.forEach((item, flatIndex) => {
    let bucket = groups.find(g => g.group === item.group);
    if (!bucket) {
      bucket = { group: item.group, entries: [] };
      groups.push(bucket);
    }
    bucket.entries.push({ item, flatIndex });
  });

  return (
    <div className="hf-cmdk-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="hf-cmdk-box hf-glass"
        role="dialog"
        aria-modal="true"
        aria-label="Jump to"
      >
        <input
          ref={inputRef}
          className="hf-cmdk-input"
          type="text"
          placeholder="Jump to a department, patient, or action…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="hf-cmdk-list" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="hf-cmdk-empty">No matches for &ldquo;{query}&rdquo;</div>
          ) : (
            groups.map(g => (
              <div key={g.group}>
                <div className="hf-cmdk-group">{g.group}</div>
                {g.entries.map(({ item, flatIndex }) => (
                  <button
                    key={item.label}
                    type="button"
                    className="hf-cmdk-item"
                    data-active={flatIndex === activeIndex}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    onClick={() => choose(item)}
                  >
                    <span>{item.label}</span>
                    {item.meta && <span className="hf-cmdk-meta">{item.meta}</span>}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
