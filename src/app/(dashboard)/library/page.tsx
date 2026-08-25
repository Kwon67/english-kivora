import type { LucideIcon } from 'lucide-react'
import { redirect } from 'next/navigation'
import { BookOpen, FolderOpen, Layers3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { groupUserPacksByFolder } from '@/features/cards/lib/packFolders'
import UserPacksManager, { type UserPackSummary } from '@/features/profile/components/UserPacksManager'
import {
  libraryShell,
  libraryTelemetryBand,
  libraryTelemetryCell,
} from '@/features/profile/lib/libraryPageUi'
import AccountAreaNav from '@/features/profile/components/AccountAreaNav'
import LibraryHeader from './LibraryHeader'
import { LibraryMotionSection } from './LibraryMotion'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Minha biblioteca',
  description: 'Crie, organize e gerencie seus packs pessoais de estudo.',
}

type UserPackRow = {
  id: string
  name: string
  description: string | null
  created_at: string
  is_public: boolean | null
  category: string | null
  cards: { id: string }[] | null
  assignments: { id: string; status: string; game_mode: string }[] | null
}

function TelemetryMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: LucideIcon
}) {
  return (
    <div className={libraryTelemetryCell}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-dark" strokeWidth={2.2} aria-hidden />
      </div>
      <p className="font-heading text-xl font-bold tabular-nums leading-none text-brand-dark sm:text-2xl">{value}</p>
    </div>
  )
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userPacks } = await supabase
    .from('packs')
    .select('id,name,description,created_at,is_public,category,cards(id),assignments(id,status,game_mode)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const packSummaries: UserPackSummary[] = ((userPacks || []) as unknown as UserPackRow[]).map((pack) => {
    const assignment =
      pack.assignments?.find((item) => !item.status.startsWith('completed')) ||
      pack.assignments?.[0] ||
      null

    return {
      id: pack.id,
      name: pack.name,
      description: pack.description,
      createdAt: pack.created_at,
      isPublic: Boolean(pack.is_public),
      category: pack.category,
      cardCount: pack.cards?.length || 0,
      assignmentId: assignment?.id || null,
      assignmentStatus: assignment?.status || null,
    }
  })

  const totalCards = packSummaries.reduce((sum, pack) => sum + pack.cardCount, 0)
  const folderCount = groupUserPacksByFolder(packSummaries).length

  return (
    <div className={libraryShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-12 animate-fade-in sm:space-y-8">
        <LibraryMotionSection>
          <LibraryHeader
            packCount={packSummaries.length}
            totalCards={totalCards}
            folderCount={folderCount}
          />
        </LibraryMotionSection>

        <LibraryMotionSection className={libraryTelemetryBand}>
          <TelemetryMetric label="Packs" value={packSummaries.length} icon={BookOpen} />
          <TelemetryMetric label="Cards" value={totalCards} icon={Layers3} />
          <TelemetryMetric label="Pastas" value={folderCount} icon={FolderOpen} />
        </LibraryMotionSection>

        <LibraryMotionSection>
          <AccountAreaNav activeArea="library" frosted />
        </LibraryMotionSection>

        <LibraryMotionSection>
          <UserPacksManager packs={packSummaries} />
        </LibraryMotionSection>
      </div>
    </div>
  )
}
