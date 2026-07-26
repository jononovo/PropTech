import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { UserMenu } from '@/components/UserMenu';
import { CaseShell, type Lens } from './CaseShell';
import { IntakePage } from './lenses/IntakePage';
import { TriagePage } from './lenses/TriagePage';
import { WorkfilePage } from './lenses/WorkfilePage';
import { TimelinePage } from './lenses/TimelinePage';
import { RegisterPage } from './lenses/RegisterPage';
import { LedgerPage } from './lenses/LedgerPage';
import { useCaseFile } from './useCaseFile';
import './case-file.css';

const LENSES: Lens[] = ['intake', 'triage', 'workfile', 'timeline', 'register', 'ledger'];

export function CaseFilePage({ id, lens }: { id: string; lens?: string }) {
  const [, setLocation] = useLocation();
  const { model, isLoading, error } = useCaseFile(id);
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);

  // No lens in the URL: land on the report when a run exists, otherwise Intake.
  const activeLens: Lens = LENSES.includes(lens as Lens) ? (lens as Lens) : model?.run ? 'triage' : 'intake';

  const goLens = (next: Lens, sectionId?: string) => {
    setFocusSectionId(sectionId ?? null);
    setLocation(`/applications/${id}/${next}`);
  };

  return (
    <div className="case-root w-full min-h-[100dvh] flex flex-col font-sans selection:bg-[#BFDBFE] selection:text-[#1E40AF]">
      {isLoading ? (
        <>
          <BareHeader />
          <div className="p-8 ops-mono text-sm text-[var(--ops-muted)]">Loading case file…</div>
        </>
      ) : error || !model ? (
        <>
          <BareHeader />
          <div className="p-8 max-w-[520px]">
            <div className="bg-white border border-[var(--ops-critical-border)] rounded-[6px] p-5">
              <div className="text-[14px] font-semibold text-[var(--ops-critical-text)] mb-1">
                Couldn't open this case file
              </div>
              <div className="text-[12.5px] text-[var(--ops-body-sec)]">
                {error instanceof Error ? error.message : 'The case file could not be loaded.'}
              </div>
            </div>
          </div>
        </>
      ) : (
        <CaseShell model={model} lens={activeLens} onLens={goLens}>
          {activeLens === 'intake' && <IntakePage model={model} applicationId={id} onLens={goLens} />}
          {activeLens === 'triage' && <TriagePage model={model} applicationId={id} onLens={goLens} />}
          {activeLens === 'workfile' && (
            <WorkfilePage
              key={focusSectionId ?? 'default'}
              model={model}
              applicationId={id}
              onLens={goLens}
              focusSectionId={focusSectionId}
            />
          )}
          {activeLens === 'timeline' && <TimelinePage model={model} onLens={goLens} />}
          {activeLens === 'register' && <RegisterPage model={model} applicationId={id} onLens={goLens} />}
          {activeLens === 'ledger' && <LedgerPage applicationId={id} />}
        </CaseShell>
      )}
    </div>
  );
}

/** Case chrome before the model loads — logo home + account only. */
function BareHeader() {
  return (
    <header className="shrink-0 h-[52px] bg-white border-b border-[var(--ops-border)] flex items-center justify-between pl-3 md:pl-5 pr-2 md:pr-4">
      <Link href="/" data-testid="link-brand-home" className="flex items-center gap-2.5">
        <div className="w-[22px] h-[22px] bg-[#0F172A] rounded-[5px] flex items-center justify-center">
          <div className="w-[10px] h-[10px] border-[1.5px] border-white rounded-[2px]" />
        </div>
        <span className="text-[15px] font-bold tracking-[-0.01em]">Sheaf</span>
      </Link>
      <UserMenu />
    </header>
  );
}
