export default function S08AntiFraud() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-ink text-white">
      <div className="absolute left-[6vw] top-[9vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">Anti-fraud</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight">
          Two layers, different failure modes
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[32vh] w-[41vw] border border-white/15 rounded-[0.6vw] p-[2vw]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.2em] mb-[1.5vh]">Layer 1 · Judge, visual</p>
        <p className="font-body text-[2vw] text-white/85 [text-wrap:pretty]">
          The Judge inspects the rendered pages themselves.
        </p>
        <p className="font-body text-[1.8vw] text-white/60 mt-[2vh] [text-wrap:pretty]">
          Font mismatches, misaligned columns, pasted-over regions, impossible artifacts — things only visible in pixels.
        </p>
      </div>

      <div className="absolute right-[5vw] top-[32vh] w-[41vw] border border-white/15 rounded-[0.6vw] p-[2vw]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.2em] mb-[1.5vh]">Layer 2 · scrutiny.py, deterministic</p>
        <p className="font-body text-[2vw] text-white/85 [text-wrap:pretty]">
          Pure code. Same input, same verdict, every time.
        </p>
        <p className="font-body text-[1.8vw] text-white/60 mt-[2vh] [text-wrap:pretty]">
          Risk tiers per document type, substitution checks across the set, and a deep-scan tier for high-risk blocks.
        </p>
      </div>

      <div className="absolute left-[6vw] bottom-[11vh] w-[87vw] border-t border-white/15 pt-[3vh]">
        <p className="font-body text-[2vw] text-white/75 [text-wrap:pretty]">
          A model can be talked out of a suspicion. Code cannot — which is why the layers are separate and both must pass.
        </p>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-white/40">08 / 13</span>
    </div>
  );
}
