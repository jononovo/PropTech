import React, { useState, useEffect, useRef } from "react";
import { Asterisk, Link2, CirclePlus, CircleDashed, Diamond, Globe, Lock, ArrowLeftRight } from "lucide-react";
import { Block, Template, requirementLabel, groupForPrimary, groupsSatisfiedBy, blockName } from "./builderData";

const getSectionNumber = (t: Template, bId: string) => {
  for (let i = 0; i < t.sections.length; i++) {
    for (const ss of t.sections[i].subsections) {
      for (const b of ss.blocks) {
        if (b.id === bId) return (i + 1).toString().padStart(2, '0');
      }
    }
  }
  return "00";
};

export function DocDimensions({ 
  block, 
  template, 
  variant, 
  initTipOpen = false 
}: { 
  block: Block, 
  template: Template, 
  variant: "icons" | "labels", 
  initTipOpen?: boolean 
}) {
  if (block.kind !== "document") return null;

  const items: { id: string, icon: React.ReactNode, label: string, important?: boolean, blockLevel?: boolean, skipLabel?: boolean }[] = [];

  // Requirement
  let reqIcon = <Asterisk size={14} />;
  if (block.requirement === "required_alt") reqIcon = <Link2 size={14} />;
  else if (block.requirement === "recommended") reqIcon = <CirclePlus size={14} />;
  else if (block.requirement === "optional") reqIcon = <CircleDashed size={14} />;
  
  items.push({ 
    id: "req", 
    icon: reqIcon, 
    label: requirementLabel(block.requirement), 
    important: block.requirement.startsWith("required") 
  });

  // Criticality
  if (block.criticality === "critical") {
    items.push({ id: "crit", icon: <Diamond size={14} />, label: "critical" });
  }

  // Sourcing
  if (block.sourcing === "constrained") {
    items.push({ id: "src", icon: <Globe size={14} />, label: "constrained sourcing", skipLabel: true });
  } else if (block.sourcing === "scarce") {
    items.push({ id: "src", icon: <Lock size={14} />, label: "scarce — plan alternatives", skipLabel: true });
  }

  // Alternatives
  const primaryGroup = groupForPrimary(template, block.id);
  if (primaryGroup) {
    const altNames = primaryGroup.satisfiedBy.map(altId => `${blockName(template, altId)} (${getSectionNumber(template, altId)})`).join(", ");
    items.push({ id: "alt-primary", icon: <ArrowLeftRight size={14} />, label: `required — unless ${altNames} is filed`, blockLevel: true });
  }

  const satisfiedGroups = groupsSatisfiedBy(template, block.id);
  if (satisfiedGroups.length > 0) {
    const primaryNames = satisfiedGroups.map(g => `${g.name} (${getSectionNumber(template, g.primary)})`).join(", ");
    items.push({ id: "alt-member", icon: <ArrowLeftRight size={14} />, label: `can satisfy: ${primaryNames}`, blockLevel: true });
  }

  const [openTipId, setOpenTipId] = useState<string | null>(initTipOpen ? items[0]?.id : null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenTipId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "labels") {
    const inlineItems = items.filter(i => !i.blockLevel && !i.skipLabel);
    const blockItems = items.filter(i => i.blockLevel && !i.skipLabel);
    
    return (
      <>
        {inlineItems.map((item, idx) => (
          <React.Fragment key={item.id}>
            {idx > 0 && <span className="text-[#CBD5E1]">•</span>}
            <span className={item.important ? "text-[#334155]" : "text-[#64748B]"}>
              {item.label}
            </span>
          </React.Fragment>
        ))}
        {blockItems.length > 0 && (
          <div className="w-full basis-full font-mono text-[10px] text-[#64748B] mt-1.5 pt-1.5 border-t border-dashed border-[#F1F5F9] flex flex-col gap-1">
            {blockItems.map(item => (
              <div key={item.id}>{item.label}</div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-[6px] relative" ref={containerRef}>
      {items.map(item => (
        <div key={item.id} className="relative flex items-center">
          <button
            onClick={() => setOpenTipId(openTipId === item.id ? null : item.id)}
            className={`text-[#64748B] hover:text-[#0F172A] transition-colors flex items-center justify-center w-[16px] h-[16px] ${openTipId === item.id ? 'text-[#0F172A]' : ''}`}
          >
            {item.icon}
          </button>
          {openTipId === item.id && (
            <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-50 whitespace-nowrap bg-[#0F172A] text-white font-mono text-[10px] px-2.5 py-1.5 rounded-[4px] shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
              {item.label}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-[#0F172A]" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
