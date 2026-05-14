import Link from "next/link";

export default function Loading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030306] font-sans text-zinc-100 [color-scheme:dark]">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-bg {
          position: relative;
          overflow: hidden;
          background-color: rgba(255, 255, 255, 0.04);
        }
        .shimmer-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
          animation: shimmer 1.6s ease-in-out infinite;
        }
      `}</style>

      {/* Background elements */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 15%, rgba(6,182,212,0.16), transparent 30%), radial-gradient(circle at 80% 10%, rgba(167,139,250,0.17), transparent 34%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.2), transparent 42%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.85]" />

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#030306]/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-cyan-500/20 ring-1 ring-white/10">
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px] text-slate-950"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 2v6m0 8v6M6 12h12M8 8l4-4 4 4M8 16l4 4 4-4" />
              </svg>
            </span>
            <span className="truncate text-[15px] font-semibold tracking-tight">
              Navix
              <span className="hidden text-zinc-500 sm:inline">
                {" "}
                · Results
              </span>
            </span>
          </div>
          <div className="h-9 w-24 rounded-full shimmer-bg" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="overflow-visible rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-white/[0.02] p-6 shadow-[0_30px_90px_-36px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:p-8">
          {/* Journey Display Skeleton */}
          <div className="mb-8 pb-8 border-b border-white/10">
            <div className="h-10 w-3/4 max-w-md rounded-lg shimmer-bg" />
            <div className="mt-4 h-6 w-1/3 max-w-xs rounded-md shimmer-bg" />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="w-full">
              <div className="h-4 w-16 rounded shimmer-bg" />
              <div className="mt-5 h-8 w-2/3 max-w-sm rounded-lg shimmer-bg" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full max-w-lg rounded shimmer-bg" />
                <div className="h-4 w-3/4 max-w-md rounded shimmer-bg" />
              </div>
            </div>
            <div className="h-11 w-32 shrink-0 rounded-2xl shimmer-bg" />
          </div>
        </div>

        {/* Route Cards Skeleton Grid */}
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 sm:p-8"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="space-y-3 flex-1">
                  <div className="flex gap-2">
                    <div className="h-5 w-20 rounded-full shimmer-bg" />
                    <div className="h-5 w-24 rounded-full shimmer-bg" />
                  </div>
                  <div className="h-7 w-3/4 max-w-sm rounded-lg shimmer-bg" />
                </div>
                {/* Score Ring Skeleton */}
                <div className="h-14 w-14 rounded-full shimmer-bg flex-shrink-0" />
              </div>

              {/* Timeline */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5 mb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-6 w-16 rounded shimmer-bg" />
                    <div className="h-3 w-10 rounded shimmer-bg" />
                  </div>
                  <div className="flex-1 mx-6 flex flex-col items-center gap-2">
                    <div className="h-px w-full bg-white/10" />
                    <div className="h-4 w-20 rounded-full shimmer-bg" />
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-6 w-16 rounded shimmer-bg ml-auto" />
                    <div className="h-3 w-10 rounded shimmer-bg ml-auto" />
                  </div>
                </div>
              </div>

              {/* Stats Grid (2x2) */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3 space-y-2">
                    <div className="h-3 w-16 rounded shimmer-bg" />
                    <div className="h-5 w-24 rounded shimmer-bg" />
                  </div>
                ))}
              </div>

              {/* Travel Legs */}
              <div className="space-y-1.5 mb-4">
                <div className="h-3 w-24 rounded shimmer-bg mb-2" />
                {[1, 2].map((l) => (
                  <div key={l} className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
                    <div className="h-7 w-7 rounded-full shimmer-bg flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-1/2 rounded shimmer-bg" />
                      <div className="h-3 w-1/4 rounded shimmer-bg" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Route Intelligence (2x2) */}
              <div className="pt-3 mt-1 border-t border-white/[0.06]">
                <div className="h-3 w-24 rounded shimmer-bg mb-2.5" />
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((m) => (
                    <div key={m} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 space-y-1.5">
                      <div className="h-3 w-12 rounded shimmer-bg" />
                      <div className="h-4 w-20 rounded shimmer-bg" />
                    </div>
                  ))}
                </div>
                {/* Seasonal tip */}
                <div className="mt-2.5 h-10 w-full rounded-lg bg-white/[0.015] border border-white/[0.04] shimmer-bg" />
              </div>

            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
