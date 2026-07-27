export default function S06Split() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[9vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">Step 3 · Split &amp; classify</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight">
          Deterministic first, model second
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[32vh] w-[36vw]">
        <div className="py-[2.2vh] border-t border-line">
          <p className="font-body text-[2vw] [text-wrap:pretty]">
            <span className="font-semibold">Hard signals cut first.</span>{' '}
            <span className="text-muted">Form numbers, headers, and page-1 markers split without a model call.</span>
          </p>
        </div>
        <div className="py-[2.2vh] border-t border-line">
          <p className="font-body text-[2vw] [text-wrap:pretty]">
            <span className="font-semibold">The model refines boundaries</span>{' '}
            <span className="text-muted">only where the deterministic cut is ambiguous.</span>
          </p>
        </div>
        <div className="py-[2.2vh] border-t border-b border-line">
          <p className="font-body text-[2vw] [text-wrap:pretty]">
            <span className="font-semibold">Classification maps each document</span>{' '}
            <span className="text-muted">to one block in the lender's taxonomy.</span>
          </p>
        </div>
      </div>

      <div className="absolute right-[5vw] top-[28vh] w-[45vw] bg-ink rounded-[0.6vw] p-[1.8vw] shadow-lg">
        <p className="font-mono text-[1.5vw] text-white/40 mb-[1.5vh]">classify prompt · excerpt</p>
        <pre className="font-mono text-[1.55vw] leading-[1.6] text-white/85 whitespace-pre-wrap">
          <span className="text-emerald-300/70"># You will see one document's pages.</span>{'\n'}
          <span className="text-emerald-300/70"># Choose exactly one taxonomy block.</span>{'\n'}{'\n'}
          <span className="text-sky-300">Rules:</span>{'\n'}
          - Never merge two documents into one label.{'\n'}
          - If no block fits, answer <span className="text-orange-300">"unassigned"</span> —{'\n'}
          {'  '}do not guess the closest match.{'\n'}
          - Cite the page numbers that justify{'\n'}
          {'  '}your choice.
        </pre>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">06 / 13</span>
    </div>
  );
}
