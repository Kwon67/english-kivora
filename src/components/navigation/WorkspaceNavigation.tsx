'use client'

import { useActionState, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, LogOut, Menu, MoreHorizontal, ArrowLeftRight, UserRound } from 'lucide-react'
import { logoutAction } from '@/app/actions'
import BrandMark from '@/components/ui/BrandMark'
import WorkspaceLink from './WorkspaceLink'
import { learningNavigation, administrationNavigation, learningPrimary, adminPrimary, destinationIsActive, type WorkspaceDestination } from '@/lib/workspaceNavigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/shadcn/sheet'
import { trackUxEvent } from '@/lib/uxAnalytics'

export default function WorkspaceNavigation({ username, isAdmin, workspace = 'learning' }: {
  username: string
  isAdmin: boolean
  workspace?: 'learning' | 'admin'
}) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [logoutState, logoutFormAction, logoutPending] = useActionState(logoutAction, undefined)
  const drawerTrigger = useRef<HTMLButtonElement | null>(null)
  const admin = workspace === 'admin'
  const groups = admin ? administrationNavigation : learningNavigation
  const primary = admin ? adminPrimary : learningPrimary
  const overflow = groups.map(group => ({ ...group, items: group.items.filter(item => !primary.some(p => p.href === item.href)) })).filter(group => group.items.length)
  const moreActive = overflow.some(group => group.items.some(item => destinationIsActive(pathname, item)))
  const initials = username.trim().charAt(0).toUpperCase() || 'K'
  const navigate = (item: WorkspaceDestination) => {
    setDrawerOpen(false)
    trackUxEvent('nav_click', { href: item.href, label: item.label })
  }
  const switchHref = admin ? '/home' : '/admin/dashboard'
  const switchLabel = admin ? 'Espaço de aprendizado' : 'Administração'

  function destination(item: WorkspaceDestination, compact = false) {
    const Icon = item.icon
    return <WorkspaceLink href={item.href} className={compact ? 'workspace-dock-link' : 'workspace-navigation-link'} aria-current={destinationIsActive(pathname, item) ? 'page' : undefined} onNavigate={() => navigate(item)}>
      <Icon size={compact ? 21 : 19} strokeWidth={1.5} aria-hidden="true" />
      <span>{item.label}</span>
    </WorkspaceLink>
  }

  return <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
    <header className="workspace-navigation" data-testid="workspace-navigation" data-workspace={workspace}>
      <a href="#main-content" className="workspace-skip-link">Pular para o conteúdo</a>
      <div className="workspace-navigation-bar">
        <WorkspaceLink href={admin ? '/admin/dashboard' : '/home'} className="workspace-navigation-brand" aria-label={admin ? 'Kivora — administração' : 'Kivora — início'}>
          <BrandMark showSubtitle={false} />
        </WorkspaceLink>
        <nav className="workspace-desktop-navigation" aria-label={admin ? 'Administração' : 'Navegação principal'}>
          {primary.map(item => <div key={item.href}>{destination(item)}</div>)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="workspace-navigation-link" data-current={moreActive || undefined}>Mais <ChevronDown size={16} aria-hidden="true" /></button></DropdownMenuTrigger>
            <DropdownMenuContent className="workspace-navigation-popup" align="end" sideOffset={10}>
              {overflow.map(group => <DropdownMenuGroup key={group.label}>
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.items.map(item => <DropdownMenuItem key={item.href} asChild>
                  <WorkspaceLink href={item.href} className="workspace-menu-destination" aria-current={destinationIsActive(pathname, item) ? 'page' : undefined} onNavigate={() => navigate(item)}>
                    <item.icon size={19} aria-hidden="true" /><span><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</span>
                  </WorkspaceLink>
                </DropdownMenuItem>)}
              </DropdownMenuGroup>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="workspace-navigation-account">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild><button className="workspace-account-trigger" aria-label="Abrir opções da conta"><span className="workspace-account-initial" aria-hidden="true">{initials}</span><ChevronDown size={14} aria-hidden="true" /></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="workspace-navigation-popup workspace-account-popup" sideOffset={12} collisionPadding={16}>
              <DropdownMenuLabel className="workspace-account-heading">
                <span className="workspace-account-initial" aria-hidden="true">{initials}</span>
                <span className="workspace-account-identity"><small>SUA CONTA</small><strong title={username}>{username}</strong></span>
              </DropdownMenuLabel>
              <DropdownMenuItem asChild><WorkspaceLink href="/settings"><span className="workspace-account-item-icon"><UserRound size={18} aria-hidden="true" /></span><span>Minha conta</span><ChevronRight size={15} aria-hidden="true" className="workspace-account-item-arrow" /></WorkspaceLink></DropdownMenuItem>
              {isAdmin && <DropdownMenuItem asChild><WorkspaceLink href={switchHref}><span className="workspace-account-item-icon"><ArrowLeftRight size={18} aria-hidden="true" /></span><span>{switchLabel}</span><ChevronRight size={15} aria-hidden="true" className="workspace-account-item-arrow" /></WorkspaceLink></DropdownMenuItem>}
              <DropdownMenuSeparator />
              <form action={logoutFormAction} aria-busy={logoutPending}>
                {/* Keep the form mounted until the browser dispatches its submit event. */}
                <DropdownMenuItem asChild disabled={logoutPending} onSelect={event => event.preventDefault()}>
                  <button type="submit" className="workspace-account-logout w-full" disabled={logoutPending}>
                    <span className="workspace-account-item-icon"><LogOut size={18} aria-hidden="true" /></span>{logoutPending ? 'Saindo…' : 'Sair da conta'}
                  </button>
                </DropdownMenuItem>
                {logoutState?.error && <p role="alert" className="max-w-64 px-2 py-2 text-sm text-error">{logoutState.error}</p>}
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
          <SheetTrigger asChild><button onClick={event => { drawerTrigger.current = event.currentTarget }} className="workspace-navigation-menu" aria-label={admin ? 'Abrir menu administrativo' : 'Abrir menu de navegação'}><Menu size={22} strokeWidth={1.5} /></button></SheetTrigger>
        </div>
      </div>

    </header>
    {!admin && <nav className="stitch-mobile-nav workspace-navigation-dock" aria-label="Navegação rápida">
      <div className="workspace-dock-items">
        {primary.map(item => <div key={item.href}>{destination(item, true)}</div>)}
        <SheetTrigger asChild><button onClick={event => { drawerTrigger.current = event.currentTarget }} className="workspace-dock-link" aria-label="Abrir mais opções" data-current={moreActive || undefined}><MoreHorizontal size={21} strokeWidth={1.5} /><span>Mais</span></button></SheetTrigger>
      </div>
    </nav>}
    <SheetContent side="right" className="workspace-navigation-sheet" onCloseAutoFocus={event => { event.preventDefault(); drawerTrigger.current?.focus() }}>
      <SheetHeader><SheetTitle>{admin ? 'Administração' : 'Seu espaço'}</SheetTitle><SheetDescription>Escolha uma área para continuar.</SheetDescription></SheetHeader>
      <nav aria-label="Todas as áreas" className="workspace-navigation-groups">
        {groups.map(group => <section key={group.label}><h2>{group.label}</h2><ul>{group.items.map(item => <li key={item.href}>
          <WorkspaceLink href={item.href} className="workspace-menu-destination" aria-current={destinationIsActive(pathname, item) ? 'page' : undefined} onNavigate={() => navigate(item)}>
            <item.icon size={20} strokeWidth={1.5} aria-hidden="true" /><span><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</span><ChevronRight size={15} aria-hidden="true" />
          </WorkspaceLink>
        </li>)}</ul></section>)}
      </nav>
      {isAdmin && <WorkspaceLink className="workspace-switch-link" href={switchHref} onNavigate={() => setDrawerOpen(false)}><ArrowLeftRight size={18} />{switchLabel}<ChevronRight size={15} /></WorkspaceLink>}
    </SheetContent>
  </Sheet>
}
