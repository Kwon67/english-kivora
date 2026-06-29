import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { groupUserPacksByFolder } from '@/features/cards/lib/packFolders'
import UserPacksManager, { type UserPackSummary } from '@/features/profile/components/UserPacksManager'
import LibraryAccountNav from './LibraryAccountNav'
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
    <div className="home-mobile-optimized biblioteca-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <LibraryMotionSection>
          <LibraryHeader
            packCount={packSummaries.length}
            totalCards={totalCards}
            folderCount={folderCount}
          />
        </LibraryMotionSection>

        <LibraryMotionSection>
          <LibraryAccountNav activeArea="library" />
        </LibraryMotionSection>

        <LibraryMotionSection>
          <UserPacksManager packs={packSummaries} />
        </LibraryMotionSection>
      </div>
    </div>
  )
}
