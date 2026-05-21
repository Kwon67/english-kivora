import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileEditor from '@/components/shared/ProfileEditor'
import UserPacksManager, { type UserPackSummary } from '@/components/shared/UserPacksManager'

export const metadata = {
  title: 'Meu Perfil — Kivora English',
  description: 'Personalize seu perfil, adicione uma bio e foto de perfil.',
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username,role,bio,description,avatar_url,cover_url')
    .eq('id', user.id)
    .single()

  const { data: factors } = await supabase.auth.mfa.listFactors()
  const isMFAEnabled = factors?.all.some(f => f.status === 'verified')

  const { data: userPacks } = await supabase
    .from('packs')
    .select('id,name,description,created_at,is_public,cards(id),assignments(id,status,game_mode)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (!profile) redirect('/login')

  type UserPackRow = {
    id: string
    name: string
    description: string | null
    created_at: string
    is_public: boolean | null
    cards: { id: string }[] | null
    assignments: { id: string; status: string; game_mode: string }[] | null
  }

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
      cardCount: pack.cards?.length || 0,
      assignmentId: assignment?.id || null,
      assignmentStatus: assignment?.status || null,
    }
  })

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="mb-8">
        <p className="section-kicker uppercase tracking-widest text-[var(--color-primary)] font-bold mb-1">
          Personalização
        </p>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Meu Perfil</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Personalize seu perfil com uma foto, bio e descrição.
        </p>
        
        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
          isMFAEnabled 
            ? 'bg-green-500/10 text-green-600 border-green-500/20' 
            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isMFAEnabled ? 'bg-green-500' : 'bg-amber-500'}`} />
          {isMFAEnabled ? 'Proteção 2FA Ativa' : '2FA Recomendado'}
        </div>
      </div>

      <ProfileEditor
        username={profile.username}
        bio={profile.bio || ''}
        description={profile.description || ''}
        avatarUrl={profile.avatar_url || ''}
        coverUrl={profile.cover_url || ''}
      />

      <UserPacksManager packs={packSummaries} />
    </div>
  )
}
