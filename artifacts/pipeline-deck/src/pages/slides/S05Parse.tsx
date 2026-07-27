export default function S05Parse() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text">
      <div className="absolute left-[6vw] top-[9vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">Step 2 · Parse</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight">
          Mistral OCR 4 reads every page
        </h2>
      </div>

      <div className="absolute left-[6vw] top-[32vh] w-[36vw]">
        <p className="font-body text-[2.1vw] [text-wrap:pretty]">
          Called directly on Mistral's La Plateforme API — one request per file.
        </p>
        <p className="font-body text-[1.9vw] text-muted mt-[2.5vh] [text-wrap:pretty]">
          It returns structured elements, not a text blob: headings, tables, key-value pairs, each anchored to its page.
        </p>
        <p className="font-body text-[1.9vw] text-muted mt-[2.5vh] [text-wrap:pretty]">
          Those anchors become the spans that every later decision — split, judge, approve — points back to.
        </p>
      </div>

      <div className="absolute right-[5vw] top-[28vh] w-[45vw] bg-ink rounded-[0.6vw] p-[1.8vw] shadow-lg">
        <p className="font-mono text-[1.5vw] text-white/40 mb-[1.5vh]">ocr/file-02.json</p>
        <pre className="font-mono text-[1.55vw] leading-[1.55] text-white/85 whitespace-pre">
          <span className="text-white/40">{'{'}</span>{'\n'}
          {'  '}<span className="text-sky-300">"page"</span>: <span className="text-orange-300">14</span>,{'\n'}
          {'  '}<span className="text-sky-300">"elements"</span>: <span className="text-white/40">[</span>{'\n'}
          {'    '}<span className="text-white/40">{'{'}</span> <span className="text-sky-300">"type"</span>: <span className="text-orange-300">"heading"</span>,{'\n'}
          {'      '}<span className="text-sky-300">"text"</span>: <span className="text-orange-300">"Earnings Statement"</span> <span className="text-white/40">{'}'}</span>,{'\n'}
          {'    '}<span className="text-white/40">{'{'}</span> <span className="text-sky-300">"type"</span>: <span className="text-orange-300">"kv"</span>,{'\n'}
          {'      '}<span className="text-sky-300">"key"</span>: <span className="text-orange-300">"Pay period"</span>,{'\n'}
          {'      '}<span className="text-sky-300">"value"</span>: <span className="text-orange-300">"06/01–06/15"</span> <span className="text-white/40">{'}'}</span>,{'\n'}
          {'    '}<span className="text-white/40">{'{'}</span> <span className="text-sky-300">"type"</span>: <span className="text-orange-300">"table"</span>,{'\n'}
          {'      '}<span className="text-sky-300">"rows"</span>: <span className="text-orange-300">7</span> <span className="text-white/40">{'}'}</span>{'\n'}
          {'  '}<span className="text-white/40">]</span>{'\n'}
          <span className="text-white/40">{'}'}</span>
        </pre>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-muted">05 / 13</span>
    </div>
  );
}
