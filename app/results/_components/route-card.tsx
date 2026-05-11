import type { RouteOption } from "../_data/mock-routes";

const tagClasses: Record<RouteOption["tagTone"], string> = {
  cyan: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
  emerald: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  violet: "border-violet-300/30 bg-violet-400/10 text-violet-200",
  amber: "border-amber-300/30 bg-amber-400/10 text-amber-200",
};

type RouteCardProps = {
  route: RouteOption;
};

export function RouteCard({ route }: RouteCardProps) {
  return (
    <article
      className={`group relative rounded-3xl border bg-gradient-to-br p-6 transition-all duration-300 ease-out will-change-transform sm:p-7 ${
        route.isRecommended
          ? "border-cyan-300/45 from-cyan-400/[0.14] to-white/[0.04] shadow-[0_28px_90px_-45px_rgba(34,211,238,0.55)] hover:-translate-y-1 hover:border-cyan-200/50 hover:shadow-[0_32px_90px_-38px_rgba(34,211,238,0.7)]"
          : "border-white/10 from-white/[0.06] to-white/[0.02] hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_28px_80px_-36px_rgba(34,211,238,0.5)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Route combination
          </p>
          <h2 className="mt-2 text-balance text-lg font-semibold tracking-tight text-white sm:text-xl">
            {route.routeCombination}
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Duration
          </p>
          <p className="mt-1.5 text-lg font-semibold text-zinc-100">
            {route.duration}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Estimated price
          </p>
          <p className="mt-1.5 text-lg font-semibold text-zinc-100">
            {route.estimatedPrice}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Travel legs
        </p>
        <div className="mt-3 space-y-2.5">
          {route.legs.map((leg, index) => (
            <div
              key={`${route.id}-${leg.from}-${leg.to}-${index}`}
              className="group/leg flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition group-hover:border-white/16 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            >
              <p className="min-w-0 text-sm text-zinc-300 sm:truncate">
                <span className="text-zinc-200">{leg.from}</span>
                <span className="mx-1.5 text-zinc-500">→</span>
                <span className="text-zinc-200">{leg.to}</span>
              </p>
              <p className="shrink-0 text-xs font-medium tabular-nums text-zinc-400 sm:text-right">
                <span className="text-zinc-500">{leg.mode}</span>
                <span className="mx-1.5 text-zinc-600">·</span>
                {leg.duration}
              </p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
