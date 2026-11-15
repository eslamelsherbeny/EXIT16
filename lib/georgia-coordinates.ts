import rawDatabase from '@/lib/georgia_locations_slim.json'

export type Coordinates = { lat: number; lng: number }

export const GEORGIA_AREA_COORDINATES: Record<string, Coordinates> = {
  // تبليسي وأحياؤها
  'Tbilisi - Saburtalo': { lat: 41.7271, lng: 44.7535 },
  'Tbilisi - Vake': { lat: 41.71, lng: 44.7645 },
  'Tbilisi - Vera': { lat: 41.7058, lng: 44.7831 },
  'Tbilisi - Mtatsminda': { lat: 41.6946, lng: 44.7904 },
  'Tbilisi - Old Tbilisi': { lat: 41.6874, lng: 44.8058 },
  'Tbilisi - Ortachala': { lat: 41.6749, lng: 44.8296 },
  'Tbilisi - Krtsanisi': { lat: 41.6667, lng: 44.8333 },
  'Tbilisi - Isani': { lat: 41.6881, lng: 44.8398 },
  'Tbilisi - Samgori': { lat: 41.6817, lng: 44.8727 },
  'Tbilisi - Varketili': { lat: 41.6961, lng: 44.8736 },
  'Tbilisi - Didi Digomi': { lat: 41.782, lng: 44.7667 },
  'Tbilisi - Digomi Massive': { lat: 41.7618, lng: 44.7709 },
  'Tbilisi - Didube': { lat: 41.7405, lng: 44.7797 },
  'Tbilisi - Chugureti / Marjanishvili': { lat: 41.7107, lng: 44.8001 },
  'Tbilisi - Nadzaladevi': { lat: 41.7454, lng: 44.8059 },
  'Tbilisi - Gldani': { lat: 41.8, lng: 44.8167 },
  'Tbilisi - Avlabari': { lat: 41.6917, lng: 44.8197 },
  'Tbilisi - Lisi Lake': { lat: 41.7431, lng: 44.7351 },
  'Tbilisi - Tbilisi Sea': { lat: 41.7583, lng: 44.8483 },
  'Tbilisi - Tabakhmela / Kojori': { lat: 41.658, lng: 44.748 },

  // باتومي وأحياؤها
  'Batumi - New Boulevard': { lat: 41.6258, lng: 41.6067 },
  'Batumi - Alley of Heroes': { lat: 41.6375, lng: 41.6133 },
  'Batumi - Old Boulevard / Center': { lat: 41.6517, lng: 41.6364 },
  'Batumi - Rustaveli Avenue': { lat: 41.6486, lng: 41.6288 },
  'Batumi - Khimshiashvili': { lat: 41.6359, lng: 41.6065 },
  'Batumi - Bagrationi': { lat: 41.6322, lng: 41.6234 },
  'Batumi - Airport District': { lat: 41.6111, lng: 41.5997 },
  'Batumi - Gonio / Kvariati': { lat: 41.5714, lng: 41.5647 },
  'Batumi - Makhinjauri': { lat: 41.6706, lng: 41.6953 },
  'Batumi - Chakvi / Green Cape': { lat: 41.6958, lng: 41.7114 },

  // مدن أخرى
  Kutaisi: { lat: 42.2662, lng: 42.718 },
  Rustavi: { lat: 41.5398, lng: 45.0069 },
  Gudauri: { lat: 42.4789, lng: 44.4797 },
  Bakuriani: { lat: 41.75, lng: 43.5333 },
  Borjomi: { lat: 41.8389, lng: 43.3833 },
  'Kakheti - Telavi / Kvareli': { lat: 41.9167, lng: 45.4667 },
}

export function getCoordinatesForArea(areaId: string | null): Coordinates {
  if (!areaId) return { lat: 41.7151, lng: 44.8271 }
  if (GEORGIA_AREA_COORDINATES[areaId]) {
    return GEORGIA_AREA_COORDINATES[areaId]
  }

  const clean = areaId.trim().toLowerCase()
  const cities = (rawDatabase as any).cities || {}

  if (cities[clean]?.lat && cities[clean]?.lng) {
    return { lat: Number(cities[clean].lat), lng: Number(cities[clean].lng) }
  }

  for (const cityObj of Object.values<any>(cities)) {
    if (cityObj?.nameEn?.toLowerCase() === clean && cityObj.lat && cityObj.lng) {
      return { lat: Number(cityObj.lat), lng: Number(cityObj.lng) }
    }
    for (const [dKey, dObj] of Object.entries<any>(cityObj?.districts || {})) {
      if (
        (dKey.toLowerCase() === clean || clean.includes(dKey.toLowerCase())) &&
        dObj?.lat &&
        dObj?.lng
      ) {
        return { lat: Number(dObj.lat), lng: Number(dObj.lng) }
      }
    }
  }

  return { lat: 41.7151, lng: 44.8271 }
}