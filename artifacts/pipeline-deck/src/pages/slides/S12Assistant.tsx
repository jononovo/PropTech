const base = import.meta.env.BASE_URL;

export default function S12Assistant() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-ink text-white">
      <div className="absolute left-[6vw] top-[9vh]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[1.5vh]">Where it lands</p>
        <h2 className="font-display font-extrabold text-[4vw] tracking-tight [text-wrap:balance]">
          Ask the case, not the pile
        </h2>
      </div>

      <div className="absolute right-[5vw] top-[24vh] w-[50vw]">
        <div className="border border-white/15 rounded-[0.6vw] p-[0.5vw] bg-white/5">
          <img
            src={`${base}shots/assistant.png`}
            crossOrigin="anonymous"
            alt="Case Assistant answering a question with a markdown table, read-only"
            className="w-full rounded-[0.35vw]"
          />
        </div>
        <p className="font-mono text-[1.5vw] text-white/40 mt-[1.2vh]">
          Case Assistant — read-only, grounded in approved documents
        </p>
      </div>

      <div className="absolute left-[6vw] top-[36vh] w-[32vw]">
        <p className="font-body text-[2.1vw] text-white/85 [text-wrap:pretty]">
          Because every document was split, judged, approved, and stored with provenance, the assistant answers from evidence — not from a pile of PDFs.
        </p>
      </div>

      <div className="absolute left-[6vw] bottom-[10vh] flex items-center gap-[1.2vw]">
        <div className="w-[2.4vw] h-[2.4vw] bg-white/10 border border-white/25 rounded-[0.3vw] flex items-center justify-center">
          <div className="w-[1.1vw] h-[1.1vw] border-[0.15vw] border-white rounded-[0.12vw]" />
        </div>
        <span className="font-display font-bold text-[1.8vw]">Sheaf</span>
        <span className="font-mono text-[1.5vw] text-white/40 ml-[1vw]">The run is the product.</span>
      </div>

      <span className="absolute right-[4vw] bottom-[6vh] font-mono text-[1.5vw] text-white/40">13 / 13</span>
    </div>
  );
}
