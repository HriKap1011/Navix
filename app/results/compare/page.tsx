import Link from "next/link";
import { buildRouteOptions } from "../_data/mock-routes";
import { calculateSmartScores } from "../_utils/scoring";
import { fetchRoutesFromApi } from "../_utils/api";

type SearchParams = {
  origin?: string;
  destination?: string;
  date?: string;
  flexibleMonth?: string;
  ids?: string;
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const origin = params.origin || "Mumbai";
  const destination = params.destination || "Bengaluru";
  const ids = params.ids ? params.ids.split(",").slice(0, 3) : [];

  // Generate all routes for the corridor
  const { routes: allWithScores, error } = await fetchRoutesFromApi(origin, destination, params.date || params.flexibleMonth || "");

  if (error) {
    return (
      <div className="min-h-screen bg-[#030306] flex flex-col items-center justify-center text-white p-4 text-center">
        <span className="text-5xl mb-4">⚠️</span>
        <h1 className="text-2xl font-bold mb-2 text-red-400">Comparison Failed</h1>
        <p className="text-zinc-500 mb-6 max-w-md">{error}</p>
        <Link
          href={`/results?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`}
          className="rounded-xl bg-gradient-to-r from-red-400 to-rose-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:opacity-90 transition"
        >
          Back to Results
        </Link>
      </div>
    );
  }

  // Filter only the selected routes
  const selectedRoutes = allWithScores.filter((r) => ids.includes(r.id));
  const unselectedRoutes = allWithScores.filter((r) => !ids.includes(r.id));

  if (selectedRoutes.length === 0) {
    return (
      <div className="min-h-screen bg-[#030306] flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-2">No routes selected for comparison</h1>
        <p className="text-zinc-500 mb-6">Go back to the results page to select routes.</p>
        <Link
          href={`/results?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`}
          className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition"
        >
          Back to Results
        </Link>
      </div>
    );
  }

  // Helper to parse duration string to minutes for comparison
  const getMinutes = (d: string) => {
    const h = d.match(/(\d+)h/);
    const m = d.match(/(\d+)m/);
    return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
  };

  const getPriceNum = (p: string) => parseFloat(p.replace(/[^0-9.]/g, ""));

  // Calculate best values for highlighting
  const bestPrice = Math.min(...selectedRoutes.map(r => getPriceNum(r.estimatedPrice)));
  const bestDuration = Math.min(...selectedRoutes.map(r => getMinutes(r.duration)));
  const bestTransfers = Math.min(...selectedRoutes.map(r => r.legs.length - 1));
  const bestLayover = Math.min(...selectedRoutes.map(r => getMinutes(r.layoverDuration)));

  const bestNavix = Math.max(...selectedRoutes.map(r => r.navixScore));
  const bestComfort = Math.max(...selectedRoutes.map(r => r.comfortScore));
  const bestAvail = Math.max(...selectedRoutes.map(r => r.estimatedAvailability));

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
            <Link href={`/results?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition">
              <svg className="h-4 w-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="truncate text-[15px] font-semibold tracking-tight">
              Compare Routes
              <span className="hidden text-zinc-500 sm:inline">
                {" "}
                · {origin} to {destination}
              </span>
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Route Intelligence</h1>
          <p className="mt-2 text-sm text-zinc-500">Side-by-side comparison of your selected travel combinations.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:gap-6 mb-8" style={{ gridTemplateColumns: `repeat(${selectedRoutes.length}, minmax(0, 1fr))` }}>
          {selectedRoutes.map((route) => (
            <div key={route.id} className={`relative rounded-3xl border p-6 bg-gradient-to-br ${route.isRecommended
                ? "border-cyan-400/30 from-cyan-400/[0.06] to-violet-500/[0.04] shadow-[0_20px_50px_-20px_rgba(34,211,238,0.15)]"
                : "border-white/10 from-white/[0.04] to-white/[0.01]"
              }`}>
              {route.isRecommended && (
                <span className="absolute -top-2.5 -right-2.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase text-cyan-200 backdrop-blur-md shadow-lg">
                  Top Pick
                </span>
              )}

              {/* Remove button */}
              <Link
                href={`/results/compare?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&ids=${ids.filter(i => i !== route.id).join(",")}${params.date ? `&date=${encodeURIComponent(params.date)}` : params.flexibleMonth ? `&flexibleMonth=${encodeURIComponent(params.flexibleMonth)}` : ""}`}
                className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-white/5 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors"
                title="Remove from comparison"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </Link>
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">{route.recommendationTag}</p>
                <h3 className="text-lg font-bold text-white truncate">{route.routeCombination}</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{route.estimatedPrice}</span>
                <span className="text-xs text-zinc-500">est. total</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Routes Section */}
        {ids.length < 3 && unselectedRoutes.length > 0 && (
          <div className="mb-8 p-4 rounded-2xl border border-white/[0.05] bg-white/[0.01]">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Add another route to compare</p>
            <div className="flex flex-wrap gap-2">
              {unselectedRoutes.map((route) => (
                <Link
                  key={route.id}
                  href={`/results/compare?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&ids=${[...ids, route.id].join(",")}${params.date ? `&date=${encodeURIComponent(params.date)}` : params.flexibleMonth ? `&flexibleMonth=${encodeURIComponent(params.flexibleMonth)}` : ""}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:border-cyan-500/30 hover:bg-cyan-500/[0.06] transition"
                >
                  <span className="text-cyan-400 font-bold">+</span>
                  <span>{route.routeCombination}</span>
                  <span className="text-zinc-600">|</span>
                  <span className="font-bold">{route.estimatedPrice}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 w-48">Metric</th>
                  {selectedRoutes.map((route) => (
                    <th key={route.id} className="p-4 text-sm font-bold text-white">
                      {route.routeCombination.split(" → ").map(c => c.charAt(0)).join(" → ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Navix Score */}
                <tr className="border-b border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Navix Score</td>
                  {selectedRoutes.map((route) => (
                    <td key={route.id} className={`p-4 text-sm font-bold ${route.navixScore === bestNavix ? "text-cyan-400 bg-cyan-400/[0.05]" : "text-zinc-300"
                      }`}>
                      <div className="flex items-center gap-1.5">
                        {route.navixScore}
                        {route.navixScore === bestNavix && <span>👑</span>}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Comfort Score */}
                <tr className="border-b border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Comfort Score</td>
                  {selectedRoutes.map((route) => (
                    <td key={route.id} className={`p-4 text-sm font-bold ${route.comfortScore === bestComfort ? "text-emerald-400 bg-emerald-400/[0.05]" : "text-zinc-300"
                      }`}>
                      {route.comfortScore}
                    </td>
                  ))}
                </tr>

                {/* Price */}
                <tr className="border-b border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Price</td>
                  {selectedRoutes.map((route) => (
                    <td key={route.id} className={`p-4 text-sm font-bold tabular-nums ${getPriceNum(route.estimatedPrice) === bestPrice ? "text-emerald-400 bg-emerald-400/[0.05]" : "text-zinc-300"
                      }`}>
                      {route.estimatedPrice}
                    </td>
                  ))}
                </tr>

                {/* Duration */}
                <tr className="border-b border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Duration</td>
                  {selectedRoutes.map((route) => (
                    <td key={route.id} className={`p-4 text-sm font-semibold tabular-nums ${getMinutes(route.duration) === bestDuration ? "text-emerald-400 bg-emerald-400/[0.05]" : "text-zinc-300"
                      }`}>
                      {route.duration}
                    </td>
                  ))}
                </tr>

                {/* Transfers */}
                <tr className="border-b border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Transfers</td>
                  {selectedRoutes.map((route) => (
                    <td key={route.id} className={`p-4 text-sm font-semibold ${(route.legs.length - 1) === bestTransfers ? "text-emerald-400 bg-emerald-400/[0.05]" : "text-zinc-300"
                      }`}>
                      {route.legs.length - 1} {route.legs.length - 1 === 1 ? "transfer" : "transfers"}
                    </td>
                  ))}
                </tr>

                {/* Layover Duration */}
                <tr className="border-b border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Layover</td>
                  {selectedRoutes.map((route) => (
                    <td key={route.id} className={`p-4 text-sm font-semibold tabular-nums ${getMinutes(route.layoverDuration) === bestLayover ? "text-emerald-400 bg-emerald-400/[0.05]" : "text-zinc-300"
                      }`}>
                      {route.layoverDuration}
                    </td>
                  ))}
                </tr>

                {/* Availability */}
                <tr className="border-b border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Availability</td>
                  {selectedRoutes.map((route) => (
                    <td key={route.id} className={`p-4 text-sm font-semibold tabular-nums ${route.estimatedAvailability === bestAvail ? "text-emerald-400 bg-emerald-400/[0.05]" : "text-zinc-300"
                      }`}>
                      {route.estimatedAvailability}%
                    </td>
                  ))}
                </tr>

                {/* Travel Modes */}
                <tr className="border-b border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Modes Used</td>
                  {selectedRoutes.map((route) => (
                    <td key={route.id} className="p-4 text-sm font-semibold text-zinc-300">
                      <div className="flex gap-1.5 flex-wrap">
                        {route.travelModes.map((mode) => (
                          <span key={mode} className="inline-flex items-center rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
                            {mode}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Departure Time */}
                <tr className="border-b border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Departure</td>
                  {selectedRoutes.map((route) => (
                    <td key={route.id} className="p-4 text-sm font-semibold text-zinc-300 tabular-nums">
                      {route.departureTime}
                    </td>
                  ))}
                </tr>

                {/* Arrival Time */}
                <tr className="border-b border-white/[0.05] hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-20 bg-[#0c0c12] p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Arrival</td>
                  {selectedRoutes.map((route) => (
                    <td key={route.id} className="p-4 text-sm font-semibold text-zinc-300 tabular-nums">
                      {route.arrivalTime}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
