import { useState } from "react";
import { CASE, daysToClose, alarmCount } from "./data";
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

export function Backbone() {
  const [page, setPage] = useState<PageId>(initialPage);
  const go: Go = p => setPage(p);
  const alarms = alarmCount();

  return (
    <div className="h-screen w-full flex flex-col bg-[#F7F5F0] text-[#1A1D1A] antialiased" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');`}</style>

      {/* ── shared chrome ── */}
      <header className="shrink-0 h-[56px] bg-[#FDFCFA] border-b border-[#1A1D1A]/12 flex items-center gap-5 pl-6 pr-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 bg-[#2A4D3B] flex items-center justify-center rounded-[2px]">
            <span className="font-['Fraunces'] italic text-[#F7F5F0] text-[15px] leading-none">H</span>
          </div>
          <span className="font-['Fraunces'] text-[17px] tracking-tight">Homium</span>
        </div>
        <div className="h-6 w-px bg-[#1A1D1A]/12" />
        <div className="flex items-baseline gap-3 min-w-0">
          <span className="font-['Space_Mono'] text-[11px] text-[#2A4D3B]">{CASE.id}</span>
          <span className="text-[13.5px] font-medium truncate">{CASE.applicant}</span>
          <span className="text-[12px] text-[#1A1D1A]/55 truncate hidden xl:inline">{CASE.loan}</span>
          <span className="font-['Space_Mono'] text-[9.5px] uppercase tracking-[0.08em] text-[#2A4D3B] border border-[#2A4D3B]/30 rounded-[2px] px-1.5 py-[2px]">In underwriting</span>
        </div>

        <nav className="ml-auto flex items-stretch self-stretch">
          {TABS.map(t => {
            const active = page === t.id;
            return (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={`relative px-4 font-['Space_Mono'] text-[10.5px] uppercase tracking-[0.14em] transition-colors ${active ? "text-[#1A1D1A]" : "text-[#1A1D1A]/45 hover:text-[#1A1D1A]/80"}`}
              >
                {t.label}
                {t.id === "timeline" && alarms > 0 && (
                  <span className={`ml-1.5 ${active ? "text-[#B85C38]" : "text-[#B85C38]/70"}`}>·{alarms}</span>
                )}
                {active && <span className="absolute left-3 right-3 bottom-0 h-[2px] bg-[#2A4D3B]" />}
              </button>
            );
          })}
        </nav>

        <div className="h-6 w-px bg-[#1A1D1A]/12" />
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right leading-tight">
            <div className="font-['Space_Mono'] text-[13px] text-[#2A4D3B]">{daysToClose} <span className="text-[9.5px] uppercase tracking-[0.1em] text-[#1A1D1A]/55">days to close</span></div>
            <div className="font-['Space_Mono'] text-[9px] uppercase tracking-[0.1em] text-[#1A1D1A]/40">target Sep 3</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 w-[26px] h-[26px] rounded-full bg-[#2A4D3B]/10 border border-[#2A4D3B]/25 flex items-center justify-center font-['Space_Mono'] text-[9px] text-[#2A4D3B]">ER</div>
            <div className="leading-tight hidden 2xl:block">
              <div className="text-[11.5px] font-medium">Eleanor Ramos</div>
              <div className="text-[10px] text-[#1A1D1A]/50">Underwriter</div>
            </div>
          </div>
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
