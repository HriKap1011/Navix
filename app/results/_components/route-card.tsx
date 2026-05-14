import Link from "next/link";
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

const demandColors: Record<string, { bg: string; text: string; dot: string }> = {
  Low: { bg: "bg-emerald-400/10", text: "text-emerald-300", dot: "bg-emerald-400" },
  Moderate: { bg: "bg-cyan-400/10", text: "text-cyan-300", dot: "bg-cyan-400" },
  High: { bg: "bg-amber-400/10", text: "text-amber-300", dot: "bg-amber-400" },
  "Very High": { bg: "bg-rose-400/10", text: "text-rose-300", dot: "bg-rose-400" },
};

const trendColors: Record<string, { bg: string; text: string; icon: string }> = {
  Dropping: { bg: "bg-emerald-400/10", text: "text-emerald-300", icon: "↓" },
  Stable: { bg: "bg-cyan-400/10", text: "text-cyan-300", icon: "→" },
  Rising: { bg: "bg-amber-400/10", text: "text-amber-300", icon: "↑" },
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

// Navix score colour
function scoreColor(score: number) {
  if (score >= 85) return { stroke: "stroke-emerald-400", text: "text-emerald-400" };
  if (score >= 75) return { stroke: "stroke-cyan-400", text: "text-cyan-400" };
  if (score >= 65) return { stroke: "stroke-amber-400", text: "text-amber-400" };
  return { stroke: "stroke-rose-400", text: "text-rose-400" };
}

// Crowd level colour
function crowdColor(level: number) {
  if (level > 70) return { bar: "bg-rose-400", text: "text-rose-400" };
  if (level > 40) return { bar: "bg-amber-400", text: "text-amber-400" };
  return { bar: "bg-emerald-400", text: "text-emerald-400" };
}

// ─── component ────────────────────────────────────────────────────────────────

type RouteCardProps = {
  route: RouteOption;
  priceRank?: number;
  isTopPick?: boolean;
  compareHref?: string;
  isCompared?: boolean;
};

export function RouteCard({ route, priceRank = 0, isTopPick = false, compareHref, isCompared = false }: RouteCardProps) {
  const priceEmoji = priceEmotionEmojis[Math.min(Math.max(priceRank, 0), 3)];
  const avail = availabilityColor(route.estimatedAvailability);
  const diff = difficultyConfig[route.difficulty];
  const sc = scoreColor(route.navixScore);
  const insights = route.travelInsights;
  const demand = demandColors[insights.demandLevel] || demandColors.Moderate;
  const trend = trendColors[insights.priceTrend] || trendColors.Stable;
  const crowd = crowdColor(insights.crowdLevel);

  // SVG circle math for score ring
  const circumference = 2 * Math.PI * 15.5;
  const dashArray = `${(route.navixScore / 100) * circumference} ${circumference}`;

  return (
    <article
      className={`nv-route-card group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 transition-all duration-500 ease-out will-change-transform sm:p-8 ${
        isTopPick
          ? "nv-recommended nv-pick-glow border-cyan-300/50 from-cyan-400/[0.12] via-cyan-400/[0.04] to-violet-500/[0.06] shadow-[0_28px_90px_-30px_rgba(34,211,238,0.5)] hover:-translate-y-2 hover:border-cyan-200/65 hover:shadow-[0_36px_110px_-25px_rgba(34,211,238,0.7)]"
          : route.isRecommended
            ? "nv-recommended border-cyan-300/35 from-cyan-400/[0.1] to-white/[0.04] shadow-[0_24px_80px_-40px_rgba(34,211,238,0.4)] hover:-translate-y-1.5 hover:border-cyan-200/55 hover:shadow-[0_30px_95px_-30px_rgba(34,211,238,0.65)]"
            : "border-white/10 from-white/[0.06] to-white/[0.02] hover:-translate-y-1.5 hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_28px_80px_-30px_rgba(34,211,238,0.5)]"
      }`}
    >
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-500/5 blur-2xl" />

      {/* Top pick shimmer line */}
      {isTopPick && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent nv-shimmer" />
      )}

      <div className="relative z-10 space-y-4">

        {/* ── Header ── */}
        <div className={`flex items-start justify-between gap-3 ${isTopPick ? "flex-col sm:flex-row" : ""}`}>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {isTopPick && (
                <span className="nv-pick-badge inline-flex h-6 items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-400/20 to-violet-500/15 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-200 border border-cyan-400/30 shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]">
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l1.796 3.64L14 5.27l-3 2.924.708 4.13L8 10.42l-3.708 1.904L5 8.194 2 5.27l4.204-.631L8 1z" fill="currentColor" opacity="0.9"/>
                  </svg>
                  Navix Pick
                </span>
              )}
              {route.isRecommended && !isTopPick && (
                <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-cyan-400/10 px-2 text-[9px] font-bold uppercase tracking-wider text-cyan-300 border border-cyan-400/20">
                  <span className="h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
                  Recommended
                </span>
              )}
              <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[9px] font-bold uppercase tracking-wider ${tagClasses[route.tagTone]}`}>
                {route.recommendationTag}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${diff.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${diff.dot}`} />
                {diff.label}
              </span>
            </div>
            <h2 className={`nv-text-primary text-balance font-bold tracking-tight text-white ${isTopPick ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}>
              {capitalizeRouteCombination(route.routeCombination)}
            </h2>
          </div>

          {/* Navix Score Ring and Compare */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  className={sc.stroke}
                  strokeWidth="2.5"
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 1s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-extrabold tabular-nums ${sc.text}`}>
                  {route.navixScore}
                </span>
              </div>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-600">NX Score</span>
            
            {compareHref && (
              <Link
                href={compareHref}
                className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition ${
                  isCompared
                    ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[0.02] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                }`}
              >
                {isCompared ? "✓ Added" : "+ Compare"}
              </Link>
            )}
          </div>
        </div>

        {/* ── Timeline ── */}
        <div className="nv-inner-surface flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3.5">
          <div className="text-left">
            <p className="nv-text-primary text-xl font-bold tracking-tight tabular-nums text-white">{route.departureTime}</p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">Departs</p>
          </div>

          <div className="flex-1 mx-3 sm:mx-6 relative flex flex-col items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent relative">
               <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -mt-[3px] -ml-[3px] rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
            </div>
            <span className="mt-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-zinc-400">
              {route.layoverDuration} layover
            </span>
          </div>

          <div className="text-right">
            <p className="nv-text-primary text-xl font-bold tracking-tight tabular-nums text-white">{route.arrivalTime}</p>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">Arrives</p>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Price */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Est. Price</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold tracking-tight text-white">{route.estimatedPrice}</p>
              <span className="text-xl">{priceEmoji}</span>
            </div>
          </div>

          {/* Duration */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Total Duration</p>
            <p className="text-lg font-bold tracking-tight text-white">{route.duration}</p>
          </div>

          {/* Confidence */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Confidence</p>
              <p className={`text-xs font-bold tabular-nums ${confidenceColor(route.confidenceScore).text}`}>
                {route.confidenceScore}%
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${confidenceColor(route.confidenceScore).bar}`}
                style={{ width: `${route.confidenceScore}%` }}
              />
            </div>
          </div>

          {/* Seat Likelihood */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Seat Likelihood</p>
              <p className={`text-xs font-bold tabular-nums ${avail.text}`}>
                {route.estimatedAvailability}%
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${avail.bar}`}
                style={{ width: `${route.estimatedAvailability}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Travel Legs ── */}
        <div className="pt-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-2.5 px-1">Journey Breakdown</p>
          <div className="space-y-1.5">
            {route.legs.map((leg, index) => (
              <div
                key={`${route.id}-${leg.from}-${leg.to}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs border border-white/10">
                  {getTransportEmoji(leg.mode)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-200 truncate">
                    {getShortCityName(leg.from)} <span className="text-zinc-600 mx-1 font-medium">→</span> {getShortCityName(leg.to)}
                  </p>
                  <p className="text-[11px] font-medium text-zinc-500 mt-0.5">
                    {leg.mode}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[13px] font-semibold text-zinc-300 tabular-nums">
                    {leg.departureTime} <span className="text-zinc-600 mx-0.5">–</span> {leg.arrivalTime}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/70 mt-0.5 tabular-nums">
                    {leg.duration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Travel Context Insights ── */}
        <div className="pt-3 mt-1 border-t border-white/[0.06]">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2.5 px-0.5">Route Intelligence</p>
          <div className="grid grid-cols-2 gap-2">
            {/* Demand */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Demand</p>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${demand.dot}`} />
                <span className={`text-[11px] font-semibold ${demand.text}`}>{insights.demandLevel}</span>
              </div>
            </div>

            {/* Price Trend */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Price Trend</p>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${trend.text}`}>{trend.icon}</span>
                <span className={`text-[11px] font-semibold ${trend.text}`}>{insights.priceTrend}</span>
              </div>
            </div>

            {/* Crowd Level */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Crowd</p>
                <span className={`text-[10px] font-bold tabular-nums ${crowd.text}`}>{insights.crowdLevel}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full ${crowd.bar}`}
                  style={{ width: `${insights.crowdLevel}%` }}
                />
              </div>
            </div>

            {/* Booking Window */}
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Booking</p>
              <p className="text-[11px] font-medium text-zinc-400 leading-tight">{insights.bookingUrgency}</p>
            </div>
          </div>

          {/* Seasonal tip */}
          <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2">
            <span className="text-[11px] mt-px shrink-0">💡</span>
            <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">{insights.seasonalTip}</p>
          </div>
        </div>

      </div>
    </article>
  );
}
