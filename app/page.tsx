export default function Home() {
  return (
    <div className="relative isolate flex min-h-full flex-col overflow-hidden bg-[#050508] font-sans text-zinc-100 [color-scheme:dark]">
      {/* Ambient grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 70%)",
        }}
      />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-violet-600/25 blur-[120px] motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute -right-24 top-24 h-[380px] w-[380px] rounded-full bg-cyan-500/20 blur-[110px] motion-safe:animate-pulse motion-safe:[animation-delay:1s]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[280px] w-[560px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[100px]" />

      <header className="relative z-10 border-b border-white/[0.06] bg-[#050508]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg shadow-cyan-500/20 ring-1 ring-white/10 transition-transform duration-300 hover:scale-105 hover:shadow-cyan-400/30">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-slate-950"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" />
              </svg>
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Navix
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 sm:flex">
            <a
              href="#routes"
              className="transition-colors duration-300 hover:text-white"
            >
              Routes
            </a>
            <a
              href="#how"
              className="transition-colors duration-300 hover:text-white"
            >
              How it works
            </a>
          </nav>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-200 shadow-sm transition-all duration-300 hover:border-cyan-400/35 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_0_24px_-4px_rgba(34,211,238,0.35)] active:scale-[0.98]"
          >
            Sign in
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        {/* Gradient hero */}
        <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-transparent to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="relative mx-auto max-w-6xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/90 shadow-sm backdrop-blur-sm transition-colors duration-300 hover:border-cyan-400/25 hover:bg-white/[0.06]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              Live network
            </p>

            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
              Routes that feel{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">
                instant
              </span>
              , everywhere you go.
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg">
              Navix maps multimodal legs, live disruptions, and smarter
              connections—so your next trip starts with clarity, not chaos.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-zinc-500">
              {[
                "Carbon-aware routing",
                "Door-to-door clarity",
                "Built for global grids",
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/[0.07] bg-black/30 px-3 py-1 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-zinc-300"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Search panel */}
        <section
          id="routes"
          className="relative z-10 -mt-6 px-4 pb-20 sm:-mt-10 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <form
              className="group/card rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_24px_80px_-24px_rgba(124,58,237,0.35)] backdrop-blur-2xl transition-shadow duration-500 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_32px_90px_-20px_rgba(34,211,238,0.22)] sm:p-8"
              action="#"
              method="get"
            >
              <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-white">
                    Plan your route
                  </h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Tell us where you&apos;re leaving from and where you want to
                    land—we&apos;ll surface the best paths.
                  </p>
                </div>
                <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition-colors duration-300 hover:border-emerald-400/40 sm:mt-0">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Updated moments ago
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-12 md:gap-5">
                <label className="group/field md:col-span-4">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500 transition-colors duration-300 group-focus-within/field:text-cyan-400/90">
                    From
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-focus-within/field:text-cyan-400/80">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden
                      >
                        <circle cx="12" cy="11" r="3" />
                        <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10z" />
                      </svg>
                    </span>
                    <input
                      name="origin"
                      type="text"
                      placeholder="City, station, or airport"
                      autoComplete="off"
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none ring-0 transition-all duration-300 placeholder:transition-colors focus:border-cyan-400/45 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] hover:border-white/20"
                    />
                  </div>
                </label>

                <label className="group/field md:col-span-4">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500 transition-colors duration-300 group-focus-within/field:text-violet-300/90">
                    To
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-focus-within/field:text-violet-300/80">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden
                      >
                        <path d="M3 11h13l-4-4m4 4l-4 4M21 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h8" />
                      </svg>
                    </span>
                    <input
                      name="destination"
                      type="text"
                      placeholder="Where you want to arrive"
                      autoComplete="off"
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-all duration-300 focus:border-violet-400/45 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(167,139,250,0.12)] hover:border-white/20"
                    />
                  </div>
                </label>

                <label className="group/field md:col-span-4">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500 transition-colors duration-300 group-focus-within/field:text-blue-300/90">
                    Depart
                  </span>
                  <input
                    name="date"
                    type="date"
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none transition-all duration-300 focus:border-blue-400/45 focus:bg-black/55 focus:shadow-[0_0_0_3px_rgba(96,165,250,0.12)] hover:border-white/20 [color-scheme:dark]"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
                <p id="how" className="max-w-md text-xs leading-relaxed text-zinc-500">
                  By continuing, you agree to fair-use routing and anonymous
                  telemetry that helps us keep schedules sharp across carriers.
                </p>
                <button
                  type="submit"
                  className="group/btn inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-violet-500 px-8 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_16px_40px_-12px_rgba(34,211,238,0.55)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_48px_-10px_rgba(167,139,250,0.45)] active:scale-[0.98] sm:w-auto"
                >
                  Find Routes
                  <svg
                    className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </form>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Predictive transfers",
                  body: "We weigh dwell time, walk distance, and risk so tight connections feel achievable—not reckless.",
                },
                {
                  title: "One coherent itinerary",
                  body: "Trains, flights, ferries, and last-mile options stitched into a single readable timeline.",
                },
                {
                  title: "Made for motion",
                  body: "Readable at a glance on your phone, tuned for glare, night terminals, and spotty signal.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/12 hover:bg-white/[0.04]"
                >
                  <h3 className="text-sm font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500 transition-colors duration-300 hover:text-zinc-400">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="relative z-10 mt-auto border-t border-white/[0.06] bg-black/20 px-4 py-8 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 text-sm text-zinc-500 sm:flex-row sm:items-center">
            <span>© {new Date().getFullYear()} Navix Labs</span>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <a
                href="#"
                className="transition-colors duration-300 hover:text-zinc-300"
              >
                Privacy
              </a>
              <a
                href="#"
                className="transition-colors duration-300 hover:text-zinc-300"
              >
                Terms
              </a>
              <a
                href="#"
                className="transition-colors duration-300 hover:text-zinc-300"
              >
                Status
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
