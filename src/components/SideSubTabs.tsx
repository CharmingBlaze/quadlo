import type { ReactNode } from 'react'

export type SideSubTabItem<T extends string> = {
  id: T
  label: string
  title?: string
}

type SideSubTabsProps<T extends string> = {
  tabs: SideSubTabItem<T>[]
  value: T
  onChange: (id: T) => void
  ariaLabel: string
  /** Optional content rendered beside the tab bar (e.g. a count badge). */
  trailing?: ReactNode
}

export function SideSubTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
  trailing,
}: SideSubTabsProps<T>) {
  return (
    <div className="side-sub-tabs-bar">
      <div className="side-sub-tabs" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={value === tab.id}
            className={`side-sub-tab${value === tab.id ? ' active' : ''}`}
            title={tab.title ?? tab.label}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {trailing}
    </div>
  )
}
