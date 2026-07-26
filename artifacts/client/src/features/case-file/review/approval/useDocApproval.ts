import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAnalysisQueryKey,
  getGetApplicationQueryKey,
  getListApplicationsQueryKey,
  useRecordDocumentApproval,
  useRecordMergeResolution,
  type FileSpan,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '../../../auth/ProfileContext';
import type { DocGroup, MergeDecision, PageDecisionValue } from './docGroups';
import type { PageIndex } from '../reviewModel';

/**
 * Page-decision state (the pre-step — nothing lands anywhere) + the
 * document-level submit that files into a block/variant and materializes
 * through the same seam as block accepts. File-native: submissions carry
 * FileSpans; global page decisions are translated to (fileId, page) via the
 * run's page index.
 */
export function useDocApproval(applicationId: string, index: PageIndex) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { toast } = useToast();

  /** groupId -> global page -> decision (pre-step, client-side only) */
  const [decisions, setDecisions] = useState<Record<string, Record<number, PageDecisionValue>>>({});

  const mutation = useRecordDocumentApproval({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(applicationId) });
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      },
      onError: (err: unknown) =>
        toast({
          description: `Approval not saved — ${err instanceof Error ? err.message : 'request failed'}`,
        }),
    },
  });

  // Merge-recommendation decisions persist on the application (audit trail +
  // the approval gate must survive a refresh). Upsert — reversible by design.
  const mergeMutation = useRecordMergeResolution({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
      },
      onError: (err: unknown) =>
        toast({
          description: `Merge decision not saved — ${err instanceof Error ? err.message : 'request failed'}`,
        }),
    },
  });

  const decide = (groupId: string, page: number, value: PageDecisionValue) =>
    setDecisions((d) => ({ ...d, [groupId]: { ...(d[groupId] ?? {}), [page]: value } }));

  const resolveMerge = (runId: string, spans: FileSpan[], decision: MergeDecision) =>
    mergeMutation.mutate({
      applicationId,
      data: { runId, spans, decision, decidedBy: profile.role as 'Originator' | 'Underwriter' | 'Manager' },
    });

  /** every page decided → the roll-up (rail auto-switches to document mode) */
  const fullyDecided = (group: DocGroup) => {
    const d = decisions[group.id] ?? {};
    return group.pageList.every((p) => d[p] != null);
  };

  const submit = (
    group: DocGroup,
    opts: {
      blockId: string;
      variantId?: string;
      outcome: 'approved' | 'approved_incomplete' | 'rejected';
      runId: string;
    },
    onDone?: () => void,
  ) => {
    const d = decisions[group.id] ?? {};
    const pageDecisions = group.pageList
      .filter((p) => d[p] != null)
      .map((p) => {
        const rp = index.at(p)!;
        return { fileId: rp.fileId, page: rp.page, decision: d[p]! };
      });
    mutation.mutate(
      {
        applicationId,
        data: {
          blockId: opts.blockId,
          ...(opts.variantId ? { variantId: opts.variantId } : {}),
          runId: opts.runId,
          spans: group.spans,
          ...(pageDecisions.length > 0 ? { pageDecisions } : {}),
          outcome: opts.outcome,
          decidedBy: profile.role as 'Originator' | 'Underwriter' | 'Manager',
        },
      },
      {
        onSuccess: () => {
          toast({
            description:
              opts.outcome === 'rejected'
                ? `Document rejected by ${profile.name} — recorded.`
                : opts.outcome === 'approved_incomplete'
                  ? `Approved incomplete — new version requested. Filed to the approved registry.`
                  : `Document approved by ${profile.name} — filed to the approved registry.`,
          });
          onDone?.();
        },
      },
    );
  };

  return {
    decisions,
    decide,
    resolveMerge,
    fullyDecided,
    submit,
    isPending: mutation.isPending,
  };
}
