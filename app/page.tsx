export default function Home() {
  return (
    <div className="relative isolate flex min-h-full flex-col overflow-hidden bg-[#030306] font-sans text-zinc-100 [color-scheme:dark]">
      {/* Ambient grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 85% 55% at 50% -10%, black 45%, transparent)",
        }}
      />

      <div className="pointer-events-none absolute -left-40 top-0 h-[460px] w-[460px] rounded-full bg-violet-600/[0.22] blur-[130px] motion-safe:animate-pulse" />
      <div className="pointer-events-none absolute -right-32 top-28 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.18] blur-[115px] motion-safe:animate-pulse motion-safe:[animation-delay:1.25s]" />
      <div className="pointer-events-none absolute bottom-[-120px] left-1/2 h-[320px] w-[min(90vw,720px)] -translate-x-1/2 rounded-full bg-indigo-600/[0.14] blur-[105px]" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030306]/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <a href="#" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-cyan-500/25 ring-1 ring-white/10 transition duration-300 group-hover:scale-105 group-hover:shadow-cyan-400/35">
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
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight text-white sm:text-base">
                Navix
              </span>
              <span className="mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 sm:block">
                Travel decision engine
              </span>
            </span>
          </a>

          <nav
            className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex"
            aria-label="Primary"
          >
            <a
              href="#problem"
              className="transition-colors duration-200 hover:text-white"
            >
              Problem
            </a>
            <a
              href="#features"
              className="transition-colors duration-200 hover:text-white"
            >
              Features
            </a>
            <a
              href="#plan"
              className="transition-colors duration-200 hover:text-white"
            >
              Plan route
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#plan"
              className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-200 transition-all duration-200 hover:border-cyan-400/35 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_0_28px_-6px_rgba(34,211,238,0.35)] sm:inline-flex"
            >
              Try MVP
            </a>
            <button
              type="button"
              className="hidden rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-200 hover:shadow-xl hover:shadow-cyan-400/30 md:inline-flex"
            >
              Get updates
            </button>

            {/* Mobile menu */}
            <details className="relative md:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.09] [&::-webkit-details-marker]:hidden">
                <span className="sr-only">Open menu</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </summary>
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(88vw,280px)] rounded-2xl border border-white/10 bg-[#0a0a10]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <a
                  href="#problem"
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Problem
                </a>
                <a
                  href="#features"
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Features
                </a>
                <a
                  href="#plan"
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Plan route
                </a>
                <hr className="my-2 border-white/[0.06]" />
                <a
                  href="#plan"
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-white/[0.06]"
                >
                  Try MVP →
                </a>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/[0.55] via-[#030306]/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent" />

          <div className="relative mx-auto max-w-6xl">
            <p className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/90 shadow-sm backdrop-blur-md sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
              Smart multi-modal travel decision engine
            </p>

            <h1 className="max-w-[22ch] text-balance text-4xl font-semibold tracking-tight text-white sm:max-w-3xl sm:text-5xl lg:text-[3.35rem] lg:leading-[1.06]">
              Optimize long-distance travel when{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">
                direct routes break down
              </span>
              .
            </h1>

            <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-400 sm:text-xl">
              Navix combines buses, trains, nearby stations, and alternate legs
              into ranked itineraries—so you stop tab-hopping and start deciding
              with confidence.
            </p>

            <p className="mt-6 max-w-2xl border-l-2 border-cyan-400/50 pl-5 text-base italic leading-relaxed text-zinc-300 sm:text-lg">
              “No confirmed train ticket?{" "}
              <span className="font-semibold not-italic text-white">
                Find smarter alternative routes.
              </span>
              ”
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                "Multi-modal intelligence",
                "Cheapest & fastest modes",
                "Built for real itineraries",
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/[0.08] bg-black/35 px-4 py-1.5 text-sm text-zinc-400 transition duration-200 hover:border-white/18 hover:bg-white/[0.05] hover:text-zinc-200"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Planner */}
        <section
          id="plan"
          className="relative z-10 -mt-4 px-4 pb-16 sm:-mt-8 sm:px-6 sm:pb-20 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <form
              className="group/card rounded-[1.75rem] border border-white/[0.09] bg-gradient-to-br from-white/[0.09] via-white/[0.03] to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_28px_90px_-28px_rgba(124,58,237,0.45)] backdrop-blur-2xl transition-shadow duration-500 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset,0_36px_100px_-24px_rgba(34,211,238,0.28)] sm:p-9"
              action="#"
              method="get"
            >
              <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    Find smarter routes in seconds
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                    Enter your source, destination, and travel date. Navix
                    surfaces alternate combinations—not just the obvious direct
                    option booking sites push first.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.09] px-3 py-2 text-xs font-medium text-emerald-200/95">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  MVP: trains & buses
                </span>
              </div>

              <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
                <label className="group/f lg:col-span-4">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 transition-colors group-focus-within/f:text-cyan-400/95">
                    Source
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within/f:text-cyan-400/85">
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
                      placeholder="City, station, or stop"
                      autoComplete="off"
                      className="w-full rounded-2xl border border-white/10 bg-black/45 py-4 pl-12 pr-4 text-[15px] text-white placeholder:text-zinc-500 outline-none transition duration-200 focus:border-cyan-400/50 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)] hover:border-white/[0.18]"
                    />
                  </div>
                </label>

                <label className="group/f lg:col-span-4">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 transition-colors group-focus-within/f:text-violet-300/95">
                    Destination
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within/f:text-violet-300/85">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <input
                      name="destination"
                      type="text"
                      placeholder="Where you need to arrive"
                      autoComplete="off"
                      className="w-full rounded-2xl border border-white/10 bg-black/45 py-4 pl-12 pr-4 text-[15px] text-white placeholder:text-zinc-500 outline-none transition duration-200 focus:border-violet-400/50 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(167,139,250,0.14)] hover:border-white/[0.18]"
                    />
                  </div>
                </label>

                <label className="group/f lg:col-span-4">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 transition-colors group-focus-within/f:text-sky-300/95">
                    Travel date
                  </span>
                  <input
                    name="date"
                    type="date"
                    className="w-full cursor-pointer rounded-2xl border border-white/10 bg-black/45 px-4 py-4 text-[15px] text-white outline-none transition duration-200 focus:border-sky-400/50 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.14)] hover:border-white/[0.18] [color-scheme:dark]"
                  />
                </label>
              </div>

              <div className="mt-8 flex flex-col gap-5 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-lg text-xs leading-relaxed text-zinc-500 sm:text-sm">
                  Results include comparison-friendly route cards and booking
                  partner handoffs—prioritizing clarity over clutter.
                </p>
                <button
                  type="submit"
                  className="group/btn inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-500 px-10 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_18px_46px_-14px_rgba(34,211,238,0.55)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_22px_52px_-12px_rgba(167,139,250,0.42)] active:scale-[0.98] sm:w-auto"
                >
                  Find Smarter Routes
                  <svg
                    className="h-[18px] w-[18px] transition-transform duration-300 group-hover/btn:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Problem */}
        <section
          id="problem"
          className="relative border-y border-white/[0.05] bg-gradient-to-b from-transparent via-violet-950/[0.15] to-transparent px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
                The problem
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Travel decisions shouldn&apos;t depend on ten open tabs
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-zinc-400">
                Traditional booking flows assume you already know the best path.
                Navix is built for the messy middle—when tickets vanish, prices
                spike, or direct legs simply don&apos;t exist.
              </p>
            </div>

            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {[
                "Waitlisted or unavailable train tickets",
                "Expensive last-minute flight shock",
                "Fragmented info across apps and operators",
                "Hard-to-find alternate routes and stations",
                "Hours lost comparing buses vs trains manually",
                "No single view of tradeoffs (time vs money vs comfort)",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition duration-200 hover:border-white/14 hover:bg-white/[0.04]"
                >
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-300 ring-1 ring-red-400/20">
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </span>
                  <span className="text-[15px] leading-snug text-zinc-300">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-12 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.08] to-violet-600/[0.06] p-8 sm:p-10">
              <p className="text-lg font-medium leading-relaxed text-white sm:text-xl">
                Navix solves this by generating{" "}
                <span className="text-cyan-200">
                  optimized multi-modal recommendations
                </span>{" "}
                — not endless lists of disconnected options.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="relative px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90">
                  MVP capabilities
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Intelligence that scales with your journey
                </h2>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-zinc-500 sm:text-base">
                Lean scope, sharp execution—focused on the painful “no ticket”
                moment first, with room to grow into flights, alerts, and AI
                ranking.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {[
                {
                  title: "Alternate route generation",
                  body: "Explore backups when your primary leg sells out or slips—without rebuilding the search from scratch.",
                  icon: (
                    <path d="M4 12h4l2-7 4 14 2-7h4" strokeLinecap="round" />
                  ),
                },
                {
                  title: "Bus + train combinations",
                  body: "Stitch intercity buses and rail into coherent sequences with realistic transfers and station context.",
                  icon: (
                    <>
                      <path d="M8 6v10M16 6v10M6 18h12" />
                      <circle cx="8" cy="18" r="1.5" fill="currentColor" />
                      <circle cx="16" cy="18" r="1.5" fill="currentColor" />
                    </>
                  ),
                },
                {
                  title: "Cheapest route suggestions",
                  body: "Surface budget-forward paths when price matters most—compare totals, not just promotional fares.",
                  icon: (
                    <path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  ),
                },
                {
                  title: "Fastest route recommendations",
                  body: "Prioritize time savings when you’re racing a deadline—highlight tighter but dependable sequences.",
                  icon: (
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  ),
                },
              ].map((card) => (
                <article
                  key={card.title}
                  className="group flex flex-col rounded-3xl border border-white/[0.07] bg-white/[0.025] p-6 transition duration-300 hover:border-cyan-400/25 hover:bg-white/[0.045] hover:shadow-[0_24px_70px_-36px_rgba(34,211,238,0.35)] sm:p-7"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02] text-cyan-300 ring-1 ring-white/10 transition duration-300 group-hover:text-white">
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      {card.icon}
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    {card.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-400">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 mt-auto border-t border-white/[0.06] bg-[#020208]/90 px-4 py-12 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.2fr_1fr] md:gap-16">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 shadow-md shadow-cyan-500/20">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-slate-950"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M12 2v6m0 8v6M6 12h12M8 8l4-4 4 4M8 16l4 4 4-4" />
                  </svg>
                </span>
                <span className="text-lg font-semibold text-white">Navix</span>
              </div>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-500">
                The smart multi-modal travel decision engine—optimizing routes
                when direct options fail, cost too much, or waste your time.
              </p>
              <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
                Stack · Next.js · React · Tailwind · TypeScript
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:justify-items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Product
                </p>
                <ul className="mt-4 space-y-3 text-sm text-zinc-400">
                  <li>
                    <a
                      href="#plan"
                      className="transition hover:text-white"
                    >
                      Plan route
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className="transition hover:text-white"
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#problem"
                      className="transition hover:text-white"
                    >
                      Why Navix
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Company
                </p>
                <ul className="mt-4 space-y-3 text-sm text-zinc-400">
                  <li>
                    <a href="#" className="transition hover:text-white">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition hover:text-white">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="transition hover:text-white">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Vision
                </p>
                <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                  Build lean. Ship fast recommendations. Earn trust one smarter
                  itinerary at a time.
                </p>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-12 flex max-w-6xl flex-col items-start justify-between gap-4 border-t border-white/[0.05] pt-8 text-sm text-zinc-600 sm:flex-row sm:items-center">
            <span>© {new Date().getFullYear()} Navix. All rights reserved.</span>
            <span className="text-xs text-zinc-600">
              Google Maps for long-distance travel—starting with smarter rail &
              road.
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
