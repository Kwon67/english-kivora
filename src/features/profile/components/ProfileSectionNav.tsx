'use client'

import { useEffect, useState } from 'react'
import { profileSections } from '@/features/profile/lib/profileUi'

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
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.1, 0.25, 0.5],
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
    <nav
      aria-label="Seções do perfil"
      className="sticky top-[calc(env(safe-area-inset-top)+4.25rem)] z-20 -mx-1 mb-2 bg-[#f4f5e8]/92 px-1 py-2 backdrop-blur-md dark:bg-[#050704]/92 lg:top-24"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {profileSections.map((section) => {
          const isActive = activeId === section.id

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                isActive
                  ? 'border-[#183b16] bg-[#183b16] text-[#f7f8ef] dark:border-[#b8ff5c] dark:bg-[#b8ff5c] dark:text-[#050704]'
                  : 'border-[#172113]/20 bg-[#eef3d6] text-[#425039] hover:bg-[#dfe9bd] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:text-[#b9c3a4] dark:hover:bg-[#b8ff5c]/12'
              }`}
            >
              {section.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}