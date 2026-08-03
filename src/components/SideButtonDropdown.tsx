import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

const DROPDOWN_MENU_Z = 10050
/** Theme menu opens upward over the full panel stack (header, tabs, sections). */
const THEME_DROPDOWN_MENU_Z = 12001

export type SideButtonDropdownOption = {
  value: string
  label: string
  disabled?: boolean
  /** Optional section heading shown above this option when the group changes. */
  group?: string
}

interface SideButtonDropdownProps {
  label: string
  value?: string | null
  options: SideButtonDropdownOption[]
  onSelect: (value: string) => void
  title?: string
  disabled?: boolean
  active?: boolean
  /** Keep `label` visible when idle; show `label · option` when selected. */
  alwaysShowLabel?: boolean
  /** Optional content before the label (e.g. color swatch). */
  leading?: ReactNode
  footer?: ReactNode
  /** Extra class on the floating menu (e.g. scrollable theme list). */
  menuClassName?: string
  /** Extra class on the root wrapper. */
  className?: string
}

export function SideButtonDropdown({
  label,
  value = null,
  options,
  onSelect,
  title,
  disabled = false,
  active = false,
  alwaysShowLabel = false,
  leading,
  footer,
  menuClassName,
  className,
}: SideButtonDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const opensUp = menuClassName?.includes('side-theme-dropdown-menu') ?? false

  const selected = value ? options.find((opt) => opt.value === value) : undefined
  const triggerLabel = alwaysShowLabel
    ? selected
      ? `${label} · ${selected.label}`
      : label
    : (selected?.label ?? label)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const menuWidth = rect.width
      let left = rect.left
      if (left + menuWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - menuWidth - 8)
      }

      const menuZ = opensUp ? THEME_DROPDOWN_MENU_Z : DROPDOWN_MENU_Z

      if (opensUp) {
        const menuHeight = menuRef.current?.offsetHeight ?? options.length * 28 + 8
        setMenuStyle({
          position: 'fixed',
          left,
          width: menuWidth,
          top: Math.max(8, rect.top - menuHeight - 2),
          bottom: 'auto',
          zIndex: menuZ,
          maxHeight: 'min(320px, 50vh)',
        })
      } else {
        setMenuStyle({
          position: 'fixed',
          top: rect.bottom + 2,
          bottom: 'auto',
          left,
          width: menuWidth,
          zIndex: menuZ,
        })
      }
    }

    updatePosition()
    const raf = window.requestAnimationFrame(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, opensUp, options.length])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const enabledOptionIndices = () =>
    options.flatMap((option, index) => (option.disabled ? [] : [index]))

  const focusEnabledOption = (index: number) => {
    const enabled = enabledOptionIndices()
    if (enabled.length === 0) return
    const target = enabled[((index % enabled.length) + enabled.length) % enabled.length]!
    itemRefs.current[target]?.focus()
  }

  const openAndFocus = (index: number) => {
    setOpen(true)
    window.requestAnimationFrame(() => focusEnabledOption(index))
  }

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openAndFocus(0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openAndFocus(-1)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
    }
  }

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const currentIndex = itemRefs.current.findIndex((item) => item === document.activeElement)
    const enabledPosition = enabledOptionIndices().indexOf(currentIndex)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusEnabledOption(enabledPosition + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusEnabledOption(enabledPosition - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusEnabledOption(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusEnabledOption(-1)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  return (
    <div className={`side-button-dropdown${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`side-btn side-btn-wide side-btn-dropdown ${active || selected ? 'active' : ''}`}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        disabled={disabled}
        title={title}
        aria-expanded={open}
        aria-haspopup="menu"
        onKeyDown={handleTriggerKeyDown}
      >
        {leading}
        <span className="side-btn-dropdown-label">{triggerLabel}</span>
        <span className="side-btn-dropdown-chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={`side-button-dropdown-menu side-button-dropdown-menu-portal${menuClassName ? ` ${menuClassName}` : ''}`}
            style={menuStyle}
            role="menu"
            onKeyDown={handleMenuKeyDown}
          >
            {options.map((opt, index) => {
              const prevGroup = options[index - 1]?.group
              const showGroup = Boolean(opt.group && opt.group !== prevGroup)
              return (
                <Fragment key={opt.value}>
                  {showGroup && (
                    <div className="side-button-dropdown-group" role="presentation">
                      {opt.group}
                    </div>
                  )}
                  <button
                    type="button"
                    ref={(element) => {
                      itemRefs.current[index] = element
                    }}
                    role="menuitem"
                    className={`side-button-dropdown-item ${opt.value === value ? 'active' : ''}`}
                    disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return
                      onSelect(opt.value)
                      setOpen(false)
                    }}
                  >
                    {opt.label}
                  </button>
                </Fragment>
              )
            })}
          </div>,
          document.body
        )}
      {footer}
    </div>
  )
}
