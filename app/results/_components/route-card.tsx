"use client";

import { useState } from "react";
import Link from "next/link";
import type { RouteOption, TravelDifficulty } from "../_data/mock-routes";

// ─── helpers ──────────────────────────────────────────────────────────────────

const capitalizeCity = (city: string): string =>
  city
    .split(" ")
    .map((w) => {
      if (w.startsWith("(") && w.endsWith(")")) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
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
    label: "Smooth Journey",
    color: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  Moderate: {
    label: "Comfortable",
    color: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
  },
  Challenging: {
    label: "Active Transit",
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
  return route.split(/ (?:→|->) /).map(capitalizeCity).join(" -> ");
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
  const [isExpanded, setIsExpanded] = useState(false);
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

  // Layer 2: Why Navix Recommends This
  let conciseAdvantage = "Optimal multi-modal connection recommended by Navix.";
  let conciseAdvisory = "Standard travel demand context.";

  if (isTopPick && route.recommendationReasoning && route.recommendationReasoning.length > 0) {
    conciseAdvantage = `✨ ${route.recommendationReasoning[0]}`;
    if (route.recommendationReasoning.length > 1) {
      conciseAdvisory = `🛡️ ${route.recommendationReasoning[1]}`;
    } else {
      conciseAdvisory = `🛡️ Secures a smoother, low crowding travel experience.`;
    }
  } else {
    if (route.waitlistCode) {
      conciseAdvantage = "✨ Smart bypass predicted to secure seats on alternate sectors.";
      conciseAdvisory = `🛡️ Stable seat options predicted on alternate corridor.`;
    } else if (route.routeCombination.includes("ANVT") || route.routeCombination.includes("SDAH")) {
      conciseAdvantage = "✨ Boarding at nearby terminal secures seating.";
      conciseAdvisory = "🛡️ Boarding via secondary station offers comfortable boarding.";
    } else if (route.travelModes.includes("Flight") && route.travelModes.length > 1) {
      conciseAdvantage = "✨ Air hybrid saves 6+ hours vs. direct land corridors.";
      conciseAdvisory = "🛡️ Fast air connection ensures lower travel friction.";
    } else if (route.travelModes.includes("Flight")) {
      conciseAdvantage = "✨ Direct express flight avoids all rail queues entirely.";
      conciseAdvisory = "🛡️ Direct air route secures high seat confidence.";
    } else if (route.routeCombination.includes("via")) {
      conciseAdvantage = "✨ Breaking the route via alternate corridor ensures lower crowd levels.";
      conciseAdvisory = "🛡️ Employs active secondary transit corridors.";
    } else {
      conciseAdvantage = "✨ Direct express transport connection.";
      conciseAdvisory = "🛡️ Comfortable direct booking suggested.";
    }
  }

  return (
    <article
      className={`nv-route-card group relative overflow-hidden rounded-3xl border bg-gradient-to-br p-5 transition-all duration-500 ease-out will-change-transform sm:p-6 ${
        isTopPick
          ? "nv-recommended nv-pick-glow border-cyan-300/50 from-cyan-400/[0.12] via-cyan-400/[0.04] to-violet-500/[0.06] shadow-[0_28px_90px_-30px_rgba(34,211,238,0.5)] hover:-translate-y-1.5 hover:border-cyan-200/65 hover:shadow-[0_36px_110px_-25px_rgba(34,211,238,0.7)]"
          : route.isRecommended
            ? "nv-recommended border-cyan-300/35 from-cyan-400/[0.1] to-white/[0.04] shadow-[0_24px_80px_-40px_rgba(34,211,238,0.4)] hover:-translate-y-1 hover:border-cyan-200/55 hover:shadow-[0_30px_95px_-30px_rgba(34,211,238,0.65)]"
            : "border-white/10 from-white/[0.06] to-white/[0.02] hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.04] hover:shadow-[0_28px_80px_-30px_rgba(34,211,238,0.5)]"
      }`}
    >
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-500/5 blur-2xl" />

      {/* Top pick shimmer line */}
      {isTopPick && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent nv-shimmer" />
      )}

      <div className="relative z-10 space-y-3.5">

        {/* ── LAYER 1 — QUICK DECISION VIEW ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {isTopPick && (
                <span className="nv-pick-badge inline-flex h-5 items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400/20 to-violet-500/15 px-2.5 text-[9px] font-bold uppercase tracking-wider text-cyan-200 border border-cyan-400/30 shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]">
                  ★ Navix Pick
                </span>
              )}
              {route.isRecommended && !isTopPick && (
                <span className="inline-flex h-5 items-center gap-1 rounded-full bg-cyan-400/10 px-2 text-[9px] font-bold uppercase tracking-wider text-cyan-300 border border-cyan-400/20">
                  Recommended
                </span>
              )}
              {route.recommendationTag && (
                <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[9px] font-bold uppercase tracking-wider ${tagClasses[route.tagTone]}`}>
                  {route.recommendationTag}
                </span>
              )}
              <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[9px] font-bold uppercase tracking-wider ${diff.color}`}>
                {diff.label}
              </span>
            </div>
            
            {/* Route Combination Title */}
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white capitalize leading-snug">
              {capitalizeRouteCombination(route.routeCombination)}
            </h2>

            {/* Timings, Duration, Price Grid */}
            <div className="flex items-center flex-wrap gap-2 mt-1.5 text-zinc-300 text-xs sm:text-sm font-semibold">
              <span className="text-white font-black">{route.departureTime} ➜ {route.arrivalTime}</span>
              <span className="text-zinc-700 font-bold">•</span>
              <span className="text-zinc-300 font-bold">{route.duration}</span>
              <span className="text-zinc-700 font-bold">•</span>
              <span className="text-cyan-400 font-black text-sm sm:text-base">{route.estimatedPrice}</span>
              <span className="text-lg leading-none shrink-0">{priceEmoji}</span>
            </div>
          </div>

          {/* NX Score Ring */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="relative w-12 h-12 sm:w-13 sm:h-13">
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
                <span className="text-xs font-black text-white tabular-nums">
                  {route.navixScore}
                </span>
              </div>
            </div>
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-zinc-500">NX Score</span>
          </div>
        </div>

        {/* ── LAYER 2 — WHY NAVIX RECOMMENDS THIS ── */}
        <div className="rounded-xl border border-white/[0.03] bg-white/[0.015] px-3.5 py-2.5 space-y-1.5">
          <div className="flex items-center gap-2 text-[11.5px] font-bold text-emerald-400">
            <span className="shrink-0 text-sm">✨</span>
            <span className="leading-normal">{conciseAdvantage}</span>
          </div>
          <div className={`flex items-center gap-2 text-[11.5px] font-semibold ${conciseAdvisory.includes("⚠️") ? "text-rose-400" : "text-zinc-400"}`}>
            <span className="shrink-0 text-sm">{conciseAdvisory.includes("⚠️") ? "⚠️" : "🛡️"}</span>
            <span className="leading-normal">{conciseAdvisory.replace("⚠️", "").replace("🛡️", "").trim()}</span>
          </div>
        </div>

        {/* ── LAYER 3 — JOURNEY FLOW PREVIEW ── */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] bg-white/[0.02] border border-white/[0.04] rounded-xl px-3.5 py-2">
          <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-500 mr-1 shrink-0">Flow:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {route.legs.map((leg, idx) => {
              const modeIcon = getTransportEmoji(leg.mode);
              const shortFrom = getShortCityName(leg.from);
              const shortTo = getShortCityName(leg.to);
              return (
                <div key={idx} className="flex items-center gap-1.5 flex-wrap font-bold text-zinc-300">
                  <span className="inline-flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-0.5 rounded text-[10px]">
                    <span className="text-[11px]">{modeIcon}</span>
                    <span className="text-zinc-400 font-extrabold uppercase tracking-tight text-[9px]">{leg.mode}</span>
                  </span>
                  <span className="text-zinc-200 font-bold uppercase tracking-tight">
                    {shortFrom} ➜ {shortTo}
                  </span>
                  {idx < route.legs.length - 1 && (
                    <span className="text-cyan-400/40 font-black px-0.5 shrink-0">➜</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-white/[0.05]">
          {compareHref && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = compareHref;
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                isCompared
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]"
                  : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              {isCompared ? "✓ Added" : "+ Compare"}
            </button>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-violet-200 hover:bg-violet-400/20 transition-all duration-300 shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)]"
          >
            <span>{isExpanded ? "Hide Details" : "View Details"}</span>
            <svg
              className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* ── Expandable Advanced Details ── */}
        {isExpanded && (
          <div className="pt-4 border-t border-white/[0.06] space-y-4 transition-all duration-500 ease-in-out">
            
            {/* Route Optimization Reasoning */}
            {isTopPick && route.recommendationReasoning && (
              <div className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03]">
                <p className="text-xs font-bold text-cyan-400 mb-2">Navix recommends this route because:</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {route.recommendationReasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-xs text-zinc-300">
                      <span className="text-cyan-500 font-bold">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Waitlist Rescue Simulation */}
            {route.waitlistCode && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-rose-400 border border-rose-500/20">
                      🛡️ Better Seat Availability
                    </span>
                    <span className="text-xs font-bold text-rose-300/90 tabular-nums bg-white/[0.03] border border-white/[0.05] rounded px-2 py-0.5">
                      {route.waitlistCode}
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">Seat Confidence Rating</span>
                    <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      route.confirmationLikelihood === "High" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      route.confirmationLikelihood === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                      route.confirmationLikelihood === "Low" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}>
                      {route.confirmationLikelihood} ({route.confirmationProbability}%)
                    </span>
                  </div>
                </div>

                {route.peakDemandFactor && (
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 bg-white/[0.02] border border-white/[0.04] rounded-lg px-2.5 py-2">
                    <span className="text-violet-400 text-sm">✨</span>
                    <span>Seating Context: <strong className="text-zinc-300 font-semibold">{route.peakDemandFactor}</strong></span>
                  </div>
                )}

                {route.rescueRecommendation && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-3 text-[11px]">
                    <span className="text-emerald-400 text-base mt-px shrink-0">🛡️</span>
                    <div className="space-y-0.5">
                      <p className="font-extrabold uppercase tracking-wider text-emerald-400 text-[10px]">Navix Intelligent Comfort Selection</p>
                      <p className="text-zinc-300 leading-relaxed font-semibold">{route.rescueRecommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Stats Grid (Confidence & Seat Likelihood Breakdown) */}
            <div className="grid grid-cols-2 gap-2.5">
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

            {/* Journey Breakdown Legs */}
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

            {/* Route Intelligence Details */}
            <div className="pt-3 border-t border-white/[0.06]">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-2.5 px-0.5">Route Intelligence</p>
              <div className="grid grid-cols-2 gap-2">
                {/* Demand Context */}
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

                {/* Crowd Analysis */}
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

                {/* Booking Strategy */}
                <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Booking</p>
                  <p className="text-[11px] font-medium text-zinc-400 leading-tight">{insights.bookingUrgency}</p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </article>
  );
}
