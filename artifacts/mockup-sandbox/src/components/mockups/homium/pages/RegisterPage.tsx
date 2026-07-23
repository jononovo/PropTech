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
import { ChevronDown, Lock, Check, Search as SearchIcon } from "lucide-react";
import "./RegisterPage.css";

export default function RegisterPage({ go }: { go: Go }) {
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
    <div className="h-full overflow-y-auto bg-[#FFFFFF] text-[#0F172A] flex flex-col font-sans">
      
      {/* TOP STRIP */}
      <div className="flex-none px-6 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between sticky top-0 z-20">
        <div className="relative w-72">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Search requirements or files…" 
            className="w-full pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-[4px] text-[13px] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8] transition-shadow placeholder:text-[#94A3B8]"
          />
        </div>
        
        <div className="font-['IBM_Plex_Mono'] text-[11px] text-[#64748B] flex items-center gap-2">
          <span>{cleanCount} of {total} filed clean</span>
          <span className="text-[#CBD5E1]">·</span>
          <span className={needYouCount > 0 ? "text-[#B91C1C]" : ""}>{needYouCount} need you</span>
          <span className="text-[#CBD5E1]">·</span>
          <span className={clockCount > 0 ? "text-[#B45309]" : ""}>{clockCount} on the clock ≤30d</span>
        </div>
        
        <button className="px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] border border-[#CBD5E1] rounded-[4px] hover:bg-[#F8FAFC] transition-colors bg-[#FFFFFF]">
          Export file review
        </button>
      </div>

      {/* THE SHEET */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full pt-4 pb-12">
        <table className="homium-register-table border border-[#CBD5E1]">
          <colgroup>
            <col style={{ width: "24%" }} />
            <col style={{ width: "26%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "4%" }} />
          </colgroup>
          <thead className="sticky top-[45px] z-10 shadow-[0_1px_0_#E2E8F0]">
            <tr>
              <th>Requirement</th>
              <th>Document</th>
              <th>Received</th>
              <th className="text-right">Checks</th>
              <th className="text-right">Validity</th>
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
                        <div className="flex items-center gap-2">
                          <span className="font-['IBM_Plex_Mono'] text-[11px] text-[#64748B]">{sec.num}</span>
                          <span className="text-[12px] font-semibold text-[#0F172A]">
                            {sec.name}
                          </span>
                          <span className="ml-2 px-1.5 py-0.5 rounded-[3px] border border-[#E2E8F0] text-[9.5px] uppercase tracking-wider font-semibold text-[#64748B] bg-[#FFFFFF]">
                            {sec.owner}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 w-48">
                          <span className="font-['IBM_Plex_Mono'] text-[10px] text-[#64748B] shrink-0">
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
                    let checksTint = "text-[#64748B]";
                    if (req.status === "accepted" || req.status === "clean") {
                      checksText = "4/4";
                      checksTint = "text-[#15803D]";
                    } else if (req.status === "flagged") {
                      checksText = "3/4";
                      checksTint = "text-[#B91C1C]";
                    } else if (req.status === "review") {
                      checksText = "2/3";
                      checksTint = "text-[#475569]";
                    }

                    // Render Validity
                    let validityNode = <span className="text-[#94A3B8]">—</span>;
                    if (req.expiry) {
                      if (req.expiry.kind === "hard") {
                        const isStaleSoon = daysTo(req.expiry.staleOn) <= 30;
                        validityNode = (
                          <div 
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border font-['IBM_Plex_Mono'] text-[10px] cursor-pointer hover:opacity-80 transition-opacity ${
                              isStaleSoon 
                                ? "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]" 
                                : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]"
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
                            <div className="inline-flex items-center gap-1 font-['IBM_Plex_Mono'] text-[10px] text-[#15803D]">
                              <Lock className="w-3 h-3" />
                              <span>stopped {fmt(req.acceptedOn ? new Date(req.acceptedOn) : req.expiry.staleOn)}</span>
                            </div>
                          );
                        } else {
                          const d = daysTo(req.expiry.staleOn);
                          const b = band(d);
                          
                          let bg = "bg-[#F8FAFC]";
                          let text = "text-[#475569]";
                          let border = "border-[#E2E8F0]";
                          
                          if (b === "escalate") { 
                            bg = "bg-[#FEF2F2]"; text = "text-[#B91C1C]"; border = "border-[#FECACA]";
                          } else if (b === "warn") { 
                            bg = "bg-[#FFFBEB]"; text = "text-[#B45309]"; border = "border-[#FDE68A]";
                          }
                          
                          validityNode = (
                            <div 
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-[3px] border font-['IBM_Plex_Mono'] text-[10px] cursor-pointer hover:opacity-80 transition-opacity ${bg} ${text} ${border}`}
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
                    const tagBase = "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border text-[9.5px] uppercase tracking-wider font-semibold";
                    
                    if (req.status === "accepted") {
                      statusNode = (
                        <div className={`${tagBase} bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]`}>
                          <Check className="w-3 h-3" />
                          <span>Accepted <span className="font-['IBM_Plex_Mono'] ml-0.5">{req.acceptedOn || "—"}</span></span>
                        </div>
                      );
                    } else if (req.status === "clean") {
                      statusNode = <div className={`${tagBase} bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]`}>Filed</div>;
                    } else if (req.status === "review") {
                      statusNode = <div className={`${tagBase} bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]`}>Deep review <span className="font-['IBM_Plex_Mono']">2/3</span></div>;
                    } else if (req.status === "flagged") {
                      statusNode = (
                        <div 
                          className={`${tagBase} bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] cursor-pointer hover:bg-[#FEE2E2] transition-colors`}
                          onClick={(e) => { e.stopPropagation(); go("workfile"); }}
                        >
                          Needs you
                        </div>
                      );
                    } else if (req.status === "missing") {
                      statusNode = <div className={`${tagBase} bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]`}>Not found</div>;
                    } else if (req.status === "requested") {
                      statusNode = <div className={`${tagBase} bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]`}>Requested</div>;
                    }

                    return (
                      <React.Fragment key={req.id}>
                        <tr 
                          className="homium-register-row cursor-pointer"
                          onClick={(e) => toggleRow(req.id, e)}
                        >
                          <td>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[12.5px] font-medium text-[#0F172A]">{req.name.split("—")[0].trim()}</span>
                              <span className="text-[10px] uppercase font-semibold tracking-wide text-[#64748B]">{req.formats}</span>
                            </div>
                          </td>
                          <td>
                            {req.file ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-['IBM_Plex_Mono'] text-[11px] text-[#334155]">{req.file}</span>
                                <span className="text-[10px] text-[#64748B]">
                                  pp. <span className="font-['IBM_Plex_Mono']">{req.pages}</span> <span className="mx-1 text-[#CBD5E1]">·</span> <span className="font-['IBM_Plex_Mono']">{req.conf}%</span> match
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#64748B]">
                                {req.status === "requested" ? "Requested — link sent" : "Not in the upload"}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="font-['IBM_Plex_Mono'] text-[11px] text-[#475569]">{req.receivedOn || "—"}</span>
                          </td>
                          <td className="text-right">
                            <span className={`font-['IBM_Plex_Mono'] text-[11px] ${checksTint}`}>{checksText}</span>
                          </td>
                          <td className="text-right">{validityNode}</td>
                          <td>{statusNode}</td>
                          <td className="text-center">
                            <ChevronDown className={`w-3.5 h-3.5 inline-block text-[#94A3B8] transition-transform ${isExpanded ? "rotate-180 text-[#0F172A]" : ""}`} />
                          </td>
                        </tr>

                        {/* EXPANDED PANEL */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0 border-b border-[#E2E8F0]">
                              <div className="homium-expanded-panel p-4 pl-[24%] flex gap-6 relative">
                                
                                {/* Left indicator */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#DC2626]" />

                                <div className="flex-1 flex flex-col gap-2.5 py-1">
                                  {req.flag && (
                                    <div className="text-[12.5px] text-[#0F172A] leading-relaxed">
                                      <strong className="font-semibold text-[#B91C1C] mr-2">{req.flag.kind}:</strong>
                                      {req.flag.note}
                                    </div>
                                  )}
                                  
                                  {!req.flag && req.desc && (
                                    <div className="text-[12.5px] text-[#334155] leading-relaxed">
                                      {req.desc}
                                    </div>
                                  )}

                                  {req.scores && (
                                    <div className="font-['IBM_Plex_Mono'] text-[10.5px] text-[#64748B] flex items-center gap-3">
                                      <span>Quality {req.scores.q}</span>
                                      <span className="text-[#CBD5E1]">·</span>
                                      <span>Format {req.scores.f}</span>
                                      <span className="text-[#CBD5E1]">·</span>
                                      <span>Fraud risk {req.scores.fraud}</span>
                                    </div>
                                  )}

                                  {req.expiry && (
                                    <div className="text-[11px] text-[#64748B] mt-0.5">
                                      {req.expiry.note}
                                    </div>
                                  )}
                                </div>

                                <div className="w-44 flex flex-col gap-2 shrink-0 border-l border-[#F1F5F9] pl-6 justify-center">
                                  {req.status === "flagged" && (
                                    <>
                                      <button 
                                        className="w-full py-1.5 bg-[#1D4ED8] text-white rounded-[4px] text-[12px] font-semibold hover:bg-[#1E40AF] transition-colors"
                                        onClick={(e) => { e.stopPropagation(); go("workfile"); }}
                                      >
                                        Request re-scan
                                      </button>
                                      <button className="w-full py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] text-[#0F172A] rounded-[4px] text-[12px] font-semibold hover:bg-[#F8FAFC] transition-colors">
                                        Accept as-is
                                      </button>
                                    </>
                                  )}
                                  {req.status !== "flagged" && (
                                    <button 
                                      className="w-full py-1.5 bg-[#FFFFFF] border border-[#CBD5E1] text-[#0F172A] rounded-[4px] text-[12px] font-semibold hover:bg-[#F8FAFC] transition-colors"
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
      <div className="flex-none px-6 py-2 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between font-['IBM_Plex_Mono'] text-[10px] text-[#64748B] mt-auto sticky bottom-0 z-20">
        <div className="flex items-center gap-3">
          <span>296 pages</span>
          <span className="text-[#CBD5E1]">·</span>
          <span>19 documents</span>
          <span className="text-[#CBD5E1]">·</span>
          <span>2 unassigned</span>
          <span className="text-[#CBD5E1]">·</span>
          <span>updated Jul 22, 11:31</span>
        </div>
        <div>
          Press <kbd className="px-1 py-0.5 border border-[#E2E8F0] rounded-[3px] bg-[#FFFFFF] text-[#0F172A]">/</kbd> to search 
          <span className="mx-2 text-[#CBD5E1]">·</span>
          <kbd className="px-1 py-0.5 border border-[#E2E8F0] rounded-[3px] bg-[#FFFFFF] text-[#0F172A]">Enter</kbd> to expand
        </div>
      </div>
      
    </div>
  );
}
