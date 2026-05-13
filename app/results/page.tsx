import Link from "next/link";
import { RouteCard } from "./_components/route-card";
import { TripSelector } from "./_components/trip-selector";
import { buildRouteOptions, formatTravelDate } from "./_data/mock-routes";

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
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const origin = params.origin?.trim() || "Mumbai";
  const destination = params.destination?.trim() || "Bengaluru";
  
  let date = "Flexible dates";
  if (params.date) {
    date = formatTravelDate(params.date);
  } else if (params.flexibleMonth) {
    date = formatFlexibleMonth(params.flexibleMonth);
  }
  
  const routeOptions = buildRouteOptions(origin, destination, params.date);

  // Simulate complex routing engine delay to show polished loading skeleton
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Sort routes by estimated price and create a rank map
  const sortedByPrice = [...routeOptions].sort((a, b) => {
    const priceA = parseFloat(a.estimatedPrice.replace(/[^0-9.]/g, ""));
    const priceB = parseFloat(b.estimatedPrice.replace(/[^0-9.]/g, ""));
    return priceA - priceB;
  });

  const priceRankMap = new Map<string, number>();
  sortedByPrice.forEach((route, index) => {
    priceRankMap.set(route.id, index);
  });

  const dateParam = params.date ? `date=${encodeURIComponent(params.date)}` : params.flexibleMonth ? `flexibleMonth=${encodeURIComponent(params.flexibleMonth)}` : "";
  const editSearchHref = `/?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${dateParam ? "&" + dateParam : ""}#plan`;

  return (
    <div className="relative min-h-full overflow-hidden bg-[#030306] font-sans text-zinc-100 [color-scheme:dark]">
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
        <div className="overflow-visible rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.04] to-white/[0.02] p-6 shadow-[0_30px_90px_-36px_rgba(34,211,238,0.35)] backdrop-blur-xl sm:p-8">
          {/* Journey Display */}
          <div className="mb-8 pb-8 border-b border-white/10">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
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
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Smart route options for your trip
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Compare multi-modal legs side by side. Prices and times are mock
                data for MVP—real routing plugs in later.
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

        {routeOptions.length > 0 ? (
          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            {routeOptions.map((route) => (
              <RouteCard 
                key={route.id} 
                route={route}
                priceRank={priceRankMap.get(route.id) || 0}
              />
            ))}
          </section>
        ) : (
          <section className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-12 text-center backdrop-blur-sm sm:p-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 mb-6 shadow-lg shadow-black/20">
              <span className="text-3xl grayscale">🧭</span>
            </div>
            <h3 className="text-xl font-semibold text-white sm:text-2xl">No routes found</h3>
            <p className="mt-3 max-w-md text-sm text-zinc-400">
              We couldn't find any valid routes between {capitalizeCity(origin)} and {capitalizeCity(destination)}. Try adjusting your search criteria or dates.
            </p>
            <Link
              href={editSearchHref}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-cyan-400/10 px-6 py-2.5 text-sm font-semibold text-cyan-300 ring-1 ring-inset ring-cyan-400/20 transition hover:bg-cyan-400/20 hover:text-cyan-200"
            >
              Modify search
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
