const base = import.meta.env.BASE_URL;

export default function S09Reviewer() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[8vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">Step 5 · Review</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight">
          A human approves every document
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[27vh] w-[57vw]">
        <div className="bg-card border border-line rounded-[0.5vw] p-[0.6vw] shadow-sm">
          <img
            src={`${base}shots/review.png`}
            crossOrigin="anonymous"
            alt="Page Review screen: scans, approval rail, filmstrip with merge badges"
            className="w-full rounded-[0.3vw] border border-line"
          />
        </div>
        <p className="font-mono text-[1.5vw] text-muted mt-[1.2vh]">
          Page Review — scans left, verdict rail right, filmstrip below
        </p>
      </div>

      <div className="absolute right-[5vw] top-[29vh] w-[26vw]">
        <div className="py-[2vh] border-t border-line">
          <p className="font-body text-[1.8vw] [text-wrap:pretty]">
            <span className="font-semibold">The filmstrip shows every page,</span>{' '}
            <span className="text-muted">grouped by document, with merge badges where the analyzer suggests joining groups.</span>
          </p>
        </div>
        <div className="py-[2vh] border-t border-line">
          <p className="font-body text-[1.8vw] [text-wrap:pretty]">
            <span className="font-semibold">Merges must be resolved</span>{' '}
            <span className="text-muted">on the strip before the document can be approved.</span>
          </p>
        </div>
        <div className="py-[2vh] border-t border-b border-line">
          <p className="font-body text-[1.8vw] [text-wrap:pretty]">
            <span className="font-semibold">Nothing is extracted</span>{' '}
            <span className="text-muted">until a human clicks approve.</span>
          </p>
        </div>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">09 / 13</span>
    </div>
  );
}
