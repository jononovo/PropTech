export default function S11Segments() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[8vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">Segments &amp; analysis</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight [text-wrap:balance]">
          A segment is coordinates, not a file
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[30vh] w-[36vw]">
        <p className="font-body text-[2vw] [text-wrap:pretty]">
          Until approval, a document exists only as spans — file plus page range — pointing into the untouched raw PDF.
        </p>
        <div className="bg-ink rounded-[0.5vw] p-[1.5vw] mt-[3vh]">
          <pre className="font-mono text-[1.5vw] leading-[1.6] text-white/85 whitespace-pre">
            <span className="text-sky-300">spans</span>:{'\n'}
            {'  '}- <span className="text-sky-300">fileId</span>: <span className="text-orange-300">"file-01"</span>{'\n'}
            {'    '}<span className="text-sky-300">pages</span>: [1, 9]
          </pre>
        </div>
        <p className="font-body text-[1.8vw] text-muted mt-[3vh] [text-wrap:pretty]">
          Analysis runs once per segment, ever. Human rulings layer on top — nothing is re-judged.
        </p>
      </div>

      <div className="absolute right-[5vw] top-[30vh] w-[42vw]">
        <div className="py-[2.2vh] border-t border-line">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.6vh]">postgres · analysis_runs</p>
          <p className="font-body text-[1.8vw] text-muted [text-wrap:pretty]">
            The authority. Spans, scores, flags, core fields per suggested document.
          </p>
        </div>
        <div className="py-[2.2vh] border-t border-line">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.6vh]">runs/&lt;runId&gt;/doc-NN.md</p>
          <p className="font-body text-[1.8vw] text-muted [text-wrap:pretty]">
            One projection per document — scored frontmatter over the transcript. For humans, grep, and agents.
          </p>
        </div>
        <div className="py-[2.2vh] border-t border-b border-line">
          <p className="font-mono text-[1.5vw] text-accent mb-[0.6vh]">approved/&lt;name&gt;.md</p>
          <p className="font-body text-[1.8vw] text-muted [text-wrap:pretty]">
            On approval the analysis is copied forward — the deliverable is self-contained.
          </p>
        </div>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">11 / 13</span>
    </div>
  );
}
