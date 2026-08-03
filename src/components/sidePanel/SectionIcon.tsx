import type { ReactElement } from 'react'
import type { SectionIconId } from './sidePanelCatalog'

/**
 * Line icons for side panel section headers. Drawn on a 16×16 grid with a
 * 1.5px stroke so they stay legible at the smallest panel density and read as
 * a set rather than a grab-bag.
 */
const PATHS: Record<SectionIconId, ReactElement> = {
  shapes: (
    <>
      <rect x="2" y="8" width="6" height="6" rx="1" />
      <circle cx="11" cy="11" r="3" />
      <path d="M8 2 L11.5 6.5 H4.5 Z" />
    </>
  ),
  stroke: <path d="M2 11c2.5 0 3-6 5.5-6S10 12 12.5 12c1 0 1.5-.6 1.5-.6" />,
  mesh: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" />
      <path d="M8 2.5v11M2.5 8h11" />
    </>
  ),
  options: (
    <>
      <path d="M2.5 4.5h11M2.5 11.5h11" />
      <circle cx="6" cy="4.5" r="1.8" />
      <circle cx="10" cy="11.5" r="1.8" />
    </>
  ),
  tool: (
    <path d="M10.6 2.4a3.4 3.4 0 0 0-4.3 4.3l-4 4a1.3 1.3 0 0 0 1.9 1.9l4-4a3.4 3.4 0 0 0 4.3-4.3L10.4 6.3 9.1 5l1.5-2.6Z" />
  ),
  select: (
    <>
      <path d="M3 3l4.2 10 1.6-3.9L12.7 7.6Z" />
      <path d="M9.2 9.2 13 13" />
    </>
  ),
  transform: (
    <>
      <path d="M8 1.8v12.4M1.8 8h12.4" />
      <path d="M8 1.8 6.2 3.8M8 1.8l1.8 2M8 14.2l-1.8-2M8 14.2l1.8-2M1.8 8l2-1.8M1.8 8l2 1.8M14.2 8l-2-1.8M14.2 8l-2 1.8" />
    </>
  ),
  gizmo: (
    <>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 2v3M8 11v3M2 8h3M11 8h3" />
    </>
  ),
  symmetry: (
    <>
      <path d="M8 1.5v13" strokeDasharray="2 2" />
      <path d="M6 4 2.5 8 6 12ZM10 4l3.5 4L10 12Z" />
    </>
  ),
  geometry: (
    <>
      <path d="M8 2.2 13.5 12H2.5Z" />
      <circle cx="8" cy="2.2" r="1" />
      <circle cx="13.5" cy="12" r="1" />
      <circle cx="2.5" cy="12" r="1" />
    </>
  ),
  topology: (
    <>
      <path d="M2.5 5.5h11M2.5 10.5h11" />
      <path d="M5.5 2.5v11" strokeDasharray="2 1.5" />
      <path d="M10.5 2.5v11" strokeDasharray="2 1.5" />
    </>
  ),
  object: (
    <>
      <path d="M8 2 13.5 5v6L8 14 2.5 11V5Z" />
      <path d="M2.5 5 8 8l5.5-3M8 8v6" />
    </>
  ),
  appearance: (
    <>
      <path d="M8 2a6 6 0 1 0 0 12c1 0 1.5-.6 1.5-1.3 0-.8-.7-1.1-.7-1.8 0-.6.5-1 1.1-1H11a3 3 0 0 0 3-3c0-2.7-2.7-4.9-6-4.9Z" />
      <circle cx="5.6" cy="7" r=".9" fill="currentColor" stroke="none" />
      <circle cx="9" cy="5.2" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  display: (
    <>
      <circle cx="8" cy="8" r="2.4" />
      <path d="M1.6 8S3.9 3.6 8 3.6 14.4 8 14.4 8 12.1 12.4 8 12.4 1.6 8 1.6 8Z" />
    </>
  ),
  image: (
    <>
      <rect x="2.2" y="3.2" width="11.6" height="9.6" rx="1.2" />
      <circle cx="5.8" cy="6.4" r="1.1" />
      <path d="m2.6 11.4 3.2-3 2.4 2.2 2.3-2.2 3 2.8" />
    </>
  ),
  workspace: (
    <>
      <rect x="1.8" y="2.8" width="12.4" height="10.4" rx="1.2" />
      <path d="M10.2 2.8v10.4M1.8 6h8.4" />
    </>
  ),
  theme: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 2a6 6 0 0 1 0 12Z" fill="currentColor" stroke="none" />
    </>
  ),
}

export function SectionIcon({ icon }: { icon: SectionIconId }) {
  return (
    <svg
      className="side-section-icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
    >
      {PATHS[icon]}
    </svg>
  )
}
