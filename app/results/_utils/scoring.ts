import type { RouteOption } from "../_data/mock-routes";

// Helper to parse duration string to minutes
const getMinutes = (d: string) => {
  const h = d.match(/(\d+)h/);
  const m = d.match(/(\d+)m/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
};

// Helper to parse price string to number
const getPriceNum = (p: string) => parseFloat(p.replace(/[^0-9.]/g, ""));

export function calculateSmartScores(routes: RouteOption[]): RouteOption[] {
  if (routes.length === 0) return routes;

  // 1. Extract values for normalization
  const prices = routes.map(r => getPriceNum(r.estimatedPrice));
  const durations = routes.map(r => getMinutes(r.duration));
  const transfers = routes.map(r => r.legs.length - 1);
  const comforts = routes.map(r => r.comfortScore);
  const availabilities = routes.map(r => r.estimatedAvailability);
  const seatLikelihoods = routes.map(r => r.seatLikelihood);

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

  // Helper for normalization (handles division by zero)
  const normalize = (val: number, min: number, max: number, invert = false) => {
    if (max === min) return 1.0;
    const norm = (val - min) / (max - min);
    return invert ? 1.0 - norm : norm;
  };

  // 2. Calculate scores for each route
  const scoredRoutes = routes.map(r => {
    const price = getPriceNum(r.estimatedPrice);
    const duration = getMinutes(r.duration);
    const transferCount = r.legs.length - 1;

    // Weights:
    // Price: 30% (Lower is better)
    // Duration: 25% (Lower is better)
    // Transfers: 15% (Lower is better)
    // Comfort: 10% (Higher is better)
    // Availability: 10% (Higher is better)
    // Seat Likelihood: 10% (Higher is better)

    const priceScore = normalize(price, minPrice, maxPrice, true) * 0.30;
    const durationScore = normalize(duration, minDuration, maxDuration, true) * 0.25;
    const transferScore = normalize(transferCount, minTransfers, maxTransfers, true) * 0.15;
    const comfortScore = normalize(r.comfortScore, minComfort, maxComfort) * 0.10;
    const availScore = normalize(r.estimatedAvailability, minAvail, maxAvail) * 0.10;
    const seatScore = normalize(r.seatLikelihood, minSeat, maxSeat) * 0.10;

    const totalScore = (priceScore + durationScore + transferScore + comfortScore + availScore + seatScore) * 100;

    return {
      ...r,
      navixScore: Math.round(totalScore),
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

    // Prioritize badges: Best > Cheapest > Fastest
    if (isBest) {
      tag = "Best Route";
      tone = "cyan";
    } else if (isCheapest) {
      tag = "Cheapest";
      tone = "emerald";
    } else if (isFastest) {
      tag = "Fastest";
      tone = "violet";
    }

    const reasoning: string[] = [];
    if (isBest) {
      const price = getPriceNum(r.estimatedPrice);
      const priceDiffPct = Math.round(((avgPrice - price) / avgPrice) * 100);
      
      if (priceDiffPct > 5) {
        reasoning.push(`${priceDiffPct}% cheaper than average`);
      } else if (isCheapest) {
        reasoning.push("Cheapest option available");
      }
      
      const transferCount = r.legs.length - 1;
      if (transferCount <= minTransfers) {
        reasoning.push("Fewer transfers");
      }
      
      if (r.seatLikelihood > 70) {
        reasoning.push("High seat availability");
      }
      
      if (r.comfortScore > 80) {
        reasoning.push("Superior travel comfort");
      }
      
      if (reasoning.length === 0) {
        reasoning.push("Best overall balance of time and cost");
      }
    }

    return {
      ...r,
      recommendationTag: tag,
      tagTone: tone,
      isRecommended: isBest,
      recommendationReasoning: isBest ? reasoning : undefined,
    };
  });
}
