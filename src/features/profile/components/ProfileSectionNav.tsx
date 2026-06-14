'use client'

import { useEffect, useState } from 'react'
import { Fingerprint, Lock, FolderOpen } from 'lucide-react'
import { glassPanel, profileSections, selectedPill } from '@/features/profile/lib/profileUi'

const sectionIcons: Record<string, typeof Fingerprint> = {
  identidade: Fingerprint,
  conta: Lock,
  packs: FolderOpen,
}

export default function ProfileSectionNav() {
  const [activeId, setActiveId] = useState<string>(profileSections[0].id)

  useEffect(() => {
    const sectionElements = profileSections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element))

    if (sectionElements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-12% 0px -60% 0px',
        threshold: [0.12, 0.3, 0.5],
      }
    )

    for (const element of sectionElements) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  function scrollToSection(id: string) {
    const element = document.getElementById(id)
    if (!element) return

    setActiveId(id)
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="mb-5 lg:sticky lg:top-[4.5rem] lg:z-30 lg:mb-6">
      <nav
        aria-label="Seções do perfil"
        className={`${glassPanel} p-1.5 sm:p-2`}
      >
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {profileSections.map((section) => {
            const isActive = activeId === section.id
            const Icon = sectionIcons[section.id] || Fingerprint

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[14px] px-3 py-2 text-[0.68rem] font-bold leading-tight transition-all sm:min-h-11 sm:px-4 sm:text-xs ${
                  isActive
                    ? `${selectedPill} shadow-[0_6px_16px_rgba(24,59,22,0.18)]`
                    : 'bg-transparent text-[#425039] hover:bg-[#eef3d6] dark:text-[#b9c3a4] dark:hover:bg-[#b8ff5c]/10'
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.2} />
                <span>{section.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}