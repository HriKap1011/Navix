"use client";

const capitalizeCity = (city: string): string => {
  return city
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

type TripSelectorProps = {
  origin: string;
  destination: string;
  date: string;
  dateParam?: string;
};

export function TripSelector({
  origin,
  destination,
  date,
  dateParam,
}: TripSelectorProps) {
  const capitalizedOrigin = capitalizeCity(origin);
  const capitalizedDestination = capitalizeCity(destination);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-sm font-medium text-zinc-400">Trip :</span>
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Origin */}
        <button className="group inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-gradient-to-r from-cyan-400/15 to-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/55 hover:from-cyan-400/25 hover:to-cyan-500/20 hover:text-white">
          <span className="text-cyan-400">◆</span>
          {capitalizedOrigin}
        </button>

        <span className="text-zinc-500">→</span>

        {/* Destination */}
        <button className="group inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-gradient-to-r from-violet-400/15 to-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-300/55 hover:from-violet-400/25 hover:to-violet-500/20 hover:text-white">
          <span className="text-violet-400">◆</span>
          {capitalizedDestination}
        </button>

        <span className="hidden text-zinc-600 sm:inline">·</span>

        {/* Date Display */}
        <button className="group inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-400/[0.08] to-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-cyan-400/50 hover:from-cyan-400/15 hover:to-white/[0.06] hover:text-zinc-100">
          <svg
            className="h-4 w-4 text-cyan-400/50 transition group-hover:text-cyan-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {date === "Flexible dates" ? date : <>Travel · {date}</>}
        </button>
      </div>
    </div>
  );
}
