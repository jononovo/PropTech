import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAnalysisQueryKey,
  getGetApplicationQueryKey,
  getListApplicationsQueryKey,
  getListTemplatesQueryKey,
  useDecidePacketGate,
  useGetAnalysis,
  useGetApplication,
  useRecordVerdict,
  useUpdateApplication,
  useUpgradeTemplateVersion,
  useUploadPacket,
} from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '../auth/ProfileContext';
import { buildCaseModel, type CaseModel } from './caseData';

export function useCaseFile(applicationId: string) {
  const appQ = useGetApplication(applicationId);
  const analysisQ = useGetAnalysis(applicationId);

  // Only build the model once BOTH fetches succeed. A failed analysis fetch
  // must surface as an error — never as the "no analyzer run yet" empty state.
  const model: CaseModel | null = useMemo(
    () => (appQ.data && analysisQ.isSuccess ? buildCaseModel(appQ.data, analysisQ.data) : null),
    [appQ.data, analysisQ.isSuccess, analysisQ.data],
  );

  return {
    model,
    isLoading: appQ.isLoading || analysisQ.isLoading,
    error: appQ.error ?? analysisQ.error ?? null,
  };
}

const errText = (err: unknown) =>
  err instanceof Error ? err.message : 'request failed — try again';

/** Human verdicts. decidedBy comes from the signed-in test profile. */
export function useVerdictActions(applicationId: string) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { toast } = useToast();

  const mutation = useRecordVerdict({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(applicationId) });
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      },
      onError: (err: unknown) => toast({ description: `Verdict not saved — ${errText(err)}` }),
    },
  });

  const accept = (
    blockId: string,
    dates: { documentDate?: string; expiryDate?: string; datesEdited: boolean },
    opts?: { stopsClock?: boolean; onDone?: () => void },
  ) =>
    mutation.mutate(
      {
        applicationId,
        blockId,
        data: { verdict: 'accepted', decidedBy: profile.role, ...dates },
      },
      {
        onSuccess: () => {
          toast({
            description: `Accepted by ${profile.name} (${profile.role})${opts?.stopsClock ? ' — staleness clock stopped' : ''}. Saved to the audit trail.`,
          });
          opts?.onDone?.();
        },
      },
    );

  const requestNewVersion = (blockId: string, blockName: string) =>
    mutation.mutate(
      {
        applicationId,
        blockId,
        data: { verdict: 'new_version_requested', decidedBy: profile.role, datesEdited: false },
      },
      {
        onSuccess: () =>
          toast({ description: `New version of ${blockName} requested by ${profile.name}.` }),
      },
    );

  return { accept, requestNewVersion, isPending: mutation.isPending };
}

/** Projected closing date — portal-owned, editable from the case header. */
export function useClosingDate(applicationId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useUpdateApplication({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      },
      onError: (err: unknown) => toast({ description: `Closing date not saved — ${errText(err)}` }),
    },
  });

  const setClosingDate = (date: string | null) =>
    mutation.mutate(
      { applicationId, data: { projectedClosingDate: date } },
      {
        onSuccess: () =>
          toast({ description: date ? `Closing target set to ${date}.` : 'Closing target cleared.' }),
      },
    );

  return { setClosingDate, isPending: mutation.isPending };
}

/**
 * Template re-pin — additive-only upgrade to a newer active version of the
 * same family. The server refuses downgrades, inactive targets and moves that
 * would orphan blocks; each success lands in the application's audit trail.
 */
export function useTemplateUpgrade(applicationId: string) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { toast } = useToast();

  const mutation = useUpgradeTemplateVersion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(applicationId) });
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        // inUseBy counts in the template library shift with the pin
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
      },
      onError: (err: unknown) => toast({ description: `Template not upgraded — ${errText(err)}` }),
    },
  });

  const upgrade = (targetVersion: number) =>
    mutation.mutate(
      {
        applicationId,
        data: { targetVersion, decidedBy: `${profile.name} · ${profile.role}` },
      },
      {
        onSuccess: () =>
          toast({
            description: `Template upgraded to v${targetVersion}. Recorded in the audit trail.`,
          }),
      },
    );

  return { upgrade, isPending: mutation.isPending };
}

/**
 * Packet upload + gate decision. Upload runs the server-side pre-flight
 * synchronously; the response alone tells us whether the packet gated or
 * auto-proceeded — the card that renders IS the feedback, so no success toast.
 */
export function usePacketActions(applicationId: string) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
    queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(applicationId) });
    queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
  };

  const upload = useUploadPacket({
    // Invalidate on error too: a 502 means the server reverted the packet to
    // gated, a 409 means another request advanced it — refetch either way so
    // the UI shows the server's real state, not a stale one.
    mutation: { onSuccess: invalidate, onError: invalidate },
  });

  const gate = useDecidePacketGate({
    mutation: {
      onSuccess: invalidate,
      onError: (err: unknown) => {
        invalidate();
        toast({ description: `Gate decision not recorded — ${errText(err)}` });
      },
    },
  });

  const uploadPacket = (file: File) => upload.mutate({ applicationId, data: { file } });

  const decide = (decision: 'confirmed' | 'bypassed', plan?: { parse?: string; text?: string; judge?: string }) =>
    gate.mutate(
      { applicationId, data: { decision, decidedBy: `${profile.name} · ${profile.role}`, plan } },
      {
        onSuccess: () =>
          toast({
            description:
              decision === 'bypassed'
                ? 'Processing anyway — the flags stay on the record.'
                : 'Gate confirmed — analyzer started.',
          }),
      },
    );

  return { uploadPacket, decide, upload, gate };
}
