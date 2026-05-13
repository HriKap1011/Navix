import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030306] font-sans text-zinc-100 [color-scheme:dark]">
      {/* Ambient effects */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[400px] w-[400px] rounded-full bg-violet-600/[0.15] blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 top-28 h-[350px] w-[350px] rounded-full bg-cyan-500/[0.12] blur-[115px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[250px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/[0.1] blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Illustration */}
        <div className="relative mb-10">
          <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/[0.06] bg-gradient-to-br from-white/[0.06] to-transparent shadow-[0_0_80px_-20px_rgba(34,211,238,0.15)]">
            <svg className="h-16 w-16 text-zinc-700" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Map with pin */}
              <rect x="8" y="12" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.4" />
              <path d="M20 28h24M20 36h16" stroke="currentColor" strokeWidth="1" opacity="0.25" strokeLinecap="round" />
              {/* Lost pin */}
              <circle cx="40" cy="22" r="6" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5" />
              <circle cx="40" cy="22" r="2" fill="rgba(34,211,238,0.4)" />
              <path d="M40 28v8" stroke="rgba(34,211,238,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
              {/* Question mark */}
              <text x="26" y="48" fontSize="14" fill="rgba(167,139,250,0.4)" fontWeight="bold">?</text>
            </svg>
          </div>
          <div className="absolute -top-2 right-0 h-3 w-3 rounded-full bg-cyan-400/30 animate-pulse" />
          <div className="absolute bottom-2 -left-2 h-2 w-2 rounded-full bg-violet-400/30 animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* 404 display */}
        <p className="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/[0.05] sm:text-9xl">
          404
        </p>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          This route doesn&apos;t exist
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
          Looks like you&apos;ve wandered off the map. The page you&apos;re looking for
          may have been moved, deleted, or never existed in the first place.
        </p>

        {/* Actions */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-500 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_30px_-8px_rgba(34,211,238,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_-6px_rgba(167,139,250,0.5)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            Go Home
          </Link>
          <Link
            href="/#plan"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            Search a Route
          </Link>
        </div>

        {/* Brand footer */}
        <div className="mt-16 flex items-center gap-2 text-zinc-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-slate-950" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v6m0 8v6M6 12h12M8 8l4-4 4 4M8 16l4 4 4-4" />
            </svg>
          </span>
          <span className="text-xs font-medium">Navix · Smarter routes. Fewer tabs. One decision.</span>
        </div>
      </div>
    </div>
  );
}
