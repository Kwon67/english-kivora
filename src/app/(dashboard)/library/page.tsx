import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AccountAreaShell from '@/features/profile/components/AccountAreaShell'
import UserPacksManager, { type UserPackSummary } from '@/features/profile/components/UserPacksManager'

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

  return (
    <AccountAreaShell
      activeArea="library"
      eyebrow="Conteúdo pessoal"
      title="Minha biblioteca"
      description="Crie packs, organize conteúdos em pastas e mantenha seus materiais pessoais em um único lugar."
      contentClassName="max-w-6xl"
    >
      <UserPacksManager packs={packSummaries} />
    </AccountAreaShell>
  )
}
