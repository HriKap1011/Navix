import Link from "next/link";

export default function Loading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030306] font-sans text-zinc-100 [color-scheme:dark]">
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
          <div className="h-9 w-24 rounded-full bg-white/[0.05] animate-pulse" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="overflow-visible rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-white/[0.02] p-6 shadow-[0_30px_90px_-36px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:p-8">
          {/* Journey Display Skeleton */}
          <div className="mb-8 pb-8 border-b border-white/10">
            <div className="h-10 w-3/4 max-w-md rounded-lg bg-white/[0.05] animate-pulse" />
            <div className="mt-4 h-6 w-1/3 max-w-xs rounded-md bg-white/[0.05] animate-pulse" />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="w-full">
              <div className="h-4 w-16 rounded bg-white/[0.05] animate-pulse" />
              <div className="mt-5 h-8 w-2/3 max-w-sm rounded-lg bg-white/[0.05] animate-pulse" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full max-w-lg rounded bg-white/[0.05] animate-pulse" />
                <div className="h-4 w-3/4 max-w-md rounded bg-white/[0.05] animate-pulse" />
              </div>
            </div>
            <div className="h-11 w-32 shrink-0 rounded-2xl bg-white/[0.05] animate-pulse" />
          </div>
        </div>

        {/* Route Cards Skeleton Grid */}
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 sm:p-7"
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="flex justify-between gap-3">
                  <div className="space-y-2 w-1/2">
                    <div className="h-3 w-24 rounded bg-white/[0.05] animate-pulse" />
                    <div className="h-6 w-full rounded bg-white/[0.05] animate-pulse" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-7 w-20 rounded-full bg-white/[0.05] animate-pulse" />
                    <div className="h-7 w-24 rounded-full bg-white/[0.05] animate-pulse" />
                  </div>
                </div>

                {/* Timeline */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="h-3 w-12 rounded bg-white/[0.05] animate-pulse" />
                      <div className="h-7 w-16 rounded bg-white/[0.05] animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-1.5 flex flex-col items-center">
                      <div className="h-1 w-full rounded bg-white/[0.05] animate-pulse" />
                      <div className="h-3 w-14 rounded bg-white/[0.05] animate-pulse" />
                    </div>
                    <div className="space-y-1.5 text-right">
                      <div className="h-3 w-12 ml-auto rounded bg-white/[0.05] animate-pulse" />
                      <div className="h-7 w-16 ml-auto rounded bg-white/[0.05] animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3.5 space-y-2">
                    <div className="h-3 w-16 rounded bg-white/[0.05] animate-pulse" />
                    <div className="h-6 w-20 rounded bg-white/[0.05] animate-pulse" />
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3.5 space-y-2">
                    <div className="h-3 w-20 rounded bg-white/[0.05] animate-pulse" />
                    <div className="h-6 w-16 rounded bg-white/[0.05] animate-pulse" />
                  </div>
                </div>

                {/* Availability */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="flex justify-between mb-2.5">
                    <div className="h-3 w-24 rounded bg-white/[0.05] animate-pulse" />
                    <div className="h-3 w-16 rounded bg-white/[0.05] animate-pulse" />
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.05] animate-pulse" />
                </div>

                {/* Legs */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="h-3 w-20 rounded bg-white/[0.05] animate-pulse mb-4" />
                  <div className="space-y-2.5">
                    {[1, 2].map((j) => (
                      <div key={j} className="h-10 w-full rounded-xl bg-white/[0.03] animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
