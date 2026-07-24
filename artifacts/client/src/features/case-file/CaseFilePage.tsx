import { useState } from 'react';
import { useLocation } from 'wouter';
import { AppShell } from '@/components/AppShell';
import { CaseShell, type Lens } from './CaseShell';
import { TriagePage } from './lenses/TriagePage';
import { WorkfilePage } from './lenses/WorkfilePage';
import { TimelinePage } from './lenses/TimelinePage';
import { RegisterPage } from './lenses/RegisterPage';
import { useCaseFile } from './useCaseFile';
import './case-file.css';

const LENSES: Lens[] = ['triage', 'workfile', 'timeline', 'register'];

export function CaseFilePage({ id, lens }: { id: string; lens?: string }) {
  const [, setLocation] = useLocation();
  const { model, isLoading, error } = useCaseFile(id);
  const [focusSectionId, setFocusSectionId] = useState<string | null>(null);

  const activeLens: Lens = LENSES.includes(lens as Lens) ? (lens as Lens) : 'triage';

  const goLens = (next: Lens, sectionId?: string) => {
    setFocusSectionId(sectionId ?? null);
    setLocation(`/applications/${id}/${next}`);
  };

  return (
    <AppShell active="applications">
      <div className="case-root flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="p-8 ops-mono text-sm text-[var(--ops-muted)]">Loading case file…</div>
        ) : error || !model ? (
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
        ) : (
          <CaseShell model={model} lens={activeLens} onLens={goLens}>
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
          </CaseShell>
        )}
      </div>
    </AppShell>
  );
}
