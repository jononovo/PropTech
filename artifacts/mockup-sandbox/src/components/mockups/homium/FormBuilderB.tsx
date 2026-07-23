import React, { useEffect, useState } from 'react';
import { GripVertical, Plus, Download } from 'lucide-react';
import { 
  PALETTE, 
  PURCHASE_LOAN, 
  templateToJson, 
  templateStats, 
  expiryLabel, 
  Block 
} from './builderData';

// URL Params supported:
// ?insert=1 - Shows inserter popover open after "pay-stubs" block
// ?drop=1   - Shows a drop indicator after "pay-stubs" block

function SyntaxHighlightedJson({ json, selectedId }: { json: string; selectedId: string }) {
  const lines = json.split('\n');
  let startIdx = -1;
  let endIdx = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`"id": "${selectedId}"`)) {
      // track back
      for (let j = i; j >= 0; j--) {
        if (lines[j].includes('{')) {
          startIdx = j;
          break;
        }
      }
      // track forward
      let openBraces = 1;
      for (let j = startIdx + 1; j < lines.length; j++) {
        if (lines[j].includes('{')) openBraces++;
        if (lines[j].includes('}')) openBraces--;
        if (openBraces === 0) {
          endIdx = j;
          break;
        }
      }
      break;
    }
  }

  const highlightRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'auto', block: 'center' });
      }, 50);
    }
  }, [selectedId, startIdx]);

  return (
    <div className="font-mono text-[10.5px] leading-[1.6] py-3">
      {lines.map((line, i) => {
        const isHighlighted = startIdx !== -1 && i >= startIdx && i <= endIdx;
        const isFirstHighlighted = i === startIdx;
        const safeLine = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const formattedLine = safeLine
          .replace(/("[^"]*")(:?)/g, (match, p1, p2) => {
            if (p2 === ':') {
               return `<span style="color: #1E40AF">${p1}</span>${p2}`;
            }
            return `<span style="color: #0F172A">${p1}</span>`;
          })
          .replace(/([{}\[\],])/g, `<span style="color: #94A3B8">$1</span>`);
          
        return (
          <div 
            key={i} 
            ref={isFirstHighlighted ? highlightRef : undefined}
            className={`px-4 whitespace-pre ${isHighlighted ? 'bg-[#EFF6FF]' : ''}`} 
            dangerouslySetInnerHTML={{ __html: formattedLine || ' ' }} 
          />
        );
      })}
    </div>
  );
}

const Inserter = ({ active, isDrop }: { active?: boolean; isDrop?: boolean }) => {
  if (isDrop) {
    return (
      <div className="relative h-3 w-full flex items-center justify-center z-10">
        <div className="absolute inset-x-0 h-[2px] bg-[#1D4ED8]" />
        <div className="absolute left-1/2 -translate-x-1/2 bg-[#1D4ED8] text-white font-mono text-[9px] px-2 py-0.5 rounded uppercase tracking-widest font-semibold shadow-sm">
          Drop Block Here
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-3 w-full flex items-center justify-center z-10 group">
      <div className={`absolute inset-x-0 h-[2px] bg-[#1D4ED8] scale-x-0 group-hover:scale-x-100 transition-transform origin-center ${active ? 'scale-x-100' : ''}`} />
      <button className={`absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border flex items-center justify-center z-10 
        ${active ? 'border-[#1D4ED8] text-[#1D4ED8]' : 'border-slate-300 text-slate-400 opacity-0 group-hover:opacity-100'}`}>
        <Plus className="w-3 h-3" />
      </button>
      
      {active && (
        <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-48 bg-white border border-slate-200 rounded-md shadow-[0_8px_24px_rgba(15,23,42,0.12)] p-1.5 z-50 flex flex-col gap-0.5">
          {PALETTE.map(item => (
            <button key={item.kind} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded text-left transition-colors">
              <span className="text-[12px] font-medium text-slate-700">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const BlockCard = ({ block, isSelected }: { block: Block; isSelected: boolean }) => {
  return (
    <div className={`group relative bg-white border rounded p-3 flex items-start gap-3 transition-colors ${
      isSelected 
        ? 'border-[#1D4ED8] shadow-[0_0_0_1px_rgba(29,78,216,1)] z-20' 
        : 'border-slate-200 hover:border-slate-300 z-0'
    }`}>
      <div className={`mt-0.5 cursor-grab transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
         <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 pt-0.5">
         {isSelected ? (
           <div className="flex flex-col gap-3">
             <input 
               type="text" 
               defaultValue={block.name} 
               className="text-[13px] font-medium text-slate-900 border border-slate-300 rounded px-2 py-1.5 w-full focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]" 
             />
             <div className="flex items-center gap-5">
                {block.kind === 'document' && (
                  <>
                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                      <input type="checkbox" defaultChecked={block.required} className="rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8] w-3.5 h-3.5" />
                      Required
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400 font-mono">formats</span>
                      <input type="text" defaultValue={block.formats?.join(', ')} className="border border-slate-200 rounded px-2 py-1 w-24 font-mono text-[10px] text-slate-700 focus:outline-none focus:border-[#1D4ED8]" />
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400 font-mono">expiry</span>
                      <select defaultValue={block.expiry ? (block.expiry.kind === 'staleness' ? block.expiry.days : 'hard') : 0} className="border border-slate-200 rounded px-2 py-1 font-mono text-[10px] text-slate-700 focus:outline-none focus:border-[#1D4ED8] bg-white">
                        <option value={0}>None</option>
                        <option value={30}>30 Days</option>
                        <option value={60}>60 Days</option>
                        <option value={90}>90 Days</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </>
                )}
             </div>
           </div>
         ) : (
           <>
             <div className="flex items-center justify-between">
               <div className="text-[13px] font-medium text-slate-900">{block.name}</div>
               <div className="flex items-center gap-2.5">
                 {block.kind === 'document' && (
                   <>
                     <span className="font-mono text-[10px] text-slate-400">{block.formats?.join(', ')}</span>
                     <span className="text-slate-300 px-0.5">·</span>
                     <span className={`font-mono text-[10px] ${block.required ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                       {block.required ? 'REQ' : 'OPT'}
                     </span>
                     <span className="text-slate-300 px-0.5">·</span>
                     <span className="font-mono text-[10px] text-slate-400">{expiryLabel(block.expiry)}</span>
                     {block.multiPage && (
                       <>
                         <span className="text-slate-300 px-0.5">·</span>
                         <span className="font-mono text-[10px] text-slate-400">MULTI-PAGE</span>
                       </>
                     )}
                   </>
                 )}
               </div>
             </div>
             {block.kind === 'fields' && block.fields && (
               <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                 {block.fields.map(f => (
                   <div key={f.id} className="flex items-center gap-3">
                     <span className="font-mono text-[10px] text-slate-400 w-12">{f.type}</span>
                     <span className="text-[12px] text-slate-700">{f.label}</span>
                     {f.required && <span className="font-mono text-[10px] text-slate-400 ml-auto">req</span>}
                   </div>
                 ))}
               </div>
             )}
           </>
         )}
      </div>
    </div>
  );
};

export default function FormBuilderB() {
  const [insertOpen, setInsertOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setInsertOpen(urlParams.get('insert') === '1');
    setDropOpen(urlParams.get('drop') === '1');
    
    if (urlParams.get('focus') === 'income') {
      setTimeout(() => {
        document.getElementById('income-assets')?.scrollIntoView({ behavior: 'auto', block: 'center' });
      }, 50);
    }
  }, []);

  const selectedBlockId = "bank-statements";
  const selectedSection = PURCHASE_LOAN.sections.find(s => 
    s.subsections?.some(sub => sub.blocks?.some(b => b.id === selectedBlockId))
  );

  const stats = templateStats(PURCHASE_LOAN);
  const jsonContent = templateToJson(PURCHASE_LOAN);

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-[1440px] mx-auto bg-[#F3F5F7] text-slate-900 overflow-hidden font-inter selection:bg-blue-100">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}} />
      
      {/* Header */}
      <div className="h-[52px] border-b border-slate-200 bg-white flex items-center px-6 flex-shrink-0 justify-between">
        <div className="flex items-center gap-4">
          <div className="text-[14px] font-semibold text-slate-900 border-b border-dashed border-slate-300 pb-0.5 cursor-text">
            {PURCHASE_LOAN.template}
          </div>
          <div className="font-mono text-[10.5px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">v{PURCHASE_LOAN.version}</div>
          <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
          <div className="font-mono text-[10.5px] text-slate-500">
            {stats.sections} sections · {stats.docs} documents · {stats.fieldGroups} field groups
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Rail (Outline & Palette) */}
        <div className="w-[240px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-5 border-b border-slate-200 flex-1 overflow-y-auto">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-4">Outline</div>
            <div className="flex flex-col gap-3">
              {PURCHASE_LOAN.sections.map((sec, i) => {
                const isSelectedSec = selectedSection?.id === sec.id;
                return (
                  <div key={sec.id} className="relative">
                    {isSelectedSec && (
                      <div className="absolute -left-5 top-0 bottom-0 w-[3px] rounded-r bg-[#1D4ED8]" />
                    )}
                    <div className={`text-[12px] font-medium flex items-center gap-2 py-0.5 ${isSelectedSec ? 'text-[#1D4ED8]' : 'text-slate-700'}`}>
                       <span className={`font-mono text-[10px] ${isSelectedSec ? 'text-blue-500' : 'text-slate-400'}`}>
                         {(i+1).toString().padStart(2, '0')}
                       </span>
                       {sec.name}
                    </div>
                    {sec.subsections && sec.subsections.length > 0 && (
                      <div className="pl-6 border-l border-slate-100 ml-1.5 mt-1.5 flex flex-col gap-1.5">
                        {sec.subsections.map(sub => (
                          <div key={sub.id} className="text-[11.5px] text-slate-500">{sub.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="p-5 bg-slate-50 border-t border-slate-200">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-3">Palette</div>
            <div className="flex flex-col gap-1.5">
              {PALETTE.map(item => (
                <div key={item.kind} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded cursor-grab hover:border-slate-300 hover:shadow-sm transition-all">
                  <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[12px] font-medium text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center (Worksheet) */}
        <div className="flex-1 overflow-y-auto bg-[#F3F5F7] p-8">
          <div className="max-w-[640px] mx-auto pb-32">
            <Inserter active={false} />
            {PURCHASE_LOAN.sections.map((sec, secIdx) => (
              <div key={sec.id} className="mb-10">
                <div className="flex items-center gap-3 mb-5 pl-2" id={sec.id}>
                  <span className="font-mono text-[12px] text-slate-400">
                    {(secIdx + 1).toString().padStart(2, '0')}
                  </span>
                  <h2 className="text-[13px] font-semibold text-slate-900 uppercase tracking-[0.04em]">
                    {sec.name}
                  </h2>
                  <div className="px-1.5 py-0.5 bg-white border border-slate-200 text-[#64748B] text-[9px] font-semibold uppercase tracking-[0.1em] rounded-sm shadow-sm ml-1">
                    {sec.owner}
                  </div>
                </div>
                
                {sec.subsections?.map(sub => (
                  <div key={sub.id} className="mt-6 ml-6 border-l-2 border-slate-200 pl-5">
                    <h3 className="text-[12.5px] font-semibold text-slate-800 mb-3">{sub.name}</h3>
                    <div className="flex flex-col gap-0">
                      {sub.blocks?.map((block) => (
                        <React.Fragment key={block.id}>
                           <BlockCard block={block} isSelected={block.id === selectedBlockId} />
                           <Inserter 
                             active={insertOpen && block.id === 'pay-stubs' && !dropOpen} 
                             isDrop={dropOpen && block.id === 'pay-stubs'} 
                           />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Rail (Live JSON) */}
        <div className="w-[360px] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col">
          <div className="h-[40px] px-4 flex items-center border-b border-slate-200 bg-slate-50 flex-shrink-0">
            <div className="font-mono text-[11px] text-slate-500 tracking-tight">
              purchase-loan-ca.v3.json · writes as you edit
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
             <SyntaxHighlightedJson json={jsonContent} selectedId={selectedBlockId} />
          </div>
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
            <div className="font-mono text-[10.5px] text-slate-500">
              {new Blob([jsonContent]).size} bytes
            </div>
            <button className="px-4 py-1.5 bg-[#1D4ED8] text-white text-[12px] font-medium rounded hover:bg-[#1E40AF] transition-colors flex items-center gap-1.5 shadow-sm">
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
