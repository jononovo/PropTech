import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAnalysisQueryKey,
  getGetApplicationQueryKey,
  getListApplicationsQueryKey,
  useRecordDocumentApproval,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '../../../auth/ProfileContext';
import type { DocGroup, PageDecisionValue } from './docGroups';

/**
 * Page-decision state (the pre-step — nothing lands anywhere) + the
 * document-level submit that files into a block/variant and materializes
 * through the same seam as block accepts.
 */
export function useDocApproval(applicationId: string) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { toast } = useToast();

  /** groupId -> page -> decision (pre-step, client-side only) */
  const [decisions, setDecisions] = useState<Record<string, Record<number, PageDecisionValue>>>({});
  /** adjacent groups the human linked as one document */
  const [links, setLinks] = useState<Array<[string, string]>>([]);

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

  const decide = (groupId: string, page: number, value: PageDecisionValue) =>
    setDecisions((d) => ({ ...d, [groupId]: { ...(d[groupId] ?? {}), [page]: value } }));

  const link = (aId: string, bId: string) => setLinks((ls) => [...ls, [aId, bId]]);

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
      .map((p) => ({ page: p, decision: d[p]! }));
    mutation.mutate(
      {
        applicationId,
        data: {
          blockId: opts.blockId,
          ...(opts.variantId ? { variantId: opts.variantId } : {}),
          runId: opts.runId,
          pages: group.pages,
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

  return { decisions, decide, links, link, fullyDecided, submit, isPending: mutation.isPending };
}
