import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileEditor from '@/components/shared/ProfileEditor'

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

  if (!profile) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl">
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
    </div>
  )
}
