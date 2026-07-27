const base = import.meta.env.BASE_URL;

export default function S03Preflight() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[9vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">Step 1 · Pre-flight</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight">
          Before any model runs
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[32vh] w-[32vw]">
        <div className="py-[2.2vh] border-t border-line">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.6vh]">poppler</p>
          <p className="font-body text-[1.9vw] text-muted [text-wrap:pretty]">
            Opens every PDF, counts pages, rejects encrypted or corrupt files loudly.
          </p>
        </div>
        <div className="py-[2.2vh] border-t border-line">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.6vh]">pillow</p>
          <p className="font-body text-[1.9vw] text-muted [text-wrap:pretty]">
            Renders each page to a working image — the pixels every later step reads.
          </p>
        </div>
        <div className="py-[2.2vh] border-t border-b border-line">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.6vh]">intake ledger</p>
          <p className="font-body text-[1.9vw] text-muted [text-wrap:pretty]">
            Every file and page gets a stable key. Nothing proceeds unaccounted for.
          </p>
        </div>
      </div>

      <div className="absolute right-[5vw] top-[26vh] w-[48vw]">
        <div className="bg-card border border-line rounded-[0.5vw] p-[0.6vw] shadow-sm">
          <img
            src={`${base}shots/intake.png`}
            crossOrigin="anonymous"
            alt="Sheaf intake screen after analysis: 14 documents across 38 pages"
            className="w-full rounded-[0.3vw] border border-line"
          />
        </div>
        <p className="font-mono text-[1.5vw] text-muted mt-[1.5vh]">
          Intake after analysis — 14 documents found across 38 pages
        </p>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">03 / 13</span>
    </div>
  );
}
