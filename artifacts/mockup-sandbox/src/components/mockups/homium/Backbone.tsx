import { useState } from "react";
import { ChevronDown, ArrowUpRight, Menu as MenuIcon, X } from "lucide-react";
import { CASE, daysToClose, allReqs, liveClocks } from "./data";
import IntakePage from "./pages/IntakePage";
import WorkfilePage from "./pages/WorkfilePage";
import TimelinePage from "./pages/TimelinePage";
import RegisterPage from "./pages/RegisterPage";

export type PageId = "intake" | "workfile" | "timeline" | "register";
export type Go = (p: PageId) => void;

const MONO = "font-['IBM_Plex_Mono']";

const TABS: { id: PageId; label: string }[] = [
  { id: "intake", label: "Intake" },
  { id: "workfile", label: "Workfile" },
  { id: "timeline", label: "Timeline" },
  { id: "register", label: "Register" },
];

function initialPage(): PageId {
  if (typeof window !== "undefined") {
    const p = new URLSearchParams(window.location.search).get("page");
    if (p && ["intake", "workfile", "timeline", "register"].includes(p)) return p as PageId;
  }
  return "intake";
}

type MenuId = null | "case" | "next" | "nav";
function initialMenu(): MenuId {
  if (typeof window !== "undefined") {
    const o = new URLSearchParams(window.location.search).get("open");
    if (o === "case" || o === "next" || o === "nav") return o;
  }
  return null;
}

// ── the ranked queue: blockers first (anything stalling underwriting), then clocks ──
type Tone = "red" | "amber";
type NextItem = { id: string; title: string; note: string; chip: string; tone: Tone; page: PageId };
function nextUp(): NextItem[] {
  const reqs = allReqs();
  const items: NextItem[] = [];
  for (const { req } of reqs)
    if (req.status === "missing" && req.required)
      items.push({ id: req.id, title: req.name, note: "Not in the package — blocks underwriting", chip: "not filed", tone: "red", page: "workfile" });
  for (const { req } of reqs)
    if (req.status === "flagged")
      items.push({ id: req.id, title: req.name, note: `${req.flag?.kind ?? "Exception"} — needs your verdict`, chip: "needs verdict", tone: "amber", page: "workfile" });
  for (const c of liveClocks()) {
    if (items.some(i => i.id === c.req.id)) continue;
    if (c.days > 30) break; // quiet clocks don't earn header space
    items.push({ id: c.req.id, title: c.req.name, note: c.req.expiry!.rule, chip: `${c.days} days`, tone: c.days <= 7 ? "red" : "amber", page: "timeline" });
  }
  return items.slice(0, 3);
}

const TONE: Record<Tone, string> = { red: "text-[#B91C1C]", amber: "text-[#B45309]" };
const DOT: Record<Tone, string> = { red: "bg-[#DC2626]", amber: "bg-[#D97706]" };

// overlay panels: anchored dropdowns on desktop, full-width sheets under the header on mobile
const PANEL = "fixed inset-x-2 top-[58px] md:absolute md:inset-x-auto md:top-[calc(100%+8px)] bg-white border border-[#E2E8F0] rounded-[6px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] z-50 overflow-hidden";

export function Backbone() {
  const [page, setPage] = useState<PageId>(initialPage);
  const [menu, setMenu] = useState<MenuId>(initialMenu);
  const go: Go = p => { setPage(p); setMenu(null); };
  const queue = nextUp();
  const top = queue[0];

  return (
    <div className="h-screen w-full flex flex-col bg-[#F3F5F7] text-[#0F172A] antialiased" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {/* click-outside veil */}
      {menu && <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />}

      {/* ── shared chrome: identity · navigation · next action. Everything else lives one reveal deeper. ── */}
      <header className="shrink-0 h-[52px] bg-white border-b border-[#E2E8F0] flex items-center gap-2 md:gap-4 pl-3 md:pl-5 pr-2 md:pr-4">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-[26px] h-[26px] bg-[#1D4ED8] flex items-center justify-center rounded-[4px]">
            <span className="text-white text-[13px] font-bold leading-none">H</span>
          </div>
          <span className="hidden md:inline text-[15px] font-semibold tracking-[-0.01em]">Homium</span>
        </div>
        <div className="hidden md:block h-5 w-px bg-[#E2E8F0] shrink-0" />

        {/* case anchor — the name is the file */}
        <div className="relative min-w-0 flex-1 md:flex-none">
          <button
            onClick={() => setMenu(menu === "case" ? null : "case")}
            className="flex items-center gap-1.5 px-2 py-2 md:py-1.5 -ml-2 rounded-[4px] hover:bg-[#F1F5F9] transition-colors min-w-0 max-w-full md:max-w-none"
          >
            <span className="text-[13px] font-semibold truncate">{CASE.applicant}</span>
            <ChevronDown size={12} className={`text-[#94A3B8] shrink-0 transition-transform duration-150 ${menu === "case" ? "rotate-180" : ""}`} />
          </button>

          {menu === "case" && (
            <div className={`${PANEL} md:left-0 md:w-[324px]`}>
              <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-[#F1F5F9]">
                <span className={`${MONO} text-[11px] font-medium`}>{CASE.id}</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#1E40AF] bg-[#EFF6FF] border border-[#BFDBFE] rounded-[3px] px-1.5 py-[2px]">In underwriting</span>
              </div>
              <div className="px-4 py-2.5 space-y-1.5">
                {[
                  ["Loan", CASE.loan],
                  ["Property", CASE.property],
                  ["Program", CASE.program],
                  ["Originator", CASE.originator],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-[11.5px] leading-snug">
                    <span className="w-[64px] shrink-0 text-[#64748B]">{k}</span>
                    <span className="text-[#0F172A]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-t border-[#E2E8F0] bg-[#F8FAFC]">
                <span className="text-[10.5px] text-[#64748B]">Closing target</span>
                <span className={`${MONO} text-[11px] font-medium`}>Sep 3 · {daysToClose} days</span>
              </div>
            </div>
          )}
        </div>

        <nav className="ml-auto hidden md:flex items-stretch self-stretch shrink-0">
          {TABS.map(t => {
            const active = page === t.id;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={`relative px-4 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${active ? "text-[#0F172A]" : "text-[#64748B] hover:text-[#0F172A]"}`}
              >
                {t.label}
                {active && <span className="absolute left-3 right-3 bottom-0 h-[2px] bg-[#1D4ED8]" />}
              </button>
            );
          })}
        </nav>

        <div className="hidden md:block h-5 w-px bg-[#E2E8F0] shrink-0" />

        {/* next action — the one thing the header is allowed to say out loud */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenu(menu === "next" ? null : "next")}
            className="flex items-center gap-1.5 md:gap-2 px-2 md:px-2.5 py-2 md:py-1.5 rounded-[4px] hover:bg-[#F1F5F9] transition-colors"
          >
            {top ? (
              <>
                <span className={`w-[7px] h-[7px] rounded-[2px] shrink-0 ${DOT[top.tone]}`} />
                <span className="hidden md:inline text-[12.5px] font-semibold max-w-[220px] truncate">
                  {top.title} <span className={`${TONE[top.tone]} font-medium`}>— {top.chip}</span>
                </span>
                <span className={`md:hidden ${MONO} text-[11px] font-medium ${TONE[top.tone]}`}>{queue.length}</span>
                {queue.length > 1 && <span className={`hidden md:inline ${MONO} text-[10px] text-[#64748B]`}>+{queue.length - 1}</span>}
              </>
            ) : (
              <>
                <span className="w-[7px] h-[7px] rounded-[2px] shrink-0 bg-[#15803D]" />
                <span className="hidden md:inline text-[12.5px] text-[#475569]">Nothing needs you</span>
                <span className={`hidden md:inline ${MONO} text-[10px] text-[#64748B]`}>{daysToClose}d to close</span>
              </>
            )}
            <ChevronDown size={12} className={`text-[#94A3B8] shrink-0 transition-transform duration-150 ${menu === "next" ? "rotate-180" : ""}`} />
          </button>

          {menu === "next" && (
            <div className={`${PANEL} md:right-0 md:w-[372px]`}>
              <div className="px-4 pt-3 pb-2 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                Needs you · blockers first
              </div>
              {queue.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => go(it.page)}
                  className="group w-full flex items-center gap-3 px-4 py-3 md:py-2.5 text-left hover:bg-[#F8FAFC] transition-colors border-t border-[#F1F5F9]"
                >
                  <span className={`${MONO} text-[10px] text-[#94A3B8] pt-[1px]`}>0{i + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] font-semibold truncate">{it.title}</span>
                    <span className="block text-[11px] text-[#64748B] truncate">{it.note}</span>
                  </span>
                  <span className={`${MONO} text-[10px] font-medium shrink-0 ${TONE[it.tone]}`}>{it.chip}</span>
                  <ArrowUpRight size={12} className="text-[#94A3B8] group-hover:text-[#1D4ED8] shrink-0 transition-colors" />
                </button>
              ))}
              <div className={`px-4 py-2 border-t border-[#E2E8F0] bg-[#F8FAFC] ${MONO} text-[10px] text-[#64748B]`}>
                {daysToClose} days to close · target Sep 3
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex w-[26px] h-[26px] rounded-full bg-[#F1F5F9] border border-[#CBD5E1] items-center justify-center text-[9.5px] font-semibold text-[#334155] shrink-0" title="Eleanor Ramos — Underwriter">ER</div>

        {/* mobile nav */}
        <div className="relative shrink-0 md:hidden">
          <button
            onClick={() => setMenu(menu === "nav" ? null : "nav")}
            className="w-9 h-9 flex items-center justify-center rounded-[4px] hover:bg-[#F1F5F9] transition-colors text-[#334155]"
            aria-label="Pages"
          >
            {menu === "nav" ? <X size={17} /> : <MenuIcon size={17} />}
          </button>

          {menu === "nav" && (
            <div className={`${PANEL} md:hidden`}>
              <div className="px-4 pt-3 pb-2 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">Pages</div>
              {TABS.map(t => {
                const active = page === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => go(t.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-[0.08em] border-t border-[#F1F5F9] transition-colors ${active ? "text-[#1E40AF] bg-[#F8FAFC]" : "text-[#334155] hover:bg-[#F8FAFC]"}`}
                  >
                    {t.label}
                    {active && <span className="w-1.5 h-1.5 rounded-[2px] bg-[#1D4ED8]" />}
                  </button>
                );
              })}
              <div className={`px-4 py-2 border-t border-[#E2E8F0] bg-[#F8FAFC] ${MONO} text-[10px] text-[#64748B]`}>
                {CASE.id} · {daysToClose} days to close
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── active page ── */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {page === "intake" && <IntakePage go={go} />}
        {page === "workfile" && <WorkfilePage go={go} />}
        {page === "timeline" && <TimelinePage go={go} />}
        {page === "register" && <RegisterPage go={go} />}
      </main>
    </div>
  );
}
