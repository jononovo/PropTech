import pathlib

p = pathlib.Path('artifacts/mockup-sandbox/src/components/mockups/doc-approval/FilmstripFinal.tsx')
txt = p.read_text()

txt = txt.replace(
    '<div className="absolute -top-[22px] left-0 flex items-center gap-1.5 w-max px-0.5">\n                <div className="text-[10.5px] font-bold text-slate-600 truncate">URLA Form 1003</div>\n                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />\n              </div>',
    '<div className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden">\n                <div className="text-[10.5px] font-bold text-slate-600 truncate min-w-0">URLA Form 1003</div>\n                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3] shrink-0" />\n              </div>'
)

txt = txt.replace(
    '<div className="absolute -top-[22px] left-0 flex items-center gap-1.5 w-max px-0.5">\n                <div className="text-[10.5px] font-bold text-slate-600 truncate">Bank statement · Jan</div>\n                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />\n              </div>',
    '<div className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden">\n                <div className="text-[10.5px] font-bold text-slate-600 truncate min-w-0">Bank statement · Jan</div>\n                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3] shrink-0" />\n              </div>'
)

txt = txt.replace(
    '<div className="absolute -top-[22px] left-0 flex items-center gap-1.5 w-max px-0.5">\n                <div className="text-[10.5px] font-bold text-purple-700 truncate">Driver\'s license (front)</div>\n              </div>',
    '<div className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden">\n                <div className="text-[10.5px] font-bold text-purple-700 truncate min-w-0">Driver\'s license (front)</div>\n              </div>'
)

txt = txt.replace(
    '<div className="absolute -top-[22px] left-0 flex items-center gap-1.5 w-max px-0.5">\n                <div className="text-[10.5px] font-bold text-purple-700 truncate">Driver\'s license (back)</div>\n              </div>',
    '<div className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden">\n                <div className="text-[10.5px] font-bold text-purple-700 truncate min-w-0">Driver\'s license (back)</div>\n              </div>'
)

txt = txt.replace(
    '<div \n                className="absolute -top-[22px] left-0 flex items-center gap-1.5 w-max px-0.5 cursor-pointer"\n                onClick={() => setMode(\'document\')}\n              >\n                <div className={`text-[10.5px] font-bold truncate ${mode === \'document\' ? \'text-blue-700\' : \'text-slate-600\'}`}>Bank statement · Feb</div>\n              </div>',
    '<div \n                className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 cursor-pointer overflow-hidden"\n                onClick={() => setMode(\'document\')}\n              >\n                <div className={`text-[10.5px] font-bold truncate min-w-0 ${mode === \'document\' ? \'text-blue-700\' : \'text-slate-600\'}`}>Bank statement · Feb</div>\n              </div>'
)

txt = txt.replace(
    '<div className="absolute -top-[22px] left-0 flex items-center gap-2 w-max px-0.5">\n                <div className="text-[10.5px] font-bold text-slate-600 truncate">Pay stub</div>\n                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-medium px-1.5 py-[1px] rounded flex items-center gap-1">\n                  <Flag className="w-2.5 h-2.5 text-amber-600 fill-amber-100" />\n                  low score — accepted with flag\n                </div>\n                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />\n              </div>',
    '<div className="absolute -top-[22px] left-0 w-full flex items-center gap-1 px-0.5 overflow-hidden">\n                <div className="text-[10.5px] font-bold text-slate-600 truncate shrink min-w-0">Pay stub</div>\n                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-medium px-1.5 py-[1px] rounded flex items-center gap-1 shrink truncate min-w-0" title="low score — accepted with flag">\n                  <Flag className="w-2.5 h-2.5 text-amber-600 fill-amber-100 shrink-0" />\n                  <span className="truncate">accepted with flag</span>\n                </div>\n                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3] shrink-0" />\n              </div>'
)

p.write_text(txt)
