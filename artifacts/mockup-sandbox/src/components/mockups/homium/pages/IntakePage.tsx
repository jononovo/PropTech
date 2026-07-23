import { useState, useEffect } from "react";
import { Upload, FileText, Check, Loader2, AlertCircle } from "lucide-react";
import type { Go } from "../Backbone";
import { CASE, AUDIT, UNASSIGNED, exceptions, stats, daysToClose } from "../data";
import "./IntakePage.css";

type PageState = "drop" | "processing" | "report";

export default function IntakePage({ go }: { go: Go }) {
  const [state, setState] = useState<PageState>("drop");
  
  // processing states
  const [procStep, setProcStep] = useState(0); 
  const [pageCount, setPageCount] = useState(0);
  const [checkLabelIdx, setCheckLabelIdx] = useState(0);

  // triage report verdicts
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (state !== "processing") return;
    
    // Step 0: Reading pages (0-296)
    const duration = 1000;
    const start = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const p = Math.min((now - start) / duration, 1);
      setPageCount(Math.floor(p * 296));
      if (p === 1) {
        clearInterval(timer);
        setProcStep(1);
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (state !== "processing") return;
    
    if (procStep === 1) {
      const t = setTimeout(() => setProcStep(2), 1000);
      return () => clearTimeout(t);
    }
    if (procStep === 2) {
      const t = setTimeout(() => setProcStep(3), 1000);
      return () => clearTimeout(t);
    }
    if (procStep === 3) {
      const t = setInterval(() => {
        setCheckLabelIdx(i => {
          if (i < 3) return i + 1;
          clearInterval(t);
          setProcStep(4);
          setTimeout(() => setState("report"), 500);
          return i;
        });
      }, 500);
      return () => clearInterval(t);
    }
  }, [state, procStep]);

  const handleVerdict = (id: string, text: string) => {
    setResolved(prev => ({ ...prev, [id]: text }));
    setToastVisible(false);
    setTimeout(() => setToastVisible(true), 50);
    setTimeout(() => setToastVisible(false), 3000);
  };

  return (
    <div className="intake-root overflow-y-auto px-8 py-10 flex flex-col items-center relative">
      {state === "drop" && <DropState onClick={() => setState("processing")} onSkip={() => setState("report")} />}
      {state === "processing" && <ProcessingState step={procStep} pages={pageCount} checkIdx={checkLabelIdx} />}
      {state === "report" && <ReportState resolved={resolved} onVerdict={handleVerdict} go={go} />}

      {toastVisible && (
        <div className="fixed bottom-6 left-6 bg-[var(--ops-ink)] text-white px-4 py-2.5 rounded flex items-center gap-3 animate-slide-up z-50 shadow-md">
          <div className="w-4 h-4 rounded-sm bg-[var(--ops-ok-text)] flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-[13px] font-medium">Verdict saved to audit log</span>
        </div>
      )}
    </div>
  );
}

function DropState({ onClick, onSkip }: { onClick: () => void; onSkip: () => void }) {
  return (
    <div className="w-full max-w-[720px] animate-fade-in flex flex-col items-center">
      {/* Case Card */}
      <div className="w-full bg-[var(--ops-surface)] border border-[var(--ops-border)] rounded p-4 mb-6 flex justify-between items-center">
        <div>
          <div className="font-mono text-[11px] text-[var(--ops-muted)] mb-1">{CASE.id}</div>
          <div className="font-semibold text-[16px] text-[var(--ops-ink)]">
            {CASE.applicant} <span className="font-normal text-[var(--ops-body-sec)] pl-1">— {CASE.loan}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="micro-label mb-1">CLOSING TARGET</div>
          <div className="font-mono text-[13px] text-[var(--ops-ink)]">Sep 3 · {daysToClose} days out</div>
        </div>
      </div>
      
      {/* Drop Zone */}
      <div 
        onClick={onClick}
        className="w-full h-[360px] bg-[var(--ops-surface)] border-[1.5px] border-dashed border-[var(--ops-strong-border)] rounded-[6px] flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--ops-inset)] transition-colors relative group"
      >
        <div className="w-12 h-12 rounded bg-[var(--ops-accent)] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <h2 className="font-semibold tracking-[-0.01em] text-[21px] text-[var(--ops-ink)] mb-2">Drop the application file</h2>
        <p className="text-[14px] text-[var(--ops-muted)] text-center max-w-[380px] mb-6">
          One PDF, three hundred pages. Homium files everything against the checklist — you review only the exceptions.
        </p>
        <button className="btn-secondary pointer-events-none">Browse files</button>
        
        <div className="absolute bottom-5 micro-label text-[10px] text-[var(--ops-faint)] opacity-0 group-hover:opacity-100 transition-opacity">
          demo — click the zone to load the package
        </div>
      </div>
      
      {/* Connect */}
      <div className="flex items-center gap-3 mt-6">
        <span className="text-[13px] text-[var(--ops-muted)]">or connect</span>
        <button onClick={onClick} className="text-[13px] font-medium text-[var(--ops-accent)] hover:text-[var(--ops-accent-hover)] transition-colors">Google Drive</button>
        <div className="w-[1px] h-3 bg-[var(--ops-strong-border)]" />
        <button onClick={onClick} className="text-[13px] font-medium text-[var(--ops-accent)] hover:text-[var(--ops-accent-hover)] transition-colors">Dropbox</button>
        <div className="w-[1px] h-3 bg-[var(--ops-strong-border)]" />
        <button onClick={onClick} className="text-[13px] font-medium text-[var(--ops-accent)] hover:text-[var(--ops-accent-hover)] transition-colors">Box</button>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onSkip(); }} className="mt-12 micro-label hover:text-[var(--ops-accent)] transition-colors cursor-pointer">
        skip to the report →
      </button>
    </div>
  );
}

const CHECKS = ["scan quality", "dates & validity windows", "names & numbers", "signatures & seals"];

function ProcessingState({ step, pages, checkIdx }: { step: number; pages: number; checkIdx: number }) {
  let pct = 0;
  if (step === 0) pct = (pages/296)*25;
  else if (step === 1) pct = 25;
  else if (step === 2) pct = 50;
  else if (step === 3) pct = 75 + (checkIdx/3)*24;
  else if (step === 4) pct = 100;

  return (
    <div className="w-full max-w-[600px] mt-20 animate-fade-in">
      <div className="bg-[var(--ops-surface)] border border-[var(--ops-border)] rounded p-5 mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[var(--ops-inset)] border border-[var(--ops-inner-rule)] text-[var(--ops-accent)] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-mono text-[13px] text-[var(--ops-ink)]">{CASE.package.file}</div>
              <div className="font-mono text-[11px] text-[var(--ops-muted)] mt-1">
                {CASE.package.pages} pages · {CASE.package.size} · received {CASE.package.received}
              </div>
            </div>
          </div>
          <div className="font-mono text-[15px] text-[var(--ops-accent)] font-semibold">
            {Math.floor(pct)}%
          </div>
        </div>
        <div className="w-full h-1 bg-[var(--ops-inner-rule)] rounded-full mt-5 overflow-hidden">
          <div 
            className="h-full bg-[var(--ops-accent)] transition-all duration-300 ease-out" 
            style={{ width: `${pct}%` }} 
          />
        </div>
      </div>

      <div className="space-y-0 border-t border-[var(--ops-border)]">
        <StepRow active={step === 0} done={step > 0} label="Reading pages" mono={`${pages} / 296`} />
        <StepRow active={step === 1} done={step > 1} label="Identifying documents" mono={step > 0 ? "19 found" : ""} />
        <StepRow active={step === 2} done={step > 2} label="Matching to the checklist" mono={step > 1 ? "17 of 20" : ""} />
        <StepRow active={step === 3} done={step > 3} label="Running checks" mono={step > 2 ? `${CHECKS[checkIdx]} · ${checkIdx + 1} of 4` : ""} />
      </div>

      <div className="text-center mt-16 micro-label text-[var(--ops-faint)]">
        Quiet automation — you'll only be asked about exceptions.
      </div>
    </div>
  );
}

function StepRow({ active, done, label, mono }: { active: boolean; done: boolean; label: string; mono: string }) {
  return (
    <div className={`flex items-center justify-between transition-all duration-300 py-3 border-b border-[var(--ops-inner-rule)] ${active ? 'bg-[var(--ops-inset)] px-4 -mx-4 rounded' : 'px-2 -mx-2'} ${active || done ? "opacity-100" : "opacity-30"}`}>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 flex items-center justify-center">
          {done ? (
            <Check className="w-3.5 h-3.5 text-[var(--ops-ok-text)]" />
          ) : active ? (
            <Loader2 className="w-3.5 h-3.5 text-[var(--ops-accent)] animate-spin-slow" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--ops-border)]" />
          )}
        </div>
        <span className={`text-[14px] ${active ? "text-[var(--ops-ink)] font-medium" : done ? "text-[var(--ops-body-sec)]" : "text-[var(--ops-muted)]"}`}>
          {label}
        </span>
      </div>
      <span className="font-mono text-[12px] text-[var(--ops-muted)]">{mono}</span>
    </div>
  );
}

function ReportState({ resolved, onVerdict, go }: { resolved: Record<string, string>; onVerdict: (id: string, text: string) => void; go: Go }) {
  const st = stats();
  const excs = exceptions();
  
  return (
    <div className="w-full max-w-[960px] animate-slide-up pb-16">
      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCell val={st.found.toString()} label="documents found" sub="from 296 pages" />
        <StatCell val={st.quiet.toString()} label="filed quietly" sub="no action needed" />
        <StatCell val={st.attention.toString()} label="need you" sub="exceptions below" alert={st.attention > 0 ? "warning" : undefined} />
        <StatCell val={st.unassigned.toString()} label="unassigned" sub="review anytime" />
      </div>

      <div className="flex justify-center mb-12">
        <button onClick={() => go("timeline")} className="micro-label hover:text-[var(--ops-accent)] transition-colors">
          3 documents are on the clock — see timeline →
        </button>
      </div>

      <div className="flex justify-between items-baseline mb-4 border-b border-[var(--ops-border)] pb-3">
        <h3 className="font-semibold tracking-[-0.01em] text-[18px] text-[var(--ops-ink)]">Needs Your Attention</h3>
        <button onClick={() => go("workfile")} className="micro-label hover:text-[var(--ops-accent)] transition-colors">
          resolve in workfile →
        </button>
      </div>

      <div className="space-y-3 mb-16">
        {excs.map(({ req, sec }) => (
          <ExceptionRow 
            key={req.id} 
            req={req} 
            sec={sec} 
            resolvedText={resolved[req.id]} 
            onResolve={(text) => onVerdict(req.id, text)} 
          />
        ))}
      </div>

      <div className="flex justify-between items-baseline mb-4 border-b border-[var(--ops-border)] pb-3 mt-12">
        <h3 className="font-semibold tracking-[-0.01em] text-[18px] text-[var(--ops-ink)]">Unassigned</h3>
        <span className="micro-label">nothing blocks application</span>
      </div>
      
      <div className="space-y-3 mb-12">
        {UNASSIGNED.map(u => (
          <div key={u.id} className="bg-[var(--ops-surface)] border border-[var(--ops-border)] rounded p-4 flex items-start justify-between hover:bg-[var(--ops-inset)] transition-colors">
            <div className="flex items-start gap-5">
              <div className="min-w-[180px]">
                <div className="text-[14px] font-medium text-[var(--ops-ink)] mb-1">{u.label}</div>
                <div className="font-mono text-[11px] text-[var(--ops-muted)]">pp. {u.pages}</div>
              </div>
              <div className="text-[13px] text-[var(--ops-body-sec)] max-w-[400px] leading-relaxed border-l border-[var(--ops-border)] pl-4">
                {u.note}
              </div>
            </div>
            <button className="btn-secondary">File as…</button>
          </div>
        ))}
      </div>

      <div className="mb-8 mt-12">
        <h3 className="font-semibold tracking-[-0.01em] text-[15px] text-[var(--ops-ink)] mb-5">Audit Trail</h3>
        <div className="pl-4 border-l-2 border-[var(--ops-inner-rule)] space-y-4 ml-1">
          {AUDIT.map((a, i) => (
            <div key={i} className="flex items-start gap-4 relative">
              <div className="absolute -left-[21px] w-2.5 h-2.5 rounded bg-[var(--ops-surface)] border-2 border-[var(--ops-strong-border)] mt-[3px]" />
              <div className="font-mono text-[11px] text-[var(--ops-muted)] w-28 shrink-0 pt-0.5 tracking-wide">{a.time}</div>
              <div className="text-[13px] text-[var(--ops-body-sec)] pt-px">{a.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 pt-6 border-t border-[var(--ops-border)] text-center micro-label text-[var(--ops-faint)]">
        Your assignments win — Homium respects manual placement.
      </div>
    </div>
  );
}

function StatCell({ val, label, sub, alert }: { val: string; label: string; sub: string; alert?: "warning" | "critical" }) {
  const isWarn = alert === "warning";
  const isCrit = alert === "critical";
  const bg = isWarn ? "bg-[var(--ops-warning-wash)] border-[var(--ops-warning-border)]" : isCrit ? "bg-[var(--ops-critical-wash)] border-[var(--ops-critical-border)]" : "bg-[var(--ops-surface)] border-[var(--ops-border)]";
  const textVal = isWarn ? "text-[var(--ops-warning-text)]" : isCrit ? "text-[var(--ops-critical-text)]" : "text-[var(--ops-ink)]";

  return (
    <div className={`border rounded p-4 flex flex-col items-center text-center ${bg}`}>
      <div className={`font-mono text-[28px] leading-none mb-2 font-medium ${textVal}`}>{val}</div>
      <div className="micro-label mb-1">{label}</div>
      <div className="text-[12px] text-[var(--ops-muted)]">{sub}</div>
    </div>
  );
}

function ExceptionRow({ req, sec, resolvedText, onResolve }: { req: any; sec: any; resolvedText?: string; onResolve: (t: string) => void }) {
  if (resolvedText) {
    return (
      <div className="bg-[var(--ops-surface)] border border-[var(--ops-border)] rounded p-3 flex items-center gap-3 animate-fade-in">
        <div className="w-5 h-5 rounded bg-[var(--ops-ok-wash)] border border-[var(--ops-ok-border)] flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-[var(--ops-ok-text)]" />
        </div>
        <div className="text-[13px] text-[var(--ops-ink)] flex-1">{resolvedText} <span className="text-[var(--ops-muted)] ml-2">— saved to audit log</span></div>
      </div>
    );
  }

  // Tokens for status/flags
  let sevWash = "bg-[var(--ops-neutral-wash)]";
  let sevBorder = "border-[var(--ops-neutral-border)]";
  let sevText = "text-[var(--ops-neutral-text)]";
  
  if (req.flag?.severity === "amber") {
    sevWash = "bg-[var(--ops-warning-wash)]";
    sevBorder = "border-[var(--ops-warning-border)]";
    sevText = "text-[var(--ops-warning-text)]";
  } else if (req.flag?.severity === "clay") {
    sevWash = "bg-[var(--ops-critical-wash)]";
    sevBorder = "border-[var(--ops-critical-border)]";
    sevText = "text-[var(--ops-critical-text)]";
  }

  // verdicts
  let verdicts = null;
  if (req.id === "c3") {
    verdicts = (
      <>
        <button className="btn-secondary" onClick={() => onResolve("Accepted as-is")}>Accept as-is</button>
        <button className="btn-primary" onClick={() => onResolve("Re-scan requested — secure upload link sent")}>Request re-scan</button>
      </>
    );
  } else if (req.id === "c4") {
    verdicts = (
      <>
        <button className="btn-secondary" onClick={() => onResolve("Document uploaded manually")}>Upload it myself</button>
        <button className="btn-primary" onClick={() => onResolve("Requested from applicant — secure upload link sent")}>Request from applicant</button>
      </>
    );
  } else if (req.id === "e1") {
    verdicts = (
      <div className="flex items-center gap-3">
        <span className="micro-label">NO ACTION YET</span>
        <button className="btn-secondary" onClick={() => onResolve("Viewed deep review")}>View deep review</button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--ops-surface)] border border-[var(--ops-border)] rounded hover:bg-[var(--ops-inset)] transition-colors p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h4 className="text-[15px] font-medium text-[var(--ops-ink)]">{req.name}</h4>
            <div className="px-1.5 py-0.5 rounded-[3px] bg-[var(--ops-inset)] border border-[var(--ops-border)] micro-label text-[9.5px]">
              {sec.num} · {sec.name}
            </div>
          </div>
          {req.file && (
            <div className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-[var(--ops-muted)]">
              <FileText className="w-3 h-3" />
              {req.file} {req.pages ? `· pp. ${req.pages}` : ""}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div className={`flex items-start gap-2 max-w-[520px] rounded p-2.5 border ${sevWash} ${sevBorder}`}>
          <AlertCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${sevText}`} />
          <div>
            <div className={`text-[12px] font-semibold mb-0.5 ${sevText}`}>
              {req.flag?.kind}
            </div>
            <div className={`text-[13px] leading-relaxed ${sevText}`}>
              {req.flag?.note}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 shrink-0 ml-4">
          {verdicts}
        </div>
      </div>
    </div>
  );
}
