import { createClient } from '@/lib/supabase/server'
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Trophy, 
  Target, 
  ShieldCheck,
  Search,
  MessageCircle
} from 'lucide-react'
import { sendFriendRequest, respondToFriendRequest } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function SocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch Friendships
  const { data: friendships } = await supabase
    .from('friendships')
    .select(`
      id,
      status,
      created_at,
      requester:requester_id (id, username),
      addressee:addressee_id (id, username)
    `)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  // Fetch Badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select(`
      unlocked_at,
      badge:badge_id (name, description, icon_name)
    `)
    .eq('user_id', user.id)

  // Fetch Quests
  const { data: quests } = await supabase
    .from('user_quests')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')

  interface FriendshipNode {
    id: string
    username: string
  }

  interface Friendship {
    id: string
    status: string
    created_at: string
    requester: FriendshipNode | null
    addressee: FriendshipNode | null
  }

  const typedFriendships = (friendships as unknown as Friendship[]) || []
  const pendingRequests = typedFriendships.filter((f) => f.status === 'pending' && f.addressee && f.addressee.id === user.id)
  const activeFriends = typedFriendships.filter((f) => f.status === 'accepted')

  return (
    <div className="mx-auto max-w-[var(--page-width)] px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">Social & Conquistas</h1>
        <p className="text-[var(--color-text-muted)]">Conecte-se com amigos e acompanhe seu progresso.</p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Friends Section */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Add Friend */}
          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <UserPlus className="h-5 w-5 text-[var(--color-primary)]" />
              Adicionar Amigo
            </h2>
            <form action={async (formData) => {
              'use server'
              const username = formData.get('username') as string
              if (username) await sendFriendRequest(username)
            }} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input 
                  name="username"
                  type="text" 
                  placeholder="Nome de usuário..." 
                  className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container-low)] py-2 pl-10 pr-4 focus:border-[var(--color-primary)] focus:outline-none text-[var(--color-text)]"
                  required
                />
              </div>
              <button type="submit" className="rounded-full bg-[var(--color-primary)] px-6 py-2 font-semibold text-[var(--color-on-primary)] transition-opacity hover:opacity-90 cursor-pointer">
                Enviar
              </button>
            </form>
          </section>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <section className="rounded-3xl border border-[var(--color-error)]/20 bg-[var(--color-surface)] p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[var(--color-error)]">
                Solicitações Pendentes
              </h2>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between rounded-2xl bg-[var(--color-surface-container-low)] p-4">
                    <span className="font-semibold text-[var(--color-text)]">{req.requester?.username}</span>
                    <div className="flex gap-2">
                      <form action={async () => {
                        'use server'
                        await respondToFriendRequest(req.id, 'accepted')
                      }}>
                        <button type="submit" className="rounded-full bg-[var(--color-primary)] p-2 text-[var(--color-on-primary)] cursor-pointer">
                          <Check className="h-4 w-4" />
                        </button>
                      </form>
                      <form action={async () => {
                        'use server'
                        await respondToFriendRequest(req.id, 'rejected')
                      }}>
                        <button type="submit" className="rounded-full bg-[var(--color-error)] p-2 text-[var(--color-on-primary)] cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Friends List */}
          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Users className="h-5 w-5 text-[var(--color-primary)]" />
              Meus Amigos
            </h2>
            {activeFriends.length === 0 ? (
              <p className="py-8 text-center text-[var(--color-text-muted)]">Você ainda não adicionou nenhum amigo.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeFriends.map((f) => {
                  const friend = f.requester?.id === user.id ? f.addressee : f.requester
                  if (!friend) return null
                  return (
                    <div key={f.id} className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-surface-container-low)]">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-lg font-bold text-[var(--color-primary)]">
                        {friend.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[var(--color-text)]">{friend.username}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Amigo desde {new Date(f.created_at).toLocaleDateString()}</p>
                      </div>
                      <button className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] cursor-pointer">
                        <MessageCircle className="h-5 w-5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Gamification Column */}
        <div className="space-y-8">
          {/* Active Quests */}
          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Target className="h-5 w-5 text-[var(--color-primary)]" />
              Missões Ativas
            </h2>
            {quests && quests.length > 0 ? (
              <div className="space-y-4">
                {quests.map(quest => (
                  <div key={quest.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-[var(--color-text)]">{quest.quest_type.replace('_', ' ').toUpperCase()}</span>
                      <span className="text-[var(--color-text-muted)]">{quest.progress}/{quest.target}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                      <div 
                        className="h-full bg-[var(--color-primary)] transition-all" 
                        style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-[var(--color-text-muted)]">Nenhuma missão ativa no momento.</p>
            )}
          </section>

          {/* Badges Section */}
          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
              <Trophy className="h-5 w-5 text-[var(--color-primary)]" />
              Conquistas
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {userBadges && userBadges.length > 0 ? (
                userBadges.map((ub) => {
                  const badge = Array.isArray(ub.badge) ? ub.badge[0] : ub.badge
                  if (!badge) return null
                  return (
                    <div key={badge.name} title={badge.description} className="flex flex-col items-center gap-1">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-inner">
                        <ShieldCheck className="h-8 w-8" />
                      </div>
                      <span className="text-center text-[10px] font-bold leading-tight text-[var(--color-text)]">{badge.name}</span>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-3 py-4 text-center text-sm text-[var(--color-text-muted)]">
                  Comece a treinar para ganhar sua primeira badge!
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
