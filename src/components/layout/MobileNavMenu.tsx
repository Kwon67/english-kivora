'use client'

import Link from 'next/link'
import { m, type Variants } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { LogOut, Settings2 } from 'lucide-react'
import { logoutAction } from '@/app/actions'
import { Dialog, DialogContent, DialogTitle } from '@/components/shadcn/dialog'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'
import { homeCardClass, homeIconBox, homeSmallPillClass } from '@/lib/homeStyles'
import { landingRadius, landingRadiusLg } from '@/lib/landingStyles'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

type NavLinkItem = {
  href: string
  label: string
  icon: LucideIcon
  match?: string
  exact?: boolean
}

type MobileNavMenuProps = {
  open: boolean
  onClose: () => void
  username: string
  isAdmin: boolean
  groups: { title: string; links: NavLinkItem[] }[]
  adminLinks: NavLinkItem[]
  isActive: (href: string, match?: string, exact?: boolean) => boolean
  warmRoute: (href: string) => void
  /**
   * The hamburger that opens this menu. Radix hands focus back to its own
   * DialogTrigger on close, and this menu is driven by `open` instead of one,
   * so without this the focus would land on <body> and a keyboard user would
   * restart their tab journey at the top of the page.
   */
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const accentSquare =
  'inline-block h-2.5 w-2.5 shrink-0 rounded-[2px] border border-brand-dark bg-brand-accent'
const connectorLine = 'section-badge-line inline-block h-px shrink-0 bg-brand-dark/60'

/**
 * Overrides Dialog's centred placement, anchoring the panel under the topbar instead.
 * Radix owns the hard parts now — portal, focus containment, Escape, body scroll lock,
 * focus restore — so the panel only has to describe where it sits and how it looks.
 * `origin-top-right` keeps the zoom-in reading as "grew out of the hamburger".
 */
const mobileMenuPanel = [
  'no-scrollbar top-[var(--app-topbar-height)] right-3 left-3 translate-x-0 translate-y-0',
  'w-auto max-w-none sm:max-w-none',
  'max-h-[calc(100dvh-var(--app-topbar-height)-1rem)] overflow-y-auto overscroll-contain overflow-x-hidden',
  'home-frosted-surface home-frosted-surface-soft block origin-top-right rounded-container border p-3',
  'text-brand-dark ring-0',
  'data-open:slide-in-from-top-2',
].join(' ')
// Linha de lista, não card em grade: o olho percorre uma coluna só, em vez de pular entre duas.
// Atenção ao contrapeso — 8 linhas empilhadas são MAIS altas que 4 fileiras de duas colunas, então
// a linha foi enxugada (ícone 32px, py-2) e o cabeçalho perdeu peso, para o menu caber sem rolar.
const mobileMenuItem = `${landingRadiusLg} relative flex w-full items-center gap-3 border border-brand-dark px-3 py-2 font-heading text-sm font-bold`
const logoutButtonClass = `${landingRadius} inline-flex h-10 w-10 items-center justify-center border border-brand-dark bg-bg-card text-brand-dark shadow-offset-sm transition-[transform,box-shadow,background-color] duration-200 hover:bg-brand-accent hover:shadow-offset-accent active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`

/* The overlay and the panel's own entrance are Radix's job now (data-open/data-closed
   animation classes). What stays in Motion is the part Radix has no opinion about:
   the staggered reveal of the blocks and rows inside the panel. */
const contentVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
}

const blockVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
}

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
}

function mergeSingleItemGroups(groups: { title: string; links: NavLinkItem[] }[]) {
  const merged: { title: string; links: NavLinkItem[] }[] = []
  const strayLinks: NavLinkItem[] = []

  for (const group of groups) {
    if (group.links.length === 1) {
      strayLinks.push(group.links[0])
    } else {
      merged.push(group)
    }
  }

  if (strayLinks.length > 0) {
    merged.push({ title: 'Mais', links: strayLinks })
  }

  return merged
}

function SectionKicker({
  label,
  lineWidth = 'w-6',
  animate,
  delay = 0,
}: {
  label: string
  lineWidth?: string
  animate: boolean
  delay?: number
}) {
  const squareMotion = animate
    ? {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring' as const, stiffness: 520, damping: 24, delay },
      }
    : {}

  const lineMotion = animate
    ? {
        initial: { scaleX: 0, opacity: 0 },
        animate: { scaleX: 1, opacity: 1 },
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const, delay: delay + 0.06 },
      }
    : {}

  const pillMotion = animate
    ? {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const, delay: delay + 0.03 },
      }
    : {}

  return (
    <div className="flex w-fit items-center">
      <m.span className={accentSquare} aria-hidden="true" {...squareMotion} />
      <m.span
        className={`${connectorLine} ${lineWidth} origin-right`}
        aria-hidden="true"
        {...lineMotion}
      />
      <m.span className={homeSmallPillClass} {...pillMotion}>
        {label}
      </m.span>
    </div>
  )
}

function MenuNavLink({
  link,
  active,
  onClose,
  warmRoute,
  animate,
}: {
  link: NavLinkItem
  active: boolean
  onClose: () => void
  warmRoute: (href: string) => void
  animate: boolean
}) {
  const Icon = link.icon
  const motionProps = animate
    ? {
        variants: itemVariants,
        whileTap: { scale: 0.98 },
      }
    : {}

  const LinkWrapper = animate ? m.div : 'div'

  return (
    <LinkWrapper {...motionProps} className="min-w-0">
      <Link
        href={link.href}
        transitionTypes={link.href === '/home' ? navBackTransitionTypes : navForwardTransitionTypes}
        prefetch={false}
        scroll
        aria-current={active ? 'page' : undefined}
        aria-label={link.label}
        onClick={onClose}
        onMouseEnter={() => warmRoute(link.href)}
        onTouchStart={() => warmRoute(link.href)}
        className={`${mobileMenuItem} ${
          active
            ? 'bg-brand-accent text-brand-dark shadow-offset-sm'
            : 'bg-bg-card/55 text-brand-dark backdrop-blur-sm active:bg-bg-primary/75'
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-control border border-brand-dark p-1.5 ${
            active ? 'bg-bg-card text-brand-dark' : 'bg-brand-accent text-brand-dark'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        </div>
        <span className="min-w-0 flex-1 truncate leading-tight">{link.label}</span>
        {/* Centralizado à direita da linha; no layout de card antigo ele ficava no canto de cima. */}
        {active ? (
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-[2px] border border-brand-dark bg-brand-dark"
            aria-hidden="true"
          />
        ) : null}
      </Link>
    </LinkWrapper>
  )
}

export default function MobileNavMenu({
  open,
  onClose,
  username,
  isAdmin,
  groups,
  adminLinks,
  isActive,
  warmRoute,
  triggerRef,
}: MobileNavMenuProps) {
  const prefersReducedMotion = useHydratedReducedMotion()
  // O bloqueio por iOS saiu: ele nasceu junto com a animação, de forma preventiva, e não há
  // registro de bug que o justifique — o efeito era o iPhone, que é o alvo principal do site,
  // nunca ver animação nenhuma. O que resta anima só opacity/transform, que é o subconjunto
  // que o Safari do iOS compõe na GPU; nada aqui anima blur, sombra ou layout.
  const shouldAnimate = !prefersReducedMotion

  const LinkList = shouldAnimate ? m.div : 'div'
  const displayGroups = mergeSingleItemGroups(groups)

  const linkListMotion = shouldAnimate
    ? { variants: listVariants, initial: 'hidden', animate: 'visible' }
    : {}

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent
        showCloseButton={false}
        // The topbar's own hamburger doubles as the close button, so the panel does not
        // need a second X in its corner.
        className={`${mobileMenuPanel} lg:hidden`}
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          triggerRef.current?.focus()
        }}
      >
        {/* Radix requires a title for the dialog to be announced; the visible trigger
            already says "menu", so it is for screen readers only. */}
        <DialogTitle className="sr-only">Menu de navegação</DialogTitle>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand-accent/10 blur-3xl"
        />
        <m.div
          className="relative z-10"
          variants={shouldAnimate ? contentVariants : undefined}
          initial={shouldAnimate ? 'hidden' : false}
          animate={shouldAnimate ? 'visible' : 'visible'}
        >
              {/* O selo "Menu" saiu: rotular de "Menu" o painel que a pessoa acabou de abrir
                  pelo botão de menu não acrescenta nada e custava ~40px de altura. */}
              <m.div
                className={`${homeCardClass} home-frosted-subtle mb-3 px-3 py-2.5`}
                variants={shouldAnimate ? blockVariants : undefined}
              >
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href="/settings"
                    prefetch={false}
                    onClick={onClose}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <m.div
                      className={homeIconBox}
                      whileHover={shouldAnimate ? { rotate: -4, scale: 1.04 } : undefined}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                    >
                      <Settings2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                    </m.div>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-sm font-bold text-brand-dark">{username}</p>
                      <span className={`mt-1.5 inline-flex ${homeSmallPillClass}`}>
                        {isAdmin ? 'Administrador' : 'Conta'}
                      </span>
                    </div>
                  </Link>

                  <form action={logoutAction} className="inline-flex shrink-0">
                    <m.button
                      type="submit"
                      className={logoutButtonClass}
                      aria-label="Sair da sessão"
                      whileHover={shouldAnimate ? { y: -1, x: -1 } : undefined}
                      whileTap={shouldAnimate ? { x: 2, y: 2, boxShadow: '0 0 0 #1C1915' } : undefined}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    >
                      <LogOut className="h-4 w-4" strokeWidth={2} />
                    </m.button>
                  </form>
                </div>
              </m.div>

              <div className="flex flex-col gap-0.5">
                {displayGroups.map((group, groupIndex) => (
                  <m.div
                    key={group.title}
                    className={groupIndex > 0 ? 'mt-2.5 border-t border-brand-border pt-2.5' : ''}
                    variants={shouldAnimate ? blockVariants : undefined}
                  >
                    <div className="mb-1.5 px-1">
                      <SectionKicker
                        label={group.title}
                        lineWidth="w-5"
                        animate={shouldAnimate}
                        delay={0.08 + groupIndex * 0.05}
                      />
                    </div>
                    <LinkList className="flex flex-col gap-1.5" {...linkListMotion}>
                      {group.links.map((link) => (
                        <MenuNavLink
                          key={link.href}
                          link={link}
                          active={isActive(link.href, link.match, link.exact)}
                          onClose={onClose}
                          warmRoute={warmRoute}
                          animate={shouldAnimate}
                        />
                      ))}
                    </LinkList>
                  </m.div>
                ))}

                {isAdmin ? (
                  <m.div
                    className="mt-2.5 border-t border-brand-border pt-2.5"
                    variants={shouldAnimate ? blockVariants : undefined}
                  >
                    <div className="mb-1.5 px-1">
                      <SectionKicker
                        label="Admin"
                        lineWidth="w-5"
                        animate={shouldAnimate}
                        delay={0.08 + displayGroups.length * 0.05}
                      />
                    </div>
                    <LinkList className="flex flex-col gap-1.5" {...linkListMotion}>
                      {adminLinks.map((link) => (
                        <MenuNavLink
                          key={link.href}
                          link={link}
                          active={isActive(link.href, link.match, link.exact)}
                          onClose={onClose}
                          warmRoute={warmRoute}
                          animate={shouldAnimate}
                        />
                      ))}
                    </LinkList>
                  </m.div>
                ) : null}
              </div>
        </m.div>
      </DialogContent>
    </Dialog>
  )
}
