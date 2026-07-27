export default function S02Problem() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[9vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">The problem</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight [text-wrap:balance]">
          One PDF is never one document
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[34vh] w-[50vw]">
        <div className="border-t border-line py-[2.6vh]">
          <p className="font-body text-[2.1vw] [text-wrap:pretty]">
            <span className="font-semibold">Borrowers upload bundles.</span>{' '}
            <span className="text-muted">A single scan can hold a URLA, two paystubs, and a bank statement.</span>
          </p>
        </div>
        <div className="border-t border-line py-[2.6vh]">
          <p className="font-body text-[2.1vw] [text-wrap:pretty]">
            <span className="font-semibold">Pages arrive out of order,</span>{' '}
            <span className="text-muted">duplicated, rotated, or split across separate uploads days apart.</span>
          </p>
        </div>
        <div className="border-t border-line border-b py-[2.6vh]">
          <p className="font-body text-[2.1vw] [text-wrap:pretty]">
            <span className="font-semibold">Late drops must merge,</span>{' '}
            <span className="text-muted">not restart — every new file folds into the latest run's picture.</span>
          </p>
        </div>
      </div>

      <div className="absolute right-[6vw] top-[32vh] w-[28vw] bg-card border border-line rounded-[0.5vw] p-[2vw]">
        <p className="font-mono text-[1.5vw] text-muted uppercase tracking-[0.2em] mb-[2vh]">A real run</p>
        <div className="flex items-baseline gap-[0.8vw]">
          <span className="font-display font-extrabold text-[5.5vw] tracking-tighter">3</span>
          <span className="font-body text-[1.8vw] text-muted">files uploaded</span>
        </div>
        <div className="flex items-baseline gap-[0.8vw] mt-[1vh]">
          <span className="font-display font-extrabold text-[5.5vw] tracking-tighter">38</span>
          <span className="font-body text-[1.8vw] text-muted">pages inside</span>
        </div>
        <div className="flex items-baseline gap-[0.8vw] mt-[1vh]">
          <span className="font-display font-extrabold text-[5.5vw] tracking-tighter text-accent">14</span>
          <span className="font-body text-[1.8vw] text-muted">actual documents</span>
        </div>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">02 / 12</span>
    </div>
  );
}
