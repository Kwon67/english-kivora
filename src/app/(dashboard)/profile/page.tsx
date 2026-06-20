import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOwnProfile } from '@/features/profile/lib/getOwnProfile'
import UserPacksManager, { type UserPackSummary } from '@/features/profile/components/UserPacksManager'
import ProfileIdentityCard from '@/features/profile/components/ProfileIdentityCard'
import ProfileAccountSettings from '@/features/profile/components/ProfileAccountSettings'
import ProfileSectionNav from '@/features/profile/components/ProfileSectionNav'
import { pageBgGlow, pageBgGrid } from '@/lib/pageShellBackground'

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
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface-container-lowest p-6 text-center">
        <h1 className="text-xl font-bold text-text">Perfil indisponível</h1>
        <p className="mt-2 text-sm text-text-muted">
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
    <div className="home-mobile-optimized relative -mx-4 -my-6 overflow-x-clip bg-surface px-4 py-5 pb-12 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#050704] dark:text-text">
      <div className={pageBgGrid} />
      <div className={pageBgGlow} />

      <div className="relative z-10 space-y-5 pb-8 lg:space-y-6">
        {/* ─── Page header ─── */}
        <header className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[0.64rem] font-black uppercase tracking-[0.12em] text-text-subtle dark:text-text-subtle">
              Configurações
            </p>
            <h1 className="font-montserrat text-2xl font-bold text-text dark:text-text sm:text-3xl">
              Meu Perfil
            </h1>
          </div>
          <p className="hidden text-xs font-semibold text-text-subtle dark:text-text-subtle sm:block">
            Gerencie sua identidade, segurança e conteúdo.
          </p>
        </header>

        <ProfileSectionNav />

        {/* ─── Main grid ─── */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:items-start lg:gap-8">
          {/* Left column */}
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

          {/* Right column */}
          <UserPacksManager packs={packSummaries} />
        </div>
      </div>
    </div>
  )
}