export function capitalizeCity(city: string): string {
  return city
    .split(" ")
    .map((w) => {
      if (w.startsWith("(") && w.endsWith(")")) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function parseDurationToMinutes(duration: string): number {
  const h = duration.match(/(\d+)h/);
  const m = duration.match(/(\d+)m/);
  return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
}

export function parsePriceToNumber(price: string): number {
  return parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
}

export function formatTravelDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
