import React, { useState } from 'react';
import { 
  Check, 
  ChevronDown, 
  FileText, 
  BrainCircuit, 
  AlertTriangle,
  UploadCloud,
  Link as LinkIcon,
  RefreshCcw,
  CheckCircle2,
  X,
  FileImage,
  MousePointerClick,
  GripVertical,
  ArrowRight
} from 'lucide-react';

export function Intake() {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1A1D1A] font-['DM_Sans',_sans-serif] selection:bg-[#2A4D3B] selection:text-white flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 border-b-2 border-b-[#E3E1DB] bg-[#F7F5F0]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#2A4D3B] text-[#F7F5F0] flex items-center justify-center font-['Fraunces'] font-bold italic text-lg">
              H
            </div>
            <span className="font-['Fraunces'] font-medium text-lg tracking-wide text-[#2A4D3B]">
              Homium
            </span>
          </div>
          <div className="h-6 w-px bg-[#E3E1DB]"></div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#737A73]">Intake Queue</span>
            <span className="text-[#E3E1DB]">/</span>
            <span className="font-medium flex items-center gap-2">
              Batch #4920
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-sm bg-[#EAF0EC] border border-[#D5E3D8] text-[#2A4D3B] text-xs font-medium tracking-wide flex items-center gap-1">
              <Check className="w-3 h-3" /> ANALYZED
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-[#737A73]">Originator: <span className="font-medium text-[#1A1D1A]">Sarah Jenkins</span></div>
          <div className="h-6 w-px bg-[#E3E1DB]"></div>
          <button className="bg-[#2A4D3B] hover:bg-[#1E3A2B] text-[#F7F5F0] text-sm font-medium px-5 py-2 rounded-md shadow-sm transition-colors flex items-center gap-2">
            Commit Batch
            <Check className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 flex items-start gap-8">
        
        {/* Left Column: Dropzone & Integrations */}
        <aside className="w-80 shrink-0 space-y-6">
          <div className="bg-white border border-[#E3E1DB] rounded-lg p-6 shadow-sm">
            <h3 className="font-['Fraunces'] text-lg font-medium text-[#2A4D3B] mb-4">Add Files</h3>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                dragActive ? 'border-[#2A4D3B] bg-[#EAF0EC]' : 'border-[#C4C2BB] bg-[#FAFAF9] hover:bg-[#FDFDFB]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); }}
            >
              <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                <UploadCloud className="w-6 h-6 text-[#2A4D3B]" />
              </div>
              <span className="text-sm font-medium text-[#1A1D1A] mb-1">Click or drag files here</span>
              <span className="text-xs text-[#737A73]">PDF, JPG, PNG (Max 50MB)</span>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-3 text-xs text-[#A3AA9F] font-bold tracking-widest uppercase mb-4 before:h-px before:flex-1 before:bg-[#E3E1DB] after:h-px after:flex-1 after:bg-[#E3E1DB]">
                OR IMPORT FROM
              </div>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-[#E3E1DB] bg-white text-sm font-medium text-[#4A4F4A] hover:bg-[#FAFAF9] transition-colors">
                  <LinkIcon className="w-4 h-4" /> Google Drive
                </button>
                <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md border border-[#E3E1DB] bg-white text-sm font-medium text-[#4A4F4A] hover:bg-[#FAFAF9] transition-colors">
                  <LinkIcon className="w-4 h-4" /> Dropbox
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Analyzed Batch */}
        <div className="flex-1 max-w-4xl space-y-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h2 className="font-['Fraunces'] text-2xl font-medium text-[#1A1D1A]">Analyzed Documents</h2>
              <p className="text-[#737A73] mt-1 text-[15px]">Review AI classifications and confirm document mapping.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-[#A3B18A]"></div>
                <span className="text-[#4A4F4A]">2 Confirmed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-[#D39B88]"></div>
                <span className="text-[#4A4F4A]">2 Pending Review</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            
            {/* Item 1: Auto-allocated, high confidence */}
            <div className="bg-white border border-[#D5E3D8] rounded-lg shadow-sm flex items-center p-3 gap-4 group transition-all hover:shadow-md">
              <div className="cursor-grab text-[#D1CFC9] hover:text-[#737A73]">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="p-2 bg-[#FAFAF9] rounded border border-[#E3E1DB]">
                <FileText className="w-6 h-6 text-[#4A4F4A]" />
              </div>
              <div className="w-64 shrink-0">
                <div className="font-medium text-[#1A1D1A] text-sm truncate" title="chase_stmt_09_2023.pdf">chase_stmt_09_2023.pdf</div>
                <div className="text-xs text-[#737A73] mt-0.5">1.2 MB &bull; PDF</div>
              </div>
              
              <div className="flex-1 flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-[#A3AA9F]" />
                <div className="flex-1 flex flex-col gap-1.5 bg-[#F5F9F6] border border-[#D5E3D8] rounded-md p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#2A4D3B] flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" /> AI Suggestion
                    </span>
                    <span className="text-[10px] font-['Space_Mono'] text-[#737A73]">98% Match</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="flex-1 text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0 text-[#1A1D1A] cursor-pointer">
                      <option>Bank Statements — Last 3 Months</option>
                      <option>W-2 Forms</option>
                      <option>Tax Returns</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="w-32 shrink-0 flex items-center justify-end">
                <button className="flex items-center gap-1.5 text-sm font-medium text-[#A3B18A] hover:text-[#2A4D3B] transition-colors border border-transparent hover:border-[#D5E3D8] px-3 py-1.5 rounded-md hover:bg-[#EAF0EC]">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm
                </button>
              </div>
            </div>

            {/* Item 2: Flagged for legibility */}
            <div className="bg-[#FFF8ED] border border-[#FDE3B8] rounded-lg shadow-sm flex flex-col p-3 gap-3 group transition-all">
              <div className="flex items-center gap-4">
                <div className="cursor-grab text-[#D1CFC9] hover:text-[#737A73]">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="p-2 bg-white rounded border border-[#FDE3B8]">
                  <FileImage className="w-6 h-6 text-[#9A6A1D]" />
                </div>
                <div className="w-64 shrink-0">
                  <div className="font-medium text-[#1A1D1A] text-sm truncate" title="scan_001.jpg">scan_001.jpg</div>
                  <div className="text-xs text-[#737A73] mt-0.5">3.4 MB &bull; JPG</div>
                </div>
                
                <div className="flex-1 flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 text-[#A3AA9F]" />
                  <div className="flex-1 flex flex-col gap-1.5 bg-white border border-[#FDE3B8] rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-[#9A6A1D] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Low Confidence
                      </span>
                      <span className="text-[10px] font-['Space_Mono'] text-[#9A6A1D]">62% Match</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="flex-1 text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0 text-[#1A1D1A] cursor-pointer">
                        <option>W-2 Forms</option>
                        <option>Bank Statements</option>
                        <option>Driver's License</option>
                        <option>Unassigned</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="w-32 shrink-0 flex items-center justify-end">
                  <button className="flex items-center gap-1.5 text-sm font-medium text-[#9A6A1D] border border-[#FDE3B8] bg-white px-3 py-1.5 rounded-md hover:bg-[#FDF6E3] transition-colors shadow-sm">
                    Review
                  </button>
                </div>
              </div>
              <div className="ml-14 flex items-center gap-2 text-xs text-[#7A5317]">
                <span className="font-medium">AI Note:</span>
                <span>Document is blurry. OCR extracted partial text matching "Wage and Tax Statement". Human verification required.</span>
              </div>
            </div>

            {/* Item 3: Auto-allocated, high confidence (Already confirmed state) */}
            <div className="bg-white border border-[#E3E1DB] rounded-lg shadow-sm flex items-center p-3 gap-4 group opacity-75">
              <div className="w-5"></div> {/* Spacer for align */}
              <div className="p-2 bg-[#FAFAF9] rounded border border-[#E3E1DB]">
                <FileText className="w-6 h-6 text-[#4A4F4A]" />
              </div>
              <div className="w-64 shrink-0">
                <div className="font-medium text-[#737A73] text-sm truncate line-through decoration-[#D1CFC9]">tax_return_signed.pdf</div>
                <div className="text-xs text-[#A3AA9F] mt-0.5">4.1 MB &bull; PDF</div>
              </div>
              
              <div className="flex-1 flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-[#E3E1DB]" />
                <div className="flex-1 flex flex-col gap-1.5 bg-[#FAFAF9] border border-[#E3E1DB] rounded-md p-2">
                  <div className="text-sm font-medium text-[#737A73]">Tax Returns — Last 2 Years</div>
                </div>
              </div>

              <div className="w-32 shrink-0 flex items-center justify-end">
                <span className="flex items-center gap-1.5 text-sm font-medium text-[#A3B18A]">
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmed
                </span>
              </div>
            </div>

            {/* Item 4: Unknown */}
            <div className="bg-white border border-[#E3E1DB] rounded-lg shadow-sm flex items-center p-3 gap-4 group hover:border-[#C4C2BB] transition-colors">
              <div className="cursor-grab text-[#D1CFC9] hover:text-[#737A73]">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="p-2 bg-[#FAFAF9] rounded border border-[#E3E1DB]">
                <FileText className="w-6 h-6 text-[#A3AA9F]" />
              </div>
              <div className="w-64 shrink-0">
                <div className="font-medium text-[#1A1D1A] text-sm truncate" title="unknown_doc_v2.pdf">unknown_doc_v2.pdf</div>
                <div className="text-xs text-[#737A73] mt-0.5">0.8 MB &bull; PDF</div>
              </div>
              
              <div className="flex-1 flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-[#E3E1DB]" />
                <div className="flex-1 flex flex-col gap-1.5 bg-white border border-[#C4C2BB] rounded-md p-2 border-dashed">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#737A73]">Unrecognized</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select defaultValue="" className="flex-1 text-sm text-[#737A73] bg-transparent border-none outline-none focus:ring-0 p-0 cursor-pointer">
                      <option value="" disabled>Select destination...</option>
                      <option>Bank Statements</option>
                      <option>W-2 Forms</option>
                      <option>Tax Returns</option>
                      <option>Letter of Explanation</option>
                      <option>Initial Disclosures</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="w-32 shrink-0 flex items-center justify-end">
                <button className="text-sm font-medium text-[#A3AA9F] cursor-not-allowed">
                  Confirm
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
