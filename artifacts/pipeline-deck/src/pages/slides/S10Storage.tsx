export default function S10Storage() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[8vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">Step 6 · Storage</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight">
          What gets saved where
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[28vh] w-[42vw] bg-ink rounded-[0.6vw] p-[2vw] shadow-lg">
        <pre className="font-mono text-[1.6vw] leading-[1.7] text-white/85 whitespace-pre">
          applications/APP-1042/{'\n'}
          <span className="text-white/40">├─</span> files/            <span className="text-emerald-300/60"># raw uploads, immutable</span>{'\n'}
          <span className="text-white/40">│  ├─</span> file-01.pdf{'\n'}
          <span className="text-white/40">│  └─</span> file-02.pdf{'\n'}
          <span className="text-white/40">├─</span> runs/latest/{'\n'}
          <span className="text-white/40">│  ├─</span> ocr/            <span className="text-emerald-300/60"># parse output per file</span>{'\n'}
          <span className="text-white/40">│  └─</span> judge/          <span className="text-emerald-300/60"># write-once verdicts</span>{'\n'}
          <span className="text-white/40">│     └─</span> doc-07.json{'\n'}
          <span className="text-white/40">└─</span> approved/         <span className="text-orange-300"># flat, human-approved</span>{'\n'}
          <span className="text-white/40">   ├─</span> urla-1003.pdf{'\n'}
          <span className="text-white/40">   └─</span> urla-1003.md    <span className="text-emerald-300/60"># sidecar</span>
        </pre>
      </div>

      <div className="absolute right-[5vw] top-[30vh] w-[40vw]">
        <div className="py-[2.2vh] border-t border-line">
          <p className="font-body text-[1.9vw] [text-wrap:pretty]">
            <span className="font-semibold">Raw stays raw.</span>{' '}
            <span className="text-muted">Uploads in files/ are never modified — denied pages stay there too, just excluded from approved.</span>
          </p>
        </div>
        <div className="py-[2.2vh] border-t border-line">
          <p className="font-body text-[1.9vw] [text-wrap:pretty]">
            <span className="font-semibold">Latest run is the whole truth.</span>{' '}
            <span className="text-muted">Incremental drops merge into it at ingest — no run archaeology.</span>
          </p>
        </div>
        <div className="py-[2.2vh] border-t border-b border-line">
          <p className="font-body text-[1.9vw] [text-wrap:pretty]">
            <span className="font-semibold">Approved is flat.</span>{' '}
            <span className="text-muted">One clean PDF plus one sidecar per document — what downstream systems consume.</span>
          </p>
        </div>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">10 / 12</span>
    </div>
  );
}
