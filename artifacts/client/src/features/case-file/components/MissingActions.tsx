import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

/**
 * Real actions for a missing document: the intake form is the mechanism.
 * Email delivery is deliberately out of scope until v3 — copying the
 * applicant link is the honest version of "request from applicant".
 */
export function MissingActions({ applicationId }: { applicationId: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const copyLink = async () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const url = `${window.location.origin}${base}/apply/${applicationId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ description: 'Applicant intake link copied — paste it anywhere.' });
    } catch {
      toast({ description: `Copy failed — the link is ${url}` });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
      <button
        onClick={() => setLocation(`/apply/${applicationId}`)}
        data-testid="button-open-intake"
        className="btn-secondary"
      >
        Open intake form
      </button>
      <button onClick={copyLink} data-testid="button-copy-applicant-link" className="btn-primary">
        Copy applicant link
      </button>
    </div>
  );
}
