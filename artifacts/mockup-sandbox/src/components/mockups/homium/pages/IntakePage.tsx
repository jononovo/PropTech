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
    <div className="intake-root overflow-y-auto px-8 py-12 flex flex-col items-center relative">
      {state === "drop" && <DropState onClick={() => setState("processing")} onSkip={() => setState("report")} />}
      {state === "processing" && <ProcessingState step={procStep} pages={pageCount} checkIdx={checkLabelIdx} />}
      {state === "report" && <ReportState resolved={resolved} onVerdict={handleVerdict} go={go} />}

      {toastVisible && (
        <div className="fixed bottom-6 left-6 bg-ink text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up z-50">
          <div className="w-5 h-5 rounded-full bg-deep-green flex items-center justify-center">
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
      <div className="w-full bg-surface hairline-all rounded-xl p-5 mb-8 flex justify-between items-center shadow-sm">
        <div>
          <div className="font-mono text-[11px] text-sage tracking-wider uppercase mb-1">{CASE.id}</div>
          <div className="font-fraunces text-[18px] text-ink">{CASE.applicant} <span className="font-inter font-medium text-[15px] pl-1">— {CASE.loan}</span></div>
          <div className="text-[13px] text-sage mt-0.5">{CASE.property} · {CASE.program}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] text-sage tracking-wider uppercase mb-1">Closing target</div>
          <div className="font-mono text-[13px] text-ink">Sep 3 · {daysToClose} days out</div>
        </div>
      </div>
      
      {/* Drop Zone */}
      <div 
        onClick={onClick}
        className="w-full h-[400px] bg-surface hairline-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-black/[0.02] transition-colors relative group shadow-sm"
      >
        <div className="w-14 h-14 rounded-xl bg-deep-green flex items-center justify-center mb-6 shadow-md group-hover:scale-105 transition-transform duration-300">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <h2 className="font-fraunces text-[28px] text-ink mb-3">Drop the application file</h2>
        <p className="text-[14px] text-sage text-center max-w-[420px] leading-relaxed mb-6">
          One PDF, three hundred pages, no sorting needed. Homium splits, names, and files every page against this loan's checklist — you review only what needs you.
        </p>
        <button className="btn-quiet pointer-events-none">Browse files</button>
        
        <div className="absolute bottom-6 font-mono text-[11px] text-sage tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
          demo — click the zone to load the Henderson package
        </div>
      </div>
      
      {/* Connect */}
      <div className="flex items-center gap-4 mt-8">
        <span className="text-[13px] text-sage">or connect</span>
        <button onClick={onClick} className="btn-ghost text-sage hover:text-ink">Google Drive</button>
        <span className="text-sage">·</span>
        <button onClick={onClick} className="btn-ghost text-sage hover:text-ink">Dropbox</button>
        <span className="text-sage">·</span>
        <button onClick={onClick} className="btn-ghost text-sage hover:text-ink">Box</button>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onSkip(); }} className="mt-16 text-[12px] text-sage hover:text-ink transition-colors font-mono uppercase tracking-wider">
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
    <div className="w-full max-w-[640px] mt-24 animate-fade-in">
      <div className="bg-surface hairline-all rounded-xl p-6 shadow-sm mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-black/[0.04] text-deep-green flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono text-[13px] text-ink">{CASE.package.file}</div>
              <div className="font-mono text-[11px] text-sage mt-1">
                {CASE.package.pages} pages · {CASE.package.size} · received {CASE.package.received}
              </div>
            </div>
          </div>
          <div className="font-mono text-[15px] text-deep-green font-bold">
            {Math.floor(pct)}%
          </div>
        </div>
        <div className="w-full h-1 bg-black/[0.06] rounded-full mt-6 overflow-hidden">
          <div 
            className="h-full bg-deep-green transition-all duration-300 ease-out" 
            style={{ width: `${pct}%` }} 
          />
        </div>
      </div>

      <div className="space-y-6 px-4">
        <StepRow active={step === 0} done={step > 0} label="Reading pages" mono={`${pages} / 296`} />
        <StepRow active={step === 1} done={step > 1} label="Identifying documents" mono={step > 0 ? "19 found" : ""} />
        <StepRow active={step === 2} done={step > 2} label="Matching to the checklist" mono={step > 1 ? "17 of 20" : ""} />
        <StepRow active={step === 3} done={step > 3} label="Running checks" mono={step > 2 ? `${CHECKS[checkIdx]} · ${checkIdx + 1} of 4` : ""} />
      </div>

      <div className="text-center mt-20 font-mono text-[11px] text-sage uppercase tracking-wider">
        Quiet automation — you'll only be asked about exceptions.
      </div>
    </div>
  );
}

function StepRow({ active, done, label, mono }: { active: boolean; done: boolean; label: string; mono: string }) {
  return (
    <div className={`flex items-center justify-between transition-all duration-300 ${active || done ? "opacity-100" : "opacity-30 translate-y-1"}`}>
      <div className="flex items-center gap-4">
        <div className="w-5 h-5 flex items-center justify-center">
          {done ? (
            <Check className="w-4 h-4 text-deep-green" />
          ) : active ? (
            <Loader2 className="w-4 h-4 text-deep-green animate-spin-slow" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-sage/40" />
          )}
        </div>
        <span className={`text-[15px] ${active ? "text-ink font-medium" : done ? "text-ink" : "text-sage"}`}>
          {label}
        </span>
      </div>
      <span className="font-mono text-[12px] text-sage">{mono}</span>
    </div>
  );
}

function ReportState({ resolved, onVerdict, go }: { resolved: Record<string, string>; onVerdict: (id: string, text: string) => void; go: Go }) {
  const st = stats();
  const excs = exceptions();
  
  return (
    <div className="w-full max-w-[960px] animate-slide-up pb-24">
      {/* Stat strip */}
      <div className="grid grid-cols-4 bg-surface hairline-all rounded-xl shadow-sm overflow-hidden mb-3">
        <StatCell val={(st.found + st.unassigned).toString()} label="documents found" sub="from 296 pages in one upload" />
        <StatCell val={st.quiet.toString()} label="filed quietly" sub="no action needed from you" />
        <StatCell val={st.attention.toString()} label="need you" sub="exceptions surfaced below" amber />
        <StatCell val={st.unassigned.toString()} label="unassigned" sub="nothing blocking — review anytime" />
      </div>

      <div className="text-center mb-16">
        <button onClick={() => go("timeline")} className="font-mono text-[11px] text-sage hover:text-ink uppercase tracking-wider transition-colors">
          3 documents are on the clock — see the Timeline →
        </button>
      </div>

      <div className="flex justify-between items-baseline mb-6 border-b border-homium-hairline pb-4">
        <h3 className="font-fraunces text-[24px] text-ink">Needs Your Attention</h3>
        <button onClick={() => go("workfile")} className="font-mono text-[11px] text-sage hover:text-ink uppercase tracking-wider transition-colors">
          resolve in the Workfile →
        </button>
      </div>

      <div className="space-y-4 mb-20">
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

      <div className="flex justify-between items-baseline mb-6 border-b border-homium-hairline pb-4">
        <div className="flex items-baseline gap-4">
          <h3 className="text-[18px] font-medium text-ink">Unassigned</h3>
          <span className="font-mono text-[11px] text-sage uppercase tracking-wider">nothing here blocks the application</span>
        </div>
      </div>
      
      <div className="space-y-4 mb-20">
        {UNASSIGNED.map(u => (
          <div key={u.id} className="bg-surface hairline-all rounded-lg p-5 flex items-start justify-between shadow-sm">
            <div className="flex items-start gap-6">
              <div className="min-w-[200px]">
                <div className="text-[14px] font-medium text-ink">{u.label}</div>
                <div className="font-mono text-[11px] text-sage mt-1.5">pp. {u.pages}</div>
              </div>
              <div className="text-[14px] text-ink max-w-[440px] leading-relaxed pt-0.5">{u.note}</div>
            </div>
            <button className="btn-ghost text-sage">File as…</button>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="text-[18px] font-medium text-ink mb-6">Audit Trail</h3>
        <div className="pl-5 border-l border-homium-hairline space-y-6 relative ml-1">
          {AUDIT.map((a, i) => (
            <div key={i} className="flex items-start gap-6 relative">
              <div className="absolute -left-[25px] w-2 h-2 rounded-full bg-surface border border-homium-hairline mt-1.5" />
              <div className="font-mono text-[11px] text-sage w-32 shrink-0 pt-1 tracking-wide">{a.time}</div>
              <div className="text-[14px] text-ink pt-0.5">{a.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-24 pt-8 hairline-t text-center font-mono text-[11px] text-sage uppercase tracking-wider">
        Your assignments always win — Homium never re-files a document you placed by hand.
      </div>
    </div>
  );
}

function StatCell({ val, label, sub, amber }: { val: string; label: string; sub: string; amber?: boolean }) {
  return (
    <div className={`p-6 hairline-r last:border-r-0 flex flex-col items-center text-center ${amber ? 'bg-amber-wash' : ''}`}>
      <div className="font-mono text-[36px] text-ink leading-none mb-3 font-bold">{val}</div>
      <div className="text-[14px] font-medium text-ink mb-1.5">{label}</div>
      <div className="text-[12px] text-sage leading-relaxed max-w-[160px]">{sub}</div>
    </div>
  );
}

function ExceptionRow({ req, sec, resolvedText, onResolve }: { req: any; sec: any; resolvedText?: string; onResolve: (t: string) => void }) {
  if (resolvedText) {
    return (
      <div className="bg-surface hairline-all rounded-lg p-4 flex items-center gap-3 animate-fade-in shadow-sm">
        <div className="w-5 h-5 rounded-full bg-deep-green flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-white" />
        </div>
        <div className="text-[14px] text-ink flex-1">{resolvedText} · <span className="text-sage">your call is on the audit log</span></div>
      </div>
    );
  }

  // Verdict logic based on req.id
  let verdicts = null;
  if (req.id === "c3") {
    verdicts = (
      <>
        <button className="btn-quiet" onClick={() => onResolve("Accepted as-is")}>Accept as-is</button>
        <button className="btn-primary" onClick={() => onResolve("Re-scan requested — secure upload link sent")}>Request re-scan</button>
      </>
    );
  } else if (req.id === "c4") {
    verdicts = (
      <>
        <button className="btn-quiet" onClick={() => onResolve("Document uploaded manually")}>Upload it myself</button>
        <button className="btn-primary" onClick={() => onResolve("Requested from applicant — secure upload link sent")}>Request from applicant</button>
      </>
    );
  } else if (req.id === "e1") {
    verdicts = (
      <div className="flex items-center gap-4">
        <span className="font-mono text-[11px] text-sage uppercase tracking-wider">no action needed from you yet</span>
        <button className="btn-quiet-slate" onClick={() => onResolve("Viewed deep review")}>View deep review</button>
      </div>
    );
  }

  return (
    <div className="bg-surface hairline-all rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-[16px] font-medium text-ink">{req.name}</h4>
            <span className="font-mono text-[11px] text-sage uppercase tracking-wider">{sec.num} · {sec.name}</span>
          </div>
          {req.file && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/[0.03] font-mono text-[11px] text-ink mb-2">
              <FileText className="w-3.5 h-3.5 text-sage" />
              {req.file} {req.pages ? `· pp. ${req.pages}` : ""}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-2">
        <div className="flex items-start gap-3 max-w-[560px]">
          <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${req.flag?.severity === 'amber' ? 'text-amber' : req.flag?.severity === 'clay' ? 'text-clay' : 'text-slate'}`} />
          <div>
            <div className={`text-[13px] font-medium mb-1 ${req.flag?.severity === 'amber' ? 'text-amber' : req.flag?.severity === 'clay' ? 'text-clay' : 'text-slate'}`}>
              {req.flag?.kind}
            </div>
            <div className="text-[14px] text-ink leading-relaxed">
              {req.flag?.note}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 shrink-0 ml-6">
          {verdicts}
        </div>
      </div>
    </div>
  );
}
