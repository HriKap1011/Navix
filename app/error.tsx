"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030306] font-sans text-zinc-100 [color-scheme:dark]">
      {/* Ambient effects */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[350px] w-[350px] rounded-full bg-rose-600/[0.12] blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 top-0 h-[300px] w-[300px] rounded-full bg-amber-500/[0.1] blur-[115px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[200px] w-[400px] -translate-x-1/2 rounded-full bg-violet-600/[0.08] blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Illustration */}
        <div className="relative mb-10">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-rose-400/[0.15] bg-gradient-to-br from-rose-500/[0.08] to-transparent shadow-[0_0_60px_-15px_rgba(244,63,94,0.15)]">
            <svg className="h-14 w-14 text-zinc-600" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Broken route line */}
              <path d="M12 32h14" stroke="rgba(34,211,238,0.4)" strokeWidth="2" strokeLinecap="round" />
              <path d="M38 32h14" stroke="rgba(167,139,250,0.4)" strokeWidth="2" strokeLinecap="round" />
              {/* Break indicator */}
              <circle cx="32" cy="32" r="6" stroke="rgba(244,63,94,0.5)" strokeWidth="1.5" />
              <path d="M29 29l6 6M35 29l-6 6" stroke="rgba(244,63,94,0.5)" strokeWidth="1.5" strokeLinecap="round" />
              {/* Route dots */}
              <circle cx="8" cy="32" r="3" fill="rgba(34,211,238,0.3)" />
              <circle cx="56" cy="32" r="3" fill="rgba(167,139,250,0.3)" />
              {/* Signal waves */}
              <path d="M28 18c4 0 8 4 8 4" stroke="rgba(244,63,94,0.2)" strokeWidth="1" strokeLinecap="round" />
              <path d="M26 12c6 0 12 8 12 8" stroke="rgba(244,63,94,0.15)" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
          <div className="absolute -top-1 right-2 h-2.5 w-2.5 rounded-full bg-rose-400/40 animate-pulse" />
          <div className="absolute bottom-0 -left-1 h-2 w-2 rounded-full bg-amber-400/30 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Error message */}
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
          Our route engine hit an unexpected snag. This is usually temporary — try
          again, or head back home to start a fresh search.
        </p>

        {error.digest && (
          <p className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs font-mono text-zinc-600">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-500 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_30px_-8px_rgba(34,211,238,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_-6px_rgba(167,139,250,0.5)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            Back to Home
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
