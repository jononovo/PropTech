import { useState } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { CASE, daysToClose, allReqs, liveClocks } from "./data";
import IntakePage from "./pages/IntakePage";
import WorkfilePage from "./pages/WorkfilePage";
import TimelinePage from "./pages/TimelinePage";
import RegisterPage from "./pages/RegisterPage";

export type PageId = "intake" | "workfile" | "timeline" | "register";
export type Go = (p: PageId) => void;

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

type Menu = null | "case" | "next";
function initialMenu(): Menu {
  if (typeof window !== "undefined") {
    const o = new URLSearchParams(window.location.search).get("open");
    if (o === "case" || o === "next") return o;
  }
  return null;
}

// ── the ranked queue: blockers first (anything stalling underwriting), then clocks ──
type NextItem = { id: string; title: string; note: string; chip: string; tone: "clay" | "amber"; page: PageId };
function nextUp(): NextItem[] {
  const reqs = allReqs();
  const items: NextItem[] = [];
  for (const { req } of reqs)
    if (req.status === "missing" && req.required)
      items.push({ id: req.id, title: req.name, note: "Not in the package — blocks underwriting", chip: "not filed", tone: "clay", page: "workfile" });
  for (const { req } of reqs)
    if (req.status === "flagged")
      items.push({ id: req.id, title: req.name, note: `${req.flag?.kind ?? "Exception"} — needs your verdict`, chip: "needs verdict", tone: "amber", page: "workfile" });
  for (const c of liveClocks()) {
    if (items.some(i => i.id === c.req.id)) continue;
    if (c.days > 30) break; // quiet clocks don't earn header space
    items.push({ id: c.req.id, title: c.req.name, note: c.req.expiry!.rule, chip: `${c.days} days`, tone: c.days <= 7 ? "clay" : "amber", page: "timeline" });
  }
  return items.slice(0, 3);
}

const TONE = { clay: "text-[#B85C38]", amber: "text-[#B8862B]" };

export function Backbone() {
  const [page, setPage] = useState<PageId>(initialPage);
  const [menu, setMenu] = useState<Menu>(initialMenu);
  const go: Go = p => { setPage(p); setMenu(null); };
  const queue = nextUp();
  const top = queue[0];

  return (
    <div className="h-screen w-full flex flex-col bg-[#F7F5F0] text-[#1A1D1A] antialiased" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');`}</style>

      {/* click-outside veil */}
      {menu && <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />}

      {/* ── shared chrome: identity · navigation · next action. Everything else lives one reveal deeper. ── */}
      <header className="shrink-0 h-[56px] bg-[#FDFCFA] border-b border-[#1A1D1A]/12 flex items-center gap-4 pl-6 pr-5">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-[#2A4D3B] flex items-center justify-center rounded-[2px]">
            <span className="font-['Fraunces'] italic text-[#F7F5F0] text-[15px] leading-none">H</span>
          </div>
          <span className="font-['Fraunces'] text-[17px] tracking-tight">Homium</span>
        </div>
        <div className="h-6 w-px bg-[#1A1D1A]/12 shrink-0" />

        {/* case anchor — the name is the file */}
        <div className="relative min-w-0">
          <button
            onClick={() => setMenu(menu === "case" ? null : "case")}
            className="flex items-center gap-1.5 px-2 py-1.5 -ml-2 rounded-[3px] hover:bg-[#1A1D1A]/[0.04] transition-colors min-w-0"
          >
            <span className="text-[13.5px] font-medium truncate">{CASE.applicant}</span>
            <ChevronDown size={12} className={`text-[#1A1D1A]/40 shrink-0 transition-transform duration-200 ${menu === "case" ? "rotate-180" : ""}`} />
          </button>

          {menu === "case" && (
            <div className="absolute left-0 top-[calc(100%+10px)] w-[324px] bg-[#FDFCFA] border border-[#1A1D1A]/12 rounded-md shadow-[0_12px_32px_rgba(26,29,26,0.10)] z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-[#1A1D1A]/8">
                <span className="font-['Space_Mono'] text-[11px] text-[#2A4D3B]">{CASE.id}</span>
                <span className="font-['Space_Mono'] text-[9px] uppercase tracking-[0.08em] text-[#2A4D3B] border border-[#2A4D3B]/30 rounded-[2px] px-1.5 py-[2px]">In underwriting</span>
              </div>
              <div className="px-4 py-3 space-y-2">
                {[
                  ["Loan", CASE.loan],
                  ["Property", CASE.property],
                  ["Program", CASE.program],
                  ["Originator", CASE.originator],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-[11.5px] leading-snug">
                    <span className="w-[64px] shrink-0 text-[#1A1D1A]/45">{k}</span>
                    <span className="text-[#1A1D1A]/85">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#1A1D1A]/8 bg-[#2A4D3B]/[0.04]">
                <span className="text-[10.5px] text-[#1A1D1A]/50">Closing target</span>
                <span className="font-['Space_Mono'] text-[11px] text-[#2A4D3B]">Sep 3 · {daysToClose} days</span>
              </div>
            </div>
          )}
        </div>

        <nav className="ml-auto flex items-stretch self-stretch shrink-0">
          {TABS.map(t => {
            const active = page === t.id;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={`relative px-4 font-['Space_Mono'] text-[10.5px] uppercase tracking-[0.14em] transition-colors ${active ? "text-[#1A1D1A]" : "text-[#1A1D1A]/45 hover:text-[#1A1D1A]/80"}`}
              >
                {t.label}
                {active && <span className="absolute left-3 right-3 bottom-0 h-[2px] bg-[#2A4D3B]" />}
              </button>
            );
          })}
        </nav>

        <div className="h-6 w-px bg-[#1A1D1A]/12 shrink-0" />

        {/* next action — the one thing the header is allowed to say out loud */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenu(menu === "next" ? null : "next")}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[3px] hover:bg-[#1A1D1A]/[0.04] transition-colors"
          >
            {top ? (
              <>
                <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${top.tone === "clay" ? "bg-[#B85C38]" : "bg-[#B8862B]"}`} />
                <span className="text-[12.5px] font-medium max-w-[220px] truncate">
                  {top.title} <span className={`${TONE[top.tone]} font-normal`}>— {top.chip}</span>
                </span>
                {queue.length > 1 && <span className="font-['Space_Mono'] text-[10px] text-[#1A1D1A]/40">+{queue.length - 1}</span>}
              </>
            ) : (
              <>
                <span className="w-[7px] h-[7px] rounded-full shrink-0 bg-[#2A4D3B]" />
                <span className="text-[12.5px] text-[#1A1D1A]/60">Nothing needs you</span>
                <span className="font-['Space_Mono'] text-[10px] text-[#1A1D1A]/40">{daysToClose}d to close</span>
              </>
            )}
            <ChevronDown size={12} className={`text-[#1A1D1A]/40 shrink-0 transition-transform duration-200 ${menu === "next" ? "rotate-180" : ""}`} />
          </button>

          {menu === "next" && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-[372px] bg-[#FDFCFA] border border-[#1A1D1A]/12 rounded-md shadow-[0_12px_32px_rgba(26,29,26,0.10)] z-50 overflow-hidden">
              <div className="px-4 pt-3 pb-2 font-['Space_Mono'] text-[9px] uppercase tracking-[0.14em] text-[#1A1D1A]/45">
                Needs you · blockers first
              </div>
              {queue.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => go(it.page)}
                  className="group w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#1A1D1A]/[0.03] transition-colors border-t border-[#1A1D1A]/6"
                >
                  <span className="font-['Space_Mono'] text-[10px] text-[#1A1D1A]/35 pt-[1px]">0{i + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] font-medium truncate">{it.title}</span>
                    <span className="block text-[11px] text-[#1A1D1A]/55 truncate">{it.note}</span>
                  </span>
                  <span className={`font-['Space_Mono'] text-[10px] shrink-0 ${TONE[it.tone]}`}>{it.chip}</span>
                  <ArrowUpRight size={12} className="text-[#1A1D1A]/25 group-hover:text-[#1A1D1A]/60 shrink-0 transition-colors" />
                </button>
              ))}
              <div className="px-4 py-2.5 border-t border-[#1A1D1A]/8 bg-[#1A1D1A]/[0.02] font-['Space_Mono'] text-[10px] text-[#1A1D1A]/45">
                {daysToClose} days to close · target Sep 3
              </div>
            </div>
          )}
        </div>

        <div className="w-[26px] h-[26px] rounded-full bg-[#2A4D3B]/10 border border-[#2A4D3B]/25 flex items-center justify-center font-['Space_Mono'] text-[9px] text-[#2A4D3B] shrink-0" title="Eleanor Ramos — Underwriter">ER</div>
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
