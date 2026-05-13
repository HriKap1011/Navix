"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ValidationError = "origin" | "destination" | "date" | null;

export function SearchForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [useFlexibleDates, setUseFlexibleDates] = useState(false);
  const [flexibleMonth, setFlexibleMonth] = useState("");

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

    // Both origin and destination must be filled or both empty
    const originFilled = origin.trim().length > 0;
    const destinationFilled = destination.trim().length > 0;

    if (originFilled !== destinationFilled) {
      if (!originFilled) newErrors.push("origin");
      if (!destinationFilled) newErrors.push("destination");
    }

    // If either origin or destination is filled, date or flexible dates must be filled
    if ((originFilled || destinationFilled) && !date && !flexibleMonth) {
      newErrors.push("date");
    }

    // Validate specific date is within range
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

    // All validations passed, navigate to results
    const params = new URLSearchParams();
    if (origin.trim()) params.set("origin", origin.trim());
    if (destination.trim()) params.set("destination", destination.trim());
    if (date) params.set("date", date);
    if (flexibleMonth) params.set("flexibleMonth", flexibleMonth);

    router.push(`/results?${params.toString()}`);
  };

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
          <span className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
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
              placeholder="City, station, or stop"
              autoComplete="off"
              value={origin}
              onChange={(e) => {
                setOrigin(e.target.value);
                if (errors.includes("origin")) {
                  setErrors(errors.filter((e) => e !== "origin"));
                }
              }}
              className={`w-full rounded-2xl border py-4 pl-12 pr-4 text-[15px] text-white placeholder:text-zinc-500 outline-none transition duration-200 hover:border-white/[0.18] ${
                errors.includes("origin")
                  ? "border-red-500/50 bg-red-950/20 focus:border-red-400/50 focus:bg-red-950/30 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.14)]"
                  : "border-white/10 bg-black/45 focus:border-cyan-400/50 focus:bg-black/60 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)]"
              }`}
            />
          </div>
        </label>

        {/* Destination */}
        <label className={`group/f lg:col-span-4 ${errors.includes("destination") ? "ring-2 ring-red-500/50 rounded-2xl p-2" : ""}`}>
          <span className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
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
              placeholder="Where you need to arrive"
              autoComplete="off"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                if (errors.includes("destination")) {
                  setErrors(errors.filter((e) => e !== "destination"));
                }
              }}
              className={`w-full rounded-2xl border py-4 pl-12 pr-4 text-[15px] text-white placeholder:text-zinc-500 outline-none transition duration-200 hover:border-white/[0.18] ${
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
              <span className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
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
              <span className={`mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors ${
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

      <div className="mt-8 flex flex-col gap-5 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-lg text-xs leading-relaxed text-zinc-500 sm:text-sm">
          Results include comparison-friendly route cards and booking partner
          handoffs—prioritizing clarity over clutter.
        </p>
        <button
          type="submit"
          className="group/btn inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-500 px-10 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_18px_46px_-14px_rgba(34,211,238,0.55)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_22px_52px_-12px_rgba(167,139,250,0.42)] active:scale-[0.98] sm:w-auto"
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
