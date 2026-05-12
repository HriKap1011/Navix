import type { RouteOption } from "../_data/mock-routes";

const capitalizeCity = (city: string): string => {
  return city
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const tagClasses: Record<RouteOption["tagTone"], string> = {
  cyan: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
  emerald: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  violet: "border-violet-300/30 bg-violet-400/10 text-violet-200",
  amber: "border-amber-300/30 bg-amber-400/10 text-amber-200",
};

const transportModeEmojis: Record<string, string> = {
  flight: "✈️",
  train: "🚊",
  "express train": "🚄",
  car: "🚗",
  bus: "🚌",
  bike: "🚴",
  walk: "🚶",
};

const priceEmotionEmojis = ["😀", "☺️", "😐", "😥"];

// Abbreviations only for when text gets cut off
const cityAbbreviationsForTruncation: Record<string, string> = {
  "hyderabad": "Hyd",
  "bengaluru": "Blr",
  "bangalore": "Blr",
  "deccan": "Dcc",
  "madgaon": "Mgn",
  "junction": "Jnc",
};

type RouteCardProps = {
  route: RouteOption;
  priceRank?: number; // 0 = cheapest (happy), 3 = most expensive (worried)
};

export function RouteCard({ route, priceRank = 0 }: RouteCardProps) {
  // Determine price emotion based on rank (0-3)
  const getPriceEmoji = () => {
    const rank = Math.min(Math.max(priceRank, 0), 3);
    return priceEmotionEmojis[rank];
  };

  const getShortCityName = (city: string): string => {
    const fullName = capitalizeCity(city);
    // Only abbreviate if the full name is too long (more than 12 characters)
    if (fullName.length <= 12) {
      return fullName;
    }

    const words = fullName.split(" ");
    
    // For single word places, abbreviate the whole thing
    if (words.length === 1) {
      const lowerWord = words[0].toLowerCase();
      return cityAbbreviationsForTruncation[lowerWord] || fullName;
    }
    
    // For multi-word places, abbreviate only the first word (the longer one usually)
    const firstWordLower = words[0].toLowerCase();
    const abbreviated = cityAbbreviationsForTruncation[firstWordLower];
    
    if (abbreviated) {
      // Return abbreviated first word + remaining words
      return abbreviated + " " + words.slice(1).join(" ");
    }
    
    return fullName;
  };

  const getTransportEmoji = (mode: string): string => {
    const lowerMode = mode.toLowerCase();
    
    // Check for express/sleeper variants first
    if (lowerMode.includes("express") && lowerMode.includes("train")) return "🚄";
    if (lowerMode.includes("sleeper") && lowerMode.includes("bus")) return "🚌";
    
    // Check for main modes
    if (lowerMode.includes("flight")) return "✈️";
    if (lowerMode.includes("train")) return "🚊";
    if (lowerMode.includes("bus")) return "🚌";
    if (lowerMode.includes("bike") || lowerMode.includes("bicycle")) return "🚴";
    if (lowerMode.includes("walk")) return "🚶";
    if (lowerMode.includes("car")) return "🚗";
    
    // Default to car if no match
    return "🚗";
  };

  const capitalizeRouteCombination = (route: string): string => {
    // Split by arrows and capitalize each city
    return route
      .split(" → ")
      .map((city) => capitalizeCity(city))
      .join(" → ");
  };
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6 transition-all duration-300 ease-out will-change-transform sm:p-7 ${
        route.isRecommended
          ? "border-cyan-300/45 from-cyan-400/[0.14] to-white/[0.04] shadow-[0_28px_90px_-45px_rgba(34,211,238,0.55)] hover:-translate-y-1 hover:border-cyan-200/50 hover:shadow-[0_32px_90px_-38px_rgba(34,211,238,0.7)]"
          : "border-white/10 from-white/[0.06] to-white/[0.02] hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_28px_80px_-36px_rgba(34,211,238,0.5)]"
      }`}
    >
      {/* Gradient overlay effect */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-500/5 blur-2xl" />
      <div className="relative z-10">
        {/* Header Section */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Route combination
            </p>
            <h2 className="mt-2 text-balance text-lg font-semibold tracking-tight text-white sm:text-xl">
              {capitalizeRouteCombination(route.routeCombination)}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold ${tagClasses[route.tagTone]}`}
            >
              {route.recommendationTag}
            </span>
            {route.isRecommended ? (
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-cyan-300/35 bg-cyan-400/12 px-3 text-xs font-semibold text-cyan-100">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,0.95)]" />
                Recommended
              </span>
            ) : null}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {/* Duration */}
          <div className="group/stat relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-4 py-3.5 backdrop-blur-md transition-all duration-300 hover:border-cyan-400/30 hover:from-cyan-500/[0.08] hover:to-white/[0.04]">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-300/[0.03] to-cyan-400/0 opacity-0 transition-opacity duration-300 group-hover/stat:opacity-100" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Duration
                </p>
                <p className="mt-1.5 text-lg font-semibold text-zinc-100">
                  {route.duration}
                </p>
              </div>
              <span className="text-4xl">⏳</span>
            </div>
          </div>

          {/* Estimated Price */}
          <div className="group/stat relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-4 py-3.5 backdrop-blur-md transition-all duration-300 hover:border-violet-400/30 hover:from-violet-500/[0.08] hover:to-white/[0.04]">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400/0 via-violet-300/[0.03] to-violet-400/0 opacity-0 transition-opacity duration-300 group-hover/stat:opacity-100" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Estimated price
                </p>
                <p className="mt-1.5 text-lg font-semibold text-zinc-100">
                  {route.estimatedPrice}
                </p>
              </div>
              <span className="text-4xl">{getPriceEmoji()}</span>
            </div>
          </div>
        </div>

        {/* Travel Legs Section */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-cyan-400/50" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
            </svg>
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              Travel legs
            </p>
          </div>
          <div className="mt-4 space-y-2.5">
            {route.legs.map((leg, index) => (
              <div
                key={`${route.id}-${leg.from}-${leg.to}-${index}`}
                className="group/leg relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent px-3 py-2.5 transition duration-300 hover:border-cyan-400/30 hover:bg-cyan-400/[0.06] sm:flex sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-300/[0.02] to-cyan-400/0 opacity-0 transition-opacity duration-300 group-hover/leg:opacity-100" />
                <p className="relative min-w-0 flex items-center gap-2 text-sm text-zinc-300 sm:truncate">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-bold">
                    {index + 1}
                  </span>
                  <span>
                    <span className="text-zinc-200 font-medium">{getShortCityName(leg.from)}</span>
                    <span className="mx-1.5 text-zinc-600">→</span>
                    <span className="text-zinc-200 font-medium">{getShortCityName(leg.to)}</span>
                  </span>
                </p>
                <div className="relative mt-2 flex items-center gap-2 sm:mt-0 sm:shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400">
                    <span className="text-lg">{getTransportEmoji(leg.mode)}</span>
                    <span className="text-xs text-zinc-400">{leg.mode}</span>
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs font-semibold tabular-nums text-cyan-400/70 group-hover/leg:text-cyan-300/90 transition-colors flex items-center gap-1">
                    <span>⏳</span>
                    {leg.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
