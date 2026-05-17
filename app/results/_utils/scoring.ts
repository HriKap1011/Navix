import type { RouteOption } from "../_data/mock-routes";

// Helper to parse duration string to minutes
const getMinutes = (d: string) => {
  const h = d.match(/(\d+)h/);
  const m = d.match(/(\d+)m/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
};

// Helper to parse price string to number
const getPriceNum = (p: string) => parseFloat(p.replace(/[^0-9.]/g, ""));

// Helper to parse hour from time string like "12:30" or "08:15"
const getHour = (t: string) => {
  const parts = t.split(":");
  return parts.length >= 1 ? parseInt(parts[0]) : 12;
};

// Helper to compute travel pain/friction penalty (0 to 100)
const calculateFrictionPenalty = (r: RouteOption) => {
  let penalty = 0;

  // 1. Excessive waiting / Long layovers
  const layoverMin = getMinutes(r.layoverDuration);
  if (layoverMin > 180) {
    penalty += 25; // Excessive wait
  } else if (layoverMin > 90) {
    penalty += 15; // Long layover
  } else if (layoverMin > 0 && layoverMin < 40) {
    penalty += 10; // Stressful tight connection
  }

  // 2. Overnight transfer difficulty
  if (r.legs.length > 1) {
    const leg1ArrHour = getHour(r.legs[0].arrivalTime);
    const leg2DepHour = getHour(r.legs[1].departureTime);
    if ((leg1ArrHour >= 23 || leg1ArrHour < 5) || (leg2DepHour >= 23 || leg2DepHour < 5)) {
      penalty += 20; // Inconvenient overnight transfer
    }
  }

  // 3. Too many mode changes
  if (r.travelModes.length >= 3) {
    penalty += 25; // 3 or more modes
  } else if (r.travelModes.length === 2) {
    penalty += 12; // 2 modes
  }

  // 4. Inconvenient timings (very early morning or late night)
  const depHour = getHour(r.departureTime);
  if (depHour < 6) {
    penalty += 12; // Early wake up
  }
  const arrHour = getHour(r.arrivalTime);
  if (arrHour >= 23 || arrHour < 4) {
    penalty += 12; // Late arrival
  }

  // 5. High seat risk discomfort
  if (r.estimatedAvailability < 35 || r.seatLikelihood < 35) {
    penalty += 15;
  }

  return Math.min(penalty, 100);
};

export function calculateSmartScores(routes: RouteOption[]): RouteOption[] {
  if (routes.length === 0) return routes;

  // Compute friction penalties first to normalize them
  const routesWithFriction = routes.map(r => {
    const penalty = calculateFrictionPenalty(r);
    const frictionScore = 100 - penalty; // Higher is better (less friction)
    return {
      r,
      frictionScore
    };
  });

  // 1. Extract values for normalization
  const prices = routes.map(r => getPriceNum(r.estimatedPrice));
  const durations = routes.map(r => getMinutes(r.duration));
  const transfers = routes.map(r => r.legs.length - 1);
  const comforts = routes.map(r => r.comfortScore);
  const availabilities = routes.map(r => r.estimatedAvailability);
  const seatLikelihoods = routes.map(r => r.seatLikelihood);
  const frictionScores = routesWithFriction.map(rwf => rwf.frictionScore);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const minTransfers = Math.min(...transfers);
  const maxTransfers = Math.max(...transfers);
  
  const minComfort = Math.min(...comforts);
  const maxComfort = Math.max(...comforts);
  const minAvail = Math.min(...availabilities);
  const maxAvail = Math.max(...availabilities);
  const minSeat = Math.min(...seatLikelihoods);
  const maxSeat = Math.max(...seatLikelihoods);

  const minFriction = Math.min(...frictionScores);
  const maxFriction = Math.max(...frictionScores);

  // Helper for normalization (handles division by zero)
  const normalize = (val: number, min: number, max: number, invert = false) => {
    if (max === min) return 1.0;
    const norm = (val - min) / (max - min);
    return invert ? 1.0 - norm : norm;
  };

  // 2. Calculate scores for each route
  const scoredRoutes = routesWithFriction.map(rwf => {
    const r = rwf.r;
    const price = getPriceNum(r.estimatedPrice);
    const duration = getMinutes(r.duration);
    const transferCount = r.legs.length - 1;

    // Weights:
    // Comfort: 20% (Higher is better)
    // Travel Pain / Friction Score (No/low layovers, mode changes, timings): 20% (Higher is better)
    // Seat Likelihood: 15% (Higher is better)
    // Transfers (Low stress): 15% (Lower is better)
    // Price: 15% (Lower is better)
    // Duration: 10% (Lower is better)
    // Availability Score: 5%

    const comfortScore = normalize(r.comfortScore, minComfort, maxComfort) * 0.20;
    const frictionScore = normalize(rwf.frictionScore, minFriction, maxFriction) * 0.20;
    const seatScore = normalize(r.seatLikelihood, minSeat, maxSeat) * 0.15;
    const transferScore = normalize(transferCount, minTransfers, maxTransfers, true) * 0.15;
    const priceScore = normalize(price, minPrice, maxPrice, true) * 0.15;
    const durationScore = normalize(duration, minDuration, maxDuration, true) * 0.10;
    const availScore = normalize(r.estimatedAvailability, minAvail, maxAvail) * 0.05;

    const totalScore = (comfortScore + frictionScore + seatScore + transferScore + priceScore + durationScore + availScore) * 100;

    return {
      ...r,
      navixScore: Math.round(totalScore),
      frictionScore: rwf.frictionScore // Keep tracked for reporting
    };
  });

  // 3. Determine specific badges
  const minPriceVal = Math.min(...scoredRoutes.map(r => getPriceNum(r.estimatedPrice)));
  const minDurationVal = Math.min(...scoredRoutes.map(r => getMinutes(r.duration)));
  
  // Sort by score descending to find the absolute best
  const sortedByScore = [...scoredRoutes].sort((a, b) => b.navixScore - a.navixScore);
  const bestRouteId = sortedByScore[0]?.id;

  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  return scoredRoutes.map(r => {
    const isCheapest = getPriceNum(r.estimatedPrice) === minPriceVal;
    const isFastest = getMinutes(r.duration) === minDurationVal;
    const isBest = r.id === bestRouteId;

    let tag = r.recommendationTag;
    let tone = r.tagTone;

    const minTransfersVal = Math.min(...scoredRoutes.map(r => r.legs.length - 1));

    // Prioritize comfort-first solution-oriented badges
    if (isBest) {
      if (r.comfortScore > 85) {
        tag = "Most Comfortable";
      } else if (r.seatLikelihood > 85) {
        tag = "Best Seat Confidence";
      } else if (r.frictionScore > 90) {
        tag = "Zero Timing Friction";
      } else if (r.routeCombination.includes("via")) {
        tag = "Recommended Alternate";
      } else if (r.routeCombination.includes("ANVT") || r.routeCombination.includes("SDAH")) {
        tag = "Easier Boarding Route";
      } else {
        tag = "Smoothest Journey";
      }
      tone = "cyan";
    } else if (isCheapest) {
      tag = "Best Value Comfort";
      tone = "emerald";
    } else if (isFastest) {
      tag = "Express Comfort";
      tone = "violet";
    } else if (r.legs.length - 1 === minTransfersVal) {
      tag = "Easier Transfer";
      tone = "amber";
    }

    const reasoning: string[] = [];
    if (isBest) {
      const price = getPriceNum(r.estimatedPrice);
      const priceDiffPct = Math.round(((avgPrice - price) / avgPrice) * 100);
      
      if (priceDiffPct > 5) {
        reasoning.push(`Highly economical optimal route`);
      } else if (isCheapest) {
        reasoning.push("Best value for comfortable budget travel");
      }
      
      const transferCount = r.legs.length - 1;
      if (transferCount <= minTransfers) {
        reasoning.push("Saves transfer stress");
      }
      
      if (r.seatLikelihood > 70) {
        reasoning.push("Highly confident seat availability");
      }
      
      if (r.comfortScore > 80) {
        reasoning.push("Superior comfort and low travel friction");
      }

      if (r.frictionScore > 90) {
        reasoning.push("Daylight schedule with no waiting pain");
      } else if (r.frictionScore > 75) {
        reasoning.push("Bypasses overnight transfer stress");
      }
      
      if (reasoning.length === 0) {
        reasoning.push("Bypasses active land sector congestion");
      }
    }

    // Clean up temporary property to not pollute route object type if needed, or keep it
    const { frictionScore, ...cleanedRoute } = r as any;

    return {
      ...cleanedRoute,
      recommendationTag: tag,
      tagTone: tone,
      isRecommended: isBest,
      recommendationReasoning: isBest ? reasoning : undefined,
    };
  });
}
