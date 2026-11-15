import { Layers3, Plus } from 'lucide-react'
import WorkspaceHeading from '@/components/ui/WorkspaceHeading'
import { homePrimaryButton } from '@/lib/homeStyles'
import type { Ref } from 'react'

type Props = { packCount: number; totalCards: number; folderCount: number; creationOpen: boolean; onCreate: () => void; createButtonRef: Ref<HTMLButtonElement> }

export default function LibraryHeader({
  packCount,
  totalCards,
  folderCount,
  creationOpen,
  onCreate,
  createButtonRef,
}: Props) {
  return (
    <WorkspaceHeading
      title="Biblioteca"
      breadcrumb="Biblioteca"
      actions={
        <button type="button" ref={createButtonRef} onClick={onCreate} aria-expanded={creationOpen} aria-controls="pack-creation" className={homePrimaryButton}>
          <Plus size={17} /> Criar pack
        </button>
      }
      aside={
        <div className="workspace-summary">
          <span className="workspace-summary-icon">
            <Layers3 size={22} />
          </span>
          <div>
            <strong>
              {packCount} {packCount === 1 ? 'pack salvo' : 'packs salvos'}
            </strong>
            <p>
              {totalCards} cards · {folderCount}{' '}
              {folderCount === 1 ? 'pasta' : 'pastas'}
            </p>
          </div>
        </div>
      }
    />
  )
}
