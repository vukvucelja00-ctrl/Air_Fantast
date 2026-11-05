import { destinations } from './routes'

export type Airport = {
  code: string
  city: string
  name: string
  country: string
  /** Other names people search by, such as local spellings. */
  aliases?: string[]
}

const listed: Airport[] = [
  { code: 'BEG', city: 'Belgrade', name: 'Nikola Tesla', country: 'Serbia', aliases: ['Beograd', 'Novi Sad'] },
  { code: 'INI', city: 'Niš', name: 'Constantine the Great', country: 'Serbia' },
  { code: 'TGD', city: 'Podgorica', name: 'Podgorica', country: 'Montenegro' },
  { code: 'TIV', city: 'Tivat', name: 'Tivat', country: 'Montenegro' },
  { code: 'SJJ', city: 'Sarajevo', name: 'Sarajevo International', country: 'Bosnia and Herzegovina' },
  { code: 'ZAG', city: 'Zagreb', name: 'Franjo Tuđman', country: 'Croatia' },
  { code: 'SKP', city: 'Skopje', name: 'Skopje International', country: 'North Macedonia' },
  { code: 'TIA', city: 'Tirana', name: 'Nënë Tereza', country: 'Albania' },
  { code: 'SOF', city: 'Sofia', name: 'Sofia', country: 'Bulgaria' },
  { code: 'OTP', city: 'Bucharest', name: 'Henri Coandă', country: 'Romania', aliases: ['Bukurešt'] },
  { code: 'TSR', city: 'Timișoara', name: 'Traian Vuia', country: 'Romania', aliases: ['Temišvar'] },
  { code: 'BUD', city: 'Budapest', name: 'Ferenc Liszt', country: 'Hungary', aliases: ['Budimpešta'] },
  { code: 'VIE', city: 'Vienna', name: 'Vienna International', country: 'Austria', aliases: ['Beč', 'Wien'] },
  { code: 'IST', city: 'Istanbul', name: 'Istanbul Airport', country: 'Türkiye', aliases: ['Turkey'] },
  { code: 'SAW', city: 'Istanbul', name: 'Sabiha Gökçen', country: 'Türkiye', aliases: ['Turkey'] },
  { code: 'ATH', city: 'Athens', name: 'Eleftherios Venizelos', country: 'Greece', aliases: ['Atina'] },
  { code: 'SKG', city: 'Thessaloniki', name: 'Makedonia', country: 'Greece', aliases: ['Solun'] },
  { code: 'FCO', city: 'Rome', name: 'Fiumicino', country: 'Italy', aliases: ['Rim', 'Roma'] },
  { code: 'MXP', city: 'Milan', name: 'Malpensa', country: 'Italy', aliases: ['Milano'] },
  { code: 'VCE', city: 'Venice', name: 'Marco Polo', country: 'Italy', aliases: ['Venecija', 'Venezia'] },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle', country: 'France', aliases: ['Pariz'] },
  { code: 'ORY', city: 'Paris', name: 'Orly', country: 'France', aliases: ['Pariz'] },
  { code: 'LHR', city: 'London', name: 'Heathrow', country: 'United Kingdom', aliases: ['UK', 'England'] },
  { code: 'LGW', city: 'London', name: 'Gatwick', country: 'United Kingdom', aliases: ['UK', 'England'] },
  { code: 'STN', city: 'London', name: 'Stansted', country: 'United Kingdom', aliases: ['UK', 'England'] },
  { code: 'AMS', city: 'Amsterdam', name: 'Schiphol', country: 'Netherlands' },
  { code: 'BRU', city: 'Brussels', name: 'Brussels Airport', country: 'Belgium', aliases: ['Brisel'] },
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt am Main', country: 'Germany', aliases: ['Nemačka'] },
  { code: 'MUC', city: 'Munich', name: 'Franz Josef Strauss', country: 'Germany', aliases: ['Minhen', 'München', 'Nemačka'] },
  { code: 'BER', city: 'Berlin', name: 'Brandenburg', country: 'Germany', aliases: ['Nemačka'] },
  { code: 'DUS', city: 'Düsseldorf', name: 'Düsseldorf', country: 'Germany', aliases: ['Diseldorf', 'Nemačka'] },
  { code: 'HAM', city: 'Hamburg', name: 'Hamburg', country: 'Germany', aliases: ['Nemačka'] },
  { code: 'STR', city: 'Stuttgart', name: 'Stuttgart', country: 'Germany', aliases: ['Štutgart', 'Nemačka'] },
  { code: 'ZRH', city: 'Zurich', name: 'Zurich Airport', country: 'Switzerland', aliases: ['Cirih', 'Švajcarska'] },
  { code: 'GVA', city: 'Geneva', name: 'Geneva Airport', country: 'Switzerland', aliases: ['Ženeva', 'Švajcarska'] },
  { code: 'BCN', city: 'Barcelona', name: 'El Prat', country: 'Spain', aliases: ['Španija'] },
  { code: 'MAD', city: 'Madrid', name: 'Barajas', country: 'Spain', aliases: ['Španija'] },
  { code: 'LIS', city: 'Lisbon', name: 'Humberto Delgado', country: 'Portugal', aliases: ['Lisabon'] },
  { code: 'CPH', city: 'Copenhagen', name: 'Kastrup', country: 'Denmark', aliases: ['Kopenhagen'] },
  { code: 'ARN', city: 'Stockholm', name: 'Arlanda', country: 'Sweden', aliases: ['Štokholm', 'Švedska'] },
  { code: 'OSL', city: 'Oslo', name: 'Gardermoen', country: 'Norway' },
  { code: 'HEL', city: 'Helsinki', name: 'Vantaa', country: 'Finland' },
  { code: 'WAW', city: 'Warsaw', name: 'Chopin', country: 'Poland', aliases: ['Varšava'] },
  { code: 'PRG', city: 'Prague', name: 'Václav Havel', country: 'Czechia', aliases: ['Prag', 'Praha'] },
  { code: 'DUB', city: 'Dublin', name: 'Dublin Airport', country: 'Ireland' },
  { code: 'LCA', city: 'Larnaca', name: 'Larnaca International', country: 'Cyprus', aliases: ['Larnaka', 'Kipar'] },
  { code: 'MLA', city: 'Malta', name: 'Malta International', country: 'Malta' },
  { code: 'DXB', city: 'Dubai', name: 'Dubai International', country: 'United Arab Emirates', aliases: ['UAE', 'Dubaji'] },
  { code: 'AUH', city: 'Abu Dhabi', name: 'Zayed International', country: 'United Arab Emirates', aliases: ['UAE'] },
  { code: 'DOH', city: 'Doha', name: 'Hamad International', country: 'Qatar', aliases: ['Katar'] },
  { code: 'CAI', city: 'Cairo', name: 'Cairo International', country: 'Egypt', aliases: ['Kairo', 'Egipat'] },
  { code: 'HRG', city: 'Hurghada', name: 'Hurghada International', country: 'Egypt', aliases: ['Hurgada', 'Egipat'] },
  { code: 'SSH', city: 'Sharm El Sheikh', name: 'Sharm El Sheikh International', country: 'Egypt', aliases: ['Šarm el Šeik', 'Egipat'] },
  { code: 'TLV', city: 'Tel Aviv', name: 'Ben Gurion', country: 'Israel' },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy', country: 'United States', aliases: ['USA', 'Njujork', 'Amerika'] },
  { code: 'EWR', city: 'New York', name: 'Newark Liberty', country: 'United States', aliases: ['USA', 'Njujork', 'Amerika'] },
  { code: 'ORD', city: 'Chicago', name: "O'Hare", country: 'United States', aliases: ['USA', 'Čikago', 'Amerika'] },
  { code: 'MIA', city: 'Miami', name: 'Miami International', country: 'United States', aliases: ['USA', 'Majami', 'Amerika'] },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles International', country: 'United States', aliases: ['USA', 'Amerika'] },
  { code: 'YYZ', city: 'Toronto', name: 'Pearson', country: 'Canada', aliases: ['Kanada'] },
  { code: 'CUN', city: 'Cancún', name: 'Cancún International', country: 'Mexico', aliases: ['Kankun', 'Meksiko'] },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi', country: 'Thailand', aliases: ['Tajland'] },
  { code: 'HKT', city: 'Phuket', name: 'Phuket International', country: 'Thailand', aliases: ['Puket', 'Tajland'] },
  { code: 'SIN', city: 'Singapore', name: 'Changi', country: 'Singapore', aliases: ['Singapur'] },
  { code: 'MLE', city: 'Malé', name: 'Velana International', country: 'Maldives', aliases: ['Maldivi'] },
  { code: 'DPS', city: 'Bali', name: 'Ngurah Rai', country: 'Indonesia', aliases: ['Denpasar'] },
  { code: 'NRT', city: 'Tokyo', name: 'Narita', country: 'Japan', aliases: ['Tokio', 'Japan'] },
  { code: 'HND', city: 'Tokyo', name: 'Haneda', country: 'Japan', aliases: ['Tokio', 'Japan'] },
  { code: 'SYD', city: 'Sydney', name: 'Kingsford Smith', country: 'Australia', aliases: ['Sidnej', 'Australija'] },
]

/** The curated list, plus every airport with a direct route from Serbia. */
export const airports: Airport[] = [
  ...listed,
  { code: 'KVO', city: 'Kraljevo', name: 'Morava', country: 'Serbia' },
  ...destinations
    .filter(({ code }) => !listed.some((airport) => airport.code === code))
    .map(({ code, city, airport, country }) => ({ code, city, country, name: airport ?? city })),
]

/** Shown, in this order, before the traveller has typed anything. */
const POPULAR = ['BEG', 'VIE', 'IST', 'CDG', 'LHR', 'FRA', 'DXB', 'ATH', 'FCO', 'BCN']

/** Lower case with accents removed, so "Beč" matches "bec" and "Niš" matches "nis". */
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

function score(airport: Airport, query: string): number {
  const code = normalize(airport.code)
  const city = normalize(airport.city)
  const aliases = (airport.aliases ?? []).map(normalize)
  const country = normalize(airport.country)
  const name = normalize(airport.name)
  if (code === query) return 6
  if (city.startsWith(query)) return 5
  if (aliases.some((alias) => alias.startsWith(query))) return 4
  if (code.startsWith(query)) return 3
  if (country.startsWith(query)) return 2
  if (city.includes(query) || name.includes(query) || aliases.some((alias) => alias.includes(query))) return 1
  return 0
}

/** Matching airports, best first; with no query, the popular ones. */
export function searchAirports(query: string, excludeCode?: string, limit = 7): Airport[] {
  const q = normalize(query)
  const pool = airports.filter((airport) => airport.code !== excludeCode)
  if (!q) {
    return POPULAR.flatMap((code) => pool.filter((airport) => airport.code === code)).slice(0, limit)
  }
  return pool
    .map((airport) => ({ airport, rank: score(airport, q) }))
    .filter(({ rank }) => rank > 0)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map(({ airport }) => airport)
}
