const R = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];

export function bearingArrow(deg: number): string {
  return ARROWS[Math.round(deg / 45) % 8];
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

// Deterministic daily spawn within maxMeters of the given lat/lng.
// Seed = date string + location rounded to 0.1° so the point stays stable as you walk.
export function getDailySpawn(
  lat: number,
  lng: number,
  dateStr: string,
  maxMeters = 8047,
): { lat: number; lng: number } {
  const key = `${dateStr}-${Math.round(lat * 10)}-${Math.round(lng * 10)}`;
  let h = 5381;
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h + key.charCodeAt(i)) >>> 0;
  }
  const angle = (h * 137.508) % 360;
  const distance = (((h >>> 8) & 0xfff) / 0xfff) * (maxMeters - 1000) + 1000;
  const brng = toRad(angle);
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2),
    );
  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (((lng2 * 180) / Math.PI + 540) % 360) - 180,
  };
}

export const GLOBAL_LANDMARKS = [
  {
    name: "Eiffel Tower",
    city: "Paris",
    country: "France",
    lat: 48.8584,
    lng: 2.2945,
    emoji: "🗼",
  },
  {
    name: "Times Square",
    city: "New York",
    country: "USA",
    lat: 40.758,
    lng: -73.9855,
    emoji: "🌆",
  },
  {
    name: "Big Ben",
    city: "London",
    country: "UK",
    lat: 51.5007,
    lng: -0.1246,
    emoji: "🕰️",
  },
  {
    name: "Colosseum",
    city: "Rome",
    country: "Italy",
    lat: 41.8902,
    lng: 12.4922,
    emoji: "🏛️",
  },
  {
    name: "Sydney Opera House",
    city: "Sydney",
    country: "Australia",
    lat: -33.8568,
    lng: 151.2153,
    emoji: "🎭",
  },
  {
    name: "Sagrada Família",
    city: "Barcelona",
    country: "Spain",
    lat: 41.4036,
    lng: 2.1744,
    emoji: "⛪",
  },
  {
    name: "Tokyo Tower",
    city: "Tokyo",
    country: "Japan",
    lat: 35.6585,
    lng: 139.7454,
    emoji: "📡",
  },
  {
    name: "Machu Picchu",
    city: "Cusco",
    country: "Peru",
    lat: -13.1631,
    lng: -72.545,
    emoji: "🏔️",
  },
  {
    name: "Taj Mahal",
    city: "Agra",
    country: "India",
    lat: 27.1751,
    lng: 78.0421,
    emoji: "🕌",
  },
  {
    name: "Statue of Liberty",
    city: "New York",
    country: "USA",
    lat: 40.6892,
    lng: -74.0445,
    emoji: "🗽",
  },
  {
    name: "Brandenburg Gate",
    city: "Berlin",
    country: "Germany",
    lat: 52.5163,
    lng: 13.3777,
    emoji: "🏛️",
  },
  {
    name: "Christ the Redeemer",
    city: "Rio de Janeiro",
    country: "Brazil",
    lat: -22.9519,
    lng: -43.2105,
    emoji: "✝️",
  },
  {
    name: "Golden Gate Bridge",
    city: "San Francisco",
    country: "USA",
    lat: 37.8199,
    lng: -122.4783,
    emoji: "🌉",
  },
  {
    name: "Burj Khalifa",
    city: "Dubai",
    country: "UAE",
    lat: 25.1972,
    lng: 55.2744,
    emoji: "🏙️",
  },
  {
    name: "Angkor Wat",
    city: "Siem Reap",
    country: "Cambodia",
    lat: 13.4125,
    lng: 103.867,
    emoji: "🛕",
  },
  {
    name: "Acropolis",
    city: "Athens",
    country: "Greece",
    lat: 37.9715,
    lng: 23.7267,
    emoji: "🏛️",
  },
  {
    name: "Table Mountain",
    city: "Cape Town",
    country: "South Africa",
    lat: -33.9628,
    lng: 18.4098,
    emoji: "⛰️",
  },
  {
    name: "Forbidden City",
    city: "Beijing",
    country: "China",
    lat: 39.9163,
    lng: 116.3972,
    emoji: "🏯",
  },
  {
    name: "Grand Canyon",
    city: "Arizona",
    country: "USA",
    lat: 36.0544,
    lng: -112.1401,
    emoji: "🏜️",
  },
  {
    name: "Niagara Falls",
    city: "Ontario",
    country: "Canada",
    lat: 43.0962,
    lng: -79.0377,
    emoji: "💧",
  },
] as const;
