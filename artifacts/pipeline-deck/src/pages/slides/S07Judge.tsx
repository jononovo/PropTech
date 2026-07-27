export default function S07Judge() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[8vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">Step 4 · The Judge</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight">
          Every document faces the Judge
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[29vh] w-[41vw] bg-card border border-line rounded-[0.5vw] overflow-hidden">
        <div className="flex border-b border-line bg-bg px-[1.4vw] py-[1.2vh]">
          <span className="w-[16vw] font-mono text-[1.5vw] text-muted uppercase tracking-[0.15em]">Criterion</span>
          <span className="flex-1 font-mono text-[1.5vw] text-muted uppercase tracking-[0.15em]">What it scores</span>
        </div>
        <div className="flex px-[1.4vw] py-[1.3vh] border-b border-line">
          <span className="w-[16vw] font-mono text-[1.6vw]">quality</span>
          <span className="flex-1 font-body text-[1.6vw] text-muted">Legible, complete, usable pages</span>
        </div>
        <div className="flex px-[1.4vw] py-[1.3vh] border-b border-line">
          <span className="w-[16vw] font-mono text-[1.6vw]">formatting</span>
          <span className="flex-1 font-body text-[1.6vw] text-muted">Looks like the document it claims to be</span>
        </div>
        <div className="flex px-[1.4vw] py-[1.3vh] border-b border-line">
          <span className="w-[16vw] font-mono text-[1.6vw]">fraud_signal</span>
          <span className="flex-1 font-body text-[1.6vw] text-muted">Visual tampering pass (layer one)</span>
        </div>
        <div className="flex px-[1.4vw] py-[1.3vh] bg-bg">
          <span className="w-[16vw] font-mono text-[1.6vw] text-accent">confidence</span>
          <span className="flex-1 font-body text-[1.6vw] text-muted">Deterministic: 0.9 exact taxonomy match, 0.7 name-similarity match</span>
        </div>
      </div>

      <div className="absolute right-[5vw] top-[29vh] w-[41vw]">
        <div className="py-[2vh] border-t border-line">
          <p className="font-body text-[1.9vw] [text-wrap:pretty]">
            <span className="font-semibold">Core fields come from the Judge,</span>{' '}
            <span className="text-muted">not the classifier — it reads the document, ungrounded, v1.</span>
          </p>
        </div>
        <div className="py-[2vh] border-t border-line">
          <p className="font-body text-[1.9vw] [text-wrap:pretty]">
            <span className="font-semibold">Retry once, then clamp.</span>{' '}
            <span className="text-muted">Malformed output gets one retry; scores clamp to valid range.</span>
          </p>
        </div>
        <div className="py-[2vh] border-t border-b border-line">
          <p className="font-body text-[1.9vw] [text-wrap:pretty]">
            <span className="font-semibold">Write-once verdicts.</span>{' '}
            <span className="text-muted">Each ruling lands in judge/doc-NN.json and is never edited — an audit trail by construction.</span>
          </p>
        </div>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">07 / 13</span>
    </div>
  );
}
