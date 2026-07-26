import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAnalysisQueryKey,
  getGetApplicationQueryKey,
  getListApplicationsQueryKey,
  getListTemplatesQueryKey,
  useDecideRunGate,
  useGetAnalysis,
  useGetApplication,
  useRecordPlacement,
  useRecordVerdict,
  useAddVariant,
  useDeleteVariant,
  useMaterializeApprovedDoc,
  useUpdateApplication,
  useUpgradeTemplateVersion,
  useUploadDocument,
  useReceiveFiles,
  useUpdateSourceFile,
  type FileSpan,
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

/**
 * Manual filing of analyzer-unassigned page ranges — "your assignments win."
 * A placement replaces any earlier one overlapping the same pages (server rule).
 */
export function usePlacementActions(applicationId: string) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { toast } = useToast();

  const mutation = useRecordPlacement({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(applicationId) });
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
      },
      onError: (err: unknown) => toast({ description: `Placement not saved — ${errText(err)}` }),
    },
  });

  const rangeText = (span: FileSpan) =>
    span.pages[0] === span.pages[1]
      ? `p. ${span.pages[0]}`
      : `pp. ${span.pages[0]}–${span.pages[1]}`;

  const fileAs = (span: FileSpan, blockId: string, blockName: string, runId?: string) =>
    mutation.mutate(
      {
        applicationId,
        data: { span, target: blockId, decidedBy: profile.role, ...(runId ? { runId } : {}) },
      },
      {
        onSuccess: () =>
          toast({
            description: `Filed ${rangeText(span)} as ${blockName} — the analyzer treats this as ground truth.`,
          }),
      },
    );

  const archive = (span: FileSpan, runId?: string) =>
    mutation.mutate(
      {
        applicationId,
        data: { span, target: 'archive', decidedBy: profile.role, ...(runId ? { runId } : {}) },
      },
      {
        onSuccess: () =>
          toast({ description: `Archived ${rangeText(span)} — kept on file, off the checklist.` }),
      },
    );

  return { fileAs, archive, isPending: mutation.isPending };
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
 * File-native intake actions: drop files (they land durably as immutable
 * SourceFiles, pre-flight runs at drop) + decide the run gate over the ACTIVE
 * FILE SET. No packet, no assemble — the file list IS the working state.
 */
export function useIntakeActions(applicationId: string) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
    queryClient.invalidateQueries({ queryKey: getGetAnalysisQueryKey(applicationId) });
    queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
  };

  // Invalidate on error too: the server may have reverted the run to gated,
  // or another request advanced it — refetch so the UI shows real state.
  const receive = useReceiveFiles({
    mutation: {
      onSuccess: invalidate,
      onError: (err: unknown) => {
        invalidate();
        toast({ description: `Drop rejected — ${errText(err)}` });
      },
    },
  });

  const gate = useDecideRunGate({
    mutation: {
      onSuccess: invalidate,
      onError: (err: unknown) => {
        invalidate();
        toast({ description: `Gate decision not recorded — ${errText(err)}` });
      },
    },
  });

  const rename = useUpdateSourceFile({
    mutation: {
      onSuccess: invalidate,
      onError: (err: unknown) => toast({ description: `Rename not saved — ${errText(err)}` }),
    },
  });

  const dropFiles = (files: File[]) => receive.mutate({ applicationId, data: { files } });
  const renameFile = (fileId: string, filename: string) =>
    rename.mutate({ applicationId, fileId, data: { filename } });

  const decide = (
    decision: 'confirmed' | 'bypassed',
    plan?: { parse?: string; text?: string; judge?: string; fraudScoring?: boolean },
  ) =>
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

  return { dropFiles, receive, decide, gate, renameFile, rename };
}

/** Retry approval materialization after a loud failure (worker/storage). */
export function useMaterializeRetry(applicationId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMaterializeApprovedDoc({
    mutation: {
      // invalidate on error too — the failure timestamp/message on the app changed
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
      },
      onError: (err: unknown) => toast({ description: `Materialization failed again — ${errText(err)}` }),
    },
  });

  const retry = (blockId: string) =>
    mutation.mutate(
      { applicationId, blockId },
      { onSuccess: () => toast({ description: 'Document materialized to the approved registry.' }) },
    );

  return { retry, isPending: mutation.isPending };
}

/**
 * Set-block variants — declare the real-world instances ("Chase ····1234")
 * this application needs, tag uploads to them. Intake-side data; nothing here
 * counts toward completeness until a human accepts.
 */
export function useVariantActions(applicationId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(applicationId) });
  };

  const add = useAddVariant({
    mutation: {
      onSuccess: invalidate,
      onError: (err: unknown) => toast({ description: `Variant not added — ${errText(err)}` }),
    },
  });

  const remove = useDeleteVariant({
    mutation: {
      onSuccess: invalidate,
      onError: (err: unknown) => toast({ description: `Variant not removed — ${errText(err)}` }),
    },
  });

  const upload = useUploadDocument({
    mutation: {
      onSuccess: invalidate,
      onError: (err: unknown) => toast({ description: `Upload failed — ${errText(err)}` }),
    },
  });

  const addVariant = (blockId: string, descriptor: Record<string, string>, onDone?: () => void) =>
    add.mutate(
      { applicationId, blockId, data: { descriptor } },
      {
        onSuccess: (v) => {
          toast({ description: `Added ${v.label}.` });
          onDone?.();
        },
      },
    );

  const deleteVariant = (blockId: string, variantId: string, label: string) =>
    remove.mutate(
      { applicationId, blockId, variantId },
      { onSuccess: () => toast({ description: `Removed ${label}.` }) },
    );

  const uploadToVariant = (blockId: string, variantId: string, file: File) =>
    upload.mutate(
      { applicationId, blockId, data: { file }, params: { variantId } },
      { onSuccess: () => toast({ description: `${file.name} uploaded.` }) },
    );

  return {
    addVariant,
    deleteVariant,
    uploadToVariant,
    isAdding: add.isPending,
    isUploading: upload.isPending,
  };
}
