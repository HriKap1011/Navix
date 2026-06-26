import type { RouteOption, FetchRoutesResult, City, FetchCitiesResult } from "./types";
export type { RouteOption, FetchRoutesResult, City, FetchCitiesResult };
import { parseDurationToMinutes } from "./formatters";

export interface BackendRoute {
  route_id: string;
  source: string;
  destination: string;
  duration: string;
  price: number;
  nx_score: number;
  seat_likelihood: number;
  comfort_score: number;
  transport_modes: string[];
  recommendation_reason: string;
}

export interface BackendResponse {
  success: boolean;
  routes: BackendRoute[];
}

function mapBackendRouteToRouteOption(r: any, idx: number): RouteOption {
  const departureTimes = ["06:45", "10:30", "14:15", "18:00", "21:30"];
  const departureTime = r.departure_time || departureTimes[idx % departureTimes.length];

  const durationMin = parseDurationToMinutes(r.duration);
  const [depH, depM] = departureTime.split(":").map(Number);
  const totalMin = depH * 60 + depM + durationMin;
  const arrH = Math.floor(totalMin / 60) % 24;
  const arrM = totalMin % 60;
  const arrivalTime = r.arrival_time || `${String(arrH).padStart(2, "0")}:${String(arrM).padStart(2, "0")}`;

  const legs = r.legs && r.legs.length > 0
    ? r.legs.map((leg: any) => ({
      from: leg.from_city,
      to: leg.to_city,
      mode: leg.mode,
      duration: leg.duration,
      departureTime: leg.departure_time,
      arrivalTime: leg.arrival_time
    }))
    : r.transport_modes.map((mode: string, lIdx: number) => {
      return {
        from: lIdx === 0 ? r.source : "Transit Station",
        to: lIdx === r.transport_modes.length - 1 ? r.destination : "Transit Station",
        mode: mode.includes("-") ? mode : `${mode} Express`,
        duration: r.duration,
        departureTime: departureTime,
        arrivalTime: arrivalTime
      };
    });

  let tagTone: "cyan" | "emerald" | "violet" | "amber" = "cyan";
  const reason = (r.recommendation_reason || "").toLowerCase();
  if (reason.includes("seat") || reason.includes("boarding") || reason.includes("waitlist")) {
    tagTone = "amber";
  } else if (reason.includes("comfort") || reason.includes("luxury")) {
    tagTone = "cyan";
  } else if (reason.includes("fast") || reason.includes("time") || reason.includes("bypass") || reason.includes("saves")) {
    tagTone = "violet";
  } else if (reason.includes("price") || reason.includes("value") || reason.includes("cheap")) {
    tagTone = "emerald";
  }

  let waitlistCode: string | undefined = r.waitlist_code;
  let confirmationLikelihood: "High" | "Medium" | "Low" | "Very Low" | undefined = r.confirmation_likelihood;
  let confirmationProbability: number | undefined = r.confirmation_probability;
  let rescueRecommendation: string | undefined = r.rescue_recommendation;

  const isTrain = r.transport_modes.includes("Train");
  if (!waitlistCode && isTrain && r.seat_likelihood < 50) {
    waitlistCode = `GNWL 25 / WL 12`;
    confirmationProbability = r.seat_likelihood;
    confirmationLikelihood = r.seat_likelihood > 35 ? "Medium" : "Low";
    rescueRecommendation = "Navix Comfort Tip: Secure better seat availability by boarding at secondary station or choosing an air hybrid path!";
  } else if (!waitlistCode && isTrain) {
    confirmationProbability = r.seat_likelihood;
    confirmationLikelihood = r.seat_likelihood > 75 ? "High" : "Medium";
  }

  return {
    id: r.route_id,
    routeCombination: `${r.source} -> ${r.destination}`,
    duration: r.duration,
    estimatedPrice: `INR ${r.price.toLocaleString("en-IN")}`,
    travelModes: r.transport_modes,
    legs: legs,
    recommendationTag: r.recommendation_reason || "",
    tagTone: tagTone,
    isRecommended: r.is_recommended !== undefined ? r.is_recommended : idx === 0,
    departureTime: departureTime,
    arrivalTime: arrivalTime,
    layoverDuration: r.layover_duration || "0m",
    estimatedAvailability: r.seat_likelihood,
    confidenceScore: r.confidence_score || (80 + (idx * 5) % 15),
    difficulty: r.transport_modes.length > 1 ? "Moderate" : "Easy",
    travelInsights: {
      demandLevel: r.seat_likelihood < 40 ? "High" : "Moderate",
      bookingUrgency: r.seat_likelihood < 40 ? "Book immediately" : "Standard booking window",
      seasonalTip: r.recommendation_reason || "Plan ahead for best availability",
      crowdLevel: Math.max(10, 100 - r.comfort_score),
      priceTrend: "Stable",
      trendDescription: "Fares are stable on this corridor."
    },
    navixScore: r.nx_score,
    comfortScore: r.comfort_score,
    seatLikelihood: r.seat_likelihood,
    recommendationReasoning: r.recommendation_reasoning && r.recommendation_reasoning.length > 0
      ? r.recommendation_reasoning
      : (r.recommendation_reason ? [r.recommendation_reason] : []),
    waitlistCode,
    confirmationLikelihood,
    confirmationProbability,
    rescueRecommendation
  };
}

export async function fetchRoutesFromApi(
  origin: string,
  destination: string,
  date: string
): Promise<FetchRoutesResult> {
  const backendUrl = "http://127.0.0.1:8000/search-routes";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: origin,
        destination: destination,
        date: date || new Date().toISOString().split("T")[0],
      }),
      signal: controller.signal,
      next: { revalidate: 0 }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned HTTP status ${response.status}`);
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.routes)) {
      console.log(`Successfully fetched ${data.routes.length} routes from FastAPI backend.`);
      
      let demandProfile = null;
      if (data.demand_profile) {
        demandProfile = {
          isWeekendRush: data.demand_profile.is_weekend_rush,
          isSummerRush: data.demand_profile.is_summer_rush,
          activeFestival: data.demand_profile.active_festival,
          seatModifier: data.demand_profile.seat_modifier,
          comfortModifier: data.demand_profile.comfort_modifier,
          priceMultiplier: data.demand_profile.price_multiplier,
          crowdModifier: data.demand_profile.crowd_modifier,
          contextualMessage: data.demand_profile.contextual_message
        };
      }

      return {
        routes: data.routes.map((route: any, idx: number) => mapBackendRouteToRouteOption(route, idx)),
        error: data.error || null,
        demandProfile: demandProfile
      };
    } else {
      console.warn("Backend validation failed:", data.error);
      return {
        routes: [],
        error: data.error || "Validation failed"
      };
    }
  } catch (error) {
    console.warn("FastAPI backend is offline or returned an error.", error);
    return {
      routes: [],
      error: "Navix travel service is currently offline. Please ensure the backend server is running and try again."
    };
  }
}

export async function fetchCitiesFromApi(): Promise<FetchCitiesResult> {
  const backendUrl = "http://127.0.0.1:8000/cities";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(backendUrl, {
      signal: controller.signal,
      next: { revalidate: 0 }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned HTTP status ${response.status}`);
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.cities)) {
      return { cities: data.cities, error: null };
    }
  } catch (error) {
    console.warn("FastAPI backend is offline or failed to fetch cities.", error);
  }

  return { cities: [], error: "Failed to connect to cities database" };
}
