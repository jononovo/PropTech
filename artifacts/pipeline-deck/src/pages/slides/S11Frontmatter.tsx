export default function S11Frontmatter() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[8vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">The sidecar</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight">
          Every approved PDF carries its receipts
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[27vh] w-[47vw] bg-ink rounded-[0.6vw] p-[1.8vw] shadow-lg">
        <p className="font-mono text-[1.5vw] text-white/40 mb-[1.2vh]">approved/urla-1003.md</p>
        <pre className="font-mono text-[1.5vw] leading-[1.55] text-white/85 whitespace-pre">
          <span className="text-white/40">---</span>{'\n'}
          <span className="text-sky-300">blockName</span>: <span className="text-orange-300">"URLA — Form 1003"</span>{'\n'}
          <span className="text-sky-300">scores</span>:{'\n'}
          {'  '}<span className="text-sky-300">legibility</span>: 0.95{'\n'}
          {'  '}<span className="text-sky-300">confidence</span>: 0.9{'\n'}
          <span className="text-sky-300">coreFields</span>:{'\n'}
          {'  '}<span className="text-sky-300">borrower</span>: <span className="text-orange-300">"Jordan A. Reyes"</span>{'\n'}
          <span className="text-sky-300">derivedFrom</span>:{'\n'}
          {'  '}<span className="text-sky-300">spans</span>:{'\n'}
          {'    '}- <span className="text-sky-300">sourceKey</span>: <span className="text-orange-300">".../files/file-01"</span>{'\n'}
          {'      '}<span className="text-sky-300">pages</span>: [1, 2, 3, 4, 5, 6, 7, 8, 9]{'\n'}
          {'  '}<span className="text-sky-300">operation</span>: <span className="text-orange-300">"extract"</span>{'\n'}
          <span className="text-sky-300">approvalOutcome</span>: <span className="text-orange-300">"approved"</span>{'\n'}
          <span className="text-sky-300">approvedBy</span>: <span className="text-orange-300">"marcus"</span>{'\n'}
          <span className="text-white/40">---</span>
        </pre>
      </div>

      <div className="absolute right-[5vw] top-[30vh] w-[35vw]">
        <p className="font-body text-[2.1vw] [text-wrap:pretty]">
          YAML front matter carries scores, flags, core fields, and full provenance — which file, which pages, who approved, when.
        </p>
        <p className="font-body text-[1.9vw] text-muted mt-[3vh] [text-wrap:pretty]">
          The body below it is the analyzer's per-page markdown, so downstream tools can read the document without re-parsing the PDF.
        </p>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">12 / 13</span>
    </div>
  );
}
