import al from 'flag-icons/flags/4x3/al.svg'
import at from 'flag-icons/flags/4x3/at.svg'
import ba from 'flag-icons/flags/4x3/ba.svg'
import bg from 'flag-icons/flags/4x3/bg.svg'
import cz from 'flag-icons/flags/4x3/cz.svg'
import es from 'flag-icons/flags/4x3/es.svg'
import gr from 'flag-icons/flags/4x3/gr.svg'
import hr from 'flag-icons/flags/4x3/hr.svg'
import me from 'flag-icons/flags/4x3/me.svg'
import mk from 'flag-icons/flags/4x3/mk.svg'
import ro from 'flag-icons/flags/4x3/ro.svg'
import si from 'flag-icons/flags/4x3/si.svg'
// Shown in the header on every visit, and its detailed coat of arms is 180 KB as an SVG.
import rs from '../assets/flags/rs.webp'

export type Country = {
  code: string
  name: string
  flag: string
  /** The Air Fantast site for this country. While null, the picker points to the main site. */
  url: string | null
}

export const MAIN_SITE = 'https://airfantast.com'

/**
 * To add a country: import its flag above (flags are named by ISO code) and add a row here.
 * The first row is the default selection; the rest are alphabetical.
 */
export const countries: Country[] = [
  { code: 'rs', name: 'Serbia', flag: rs, url: MAIN_SITE },
  { code: 'al', name: 'Albania', flag: al, url: null },
  { code: 'at', name: 'Austria', flag: at, url: null },
  { code: 'ba', name: 'Bosnia and Herzegovina', flag: ba, url: null },
  { code: 'bg', name: 'Bulgaria', flag: bg, url: null },
  { code: 'hr', name: 'Croatia', flag: hr, url: null },
  { code: 'cz', name: 'Czechia', flag: cz, url: null },
  { code: 'gr', name: 'Greece', flag: gr, url: null },
  { code: 'me', name: 'Montenegro', flag: me, url: null },
  { code: 'mk', name: 'North Macedonia', flag: mk, url: null },
  { code: 'ro', name: 'Romania', flag: ro, url: null },
  { code: 'si', name: 'Slovenia', flag: si, url: null },
  { code: 'es', name: 'Spain', flag: es, url: null },
]

/** The address without its protocol, for showing on screen. */
export const siteLabel = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')
