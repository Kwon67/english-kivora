import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileEditor from '@/features/profile/components/ProfileEditor'
import UserPacksManager, { type UserPackSummary } from '@/features/profile/components/UserPacksManager'
import MFAEnrollment from '@/features/auth/components/MFAEnrollment'
import ProfileHeader from '@/features/profile/components/ProfileHeader'
import { Shield } from 'lucide-react'

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
  const isMFAEnabled = factors?.all.some(f => f.status === 'verified') ?? false

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
    <div className="mx-auto max-w-5xl space-y-8 pb-12 animate-fade-in">
      <ProfileHeader isMFAEnabled={isMFAEnabled} />

      <ProfileEditor
        username={profile.username}
        bio={profile.bio || ''}
        description={profile.description || ''}
        avatarUrl={profile.avatar_url || ''}
        coverUrl={profile.cover_url || ''}
      />

      {/* Security Section */}
      <section className="space-y-6">
        <div className="premium-card p-6 sm:p-8 editorial-shadow">
          <MFAEnrollment initialFactors={factors?.all || []} />
        </div>

        <div className="card p-6 sm:p-8 bg-[var(--color-surface-container-low)] border-dashed">
          <div className="flex items-center gap-4 text-[var(--color-text-muted)]">
            <Shield className="w-5 h-5" />
            <div>
              <h3 className="font-bold">Proteção Avançada Kivora</h3>
              <p className="text-xs">
                Sua conta está sendo monitorada contra acessos suspeitos. 
                Bloqueios automáticos por IP e rate-limiting estão ativos.
              </p>
            </div>
          </div>
        </div>
      </section>

      <UserPacksManager packs={packSummaries} />
    </div>
  )
}
