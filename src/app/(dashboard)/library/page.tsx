import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserPackSummary } from '@/features/profile/components/UserPacksManager'
import { libraryShell } from '@/features/profile/lib/libraryPageUi'
import LibraryWorkspace from './LibraryWorkspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Minha coleção',
  description: 'Suas palavras e coleções de inglês.',
}

type UserPackRow = {
  id: string
  name: string
  description: string | null
  created_at: string
  is_public: boolean | null
  category: string | null
  cards: { count: number }[] | null
  assignments: { id: string; status: string; game_mode: string }[] | null
}

export default async function LibraryPage({ searchParams }: { searchParams?: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams
  const query = (params?.q || '').trim().slice(0, 100)
  const page = Math.max(1, Math.min(10000, Number.parseInt(params?.page || '1', 10) || 1))
  const pageSize = 50
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const packsPromise = supabase
    .from('packs')
    .select('id,name,description,created_at,is_public,category,cards(count),assignments(id,status,game_mode)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  let wordsQuery = supabase.from('cards').select('id,pack_id,english_phrase,portuguese_translation,packs!inner(owner_id)', { count: 'exact' }).eq('packs.owner_id', user.id)
  const safeQuery = query.replace(/[%,().\\"]/g, ' ').trim()
  if (safeQuery) wordsQuery = wordsQuery.or(`english_phrase.ilike.%${safeQuery}%,portuguese_translation.ilike.%${safeQuery}%`)
  const [{ data: userPacks, error }, wordResult] = await Promise.all([packsPromise, wordsQuery.order('created_at', { ascending: false }).order('id').range((page - 1) * pageSize, page * pageSize - 1)])

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
      cardCount: pack.cards?.[0]?.count || 0,
      assignmentId: assignment?.id || null,
      assignmentStatus: assignment?.status || null,
    }
  })

  const totalCards = packSummaries.reduce((sum, pack) => sum + pack.cardCount, 0)

  return (
    <div className={libraryShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-12 animate-fade-in sm:space-y-8">
        <LibraryWorkspace packs={packSummaries} totalCards={totalCards} loadError={Boolean(error || wordResult.error)} query={query} page={page} matchCount={wordResult.count || 0} words={(wordResult.data || []).map(card => ({ id: card.id, packId: card.pack_id, en: card.english_phrase, pt: card.portuguese_translation }))} />
      </div>
    </div>
  )
}
