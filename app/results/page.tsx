import Link from "next/link";
import { RouteCard } from "./_components/route-card";
import { TripSelector } from "./_components/trip-selector";
import { buildRouteOptions, formatTravelDate } from "./_data/mock-routes";
import { ComparisonDrawer } from "./_components/comparison-drawer";
import { calculateSmartScores } from "./_utils/scoring";

const capitalizeCity = (city: string): string => {
  return city
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const formatFlexibleMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" }) + " (Flexible dates)";
};

type SearchParams = {
  origin?: string;
  destination?: string;
  date?: string;
  flexibleMonth?: string;
  sort?: string;
  mode?: string;
  compare?: string;
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const origin = params.origin?.trim() || "Mumbai";
  const destination = params.destination?.trim() || "Bengaluru";
  const sort = params.sort || "score";
  const mode = params.mode || "all";
  
  let date = "Flexible dates";
  if (params.date) {
    date = formatTravelDate(params.date);
  } else if (params.flexibleMonth) {
    date = formatFlexibleMonth(params.flexibleMonth);
  }
  
  const rawRouteOptions = buildRouteOptions(origin, destination, params.date || params.flexibleMonth || "");
  const rawWithScores = calculateSmartScores(rawRouteOptions);

  // Filter
  let routeOptions = [...rawWithScores];
  if (mode !== "all") {
    routeOptions = routeOptions.filter(route => 
      route.travelModes.some(m => m.toLowerCase().includes(mode.toLowerCase()))
    );
  }
  
  // Sort
  if (sort === "price") {
    routeOptions.sort((a, b) => {
      const priceA = parseFloat(a.estimatedPrice.replace(/[^0-9.]/g, ""));
      const priceB = parseFloat(b.estimatedPrice.replace(/[^0-9.]/g, ""));
      return priceA - priceB;
    });
  } else if (sort === "duration") {
    routeOptions.sort((a, b) => {
      const getMin = (d: string) => {
        const h = d.match(/(\d+)h/);
        const m = d.match(/(\d+)m/);
        return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
      };
      return getMin(a.duration) - getMin(b.duration);
    });
  } else {
    // Default: score
    routeOptions.sort((a, b) => b.navixScore - a.navixScore);
  }



  const sortedByPrice = [...rawWithScores].sort((a, b) => {
    const priceA = parseFloat(a.estimatedPrice.replace(/[^0-9.]/g, ""));
    const priceB = parseFloat(b.estimatedPrice.replace(/[^0-9.]/g, ""));
    return priceA - priceB;
  });

  const priceRankMap = new Map<string, number>();
  sortedByPrice.forEach((route, index) => {
    priceRankMap.set(route.id, index);
  });

  const createHref = (newParams: Record<string, string>) => {
    const current = new URLSearchParams();
    if (origin) current.set("origin", origin);
    if (destination) current.set("destination", destination);
    if (params.date) current.set("date", params.date);
    if (params.flexibleMonth) current.set("flexibleMonth", params.flexibleMonth);
    if (sort !== "score") current.set("sort", sort);
    if (mode !== "all") current.set("mode", mode);
    if (params.compare) current.set("compare", params.compare);
    
    for (const [key, value] of Object.entries(newParams)) {
      if (value === "") current.delete(key);
      else current.set(key, value);
    }
    return `/results?${current.toString()}`;
  };

  const compareIds = params.compare ? params.compare.split(",") : [];

  const getCompareHref = (id: string) => {
    const current = new URLSearchParams();
    if (origin) current.set("origin", origin);
    if (destination) current.set("destination", destination);
    if (params.date) current.set("date", params.date);
    if (params.flexibleMonth) current.set("flexibleMonth", params.flexibleMonth);
    if (sort !== "score") current.set("sort", sort);
    if (mode !== "all") current.set("mode", mode);
    
    let newCompare = [...compareIds];
    if (newCompare.includes(id)) {
      newCompare = newCompare.filter(i => i !== id);
    } else {
      if (newCompare.length < 3) {
        newCompare.push(id);
      } else {
        newCompare[2] = id; // Replace last if full
      }
    }
    
    if (newCompare.length > 0) {
      current.set("compare", newCompare.join(","));
    }
    
    return `/results?${current.toString()}`;
  };

  const getClearCompareHref = () => {
    const current = new URLSearchParams();
    if (origin) current.set("origin", origin);
    if (destination) current.set("destination", destination);
    if (params.date) current.set("date", params.date);
    if (params.flexibleMonth) current.set("flexibleMonth", params.flexibleMonth);
    if (sort !== "score") current.set("sort", sort);
    if (mode !== "all") current.set("mode", mode);
    return `/results?${current.toString()}`;
  };

  const selectedRoutes = rawWithScores.filter(r => compareIds.includes(r.id));
  
  const comparePageHref = `/results/compare?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&ids=${compareIds.join(",")}${params.date ? `&date=${encodeURIComponent(params.date)}` : params.flexibleMonth ? `&flexibleMonth=${encodeURIComponent(params.flexibleMonth)}` : ""}`;

  const dateParam = params.date ? `date=${encodeURIComponent(params.date)}` : params.flexibleMonth ? `flexibleMonth=${encodeURIComponent(params.flexibleMonth)}` : "";
  const editSearchHref = `/?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${dateParam ? "&" + dateParam : ""}#plan`;

  return (
    <div className="nv-page relative min-h-full overflow-hidden bg-[#030306] font-sans text-zinc-100 [color-scheme:dark]">
      <div
        className="nv-ambient pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 15%, rgba(6,182,212,0.16), transparent 30%), radial-gradient(circle at 80% 10%, rgba(167,139,250,0.17), transparent 34%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.2), transparent 42%)",
        }}
      />
      <div className="nv-grid pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.85]" />

      <header className="nv-header sticky top-0 z-30 border-b border-white/[0.06] bg-[#030306]/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90"
          >
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
          </Link>
          <Link
            href={editSearchHref}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-cyan-400/40 hover:bg-white/[0.1] hover:text-white sm:text-sm"
          >
            Edit search
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="nv-card overflow-visible rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-white/[0.02] p-6 shadow-[0_30px_90px_-36px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:p-8">
          {/* Journey Display */}
          <div className="mb-8 pb-8 border-b border-white/10">
            <h1 className="nv-text-primary text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {capitalizeCity(origin)} <span className="text-zinc-500">→</span> {capitalizeCity(destination)}
            </h1>
            <p className="mt-3 text-lg text-zinc-400">
              {date}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-zinc-200"
              >
                <span aria-hidden>←</span> Home
              </Link>
              <h2 className="nv-text-primary mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Smart route options for your trip
              </h2>
              <p className="nv-text-secondary mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Compare multi-modal legs side by side. Ranked by Navix Score.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <TripSelector 
                  origin={origin} 
                  destination={destination} 
                  date={date}
                  dateParam={params.date}
                  flexibleMonth={params.flexibleMonth}
                />
              </div>
            </div>
            <Link
              href={editSearchHref}
              className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-cyan-400/35 bg-gradient-to-r from-cyan-400/15 to-violet-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-cyan-300/55 hover:from-cyan-400/25 hover:to-violet-500/25 hover:text-white"
            >
              Refine route
            </Link>
          </div>
        </div>

        {/* Controls Section */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Filter:</span>
            <div className="flex gap-1.5">
              {[
                { label: "All", value: "all" },
                { label: "Flight", value: "flight" },
                { label: "Train", value: "train" },
                { label: "Bus", value: "bus" },
              ].map((opt) => (
                <Link
                  key={opt.value}
                  href={createHref({ mode: opt.value === "all" ? "" : opt.value })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    mode === opt.value
                      ? "bg-cyan-400/20 text-cyan-200 border border-cyan-400/30"
                      : "bg-white/[0.03] text-zinc-400 border border-white/[0.05] hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Sort by:</span>
            <div className="flex gap-1.5">
              {[
                { label: "Recommended", value: "score" },
                { label: "Price", value: "price" },
                { label: "Duration", value: "duration" },
              ].map((opt) => (
                <Link
                  key={opt.value}
                  href={createHref({ sort: opt.value === "score" ? "" : opt.value })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    sort === opt.value
                      ? "bg-violet-400/20 text-violet-200 border border-violet-400/30"
                      : "bg-white/[0.03] text-zinc-400 border border-white/[0.05] hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {routeOptions.length > 0 ? (
          <section className="mt-6 grid gap-5 lg:grid-cols-2">
            {routeOptions.slice(0, 4).map((route) => (
              <RouteCard 
                key={route.id} 
                route={route}
                priceRank={priceRankMap.get(route.id) || 0}
                isTopPick={route.isRecommended}
                compareHref={getCompareHref(route.id)}
                isCompared={compareIds.includes(route.id)}
              />
            ))}
          </section>
        ) : (
          <section className="mt-8 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent backdrop-blur-xl">
            {/* Decorative background */}
            <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-cyan-500/[0.06] blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/[0.06] blur-[100px]" />

            <div className="relative z-10 flex flex-col items-center px-6 py-16 text-center sm:px-12 sm:py-20">
              {/* Travel compass illustration */}
              <div className="relative mb-8">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent shadow-[0_0_60px_-15px_rgba(34,211,238,0.2)]">
                  <svg className="h-14 w-14 text-zinc-600" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Outer ring */}
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
                    <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                    {/* Compass needle */}
                    <path d="M32 10L36 30H28L32 10Z" fill="rgba(34,211,238,0.5)" />
                    <path d="M32 54L28 34H36L32 54Z" fill="rgba(167,139,250,0.4)" />
                    {/* Center dot */}
                    <circle cx="32" cy="32" r="3" fill="rgba(34,211,238,0.6)" />
                    <circle cx="32" cy="32" r="1.5" fill="white" opacity="0.8" />
                    {/* Cardinal marks */}
                    <circle cx="32" cy="6" r="1.5" fill="currentColor" opacity="0.4" />
                    <circle cx="58" cy="32" r="1.5" fill="currentColor" opacity="0.4" />
                    <circle cx="32" cy="58" r="1.5" fill="currentColor" opacity="0.4" />
                    <circle cx="6" cy="32" r="1.5" fill="currentColor" opacity="0.4" />
                  </svg>
                </div>
                {/* Orbiting dots */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-cyan-400/40 animate-pulse" />
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-violet-400/40 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400/30 animate-pulse" style={{ animationDelay: '2s' }} />
              </div>

              {/* Messaging */}
              <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                No routes found for this journey
              </h3>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base">
                We couldn&apos;t find multi-modal routes between{" "}
                <span className="font-semibold text-zinc-200">{capitalizeCity(origin)}</span> and{" "}
                <span className="font-semibold text-zinc-200">{capitalizeCity(destination)}</span>.
                This can happen when cities are too close, too remote, or the date doesn&apos;t have available services.
              </p>

              {/* Suggestions */}
              <div className="mt-8 w-full max-w-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">
                  What you can try
                </p>
                <div className="space-y-2">
                  {[
                    { icon: "📅", text: "Try a different travel date or use flexible dates" },
                    { icon: "📍", text: "Check for nearby cities or alternate stations" },
                    { icon: "🔄", text: "Search the reverse direction to verify coverage" },
                    { icon: "🚉", text: "Try a major hub city as an intermediate stop" },
                  ].map((tip) => (
                    <div
                      key={tip.text}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-left"
                    >
                      <span className="text-base shrink-0">{tip.icon}</span>
                      <span className="text-sm text-zinc-400">{tip.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={editSearchHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-500 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_30px_-8px_rgba(34,211,238,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_-6px_rgba(167,139,250,0.5)]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Modify Search
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  Back to Home
                </Link>
              </div>

              {/* Popular routes suggestion */}
              <div className="mt-12 w-full max-w-lg">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-3">
                  Popular routes that work great
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { from: "Delhi", to: "Mumbai", emoji: "🚄" },
                    { from: "Bangalore", to: "Goa", emoji: "🏖️" },
                    { from: "Hyderabad", to: "Chennai", emoji: "🚌" },
                    { from: "Pune", to: "Bangalore", emoji: "✈️" },
                    { from: "Kolkata", to: "Patna", emoji: "🚊" },
                    { from: "Jaipur", to: "Udaipur", emoji: "🏰" },
                  ].map((r) => (
                    <Link
                      key={`${r.from}-${r.to}`}
                      href={`/results?origin=${encodeURIComponent(r.from)}&destination=${encodeURIComponent(r.to)}`}
                      className="group/pop flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition-all duration-200 hover:border-cyan-500/30 hover:bg-cyan-500/[0.06]"
                    >
                      <span className="text-sm">{r.emoji}</span>
                      <span className="text-xs font-medium text-zinc-400 group-hover/pop:text-zinc-200 transition-colors truncate">
                        {r.from} → {r.to}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <ComparisonDrawer routes={selectedRoutes} clearHref={getClearCompareHref()} comparePageHref={comparePageHref} />
    </div>
  );
}
