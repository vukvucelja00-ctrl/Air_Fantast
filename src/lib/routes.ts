/**
 * Direct passenger routes from Serbian airports, taken from the airport timetables published on
 * Wikipedia in early November 2026 (Belgrade's table is dated October 2026). Timetables change
 * every season, so review this file regularly.
 */

export type OriginCode = 'BEG' | 'INI' | 'KVO'
export type RouteKind = 'scheduled' | 'seasonal' | 'charter' | 'upcoming'

export type RouteInfo = { airlines: string[]; kind: RouteKind; note?: string }

export type Destination = {
  code: string
  city: string
  /** Set where a city has several airports or its airport has a well-known name. */
  airport?: string
  country: string
  lat: number
  lon: number
  routes: Partial<Record<OriginCode, RouteInfo>>
}

export type Route = RouteInfo & { id: string; origin: OriginCode; destination: Destination }

export const ORIGINS: Record<OriginCode, { code: OriginCode; city: string; airport: string; lat: number; lon: number }> = {
  BEG: { code: 'BEG', city: 'Belgrade', airport: 'Nikola Tesla', lat: 44.82, lon: 20.31 },
  INI: { code: 'INI', city: 'Niš', airport: 'Constantine the Great', lat: 43.34, lon: 21.85 },
  KVO: { code: 'KVO', city: 'Kraljevo', airport: 'Morava', lat: 43.82, lon: 20.59 },
}

export const KIND_LABEL: Record<RouteKind, string> = {
  scheduled: 'Scheduled',
  seasonal: 'Seasonal',
  charter: 'Charter',
  upcoming: 'Coming soon',
}

const AS = 'Air Serbia'
const W6 = 'Wizz Air'

const scheduled = (...airlines: string[]): RouteInfo => ({ airlines, kind: 'scheduled' })
const seasonal = (...airlines: string[]): RouteInfo => ({ airlines, kind: 'seasonal' })
const charter = (...airlines: string[]): RouteInfo => ({ airlines, kind: 'charter' })
const upcoming = (note: string, ...airlines: string[]): RouteInfo => ({ airlines, kind: 'upcoming', note })

export const destinations: Destination[] = [
  { code: 'AHO', city: 'Alghero', country: 'Italy', lat: 40.63, lon: 8.29, routes: { BEG: seasonal(AS, W6) } },
  { code: 'ALC', city: 'Alicante', country: 'Spain', lat: 38.28, lon: -0.56, routes: { BEG: scheduled(AS, W6) } },
  { code: 'AMS', city: 'Amsterdam', airport: 'Schiphol', country: 'Netherlands', lat: 52.31, lon: 4.76, routes: { BEG: scheduled(AS, 'KLM') } },
  { code: 'ESB', city: 'Ankara', airport: 'Esenboğa', country: 'Türkiye', lat: 40.13, lon: 32.99, routes: { BEG: scheduled('AJet') } },
  { code: 'AYT', city: 'Antalya', country: 'Türkiye', lat: 36.9, lon: 30.8, routes: { BEG: charter(AS), INI: charter(AS) } },
  { code: 'NQZ', city: 'Astana', country: 'Kazakhstan', lat: 51.02, lon: 71.47, routes: { BEG: scheduled('SCAT Airlines') } },
  { code: 'ATH', city: 'Athens', country: 'Greece', lat: 37.94, lon: 23.95, routes: { BEG: scheduled('Aegean Airlines', AS), INI: seasonal(AS) } },
  { code: 'GYD', city: 'Baku', country: 'Azerbaijan', lat: 40.47, lon: 50.05, routes: { BEG: scheduled(AS) } },
  { code: 'BNX', city: 'Banja Luka', country: 'Bosnia and Herzegovina', lat: 44.94, lon: 17.3, routes: { BEG: scheduled(AS) } },
  { code: 'BCN', city: 'Barcelona', airport: 'El Prat', country: 'Spain', lat: 41.3, lon: 2.08, routes: { BEG: scheduled(AS, W6) } },
  { code: 'BRI', city: 'Bari', country: 'Italy', lat: 41.14, lon: 16.76, routes: { BEG: scheduled(AS) } },
  { code: 'BSL', city: 'Basel/Mulhouse', country: 'Switzerland', lat: 47.59, lon: 7.53, routes: { BEG: scheduled(W6), INI: scheduled(W6) } },
  { code: 'PEK', city: 'Beijing', airport: 'Capital', country: 'China', lat: 40.08, lon: 116.58, routes: { BEG: scheduled('Hainan Airlines') } },
  { code: 'BEG', city: 'Belgrade', airport: 'Nikola Tesla', country: 'Serbia', lat: 44.82, lon: 20.31, routes: { INI: scheduled(AS) } },
  { code: 'BER', city: 'Berlin', country: 'Germany', lat: 52.37, lon: 13.5, routes: { BEG: scheduled(AS, W6) } },
  { code: 'BJV', city: 'Bodrum', airport: 'Milas–Bodrum', country: 'Türkiye', lat: 37.25, lon: 27.66, routes: { BEG: charter(AS) } },
  { code: 'BLQ', city: 'Bologna', country: 'Italy', lat: 44.53, lon: 11.29, routes: { BEG: scheduled(AS) } },
  { code: 'BWK', city: 'Brač', country: 'Croatia', lat: 43.29, lon: 16.68, routes: { BEG: seasonal(AS) } },
  { code: 'BRU', city: 'Brussels', country: 'Belgium', lat: 50.9, lon: 4.48, routes: { BEG: scheduled(AS) } },
  { code: 'OTP', city: 'Bucharest', airport: 'Otopeni', country: 'Romania', lat: 44.57, lon: 26.1, routes: { BEG: scheduled(AS) } },
  { code: 'BUD', city: 'Budapest', country: 'Hungary', lat: 47.44, lon: 19.26, routes: { BEG: scheduled(AS) } },
  { code: 'CTA', city: 'Catania', country: 'Italy', lat: 37.47, lon: 15.07, routes: { BEG: seasonal(AS) } },
  { code: 'CHQ', city: 'Chania', country: 'Greece', lat: 35.53, lon: 24.15, routes: { BEG: seasonal(AS, W6) } },
  { code: 'ORD', city: 'Chicago', airport: "O'Hare", country: 'United States', lat: 41.98, lon: -87.9, routes: { BEG: scheduled(AS) } },
  { code: 'RMO', city: 'Chișinău', country: 'Moldova', lat: 46.93, lon: 28.93, routes: { BEG: upcoming('From 3 June 2027', AS) } },
  { code: 'CLJ', city: 'Cluj-Napoca', country: 'Romania', lat: 46.79, lon: 23.69, routes: { BEG: upcoming('From 31 May 2027', AS) } },
  { code: 'CGN', city: 'Cologne/Bonn', country: 'Germany', lat: 50.87, lon: 7.14, routes: { BEG: seasonal('Eurowings'), INI: scheduled(AS) } },
  { code: 'CPH', city: 'Copenhagen', country: 'Denmark', lat: 55.62, lon: 12.66, routes: { BEG: scheduled(AS) } },
  { code: 'CFU', city: 'Corfu', country: 'Greece', lat: 39.6, lon: 19.91, routes: { BEG: seasonal(AS) } },
  { code: 'DLM', city: 'Dalaman', country: 'Türkiye', lat: 36.71, lon: 28.79, routes: { BEG: charter(AS) } },
  { code: 'DJE', city: 'Djerba', airport: 'Djerba–Zarzis', country: 'Tunisia', lat: 33.88, lon: 10.78, routes: { BEG: charter('Nouvelair') } },
  { code: 'DTM', city: 'Dortmund', country: 'Germany', lat: 51.52, lon: 7.61, routes: { BEG: scheduled(W6), INI: scheduled(W6) } },
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', lat: 25.25, lon: 55.36, routes: { BEG: scheduled('flydubai') } },
  { code: 'DBV', city: 'Dubrovnik', country: 'Croatia', lat: 42.56, lon: 18.27, routes: { BEG: scheduled(AS) } },
  { code: 'DUS', city: 'Düsseldorf', country: 'Germany', lat: 51.29, lon: 6.77, routes: { BEG: scheduled(AS) } },
  { code: 'EIN', city: 'Eindhoven', country: 'Netherlands', lat: 51.45, lon: 5.37, routes: { BEG: scheduled(W6) } },
  { code: 'DBB', city: 'El Dabaa', airport: 'El Alamein', country: 'Egypt', lat: 30.92, lon: 28.46, routes: { BEG: charter(AS) } },
  { code: 'FLR', city: 'Florence', country: 'Italy', lat: 43.81, lon: 11.2, routes: { BEG: scheduled(AS) } },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', lat: 50.03, lon: 8.57, routes: { BEG: scheduled(AS, 'Lufthansa') } },
  { code: 'HHN', city: 'Frankfurt', airport: 'Hahn', country: 'Germany', lat: 49.95, lon: 7.26, routes: { INI: scheduled(AS) } },
  { code: 'GVA', city: 'Geneva', country: 'Switzerland', lat: 46.24, lon: 6.11, routes: { BEG: scheduled('easyJet') } },
  { code: 'GOT', city: 'Gothenburg', airport: 'Landvetter', country: 'Sweden', lat: 57.66, lon: 12.28, routes: { BEG: scheduled(W6, AS) } },
  { code: 'GNB', city: 'Grenoble', country: 'France', lat: 45.36, lon: 5.33, routes: { BEG: seasonal(W6) } },
  { code: 'CAN', city: 'Guangzhou', airport: 'Baiyun', country: 'China', lat: 23.39, lon: 113.3, routes: { BEG: scheduled(AS, 'China Southern Airlines') } },
  { code: 'HAM', city: 'Hamburg', country: 'Germany', lat: 53.63, lon: 9.99, routes: { BEG: scheduled(AS, W6) } },
  { code: 'HAJ', city: 'Hannover', country: 'Germany', lat: 52.46, lon: 9.69, routes: { BEG: scheduled(AS) } },
  { code: 'HEL', city: 'Helsinki', country: 'Finland', lat: 60.32, lon: 24.96, routes: { BEG: upcoming('Resumes 1 April 2027', AS) } },
  { code: 'HER', city: 'Heraklion', country: 'Greece', lat: 35.34, lon: 25.18, routes: { BEG: seasonal(AS, 'Sky Express') } },
  { code: 'HRG', city: 'Hurghada', country: 'Egypt', lat: 27.18, lon: 33.8, routes: { BEG: scheduled('Air Cairo', AS) } },
  { code: 'IST', city: 'Istanbul', airport: 'Istanbul Airport', country: 'Türkiye', lat: 41.26, lon: 28.74, routes: { BEG: scheduled(AS, 'Turkish Airlines'), INI: scheduled(AS), KVO: scheduled(AS) } },
  { code: 'SAW', city: 'Istanbul', airport: 'Sabiha Gökçen', country: 'Türkiye', lat: 40.9, lon: 29.31, routes: { BEG: scheduled('AJet', 'Pegasus Airlines') } },
  { code: 'ADB', city: 'Izmir', country: 'Türkiye', lat: 38.29, lon: 27.16, routes: { BEG: scheduled('AJet', AS) } },
  { code: 'KVA', city: 'Kavala', country: 'Greece', lat: 40.91, lon: 24.62, routes: { BEG: charter(AS) } },
  { code: 'KZN', city: 'Kazan', country: 'Russia', lat: 55.61, lon: 49.28, routes: { BEG: scheduled(AS) } },
  { code: 'EFL', city: 'Kefalonia', country: 'Greece', lat: 38.12, lon: 20.5, routes: { BEG: charter(AS) } },
  { code: 'KYA', city: 'Konya', country: 'Türkiye', lat: 37.98, lon: 32.56, routes: { BEG: charter('AJet') } },
  { code: 'KRK', city: 'Kraków', country: 'Poland', lat: 50.08, lon: 19.78, routes: { BEG: scheduled(AS) } },
  { code: 'LCA', city: 'Larnaca', country: 'Cyprus', lat: 34.88, lon: 33.62, routes: { BEG: scheduled(AS, W6) } },
  { code: 'LIS', city: 'Lisbon', country: 'Portugal', lat: 38.77, lon: -9.13, routes: { BEG: scheduled(AS) } },
  { code: 'LJU', city: 'Ljubljana', country: 'Slovenia', lat: 46.22, lon: 14.46, routes: { BEG: scheduled(AS), INI: scheduled(AS) } },
  { code: 'LHR', city: 'London', airport: 'Heathrow', country: 'United Kingdom', lat: 51.47, lon: -0.45, routes: { BEG: scheduled(AS) } },
  { code: 'LTN', city: 'London', airport: 'Luton', country: 'United Kingdom', lat: 51.87, lon: -0.37, routes: { BEG: scheduled(W6) } },
  { code: 'MAD', city: 'Madrid', country: 'Spain', lat: 40.49, lon: -3.57, routes: { BEG: { airlines: [AS, W6], kind: 'scheduled', note: 'Wizz Air until 8 January 2027' } } },
  { code: 'AGP', city: 'Málaga', country: 'Spain', lat: 36.67, lon: -4.5, routes: { BEG: scheduled(AS) } },
  { code: 'MMX', city: 'Malmö', country: 'Sweden', lat: 55.54, lon: 13.37, routes: { BEG: scheduled(W6) } },
  { code: 'MLA', city: 'Malta', country: 'Malta', lat: 35.86, lon: 14.48, routes: { BEG: scheduled(AS, W6), INI: scheduled(AS) } },
  { code: 'MUH', city: 'Marsa Matruh', country: 'Egypt', lat: 31.33, lon: 27.22, routes: { BEG: charter(AS) } },
  { code: 'FMM', city: 'Memmingen', country: 'Germany', lat: 47.99, lon: 10.24, routes: { BEG: scheduled(W6), INI: scheduled(W6) } },
  { code: 'MAH', city: 'Menorca', country: 'Spain', lat: 39.86, lon: 4.22, routes: { BEG: upcoming('From 16 June 2027', AS) } },
  { code: 'MIA', city: 'Miami', country: 'United States', lat: 25.79, lon: -80.29, routes: { BEG: upcoming('From 20 May 2027', AS) } },
  { code: 'MXP', city: 'Milan', airport: 'Malpensa', country: 'Italy', lat: 45.63, lon: 8.72, routes: { BEG: scheduled(AS) } },
  { code: 'BGY', city: 'Milan', airport: 'Bergamo', country: 'Italy', lat: 45.67, lon: 9.7, routes: { BEG: scheduled(W6) } },
  { code: 'MIR', city: 'Monastir', country: 'Tunisia', lat: 35.76, lon: 10.75, routes: { BEG: charter(AS, 'Nouvelair'), INI: charter(AS) } },
  { code: 'SVO', city: 'Moscow', airport: 'Sheremetyevo', country: 'Russia', lat: 55.97, lon: 37.41, routes: { BEG: scheduled(AS) } },
  { code: 'OMO', city: 'Mostar', country: 'Bosnia and Herzegovina', lat: 43.28, lon: 17.85, routes: { BEG: scheduled(AS) } },
  { code: 'MUC', city: 'Munich', country: 'Germany', lat: 48.35, lon: 11.79, routes: { BEG: scheduled(AS, 'Lufthansa') } },
  { code: 'JMK', city: 'Mykonos', country: 'Greece', lat: 37.44, lon: 25.35, routes: { BEG: seasonal(AS) } },
  { code: 'NAP', city: 'Naples', country: 'Italy', lat: 40.89, lon: 14.29, routes: { BEG: seasonal(AS) } },
  { code: 'JFK', city: 'New York', airport: 'JFK', country: 'United States', lat: 40.64, lon: -73.78, routes: { BEG: scheduled(AS) } },
  { code: 'NCE', city: 'Nice', country: 'France', lat: 43.66, lon: 7.22, routes: { BEG: scheduled(AS, W6) } },
  { code: 'INI', city: 'Niš', airport: 'Constantine the Great', country: 'Serbia', lat: 43.34, lon: 21.85, routes: { BEG: scheduled(AS) } },
  { code: 'GOJ', city: 'Nizhny Novgorod', airport: 'Strigino', country: 'Russia', lat: 56.23, lon: 43.78, routes: { BEG: scheduled(AS) } },
  { code: 'NUE', city: 'Nuremberg', country: 'Germany', lat: 49.5, lon: 11.08, routes: { BEG: scheduled(AS) } },
  { code: 'OHD', city: 'Ohrid', country: 'North Macedonia', lat: 41.18, lon: 20.74, routes: { BEG: seasonal(AS) } },
  { code: 'OSL', city: 'Oslo', country: 'Norway', lat: 60.19, lon: 11.1, routes: { BEG: scheduled(AS, 'Norwegian Air Shuttle') } },
  { code: 'PMO', city: 'Palermo', country: 'Italy', lat: 38.18, lon: 13.09, routes: { BEG: seasonal(AS, W6) } },
  { code: 'PMI', city: 'Palma de Mallorca', country: 'Spain', lat: 39.55, lon: 2.74, routes: { BEG: seasonal(AS) } },
  { code: 'CDG', city: 'Paris', airport: 'Charles de Gaulle', country: 'France', lat: 49.01, lon: 2.55, routes: { BEG: scheduled(AS, 'easyJet') } },
  { code: 'BVA', city: 'Paris', airport: 'Beauvais', country: 'France', lat: 49.45, lon: 2.11, routes: { BEG: scheduled(W6) } },
  { code: 'TGD', city: 'Podgorica', country: 'Montenegro', lat: 42.36, lon: 19.25, routes: { BEG: scheduled('Air Montenegro', AS) } },
  { code: 'OPO', city: 'Porto', country: 'Portugal', lat: 41.24, lon: -8.68, routes: { BEG: seasonal(AS) } },
  { code: 'PRG', city: 'Prague', country: 'Czechia', lat: 50.1, lon: 14.26, routes: { BEG: scheduled(AS) } },
  { code: 'PVK', city: 'Preveza/Lefkada', country: 'Greece', lat: 38.93, lon: 20.77, routes: { BEG: charter(AS) } },
  { code: 'PUY', city: 'Pula', country: 'Croatia', lat: 44.89, lon: 13.92, routes: { BEG: seasonal(AS) } },
  { code: 'RHO', city: 'Rhodes', country: 'Greece', lat: 36.41, lon: 28.09, routes: { BEG: seasonal(AS, 'Sky Express') } },
  { code: 'RIX', city: 'Riga', country: 'Latvia', lat: 56.92, lon: 23.97, routes: { BEG: seasonal('airBaltic') } },
  { code: 'RJK', city: 'Rijeka', country: 'Croatia', lat: 45.22, lon: 14.57, routes: { BEG: seasonal(AS) } },
  { code: 'FCO', city: 'Rome', airport: 'Fiumicino', country: 'Italy', lat: 41.8, lon: 12.25, routes: { BEG: scheduled(AS, W6) } },
  { code: 'LED', city: 'Saint Petersburg', airport: 'Pulkovo', country: 'Russia', lat: 59.8, lon: 30.26, routes: { BEG: scheduled(AS) } },
  { code: 'SZG', city: 'Salzburg', country: 'Austria', lat: 47.79, lon: 13.0, routes: { BEG: scheduled(AS) } },
  { code: 'JTR', city: 'Santorini', country: 'Greece', lat: 36.4, lon: 25.48, routes: { BEG: seasonal(AS) } },
  { code: 'SJJ', city: 'Sarajevo', country: 'Bosnia and Herzegovina', lat: 43.82, lon: 18.33, routes: { BEG: scheduled(AS) } },
  { code: 'SVQ', city: 'Seville', country: 'Spain', lat: 37.42, lon: -5.89, routes: { BEG: scheduled(AS) } },
  { code: 'PVG', city: 'Shanghai', airport: 'Pudong', country: 'China', lat: 31.14, lon: 121.81, routes: { BEG: scheduled(AS) } },
  { code: 'SSH', city: 'Sharm El Sheikh', country: 'Egypt', lat: 27.98, lon: 34.39, routes: { BEG: charter(AS) } },
  { code: 'JSI', city: 'Skiathos', country: 'Greece', lat: 39.18, lon: 23.5, routes: { BEG: charter(AS) } },
  { code: 'SKP', city: 'Skopje', country: 'North Macedonia', lat: 41.96, lon: 21.62, routes: { BEG: scheduled(AS) } },
  { code: 'AER', city: 'Sochi', country: 'Russia', lat: 43.45, lon: 39.96, routes: { BEG: scheduled(AS) } },
  { code: 'SOF', city: 'Sofia', country: 'Bulgaria', lat: 42.7, lon: 23.41, routes: { BEG: scheduled(AS) } },
  { code: 'SPU', city: 'Split', country: 'Croatia', lat: 43.54, lon: 16.3, routes: { BEG: scheduled(AS) } },
  { code: 'ARN', city: 'Stockholm', airport: 'Arlanda', country: 'Sweden', lat: 59.65, lon: 17.92, routes: { BEG: scheduled(AS) } },
  { code: 'NYO', city: 'Stockholm', airport: 'Skavsta', country: 'Sweden', lat: 58.79, lon: 16.91, routes: { BEG: scheduled(W6) } },
  { code: 'STR', city: 'Stuttgart', country: 'Germany', lat: 48.69, lon: 9.22, routes: { BEG: scheduled(AS) } },
  { code: 'TBS', city: 'Tbilisi', country: 'Georgia', lat: 41.67, lon: 44.95, routes: { BEG: scheduled(AS) } },
  { code: 'TLV', city: 'Tel Aviv', airport: 'Ben Gurion', country: 'Israel', lat: 32.01, lon: 34.89, routes: { BEG: scheduled('Arkia', 'Sundor') } },
  { code: 'TFS', city: 'Tenerife', airport: 'Tenerife South', country: 'Spain', lat: 28.04, lon: -16.57, routes: { BEG: scheduled(AS) } },
  { code: 'SKG', city: 'Thessaloniki', country: 'Greece', lat: 40.52, lon: 22.97, routes: { BEG: scheduled(AS), KVO: seasonal(AS) } },
  { code: 'TIA', city: 'Tirana', country: 'Albania', lat: 41.41, lon: 19.72, routes: { BEG: scheduled(AS) } },
  { code: 'TIV', city: 'Tivat', country: 'Montenegro', lat: 42.4, lon: 18.72, routes: { BEG: scheduled('Air Montenegro', AS), INI: seasonal(AS), KVO: seasonal(AS) } },
  { code: 'YYZ', city: 'Toronto', airport: 'Pearson', country: 'Canada', lat: 43.68, lon: -79.63, routes: { BEG: seasonal(AS) } },
  { code: 'TOS', city: 'Tromsø', country: 'Norway', lat: 69.68, lon: 18.92, routes: { BEG: upcoming('From 14 December 2026', AS) } },
  { code: 'VLC', city: 'Valencia', country: 'Spain', lat: 39.49, lon: -0.48, routes: { BEG: scheduled(AS) } },
  { code: 'VAR', city: 'Varna', country: 'Bulgaria', lat: 43.23, lon: 27.83, routes: { BEG: seasonal(AS) } },
  { code: 'VCE', city: 'Venice', country: 'Italy', lat: 45.51, lon: 12.35, routes: { BEG: scheduled(AS) } },
  { code: 'VIE', city: 'Vienna', country: 'Austria', lat: 48.11, lon: 16.57, routes: { BEG: scheduled(AS, 'Austrian Airlines'), INI: scheduled(AS) } },
  { code: 'WAW', city: 'Warsaw', airport: 'Chopin', country: 'Poland', lat: 52.17, lon: 20.97, routes: { BEG: scheduled('LOT Polish Airlines') } },
  { code: 'EVN', city: 'Yerevan', country: 'Armenia', lat: 40.15, lon: 44.4, routes: { BEG: upcoming('FlyOne from 15 December 2026, Air Serbia from 28 March 2027', 'FlyOne', AS) } },
  { code: 'ZAD', city: 'Zadar', country: 'Croatia', lat: 44.11, lon: 15.35, routes: { BEG: seasonal(AS) } },
  { code: 'ZAG', city: 'Zagreb', country: 'Croatia', lat: 45.74, lon: 16.07, routes: { BEG: scheduled(AS) } },
  { code: 'ZTH', city: 'Zakynthos', country: 'Greece', lat: 37.75, lon: 20.88, routes: { BEG: charter(AS) } },
  { code: 'ZRH', city: 'Zürich', country: 'Switzerland', lat: 47.46, lon: 8.55, routes: { BEG: scheduled(AS, 'Swiss'), INI: seasonal('Swiss') } },
]

export const routes: Route[] = destinations.flatMap((destination) =>
  (Object.keys(destination.routes) as OriginCode[]).map((origin) => ({
    ...(destination.routes[origin] as RouteInfo),
    id: `${origin}-${destination.code}`,
    origin,
    destination,
  })),
)

const EARTH_RADIUS_KM = 6371

/** Great-circle distance in kilometres. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = Math.PI / 180
  const dLat = (bLat - aLat) * toRad
  const dLon = (bLon - aLon) * toRad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * toRad) * Math.cos(bLat * toRad) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/** A rough flying time from distance, for orientation only: not a timetable figure. */
export function estimateFlightMinutes(km: number): number {
  return Math.round((km / 820) * 60 + 30)
}
