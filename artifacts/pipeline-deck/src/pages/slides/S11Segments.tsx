export default function S11Segments() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[8vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">Segments &amp; analysis</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight [text-wrap:balance]">
          One file, many documents
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[29vh] w-[40vw] bg-card border border-line rounded-[0.5vw] p-[1.6vw]">
        <p className="font-mono text-[1.5vw] text-muted mb-[1.8vh]">file-01.pdf · 38 pages, never cut apart</p>
        <div className="flex items-center gap-[1vw] py-[1.2vh] border-t border-line">
          <span className="font-mono text-[1.5vw] text-accent w-[9vw]">pp. 1–9</span>
          <span className="font-body text-[1.7vw]">URLA — Form 1003</span>
        </div>
        <div className="flex items-center gap-[1vw] py-[1.2vh] border-t border-line">
          <span className="font-mono text-[1.5vw] text-accent w-[9vw]">pp. 10–11</span>
          <span className="font-body text-[1.7vw]">Paystub</span>
        </div>
        <div className="flex items-center gap-[1vw] py-[1.2vh] border-t border-line">
          <span className="font-mono text-[1.5vw] text-accent w-[9vw]">pp. 12–17</span>
          <span className="font-body text-[1.7vw]">Bank statement</span>
        </div>
        <div className="flex items-center gap-[1vw] py-[1.2vh] border-t border-b border-line">
          <span className="font-mono text-[1.5vw] text-accent w-[9vw]">pp. 18–38</span>
          <span className="font-body text-[1.7vw] text-muted">…more documents, same pattern</span>
        </div>
      </div>

      <div className="absolute right-[5vw] top-[29vh] w-[40vw]">
        <div className="py-[2vh] border-t border-line">
          <p className="font-body text-[1.9vw] [text-wrap:pretty]">
            <span className="font-semibold">Each document is a page range</span>{' '}
            <span className="text-muted">pointing into the intact file — the PDF is only physically cut at approval.</span>
          </p>
        </div>
        <div className="py-[2vh] border-t border-line">
          <p className="font-body text-[1.9vw] [text-wrap:pretty]">
            <span className="font-semibold">Each range is analyzed on its own:</span>{' '}
            <span className="text-muted">its own classification, judge verdict, scores, and scored markdown sidecar.</span>
          </p>
        </div>
        <div className="py-[2vh] border-t border-b border-line">
          <p className="font-body text-[1.9vw] [text-wrap:pretty]">
            <span className="font-semibold">Analyzed once, ever.</span>{' '}
            <span className="text-muted">Human rulings layer on top of the ranges — approval copies the analysis forward, nothing is re-judged.</span>
          </p>
        </div>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">11 / 13</span>
    </div>
  );
}
