export default function S04CallGraph() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[8vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">The call graph</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight">
          A strictly sequential run
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[30vh] w-[88vw] flex items-stretch gap-[0.8vw]">
        <div className="flex-1 bg-ink text-white rounded-[0.5vw] p-[1.2vw]">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.8vh]">1 · OCR</p>
          <p className="font-body text-[1.6vw] text-white/80 [text-wrap:pretty]">One call per file. 3 files, 3 calls.</p>
          <p className="font-mono text-[1.5vw] text-white/40 mt-[1.2vh]">F calls</p>
        </div>
        <div className="self-center font-mono text-[1.8vw] text-muted">&rarr;</div>
        <div className="flex-1 bg-ink text-white rounded-[0.5vw] p-[1.2vw]">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.8vh]">2 · Boundaries</p>
          <p className="font-body text-[1.6vw] text-white/80 [text-wrap:pretty]">One refinement pass over all pages.</p>
          <p className="font-mono text-[1.5vw] text-white/40 mt-[1.2vh]">1 call</p>
        </div>
        <div className="self-center font-mono text-[1.8vw] text-muted">&rarr;</div>
        <div className="flex-1 bg-ink text-white rounded-[0.5vw] p-[1.2vw]">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.8vh]">3 · Classify + judge</p>
          <p className="font-body text-[1.6vw] text-white/80 [text-wrap:pretty]">Interleaved, once per document.</p>
          <p className="font-mono text-[1.5vw] text-white/40 mt-[1.2vh]">2 &times; D calls</p>
        </div>
        <div className="self-center font-mono text-[1.8vw] text-muted">&rarr;</div>
        <div className="flex-1 bg-card border border-line rounded-[0.5vw] p-[1.2vw]">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.8vh]">4 · Scrutiny</p>
          <p className="font-body text-[1.6vw] text-muted [text-wrap:pretty]">Deterministic anti-fraud pass. No model.</p>
          <p className="font-mono text-[1.5vw] text-muted/60 mt-[1.2vh]">0 calls</p>
        </div>
        <div className="self-center font-mono text-[1.8vw] text-muted">&rarr;</div>
        <div className="flex-1 bg-ink text-white rounded-[0.5vw] p-[1.2vw]">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.8vh]">5 · Satisfaction</p>
          <p className="font-body text-[1.6vw] text-white/80 [text-wrap:pretty]">One pass per set block at the end.</p>
          <p className="font-mono text-[1.5vw] text-white/40 mt-[1.2vh]">per block</p>
        </div>
      </div>

      <div className="absolute left-[6vw] bottom-[12vh] w-[88vw] border-t border-line pt-[3vh] flex items-baseline gap-[2vw]">
        <span className="font-display font-extrabold text-[5vw] tracking-tighter text-accent">18</span>
        <p className="font-body text-[2vw] text-muted [text-wrap:pretty]">
          model calls for a 3-file, 7-document run — sequenced, never lumped, so every answer is traceable to one document.
        </p>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">04 / 13</span>
    </div>
  );
}
