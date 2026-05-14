import Link from "next/link";
import type { RouteOption } from "../_data/mock-routes";

type ComparisonDrawerProps = {
  routes: RouteOption[];
  clearHref: string;
  comparePageHref: string;
};

export function ComparisonDrawer({ routes, clearHref, comparePageHref }: ComparisonDrawerProps) {
  if (routes.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 bg-[#030306]/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.5)]">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div>
            <h3 className="text-sm font-semibold text-white">Selected for Comparison</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{routes.length} of 3 selected</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {routes.map((route) => (
              <div key={route.id} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
                <span className="truncate max-w-[120px]">{route.routeCombination.split(" → ")[1]} route</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <Link
            href={clearHref}
            className="text-xs font-medium text-zinc-400 hover:text-white transition"
          >
            Clear All
          </Link>
          
          {routes.length >= 2 ? (
            <Link
              href={comparePageHref}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-violet-600 px-5 py-2 text-sm font-bold text-slate-950 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-300"
            >
              Compare Selected
            </Link>
          ) : (
            <button
              disabled
              className="inline-flex items-center justify-center rounded-xl bg-white/[0.05] px-5 py-2 text-sm font-bold text-zinc-600 cursor-not-allowed"
            >
              Select at least 2
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
