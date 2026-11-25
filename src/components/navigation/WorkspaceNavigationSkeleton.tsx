import BrandMark from '@/components/ui/BrandMark'

export default function WorkspaceNavigationSkeleton() {
  return (
    <header className="workspace-navigation" aria-label="Carregando navegação" aria-busy="true">
      <div className="workspace-navigation-bar">
        <BrandMark showSubtitle={false} />
        <span className="workspace-nav-placeholder" aria-hidden="true" />
      </div>
    </header>
  )
}
