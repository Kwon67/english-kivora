import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getOwnProfile } from '@/features/profile/lib/getOwnProfile'
import AccountAreaShell from '@/features/profile/components/AccountAreaShell'
import ProfileIdentityCard from '@/features/profile/components/ProfileIdentityCard'
import { softBtn } from '@/features/profile/lib/profileUi'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Editar perfil',
  description: 'Personalize como seu perfil aparece para outros membros.',
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getOwnProfile(supabase, user.id)

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

  return (
    <AccountAreaShell
      activeArea="profile"
      eyebrow="Perfil do membro"
      title="Editar perfil"
      description="Defina como seu nome, foto e apresentação aparecem para outros membros da comunidade."
      action={
        <Link href={`/profile/${encodeURIComponent(profile.username)}`} className={softBtn}>
          <ExternalLink className="h-4 w-4" />
          Ver perfil público
        </Link>
      }
    >
      <ProfileIdentityCard
        username={profile.username}
        bio={profile.bio || ''}
        description={profile.description || ''}
        avatarUrl={profile.avatar_url || ''}
        coverUrl={profile.cover_url || ''}
      />
    </AccountAreaShell>
  )
}
