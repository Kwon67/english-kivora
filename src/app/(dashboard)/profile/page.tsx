import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileEditor from '@/features/profile/components/ProfileEditor'
import UserPacksManager, { type UserPackSummary } from '@/features/profile/components/UserPacksManager'
import MFAEnrollment from '@/features/auth/components/MFAEnrollment'
import ProfileHeader from '@/features/profile/components/ProfileHeader'
import WeeklyReportPreference from '@/features/profile/components/WeeklyReportPreference'
import { Shield } from 'lucide-react'
import FlightPaths from '@/components/landing/FlightPaths'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    .select('username,role,bio,description,avatar_url,cover_url,weekly_report_enabled')
    .eq('id', user.id)
    .single()

  const { data: factors } = await supabase.auth.mfa.listFactors()
  const isMFAEnabled = factors?.all.some(f => f.status === 'verified') ?? false

  const { data: userPacks } = await supabase
    .from('packs')
    .select('id,name,description,created_at,is_public,category,cards(id),assignments(id,status,game_mode)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-6 text-center">
        <h1 className="text-xl font-bold text-[var(--color-text)]">Perfil indisponível</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Não encontramos os dados do seu perfil. Atualize a página ou entre novamente.
        </p>
      </div>
    )
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
    <div className="relative -mx-4 -my-6 overflow-hidden bg-[#f4f5e8] dark:bg-[#050704] text-[#10130f] dark:text-[#f4f7e9] px-4 py-6 pb-12 sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 transition-colors duration-300">
      {/* Background mesh grid - Landing page style */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.14] dark:opacity-[0.14] z-0" />
      
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)] z-0" />

      {/* Decorative flight-path background */}
      <FlightPaths />

      <div className="relative z-10 mx-auto max-w-5xl space-y-8 pb-12 animate-fade-in">
        <ProfileHeader isMFAEnabled={isMFAEnabled} />

        <ProfileEditor
          username={profile.username}
          bio={profile.bio || ''}
          description={profile.description || ''}
          avatarUrl={profile.avatar_url || ''}
          coverUrl={profile.cover_url || ''}
        />

        <WeeklyReportPreference initialEnabled={profile.weekly_report_enabled ?? true} />

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
    </div>
  )
}
