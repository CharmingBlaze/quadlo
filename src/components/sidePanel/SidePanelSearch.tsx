import { useEffect, useMemo, useRef, useState } from 'react'
import { SectionIcon } from './SectionIcon'
import {
  searchSidePanel,
  sectionBreadcrumb,
  type SidePanelSectionMeta,
} from './sidePanelCatalog'

/**
 * Type-to-find over the panel's table of contents.
 *
 * The panel holds well over a hundred controls across four tabs, so the honest
 * answer to "where is bevel?" used to be "open every accordion and look". This
 * turns that into one keystroke: results name the section and the trail to it,
 * and choosing one navigates there and flashes the section.
 */
export function SidePanelSearch({
  onJump,
}: {
  onJump: (section: SidePanelSectionMeta) => void
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const hits = useMemo(() => searchSidePanel(query), [query])
  const open = hits.length > 0

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Ctrl/Cmd+F focuses the panel search rather than the browser's find bar,
  // which is useless here.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'f' || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      e.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const jump = (section: SidePanelSectionMeta) => {
    onJump(section)
    setQuery('')
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      if (query) {
        setQuery('')
      } else {
        inputRef.current?.blur()
      }
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + hits.length) % hits.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const hit = hits[activeIndex] ?? hits[0]
      if (hit) jump(hit.section)
    }
  }

  return (
    <div className={`side-search${open ? ' side-search-open' : ''}`}>
      <div className="side-search-field">
        <svg className="side-search-icon" viewBox="0 0 16 16" aria-hidden focusable="false">
          <circle cx="7" cy="7" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="m10.4 10.4 3.1 3.1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          type="search"
          className="side-search-input"
          value={query}
          placeholder="Find a tool…"
          aria-label="Find a tool or setting"
          title="Find a tool or setting (Ctrl+F)"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            className="side-search-clear"
            title="Clear search (Esc)"
            aria-label="Clear search"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <ul className="side-search-results" role="listbox" aria-label="Search results">
          {hits.map((hit, i) => (
            <li key={hit.section.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                className={`side-search-result${i === activeIndex ? ' active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => jump(hit.section)}
              >
                <SectionIcon icon={hit.section.icon} />
                <span className="side-search-result-text">
                  <span className="side-search-result-title">
                    {hit.section.title}
                    {hit.matchedTerm && (
                      <em className="side-search-result-term">{hit.matchedTerm}</em>
                    )}
                  </span>
                  <span className="side-search-result-path">
                    {sectionBreadcrumb(hit.section)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
