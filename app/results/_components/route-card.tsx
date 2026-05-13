import type { RouteOption, TravelDifficulty } from "../_data/mock-routes";

// ─── helpers ──────────────────────────────────────────────────────────────────

const capitalizeCity = (city: string): string =>
  city
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const cityAbbreviationsForTruncation: Record<string, string> = {
  hyderabad: "Hyd",
  bengaluru: "Blr",
  bangalore: "Blr",
  deccan: "Dcc",
  madgaon: "Mgn",
  junction: "Jnc",
};

const tagClasses: Record<RouteOption["tagTone"], string> = {
  cyan: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
  emerald: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  violet: "border-violet-300/30 bg-violet-400/10 text-violet-200",
  amber: "border-amber-300/30 bg-amber-400/10 text-amber-200",
};

const difficultyConfig: Record<
  TravelDifficulty,
  { label: string; color: string; dot: string }
> = {
  Easy: {
    label: "Easy",
    color: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  Moderate: {
    label: "Moderate",
    color: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
  },
  Challenging: {
    label: "Challenging",
    color: "border-rose-400/30 bg-rose-400/10 text-rose-300",
    dot: "bg-rose-400",
  },
};

const priceEmotionEmojis = ["😀", "☺️", "😐", "😥"];

function getShortCityName(city: string): string {
  const full = capitalizeCity(city);
  if (full.length <= 12) return full;
  const words = full.split(" ");
  if (words.length === 1) {
    return cityAbbreviationsForTruncation[words[0].toLowerCase()] ?? full;
  }
  const abbr = cityAbbreviationsForTruncation[words[0].toLowerCase()];
  return abbr ? `${abbr} ${words.slice(1).join(" ")}` : full;
}

function getTransportEmoji(mode: string): string {
  const m = mode.toLowerCase();
  if (m.includes("flight")) return "✈️";
  if (m.includes("express") && m.includes("train")) return "🚄";
  if (m.includes("sleeper") && m.includes("bus")) return "🚌";
  if (m.includes("train")) return "🚊";
  if (m.includes("bus")) return "🚌";
  if (m.includes("bike") || m.includes("bicycle")) return "🚴";
  if (m.includes("walk")) return "🚶";
  return "🚗";
}

function capitalizeRouteCombination(route: string) {
  return route.split(" → ").map(capitalizeCity).join(" → ");
}

// Availability colour: green > 60, amber 30–60, red < 30
function availabilityColor(pct: number) {
  if (pct > 60) return { bar: "bg-emerald-400", text: "text-emerald-400" };
  if (pct > 30) return { bar: "bg-amber-400", text: "text-amber-400" };
  return { bar: "bg-rose-500", text: "text-rose-400" };
}

// Confidence colour
function confidenceColor(score: number) {
  if (score > 80) return { text: "text-emerald-400", bar: "bg-emerald-400" };
  if (score > 50) return { text: "text-amber-400", bar: "bg-amber-400" };
  return { text: "text-rose-500", bar: "bg-rose-500" };
}

// ─── component ────────────────────────────────────────────────────────────────

type RouteCardProps = {
  route: RouteOption;
  priceRank?: number;
};

export function RouteCard({ route, priceRank = 0 }: RouteCardProps) {
  const priceEmoji = priceEmotionEmojis[Math.min(Math.max(priceRank, 0), 3)];
  const avail = availabilityColor(route.estimatedAvailability);
  const diff = difficultyConfig[route.difficulty];

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 transition-all duration-500 ease-out will-change-transform sm:p-8 ${
        route.isRecommended
          ? "border-cyan-300/45 from-cyan-400/[0.14] to-white/[0.04] shadow-[0_28px_90px_-45px_rgba(34,211,238,0.55)] hover:-translate-y-1.5 hover:border-cyan-200/60 hover:shadow-[0_32px_100px_-30px_rgba(34,211,238,0.75)]"
          : "border-white/10 from-white/[0.06] to-white/[0.02] hover:-translate-y-1.5 hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_28px_80px_-30px_rgba(34,211,238,0.5)]"
      }`}
    >
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-500/5 blur-2xl" />

      <div className="relative z-10 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Route combination
            </p>
            <h2 className="mt-2 text-balance text-xl font-bold tracking-tight text-white sm:text-2xl">
              {capitalizeRouteCombination(route.routeCombination)}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Difficulty badge */}
            <span
              className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold ${diff.color}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
              {diff.label}
            </span>
            <span
              className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold ${tagClasses[route.tagTone]}`}
            >
              {route.recommendationTag}
            </span>
            {route.isRecommended && (
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-cyan-300/35 bg-cyan-400/12 px-3 text-xs font-semibold text-cyan-100">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.95)]" />
                Recommended
              </span>
            )}
          </div>
        </div>

        {/* ── Time Timeline ── */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] px-4 py-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            {/* Departure */}
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Departs</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums text-white">{route.departureTime}</p>
            </div>

            {/* Timeline bar */}
            <div className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center gap-1">
                <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/60 to-cyan-400/20" />
                {/* Layover pill */}
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-400 shadow-sm">
                  {route.layoverDuration} layover
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-cyan-400/60 to-cyan-400/20" />
              </div>
              <p className="text-xs font-medium tabular-nums text-zinc-500">{route.duration} total</p>
            </div>

            {/* Arrival */}
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Arrives</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums text-white">{route.arrivalTime}</p>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Price */}
          <div className="group/stat relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-4 py-3.5 backdrop-blur-md transition-all duration-300 hover:border-violet-400/40 hover:from-violet-500/[0.12] hover:to-white/[0.04]">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-violet-300/[0.03] to-violet-400/0 opacity-0 transition-opacity duration-300 group-hover/stat:opacity-100" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Est. price</p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-white">{route.estimatedPrice}</p>
              </div>
              <span className="text-3xl transition-transform duration-300 group-hover/stat:scale-110">{priceEmoji}</span>
            </div>
          </div>

          {/* Confidence */}
          <div className="group/stat relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-4 py-3.5 backdrop-blur-md transition-all duration-300 hover:border-cyan-400/40 hover:from-cyan-500/[0.12] hover:to-white/[0.04]">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-300/[0.03] to-cyan-400/0 opacity-0 transition-opacity duration-300 group-hover/stat:opacity-100" />
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Confidence</p>
              <div className="mt-1 flex items-end gap-1">
                <p className={`text-2xl font-extrabold tracking-tight tabular-nums ${confidenceColor(route.confidenceScore).text}`}>
                  {route.confidenceScore}
                </p>
                <p className="mb-1 text-xs font-medium text-zinc-500">/100</p>
              </div>
              {/* Mini confidence bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${confidenceColor(route.confidenceScore).bar}`}
                  style={{ width: `${route.confidenceScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Availability ── */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Est. availability</p>
            <p className={`text-xs font-semibold tabular-nums ${avail.text}`}>
              {route.estimatedAvailability}% seats
            </p>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${avail.bar}`}
              style={{ width: `${route.estimatedAvailability}%` }}
            />
          </div>
        </div>

        {/* ── Travel Legs ── */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-cyan-400/50" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
            </svg>
            <p className="text-xs uppercase tracking-wider text-zinc-500">Travel legs</p>
          </div>
          <div className="mt-4 space-y-2.5">
            {route.legs.map((leg, index) => (
              <div
                key={`${route.id}-${leg.from}-${leg.to}-${index}`}
                className="group/leg relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent px-4 py-3 transition-all duration-300 hover:scale-[1.01] hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-300/[0.02] to-cyan-400/0 opacity-0 transition-opacity duration-300 group-hover/leg:opacity-100" />
                <div className="relative flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  {/* Route */}
                  <p className="flex min-w-0 items-center gap-2 text-sm text-zinc-300">
                    <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-bold">
                      {index + 1}
                    </span>
                    <span>
                      <span className="font-medium text-zinc-200">{getShortCityName(leg.from)}</span>
                      <span className="mx-1.5 text-zinc-600">→</span>
                      <span className="font-medium text-zinc-200">{getShortCityName(leg.to)}</span>
                    </span>
                  </p>
                  {/* Meta */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <span className="text-base">{getTransportEmoji(leg.mode)}</span>
                      <span>{leg.mode}</span>
                    </span>
                    <span className="text-zinc-700">·</span>
                    <span className="tabular-nums text-zinc-500">
                      {leg.departureTime}
                      <span className="mx-1 text-zinc-700">–</span>
                      {leg.arrivalTime}
                    </span>
                    <span className="text-zinc-700">·</span>
                    <span className="font-semibold tabular-nums text-cyan-400/70 group-hover/leg:text-cyan-300/90 transition-colors">
                      {leg.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </article>
  );
}
