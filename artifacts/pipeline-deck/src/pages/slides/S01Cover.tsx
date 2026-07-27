export default function S01Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-ink text-white">
      <div className="absolute left-[6vw] top-[8vh] flex items-center gap-[1vw]">
        <div className="w-[3.2vw] h-[3.2vw] bg-white/10 border border-white/25 rounded-[0.35vw] flex items-center justify-center">
          <div className="w-[1.5vw] h-[1.5vw] border-[0.18vw] border-white rounded-[0.15vw]" />
        </div>
        <span className="font-display font-bold text-[1.6vw] tracking-tight">Sheaf</span>
      </div>

      <div className="absolute left-[6vw] top-[34vh] max-w-[70vw]">
        <p className="font-mono text-[1.5vw] text-accent uppercase tracking-[0.25em] mb-[3vh]">
          Engineering deep dive
        </p>
        <h1 className="font-display font-extrabold text-[6.4vw] leading-[1.02] tracking-tighter [text-wrap:balance]">
          Anatomy of a Document Run
        </h1>
        <p className="font-body text-[2vw] text-white/70 mt-[3.5vh] max-w-[52vw] [text-wrap:pretty]">
          What happens between a borrower's messy PDF drop and a clean, audited document set.
        </p>
      </div>

      <div className="absolute left-[6vw] bottom-[8vh] flex items-center gap-[2vw]">
        <div className="h-[0.35vh] w-[8vw] bg-accent" />
        <span className="font-mono text-[1.5vw] text-white/50">document-pipeline · July 2026</span>
      </div>

      <span className="absolute right-[4vw] bottom-[8vh] font-mono text-[1.5vw] text-white/40">01 / 12</span>
    </div>
  );
}
