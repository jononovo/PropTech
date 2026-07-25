import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetTemplateQueryKey,
  getListTemplatesQueryKey,
  useCreateSavedSection,
  useGetTemplate,
  useListSavedSections,
  useSaveTemplate,
  type Section,
  type Template,
} from "@workspace/api-client-react";
import type { TemplateAction } from "./state/templateActions";
import { templateReducer } from "./state/templateReducer";

/**
 * Owns the builder's draft state: loads the server template once per
 * family/version, applies every mutation through the pure reducer (the ONLY
 * mutation path — buttons and drags both dispatch here), tracks dirtiness,
 * and saves via the existing full-document PUT with cache write-through.
 */
export function useTemplateDraft(family: string, version: number) {
  const query = useGetTemplate(family, version, {
    query: { enabled: !!family, queryKey: getGetTemplateQueryKey(family, version) },
  });
  const { data: savedSections = [] } = useListSavedSections();
  const saveMutation = useSaveTemplate();
  const createSavedSection = useCreateSavedSection();
  const queryClient = useQueryClient();

  const [template, setTemplate] = useState<Template | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const initializedFor = useRef("");

  useEffect(() => {
    if (query.data && initializedFor.current !== `${family}-${version}`) {
      setTemplate(query.data);
      setDirty(false);
      initializedFor.current = `${family}-${version}`;
    }
  }, [query.data, family, version]);

  const dispatch = useCallback((action: TemplateAction) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const next = templateReducer(prev, action);
      if (next !== prev) setDirty(true);
      return next;
    });
  }, []);

  const save = useCallback(() => {
    if (!template || template.status !== "draft") return;
    setSaveError(null);
    saveMutation.mutate(
      { family, version, data: template },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetTemplateQueryKey(family, version), updated);
          queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
          setTemplate(updated);
          setDirty(false);
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
            (err instanceof Error ? err.message : "Save failed");
          setSaveError(msg);
        },
      },
    );
  }, [template, family, version, saveMutation, queryClient]);

  /** "Save as section" → library copy (copies, never links). */
  const saveSectionToLibrary = useCallback(
    (section: Section) => {
      if (!template) return;
      createSavedSection.mutate({
        data: {
          name: section.name,
          source: `${template.template} v${template.version}`,
          section,
        },
      });
    },
    [template, createSavedSection],
  );

  return {
    template,
    dispatch,
    dirty,
    save,
    saving: saveMutation.isPending,
    saveError,
    savedSections,
    saveSectionToLibrary,
    savingSection: createSavedSection.isPending,
    isLoading: query.isLoading,
    loadError: query.error,
  };
}
