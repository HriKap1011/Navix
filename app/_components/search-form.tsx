"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─── Data ─────────────────────────────────────────────────────────────────────

type PopularRoute = {
  origin: string;
  destination: string;
  label: string;
  emoji: string;
  tag?: string;
};

const POPULAR_ROUTES: PopularRoute[] = [
  { origin: "Delhi", destination: "Mumbai", label: "Delhi → Mumbai", emoji: "🚄", tag: "Most searched" },
  { origin: "Bangalore", destination: "Goa", label: "Bangalore → Goa", emoji: "🏖️", tag: "Weekend getaway" },
  { origin: "Hyderabad", destination: "Chennai", label: "Hyderabad → Chennai", emoji: "🚌" },
  { origin: "Pune", destination: "Bangalore", label: "Pune → Bangalore", emoji: "✈️" },
  { origin: "Kolkata", destination: "Patna", label: "Kolkata → Patna", emoji: "🚊" },
  { origin: "Jaipur", destination: "Udaipur", label: "Jaipur → Udaipur", emoji: "🏰" },
];

const PLACEHOLDER_EXAMPLES = [
  { origin: "e.g. Hyderabad", destination: "e.g. Bangalore" },
  { origin: "e.g. Delhi", destination: "e.g. Mumbai" },
  { origin: "e.g. Pune", destination: "e.g. Goa" },
  { origin: "e.g. Chennai", destination: "e.g. Coimbatore" },
  { origin: "e.g. Kolkata", destination: "e.g. Patna" },
];

type RecentSearch = {
  origin: string;
  destination: string;
  date?: string;
  timestamp: number;
};

const RECENT_SEARCHES_KEY = "navix_recent_searches";
const MAX_RECENT = 4;

function getRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(search: Omit<RecentSearch, "timestamp">) {
  const existing = getRecentSearches();
  const deduped = existing.filter(
    (s) =>
      !(
        s.origin.toLowerCase() === search.origin.toLowerCase() &&
        s.destination.toLowerCase() === search.destination.toLowerCase()
      )
  );
  const updated = [{ ...search, timestamp: Date.now() }, ...deduped].slice(
    0,
    MAX_RECENT
  );
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

type ValidationError = "origin" | "destination" | "date" | null;

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [flexibleMonth, setFlexibleMonth] = useState(searchParams.get("flexibleMonth") || "");
  const [useFlexibleDates, setUseFlexibleDates] = useState(!!searchParams.get("flexibleMonth"));
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const currentPlaceholder = useMemo(
    () => PLACEHOLDER_EXAMPLES[placeholderIdx],
    [placeholderIdx]
  );

  const getMinDate = (): string => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getMaxDate = (): string => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    return maxDate.toISOString().split("T")[0];
  };

  const getMinMonth = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const getMaxMonth = (): string => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationError[] = [];

    const originFilled = origin.trim().length > 0;
    const destinationFilled = destination.trim().length > 0;

    if (originFilled !== destinationFilled) {
      if (!originFilled) newErrors.push("origin");
      if (!destinationFilled) newErrors.push("destination");
    }

    if ((originFilled || destinationFilled) && !date && !flexibleMonth) {
      newErrors.push("date");
    }

    if (date) {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 5);

      if (selectedDate < today || selectedDate > maxDate) {
        newErrors.push("date");
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Save to recent searches
    if (origin.trim() && destination.trim()) {
      saveRecentSearch({
        origin: origin.trim(),
        destination: destination.trim(),
        date: date || flexibleMonth || undefined,
      });
      setRecentSearches(getRecentSearches());
    }

    const params = new URLSearchParams();
    if (origin.trim()) params.set("origin", origin.trim());
    if (destination.trim()) params.set("destination", destination.trim());
    if (date) params.set("date", date);
    if (flexibleMonth) params.set("flexibleMonth", flexibleMonth);

    router.push(`/results?${params.toString()}`);
  };

  const applyRoute = useCallback(
    (o: string, d: string, dt?: string) => {
      setOrigin(o);
      setDestination(d);
      if (dt) setDate(dt);
      setErrors([]);
    },
    []
  );

  const clearRecent = useCallback(() => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
    setRecentSearches([]);
  }, []);

  const hasEmptyInputs = !origin.trim() && !destination.trim();

  return (
    <form
      id="search"
      className="group/card rounded-[1.75rem] border border-white/[0.09] bg-gradient-to-br from-white/[0.09] via-white/[0.03] to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_28px_90px_-28px_rgba(124,58,237,0.45)] backdrop-blur-2xl transition-shadow duration-500 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset,0_36px_100px_-24px_rgba(34,211,238,0.28)] sm:p-9"
      onSubmit={handleSubmit}
    >
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Find smarter routes in seconds
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Enter your source, destination, and travel date. Navix surfaces
            alternate combinations—not just the obvious direct option booking
            sites push first.
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
        {/* Source */}
        <label className={`group/f lg:col-span-4 ${errors.includes("origin") ? "ring-2 ring-red-500/50 rounded-2xl p-2" : ""}`}>
          <span className={`mb-2 block text-xs font-semibold uppercase tracking-wider transition-colors ${
            errors.includes("origin")
              ? "text-red-400"
              : "text-zinc-500 group-focus-within/f:text-cyan-400/95"
          }`}>
            Source
            {errors.includes("origin") && (
              <span className="ml-2 text-red-400">Please fill this</span>
            )}
          </span>
          <div className="relative">
            <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
              errors.includes("origin")
                ? "text-red-400/85"
                : "text-zinc-500 group-focus-within/f:text-cyan-400/85"
            }`}>
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
              type="text"
              placeholder={currentPlaceholder.origin}
              autoComplete="off"
              value={origin}
              onChange={(e) => {
                setOrigin(e.target.value);
                if (errors.includes("origin")) {
                  setErrors(errors.filter((e) => e !== "origin"));
                }
              }}
              className={`w-full rounded-2xl border py-4 pl-12 pr-4 text-[15px] text-white placeholder:text-zinc-600 outline-none transition duration-200 hover:border-white/[0.18] ${
                errors.includes("origin")
                  ? "border-red-500/50 bg-red-950/20 focus:border-red-400/50 focus:bg-red-950/30 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]"
                  : "border-white/10 bg-black/45 focus:border-cyan-400/50 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)]"
              }`}
            />
          </div>
        </label>

        {/* Destination */}
        <label className={`group/f lg:col-span-4 ${errors.includes("destination") ? "ring-2 ring-red-500/50 rounded-2xl p-2" : ""}`}>
          <span className={`mb-2 block text-xs font-semibold uppercase tracking-wider transition-colors ${
            errors.includes("destination")
              ? "text-red-400"
              : "text-zinc-500 group-focus-within/f:text-violet-300/95"
          }`}>
            Destination
            {errors.includes("destination") && (
              <span className="ml-2 text-red-400">Please fill this</span>
            )}
          </span>
          <div className="relative">
            <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
              errors.includes("destination")
                ? "text-red-400/85"
                : "text-zinc-500 group-focus-within/f:text-violet-300/85"
            }`}>
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
              type="text"
              placeholder={currentPlaceholder.destination}
              autoComplete="off"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                if (errors.includes("destination")) {
                  setErrors(errors.filter((e) => e !== "destination"));
                }
              }}
              className={`w-full rounded-2xl border py-4 pl-12 pr-4 text-[15px] text-white placeholder:text-zinc-600 outline-none transition duration-200 hover:border-white/[0.18] ${
                errors.includes("destination")
                  ? "border-red-500/50 bg-red-950/20 focus:border-red-400/50 focus:bg-red-950/30 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]"
                  : "border-white/10 bg-black/45 focus:border-violet-400/50 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(167,139,250,0.14)]"
              }`}
            />
          </div>
        </label>

        {/* Travel Date or Flexible Dates */}
        <div className="lg:col-span-4">
          {!useFlexibleDates ? (
            <label className={`group/f block ${errors.includes("date") ? "ring-2 ring-red-500/50 rounded-2xl p-2" : ""}`}>
              <span className={`mb-2 block text-xs font-semibold uppercase tracking-wider transition-colors ${
                errors.includes("date")
                  ? "text-red-400"
                  : "text-zinc-500 group-focus-within/f:text-sky-300/95"
              }`}>
                Travel date
                {errors.includes("date") && (
                  <span className="ml-2 text-red-400">
                    {!date && !flexibleMonth ? "Please select a date" : "Date must be within 5 years"}
                  </span>
                )}
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.includes("date")) {
                    setErrors(errors.filter((e) => e !== "date"));
                  }
                }}
                min={getMinDate()}
                max={getMaxDate()}
                className={`w-full cursor-pointer rounded-2xl border px-4 py-4 text-[15px] text-white outline-none transition duration-200 hover:border-white/[0.18] [color-scheme:dark] ${
                  errors.includes("date")
                    ? "border-red-500/50 bg-red-950/20 focus:border-red-400/50 focus:bg-red-950/30 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]"
                    : "border-white/10 bg-black/45 focus:border-sky-400/50 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.14)]"
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setUseFlexibleDates(true);
                  setDate("");
                  if (errors.includes("date")) {
                    setErrors(errors.filter((e) => e !== "date"));
                  }
                }}
                className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition"
              >
                Not sure of exact date?
              </button>
            </label>
          ) : (
            <label className={`group/f block ${errors.includes("date") ? "ring-2 ring-red-500/50 rounded-2xl p-2" : ""}`}>
              <span className={`mb-2 block text-xs font-semibold uppercase tracking-wider transition-colors ${
                errors.includes("date")
                  ? "text-red-400"
                  : "text-zinc-500 group-focus-within/f:text-sky-300/95"
              }`}>
                Month & Year
                {errors.includes("date") && (
                  <span className="ml-2 text-red-400">Please select a month</span>
                )}
              </span>
              <input
                type="month"
                value={flexibleMonth}
                onChange={(e) => {
                  setFlexibleMonth(e.target.value);
                  if (errors.includes("date")) {
                    setErrors(errors.filter((e) => e !== "date"));
                  }
                }}
                min={getMinMonth()}
                max={getMaxMonth()}
                className={`w-full cursor-pointer rounded-2xl border px-4 py-4 text-[15px] text-white outline-none transition duration-200 hover:border-white/[0.18] [color-scheme:dark] ${
                  errors.includes("date")
                    ? "border-red-500/50 bg-red-950/20 focus:border-red-400/50 focus:bg-red-950/30 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]"
                    : "border-white/10 bg-black/45 focus:border-sky-400/50 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(56,189,248,0.14)]"
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setUseFlexibleDates(false);
                  setFlexibleMonth("");
                  if (errors.includes("date")) {
                    setErrors(errors.filter((e) => e !== "date"));
                  }
                }}
                className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition"
              >
                Back to specific date
              </button>
            </label>
          )}
        </div>
      </div>

      {/* ── Quick suggestions & recent searches ── */}
      {hasEmptyInputs && (
        <div className="mt-8 space-y-6 border-t border-white/[0.06] pt-8">

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Recent searches
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, i) => (
                  <button
                    key={`recent-${i}`}
                    type="button"
                    onClick={() => applyRoute(search.origin, search.destination, search.date)}
                    className="group/recent inline-flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm transition-all duration-200 hover:border-cyan-500/30 hover:bg-cyan-500/[0.06]"
                  >
                    <svg className="h-3.5 w-3.5 text-zinc-600 group-hover/recent:text-cyan-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-zinc-400 group-hover/recent:text-zinc-200 transition-colors font-medium">
                      {search.origin}
                    </span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-zinc-400 group-hover/recent:text-zinc-200 transition-colors font-medium">
                      {search.destination}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Routes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-3.5 w-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Popular routes
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {POPULAR_ROUTES.map((route) => (
                <button
                  key={route.label}
                  type="button"
                  onClick={() => applyRoute(route.origin, route.destination)}
                  className="group/pop flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-all duration-200 hover:border-cyan-500/30 hover:bg-cyan-500/[0.06] hover:-translate-y-0.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-lg transition-transform duration-200 group-hover/pop:scale-110 border border-white/[0.06]">
                    {route.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-300 truncate group-hover/pop:text-white transition-colors">
                      {route.label}
                    </p>
                    {route.tag && (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/70 mt-0.5">
                        {route.tag}
                      </p>
                    )}
                  </div>
                  <svg className="h-4 w-4 text-zinc-700 group-hover/pop:text-cyan-400 transition-all shrink-0 group-hover/pop:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── Submit bar ── */}
      <div className={`flex flex-col gap-5 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between ${hasEmptyInputs ? "mt-6" : "mt-8"}`}>
        <p className="max-w-lg text-xs leading-relaxed text-zinc-500 sm:text-sm">
          Results include comparison-friendly route cards and booking partner
          handoffs—prioritizing clarity over clutter.
        </p>
        <button
          type="submit"
          className="group/btn inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-500 px-10 py-4 text-base font-bold text-slate-950 shadow-[0_15px_40px_-10px_rgba(34,211,238,0.4)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_20px_45px_-10px_rgba(167,139,250,0.4)] active:scale-[0.98] sm:w-auto"
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
  );
}
