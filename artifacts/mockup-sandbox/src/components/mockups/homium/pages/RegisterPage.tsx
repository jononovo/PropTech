import React, { useState } from "react";
import type { Go } from "../Backbone";
import { 
  SECTIONS, 
  daysTo, 
  band, 
  fmt, 
  liveClocks, 
  allReqs, 
  CASE 
} from "../data";
import { Search, ChevronDown, ChevronRight, Lock, Check, Clock, AlertTriangle, AlertCircle, FileText, UploadCloud, Search as SearchIcon } from "lucide-react";
import "./RegisterPage.css";

export default function RegisterPage({ go }: { go: Go }) {
  // State for expanded rows
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "c3": true });

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const all = allReqs();
  const total = all.length;
  const cleanCount = all.filter(r => r.req.status === "clean" || r.req.status === "accepted").length;
  const needYouCount = all.filter(r => r.req.status === "flagged" || (r.req.status === "missing" && r.req.required)).length;
  const clockCount = liveClocks().filter(x => x.days <= 30).length;

  return (
    <div className="h-full overflow-y-auto bg-[#F7F5F0] text-[#1A1D1A] flex flex-col font-sans">
      
      {/* TOP STRIP */}
      <div className="flex-none px-6 py-3 border-b border-[#1A1D1A]/10 bg-[#FDFCFA] flex items-center justify-between sticky top-0 z-20">
        <div className="relative w-72">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1D1A]/40" />
          <input 
            type="text" 
            placeholder="Search requirements or files…" 
            className="w-full pl-9 pr-3 py-1.5 bg-transparent border border-[#1A1D1A]/15 rounded text-[13px] focus:outline-none focus:border-[#2A4D3B] focus:ring-1 focus:ring-[#2A4D3B] transition-shadow placeholder:text-[#1A1D1A]/40"
          />
        </div>
        
        <div className="font-mono text-[11px] text-[#1A1D1A]/70 flex items-center gap-2">
          <span>{cleanCount} of {total} filed clean</span>
          <span className="text-[#1A1D1A]/30">·</span>
          <span className={needYouCount > 0 ? "text-[#B85C38]" : ""}>{needYouCount} need you</span>
          <span className="text-[#1A1D1A]/30">·</span>
          <span className={clockCount > 0 ? "text-[#B8862B]" : ""}>{clockCount} on the clock ≤30d</span>
        </div>
        
        <button className="px-3 py-1.5 text-[12px] font-medium text-[#1A1D1A]/70 border border-[#1A1D1A]/15 rounded hover:bg-[#1A1D1A]/5 hover:text-[#1A1D1A] transition-colors bg-[#FDFCFA]">
          Export file review
        </button>
      </div>

      {/* THE SHEET */}
      <div className="flex-1 p-6 max-w-[1200px] mx-auto w-full">
        <table className="homium-register-table bg-[#FDFCFA] shadow-sm rounded-sm overflow-hidden border border-[#1A1D1A]/10">
          <colgroup>
            <col style={{ width: "24%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "4%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Requirement</th>
              <th>Document</th>
              <th>Received</th>
              <th>Checks</th>
              <th>Validity</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((sec) => {
              const secTotal = sec.reqs.length;
              const secClean = sec.reqs.filter(r => r.status === "clean" || r.status === "accepted").length;
              const progressPct = Math.round((secClean / secTotal) * 100);

              return (
                <React.Fragment key={sec.id}>
                  {/* SECTION BAND */}
                  <tr className="homium-section-band group">
                    <td colSpan={7}>
                      <div className="flex items-center justify-between pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-[#1A1D1A]/40">{sec.num}</span>
                          <span className="text-[12px] font-semibold tracking-[0.05em] uppercase text-[#1A1D1A]/80">
                            {sec.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full border border-[#1A1D1A]/10 text-[10px] uppercase tracking-wider text-[#1A1D1A]/60 bg-[#FDFCFA]">
                            {sec.owner}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 w-48">
                          <span className="font-mono text-[10px] text-[#1A1D1A]/50 shrink-0">
                            {secClean} of {secTotal} clear
                          </span>
                          <div className="homium-micro-progress flex-1">
                            <div className="homium-micro-progress-fill" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* ROWS */}
                  {sec.reqs.map((req) => {
                    const isExpanded = expanded[req.id];
                    
                    // Render checks text
                    let checksText = "—";
                    let checksTint = "text-[#1A1D1A]/40";
                    if (req.status === "accepted" || req.status === "clean") {
                      checksText = "4/4";
                      checksTint = "text-[#2A4D3B]";
                    } else if (req.status === "flagged") {
                      checksText = "3/4";
                      checksTint = "text-[#B85C38]";
                    } else if (req.status === "review") {
                      checksText = "2/3";
                      checksTint = "text-[#1A1D1A]/60";
                    }

                    // Render Validity
                    let validityNode = <span className="text-[#1A1D1A]/30">—</span>;
                    if (req.expiry) {
                      if (req.expiry.kind === "hard") {
                        const isStaleSoon = daysTo(req.expiry.staleOn) <= 30;
                        validityNode = (
                          <div 
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[11px] cursor-pointer hover:opacity-80 transition-opacity ${
                              isStaleSoon 
                                ? "bg-[#B8862B]/10 text-[#B8862B]" 
                                : "bg-[#1A1D1A]/5 text-[#1A1D1A]/70"
                            }`}
                            onClick={(e) => { e.stopPropagation(); go("timeline"); }}
                          >
                            <span>hard</span>
                            <span className="opacity-40">·</span>
                            <span>{fmt(req.expiry.staleOn)}</span>
                          </div>
                        );
                      } else if (req.expiry.kind === "staleness") {
                        if (req.status === "accepted") {
                          validityNode = (
                            <div className="inline-flex items-center gap-1.5 text-[11px] text-[#1A1D1A]/50">
                              <Lock className="w-3 h-3" />
                              <span>stopped</span>
                            </div>
                          );
                        } else {
                          const d = daysTo(req.expiry.staleOn);
                          const b = band(d);
                          
                          let bg = "bg-[#1A1D1A]/5";
                          let text = "text-[#1A1D1A]/70";
                          if (b === "escalate") { bg = "bg-[#B85C38]/10"; text = "text-[#B85C38]"; }
                          else if (b === "warn") { bg = "bg-[#B8862B]/10"; text = "text-[#B8862B]"; }
                          
                          validityNode = (
                            <div 
                              className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] cursor-pointer hover:opacity-80 transition-opacity ${bg} ${text}`}
                              onClick={(e) => { e.stopPropagation(); go("timeline"); }}
                            >
                              {fmt(req.expiry.staleOn)}
                            </div>
                          );
                        }
                      }
                    }

                    // Render Status
                    let statusNode = null;
                    if (req.status === "accepted") {
                      statusNode = (
                        <div className="flex items-center gap-1.5 text-[12px] text-[#2A4D3B]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Accepted <span className="font-mono text-[11px] ml-1">{req.acceptedOn || "—"}</span></span>
                        </div>
                      );
                    } else if (req.status === "clean") {
                      statusNode = <div className="text-[12px] text-[#1A1D1A]/70">Filed</div>;
                    } else if (req.status === "review") {
                      statusNode = <div className="text-[12px] text-[#1A1D1A]/60 italic">Deep review <span className="font-mono not-italic text-[11px]">2/3</span></div>;
                    } else if (req.status === "flagged") {
                      statusNode = (
                        <div 
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#B85C38]/10 text-[#B85C38] text-[12px] font-medium cursor-pointer hover:bg-[#B85C38]/20 transition-colors"
                          onClick={(e) => { e.stopPropagation(); go("workfile"); }}
                        >
                          Needs you
                        </div>
                      );
                    } else if (req.status === "missing") {
                      statusNode = <div className="text-[12px] text-[#B8862B]">Not found</div>;
                    } else if (req.status === "requested") {
                      statusNode = <div className="text-[12px] text-[#1A1D1A]/50 italic">Requested · waiting</div>;
                    }

                    return (
                      <React.Fragment key={req.id}>
                        <tr 
                          className="homium-register-row cursor-pointer"
                          onClick={(e) => toggleRow(req.id, e)}
                        >
                          <td>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[13px] font-medium">{req.name.split("—")[0].trim()}</span>
                              <span className="text-[10px] uppercase tracking-wide text-[#1A1D1A]/40">{req.formats}</span>
                            </div>
                          </td>
                          <td>
                            {req.file ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-[11px] text-[#1A1D1A]/80">{req.file}</span>
                                <span className="text-[10px] text-[#1A1D1A]/50">
                                  pp. <span className="font-mono">{req.pages}</span> <span className="mx-1 opacity-50">·</span> <span className="font-mono">{req.conf}%</span> match
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#1A1D1A]/40 italic">
                                {req.status === "requested" ? "requested — link sent" : "not in the upload"}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="font-mono text-[11px] text-[#1A1D1A]/70">{req.receivedOn || "—"}</span>
                          </td>
                          <td>
                            <span className={`font-mono text-[11px] ${checksTint}`}>{checksText}</span>
                          </td>
                          <td>{validityNode}</td>
                          <td>{statusNode}</td>
                          <td className="text-right pr-4">
                            <ChevronDown className={`w-4 h-4 inline-block text-[#1A1D1A]/30 transition-transform ${isExpanded ? "rotate-180 text-[#1A1D1A]/70" : ""}`} />
                          </td>
                        </tr>

                        {/* EXPANDED PANEL */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0 border-b border-[#1A1D1A]/10">
                              <div className="homium-expanded-panel p-5 pl-[24%] flex gap-8 relative overflow-hidden">
                                
                                {/* Left indicator */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B85C38]" />

                                <div className="flex-1 flex flex-col gap-3">
                                  {req.flag && (
                                    <div className="text-[13px] text-[#1A1D1A] leading-relaxed">
                                      <strong className="font-medium mr-2">{req.flag.kind}:</strong>
                                      {req.flag.note}
                                    </div>
                                  )}
                                  
                                  {!req.flag && req.desc && (
                                    <div className="text-[13px] text-[#1A1D1A]/80 leading-relaxed">
                                      {req.desc}
                                    </div>
                                  )}

                                  {req.scores && (
                                    <div className="font-mono text-[11px] text-[#1A1D1A]/60 flex items-center gap-3">
                                      <span>Quality {req.scores.q}</span>
                                      <span className="opacity-30">·</span>
                                      <span>Format {req.scores.f}</span>
                                      <span className="opacity-30">·</span>
                                      <span>Fraud risk {req.scores.fraud}</span>
                                    </div>
                                  )}

                                  {req.expiry && (
                                    <div className="text-[12px] text-[#1A1D1A]/70 mt-1">
                                      {req.expiry.note}
                                    </div>
                                  )}
                                </div>

                                <div className="w-48 flex flex-col gap-2 shrink-0 border-l border-[#1A1D1A]/10 pl-6 justify-center">
                                  {req.status === "flagged" && (
                                    <>
                                      <button 
                                        className="w-full py-2 bg-[#2A4D3B] text-white rounded text-[12px] font-medium shadow-sm hover:bg-[#1f3a2c] transition-colors"
                                        onClick={(e) => { e.stopPropagation(); go("workfile"); }}
                                      >
                                        Request re-scan
                                      </button>
                                      <button className="w-full py-2 bg-transparent border border-[#1A1D1A]/15 text-[#1A1D1A]/70 rounded text-[12px] font-medium hover:bg-[#1A1D1A]/5 hover:text-[#1A1D1A] transition-colors">
                                        Accept as-is
                                      </button>
                                    </>
                                  )}
                                  {req.status !== "flagged" && (
                                    <button 
                                      className="w-full py-2 bg-[#FDFCFA] border border-[#1A1D1A]/15 text-[#1A1D1A]/70 rounded text-[12px] font-medium hover:bg-[#1A1D1A]/5 hover:text-[#1A1D1A] transition-colors"
                                      onClick={(e) => { e.stopPropagation(); go("workfile"); }}
                                    >
                                      View in Workfile
                                    </button>
                                  )}
                                </div>
                                
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="flex-none px-6 py-2 border-t border-[#1A1D1A]/10 bg-[#F7F5F0] flex items-center justify-between font-mono text-[10px] text-[#1A1D1A]/50 mt-auto sticky bottom-0 z-20">
        <div className="flex items-center gap-3">
          <span>296 pages</span>
          <span className="opacity-30">·</span>
          <span>19 documents</span>
          <span className="opacity-30">·</span>
          <span>2 unassigned</span>
          <span className="opacity-30">·</span>
          <span>updated Jul 22, 11:31</span>
        </div>
        <div>
          Press <kbd className="px-1 py-0.5 border border-[#1A1D1A]/20 rounded bg-[#FDFCFA] text-[#1A1D1A]/70">/</kbd> to search 
          <span className="mx-2 opacity-30">·</span>
          <kbd className="px-1 py-0.5 border border-[#1A1D1A]/20 rounded bg-[#FDFCFA] text-[#1A1D1A]/70">Enter</kbd> to expand
        </div>
      </div>
      
    </div>
  );
}
