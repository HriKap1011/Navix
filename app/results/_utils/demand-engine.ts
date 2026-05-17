export type DemandProfile = {
  isWeekendRush: boolean;
  isSummerRush: boolean;
  activeFestival: string | null;
  seatModifier: number; // multiplier, e.g., 0.5 means half the availability
  comfortModifier: number; // absolute addition/subtraction, e.g., -10
  priceMultiplier: number; // multiplier, e.g., 1.2
  crowdModifier: number; // absolute addition, e.g., +20
  contextualMessage: string | null;
};

// Accurate 2026 Festival Travel Windows
const FESTIVALS = [
  { name: "Holi", startMonth: 2, startDay: 1, endMonth: 2, endDay: 6 }, // Holi is March 4, 2026. Travel window: March 1-6
  { name: "Summer Vacation", startMonth: 4, startDay: 10, endMonth: 5, endDay: 15 }, // May 10 - June 15
  { name: "Raksha Bandhan", startMonth: 7, startDay: 26, endMonth: 7, endDay: 30 }, // Raksha Bandhan is Aug 28, 2026. Travel window: Aug 26-30
  { name: "Durga Puja", startMonth: 9, startDay: 14, endMonth: 9, endDay: 22 }, // Durga Puja is Oct 16-20, 2026. Travel window: Oct 14-22
  { name: "Diwali", startMonth: 10, startDay: 4, endMonth: 10, endDay: 11 }, // Diwali is Nov 8, 2026. Travel window: Nov 4-11
  { name: "Chhath Puja", startMonth: 10, startDay: 12, endMonth: 10, endDay: 17 }, // Chhath is Nov 13-16, 2026. Travel window: Nov 12-17
  { name: "New Year", startMonth: 11, startDay: 25, endMonth: 0, endDay: 5 }, // Dec 25 - Jan 5
];

const HIGH_DEMAND_CORRIDORS = [
  "delhi-patna",
  "delhi-varanasi",
  "delhi-lucknow",
  "mumbai-patna",
  "bengaluru-patna",
  "kolkata-patna",
  "mumbai-varanasi",
];

export function analyzeTravelDemand(origin: string, destination: string, dateInput?: string): DemandProfile {
  const profile: DemandProfile = {
    isWeekendRush: false,
    isSummerRush: false,
    activeFestival: null,
    seatModifier: 1.0,
    comfortModifier: 0,
    priceMultiplier: 1.0,
    crowdModifier: 0,
    contextualMessage: null,
  };

  const travelDate = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(travelDate.getTime())) {
    return profile; // Return defaults if invalid date
  }

  const dayOfWeek = travelDate.getDay();
  const month = travelDate.getMonth();
  const day = travelDate.getDate();
  
  // If the input is just "YYYY-MM", it's a flexible month search.
  const isFlexibleMonth = dateInput ? /^\d{4}-\d{2}$/.test(dateInput.trim()) : false;

  const corridorKey = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
  const isHighDemandCorridor = HIGH_DEMAND_CORRIDORS.includes(corridorKey);

  // 1. Weekend Rush Detection (Friday to Monday)
  // 0: Sun, 1: Mon, 5: Fri, 6: Sat
  if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 || dayOfWeek === 1) {
    profile.isWeekendRush = true;
    profile.seatModifier *= 0.85;
    profile.priceMultiplier *= 1.1;
    profile.crowdModifier += 15;
    profile.comfortModifier -= 5;
    profile.contextualMessage = "Weekend travel congestion expected.";
  }

  // 2. Festival & Seasonal Detection
  let maxFestivalImpact = false;
  
  for (const fest of FESTIVALS) {
    let isActive = false;
    // Handle wrap around for New Year
    if (fest.startMonth > fest.endMonth) {
      if (isFlexibleMonth) {
        if (month === fest.startMonth || month === fest.endMonth) isActive = true;
      } else {
        if ((month === fest.startMonth && day >= fest.startDay) || (month === fest.endMonth && day <= fest.endDay)) {
          isActive = true;
        }
      }
    } else {
      if (month >= fest.startMonth && month <= fest.endMonth) {
        if (isFlexibleMonth) {
           isActive = true;
        } else if (month === fest.startMonth && month === fest.endMonth) {
          if (day >= fest.startDay && day <= fest.endDay) isActive = true;
        } else if (month === fest.startMonth && day >= fest.startDay) {
          isActive = true;
        } else if (month === fest.endMonth && day <= fest.endDay) {
          isActive = true;
        } else if (month > fest.startMonth && month < fest.endMonth) {
          isActive = true;
        }
      }
    }

    if (isActive) {
      if (fest.name === "Summer Vacation") {
        profile.isSummerRush = true;
        profile.seatModifier *= 0.7;
        profile.priceMultiplier *= 1.15;
        profile.crowdModifier += 25;
        profile.comfortModifier -= 10;
        profile.contextualMessage = "Summer travel rush active.";
      } else {
        profile.activeFestival = fest.name;
        maxFestivalImpact = true;
        profile.seatModifier *= 0.4;
        profile.priceMultiplier *= 1.3;
        profile.crowdModifier += 40;
        profile.comfortModifier -= 20;
        
        if (isHighDemandCorridor && (fest.name === "Diwali" || fest.name === "Chhath Puja" || fest.name === "Holi")) {
           profile.seatModifier *= 0.6; // Further penalty for high demand corridors during major festivals
           profile.crowdModifier += 15;
           profile.contextualMessage = `Extreme ${fest.name} rush on this corridor. Alternate routes highly recommended.`;
        } else {
           profile.contextualMessage = `${fest.name} festival demand spike detected.`;
        }
      }
      break; // Apply only the most relevant festival
    }
  }

  // Cap the values
  profile.crowdModifier = Math.min(profile.crowdModifier, 65); // Don't overflow the base crowd too much
  profile.priceMultiplier = Math.min(profile.priceMultiplier, 1.75); // Cap price surge
  
  return profile;
}
