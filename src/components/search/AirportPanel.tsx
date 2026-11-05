import { Search } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { searchAirports, type Airport } from '../../lib/airports'
import { Panel } from './Panel'

export function AirportPanel({
  title,
  excludeCode,
  isSheet,
  up,
  onSelect,
  onClose,
}: {
  title: string
  excludeCode?: string
  isSheet: boolean
  up: boolean
  onSelect: (airport: Airport) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()
  const results = searchAirports(query, excludeCode)

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault()
      setActive((active + 1) % results.length)
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault()
      setActive((active - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (results[active]) onSelect(results[active])
    }
  }

  return (
    <Panel title={title} variant="airport" isSheet={isSheet} up={up} onClose={onClose}>
      <div className="fs-airport-search">
        <Search size={17} aria-hidden="true" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `${listId}-${results[active].code}` : undefined}
          aria-label="City or airport"
          placeholder="City or airport"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      <p className="fs-airport-hint">{query.trim() ? 'Results' : 'Popular'}</p>

      <ul id={listId} role="listbox" aria-label="Airports" className="fs-airport-list">
        {results.map((airport, index) => (
          <li
            key={airport.code}
            id={`${listId}-${airport.code}`}
            role="option"
            aria-selected={index === active}
            className={`fs-airport${index === active ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(index)}
            onClick={() => onSelect(airport)}
          >
            <span className="fs-airport-code">{airport.code}</span>
            <span className="fs-airport-text">
              <span className="fs-airport-city">{airport.city}</span>
              <span className="fs-airport-name">
                {airport.name}, {airport.country}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {results.length === 0 && <p className="fs-airport-empty">No airports match “{query.trim()}”.</p>}
    </Panel>
  )
}
