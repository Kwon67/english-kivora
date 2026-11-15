'use client'

import {
  Activity,
  Children,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  GraduationCap,
  ListChecks,
  Medal,
  Mic,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'

const icons = {
  chart: BarChart3,
  book: BookOpen,
  calendar: CalendarDays,
  assign: ClipboardList,
  folder: FolderOpen,
  course: GraduationCap,
  list: ListChecks,
  medal: Medal,
  audio: Mic,
  settings: Settings2,
  shield: ShieldCheck,
  sparkles: Sparkles,
  target: Target,
  users: Users,
}
type SectionTab = {
  id: string
  label: string
  description: string
  icon: keyof typeof icons
  anchors?: string[]
}

/** Task-based panels. Activity preserves drafts while suspending hidden effects. */
export default function WorkspaceSections({
  label,
  tabs,
  children,
  defaultValue,
  value,
  onValueChange,
}: {
  label: string
  tabs: SectionTab[]
  children: ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}) {
  const uid = useId()
  const root = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState(defaultValue ?? tabs[0].id)
  const active = value ?? selected
  const panels = Children.toArray(children)
  const anchorConfig = JSON.stringify(
    tabs.map(({ id, anchors }) => ({ id, anchors })),
  )
  const onAnchorSelect = useEffectEvent((id: string) => onValueChange?.(id))

  function select(id: string) {
    setSelected(id)
    onValueChange?.(id)
  }

  useEffect(() => {
    let frame = 0
    const openAnchor = (hash: string) => {
      let anchor: string
      try {
        anchor = decodeURIComponent(hash.replace(/^#/, ''))
      } catch {
        return false
      }
      const anchors = JSON.parse(anchorConfig) as Pick<
        SectionTab,
        'id' | 'anchors'
      >[]
      const tab = anchors.find(
        (item) => item.id === anchor || item.anchors?.includes(anchor),
      )
      if (!tab) return false
      setSelected(tab.id)
      onAnchorSelect(tab.id)
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          ;(document.getElementById(anchor) ?? root.current)?.scrollIntoView({
            block: 'start',
            behavior: 'instant',
          })
        })
      })
      return true
    }
    const hashChange = () => openAnchor(window.location.hash)
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href]')
          : null
      if (!link || link.target || link.download) return
      const url = new URL(link.href)
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        url.search !== location.search ||
        !url.hash
      )
        return
      if (openAnchor(url.hash)) {
        event.preventDefault()
        history.replaceState(history.state, '', url.href)
      }
    }
    hashChange()
    window.addEventListener('hashchange', hashChange)
    document.addEventListener('click', click)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('hashchange', hashChange)
      document.removeEventListener('click', click)
    }
  }, [anchorConfig])

  return (
    <div ref={root} className="workspace-sections">
      <div
        className="workspace-section-tabs"
        role="tablist"
        aria-label={label}
        onKeyDown={(event) => {
          const current = tabs.findIndex((tab) => tab.id === active)
          const index =
            event.key === 'ArrowRight'
              ? (current + 1) % tabs.length
              : event.key === 'ArrowLeft'
                ? (current - 1 + tabs.length) % tabs.length
                : event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? tabs.length - 1
                    : -1
          if (index < 0) return
          event.preventDefault()
          select(tabs[index].id)
          root.current
            ?.querySelector<HTMLButtonElement>(`[data-tab-index="${index}"]`)
            ?.focus()
        }}
      >
        {tabs.map((tab, index) => {
          const Icon = icons[tab.icon]
          return (
            <button
              key={tab.id}
              id={`${uid}-tab-${tab.id}`}
              type="button"
              role="tab"
              data-tab-index={index}
              aria-selected={active === tab.id}
              aria-controls={`${uid}-panel-${tab.id}`}
              tabIndex={active === tab.id ? 0 : -1}
              onClick={() => select(tab.id)}
            >
              <Icon size={19} strokeWidth={1.7} aria-hidden />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
      {tabs.map((tab, index) => (
        <Activity key={tab.id} mode={active === tab.id ? 'visible' : 'hidden'}>
          <section
            id={`${uid}-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${tab.id}`}
            tabIndex={0}
            className="workspace-section-panel"
            data-workspace-panel={tab.id}
          >
            <p className="workspace-section-description">{tab.description}</p>
            {panels[index]}
          </section>
        </Activity>
      ))}
    </div>
  )
}
