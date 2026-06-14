import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOwnProfile } from '@/features/profile/lib/getOwnProfile'
import UserPacksManager, { type UserPackSummary } from '@/features/profile/components/UserPacksManager'
import ProfileIdentityCard from '@/features/profile/components/ProfileIdentityCard'
import ProfileAccountSettings from '@/features/profile/components/ProfileAccountSettings'
import ProfileSectionNav from '@/features/profile/components/ProfileSectionNav'

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

  const profile = await getOwnProfile(supabase, user.id)

  const { data: factors } = await supabase.auth.mfa.listFactors()
  const isMFAEnabled = factors?.all.some((f) => f.status === 'verified') ?? false

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
    <div className="home-mobile-optimized relative -mx-4 -my-6 overflow-x-clip bg-[#f4f5e8] px-4 py-5 pb-12 text-[#10130f] sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#050704] dark:text-[#f4f7e9]">
      <div className="home-bg-grid pointer-events-none absolute inset-0 z-0 opacity-[0.14] [background-image:linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.14]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[30rem] bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-5 pb-8 lg:space-y-6">
        <header className="space-y-1 px-0.5 text-center sm:text-left">
          <p className="text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#5a664e] dark:text-[#9ea98b]">
            Configurações
          </p>
          <h1 className="font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9] sm:text-3xl">
            Meu Perfil
          </h1>
        </header>

        <ProfileSectionNav />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:items-start lg:gap-8">
          <div className="space-y-6">
            <ProfileIdentityCard
              username={profile.username}
              bio={profile.bio || ''}
              description={profile.description || ''}
              avatarUrl={profile.avatar_url || ''}
              coverUrl={profile.cover_url || ''}
              isMFAEnabled={isMFAEnabled}
            />

            <ProfileAccountSettings
              initialWeeklyReportEnabled={profile.weekly_report_enabled ?? true}
              initialFactors={factors?.all || []}
            />
          </div>

          <UserPacksManager packs={packSummaries} />
        </div>
      </div>
    </div>
  )
}