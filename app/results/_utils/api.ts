import { buildRouteOptions } from "../_data/mock-routes";
import { calculateSmartScores } from "./scoring";
import { analyzeTravelDemand } from "./demand-engine";
import type { RouteOption } from "../_data/mock-routes";

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
  // Use backend timing if present, else fallback list
  const departureTimes = ["06:45", "10:30", "14:15", "18:00", "21:30"];
  const departureTime = r.departure_time || departureTimes[idx % departureTimes.length];

  // Calculate arrival time based on duration
  const parseDurationToMin = (d: string) => {
    const h = d.match(/(\d+)h/);
    const m = d.match(/(\d+)m/);
    return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
  };
  const durationMin = parseDurationToMin(r.duration);
  const [depH, depM] = departureTime.split(":").map(Number);
  const totalMin = depH * 60 + depM + durationMin;
  const arrH = Math.floor(totalMin / 60) % 24;
  const arrM = totalMin % 60;
  const arrivalTime = r.arrival_time || `${String(arrH).padStart(2, "0")}:${String(arrM).padStart(2, "0")}`;

  // Build legs representing the travel modes
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

  // Pick tag tone based on keywords in the recommendation reason
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

  // Confirmation/waitlist details
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

export interface FetchRoutesResult {
  routes: RouteOption[];
  error?: string | null;
}

export interface City {
  name: string;
  lat: number;
  lon: number;
  has_airport: boolean;
  has_train_station: boolean;
  code: string;
  station: string;
}

export interface FetchCitiesResult {
  cities: City[];
  error?: string | null;
}

const FALLBACK_CITIES: City[] = [
  { name: "Delhi", lat: 28.7041, lon: 77.1025, has_airport: true, has_train_station: true, code: "DEL", station: "NDLS" },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, has_airport: true, has_train_station: true, code: "BOM", station: "CSMT" },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946, has_airport: true, has_train_station: true, code: "BLR", station: "SBC" },
  { name: "Hyderabad", lat: 17.3850, lon: 78.4867, has_airport: true, has_train_station: true, code: "HYD", station: "HYB" },
  { name: "Pune", lat: 18.5204, lon: 73.8567, has_airport: true, has_train_station: true, code: "PNQ", station: "PUNE" },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639, has_airport: true, has_train_station: true, code: "CCU", station: "HWH" },
  { name: "Chennai", lat: 13.0827, lon: 80.2707, has_airport: true, has_train_station: true, code: "MAA", station: "MAS" },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873, has_airport: true, has_train_station: true, code: "JAI", station: "JP" },
  { name: "Patna", lat: 25.5941, lon: 85.1376, has_airport: true, has_train_station: true, code: "PAT", station: "PNBE" },
  { name: "Varanasi", lat: 25.3176, lon: 82.9739, has_airport: true, has_train_station: true, code: "VNS", station: "BSB" },
  { name: "Lucknow", lat: 26.8467, lon: 80.9462, has_airport: true, has_train_station: true, code: "LKO", station: "LKO" },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714, has_airport: true, has_train_station: true, code: "AMD", station: "ADI" }
];

export async function fetchRoutesFromApi(
  origin: string,
  destination: string,
  date: string
): Promise<FetchRoutesResult> {
  const backendUrl = "http://127.0.0.1:8000/search-routes";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: origin,
        destination: destination,
        date: date || "2026-06-15",
      }),
      signal: controller.signal,
      next: { revalidate: 0 } // Disable caching to fetch live backend updates
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned HTTP status ${response.status}`);
    }

    const data = await response.json();
    if (data.success && Array.isArray(data.routes)) {
      console.log(`Successfully fetched ${data.routes.length} routes from FastAPI backend.`);
      return {
        routes: data.routes.map((route: any, idx: number) => mapBackendRouteToRouteOption(route, idx)),
        error: data.error || null
      };
    } else {
      console.warn("Backend validation failed:", data.error);
      return {
        routes: [],
        error: data.error || "Validation failed"
      };
    }
  } catch (error) {
    console.warn("FastAPI backend is offline or returned an error. Falling back to local simulation data.", error);
    
    // Validate inputs locally for offline fallback mode
    const sourceValid = FALLBACK_CITIES.some(
      (c) => c.name.toLowerCase() === origin.trim().toLowerCase()
    );
    const destValid = FALLBACK_CITIES.some(
      (c) => c.name.toLowerCase() === destination.trim().toLowerCase()
    );

    if (!origin.trim()) {
      return { routes: [], error: "Source city cannot be empty" };
    }
    if (!destination.trim()) {
      return { routes: [], error: "Destination city cannot be empty" };
    }
    if (!sourceValid) {
      return { routes: [], error: `'${origin}' is not a supported source city` };
    }
    if (!destValid) {
      return { routes: [], error: `'${destination}' is not a supported destination city` };
    }
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      return { routes: [], error: "Source and destination cities cannot be the same" };
    }

    // Graceful fallback to frontend-only generator & scoring
    const rawRouteOptions = buildRouteOptions(origin, destination, date);
    return {
      routes: calculateSmartScores(rawRouteOptions),
      error: null
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
    console.warn("FastAPI backend is offline or failed to fetch cities. Using local fallback list.", error);
  }

  return { cities: FALLBACK_CITIES, error: null };
}
