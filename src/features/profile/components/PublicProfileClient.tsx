'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Target, Trophy, CalendarDays, BarChart, Flame, Play, Sparkles, UserPlus, UserCheck, Loader2, Pencil } from 'lucide-react'
import { m } from 'framer-motion'
import { followUser, unfollowUser } from '@/app/actions'
import FluencyRadar from '@/features/leaderboard/components/FluencyRadar'
import EmptyState from '@/components/ui/EmptyState'

interface Badge {
  unlocked_at: string
  badge: {
    name: string
    description: string
    icon_name: string
  }
}

interface ProfileStats {
  score: number
  sessions: number
  accuracy: number
  best_streak: number
}

interface PublicProfileClientProps {
  profile: {
    id: string
    username: string
    bio: string | null
    description: string | null
    avatar_url: string | null
    cover_url: string | null
    created_at: string
  }
  isOwnProfile: boolean
  initialIsFollowing: boolean
  followersCount: number
  followingCount: number
  stats: ProfileStats
  badges: Badge[]
  radarData: { category: string; accuracy: number }[]
}

export default function PublicProfileClient({
  profile,
  isOwnProfile,
  initialIsFollowing,
  followersCount: initialFollowers,
  followingCount,
  stats,
  badges,
  radarData
}: PublicProfileClientProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowers)
  const [isPending, startTransition] = useTransition()

  function handleFollowToggle() {
    startTransition(async () => {
      try {
        if (isFollowing) {
          await unfollowUser(profile.id)
          setIsFollowing(false)
          setFollowersCount(prev => Math.max(0, prev - 1))
        } else {
          await followUser(profile.id)
          setIsFollowing(true)
          setFollowersCount(prev => prev + 1)
        }
      } catch (err) {
        console.error('Failed to toggle follow status:', err)
      }
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  } as const

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  } as const

  return (
    <m.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12 space-y-8"
    >
      {/* Profile Header Card */}
      <m.div 
        variants={itemVariants}
        className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-md group relative"
      >
        {profile.cover_url ? (
          <div className="h-48 sm:h-64 md:h-72 w-full relative overflow-hidden">
            <Image 
              src={profile.cover_url} 
              alt="Capa" 
              fill 
              priority
              className="object-cover object-center transition-transform duration-700 group-hover:scale-103" 
            />
            {/* Primary gradient: strong cinematic bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-black/20 via-50% to-transparent pointer-events-none" />
            {/* Secondary gradient: subtle top darkening */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent via-40% to-transparent pointer-events-none" />
            {/* Vignette for cinematic framing */}
            <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.3)_100%)] pointer-events-none" />
            {/* Noise texture */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay [background-image:url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC43IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
          </div>
        ) : (
          <div className="h-48 sm:h-64 md:h-72 w-full bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,var(--color-primary)/0.1,transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent pointer-events-none" />
          </div>
        )}
        
        <div className="px-6 pb-6 sm:px-10 sm:pb-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-24 gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              <m.div 
                whileHover={{ scale: 1.03 }}
                className="relative h-28 w-28 sm:h-36 sm:w-36 overflow-hidden rounded-full border-4 border-[var(--color-surface)] bg-[var(--color-surface-container)] shadow-lg z-10 flex-shrink-0"
              >
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt={profile.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl sm:text-5xl font-extrabold text-primary bg-primary-light">
                    {profile.username[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </m.div>
              
              <div className="flex flex-col pb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text leading-none">
                    {profile.username}
                  </h1>
                  {isOwnProfile && (
                    <span className="stitch-pill py-0.5 bg-primary-container text-[9px] text-primary font-extrabold uppercase tracking-wider">Você</span>
                  )}
                </div>
                {profile.bio && (
                  <p className="mt-2 text-sm sm:text-base text-text-muted font-medium leading-relaxed max-w-xl">
                    {profile.bio}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs font-semibold text-text-subtle">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <span>Membro desde {new Date(profile.created_at).getFullYear()}</span>
                  </div>
                  <div className="flex gap-3">
                    <span><strong className="text-text font-extrabold">{followersCount}</strong> Seguidores</span>
                    <span><strong className="text-text font-extrabold">{followingCount}</strong> Seguindo</span>
                  </div>
                </div>
              </div>
            </div>

            {isOwnProfile ? (
              <div className="w-full flex-shrink-0 pb-2 sm:w-auto">
                <Link
                  href="/profile"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface-container-lowest px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary shadow-sm transition-colors hover:bg-primary-light sm:w-auto"
                >
                  <Pencil className="h-4 w-4" />
                  Editar perfil
                </Link>
              </div>
            ) : (
              <div className="pb-2 flex-shrink-0 w-full sm:w-auto">
                <m.button 
                  onClick={handleFollowToggle}
                  disabled={isPending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm border ${ isFollowing ? 'border-border text-text-muted hover:bg-surface-container-low hover:text-text' : 'bg-primary text-on-primary hover:opacity-95 border-transparent shadow-[0_3px_10px_rgba(39,99,86,0.2)]' }`}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 stroke-[2.5]" />
                      Seguindo
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 stroke-[2.5]" />
                      Seguir
                    </>
                  )}
                </m.button>
              </div>
            )}
          </div>

          {profile.description && (
            <div className="mt-8 border-t border-border/40 pt-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-subtle mb-2">Sobre</h2>
              <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">
                {profile.description}
              </p>
            </div>
          )}
        </div>
      </m.div>

      {/* Grid of Stats and Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Radar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Fluency Radar Card */}
          <m.section 
            variants={itemVariants}
            className="premium-card p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.01] rounded-full blur-2xl pointer-events-none" />
            <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold text-text uppercase tracking-wider">
              <BarChart className="h-4 w-4 text-primary" />
              Radar de Fluência
            </h2>
            <div className="h-[210px] flex items-center justify-center">
              <FluencyRadar data={radarData} />
            </div>
            <p className="mt-3 text-[9px] text-center text-text-subtle font-bold uppercase tracking-widest">
              Precisão por Categoria
            </p>
          </m.section>

          {/* Core Stats Card */}
          <m.section 
            variants={itemVariants}
            className="premium-card p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/[0.01] rounded-full blur-2xl pointer-events-none" />
            <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold text-text uppercase tracking-wider">
              <Target className="h-4 w-4 text-primary" />
              Estatísticas
            </h2>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest border border-border/60 p-4 text-center hover:border-primary/30 transition-all duration-300">
                <Trophy className="h-5 w-5 text-amber-500 mb-1" />
                <span className="text-2xl font-extrabold text-text leading-tight">{stats.score}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-subtle mt-1">XP Total</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest border border-border/60 p-4 text-center hover:border-primary/30 transition-all duration-300">
                <Play className="h-5 w-5 text-primary mb-1" />
                <span className="text-2xl font-extrabold text-text leading-tight">{stats.sessions}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-subtle mt-1">Sessões</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest border border-border/60 p-4 text-center hover:border-primary/30 transition-all duration-300">
                <Sparkles className="h-5 w-5 text-blue-500 mb-1" />
                <span className="text-2xl font-extrabold text-text leading-tight">{stats.accuracy}%</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-subtle mt-1">Precisão</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest border border-border/60 p-4 text-center hover:border-primary/30 transition-all duration-300">
                <Flame className="h-5 w-5 text-orange-500 mb-1" />
                <span className="text-2xl font-extrabold text-text leading-tight">{stats.best_streak}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-subtle mt-1">Ofensiva</span>
              </div>
            </div>
          </m.section>
        </div>

        {/* Right Column: Achievements / Badges */}
        <div className="lg:col-span-2 space-y-6">
          <m.section 
            variants={itemVariants}
            className="premium-card p-6 relative overflow-hidden h-full flex flex-col"
          >
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-44 h-44 bg-primary/[0.01] rounded-full blur-3xl pointer-events-none" />
            <h2 className="mb-6 flex items-center gap-2 text-base font-extrabold text-text uppercase tracking-wider border-b border-border/45 pb-3">
              <Trophy className="h-4.5 w-4.5 text-primary" />
              Conquistas e Medalhas
            </h2>
            
            {badges && badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
                {badges.map((ub, idx) => {
                  const badge = ub.badge
                  return (
                    <m.div 
                      key={idx} 
                      title={badge.description} 
                      whileHover={{ y: -2 }}
                      className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface-container-lowest p-4 text-center transition-all duration-300 hover:border-primary/25 hover:shadow-sm dark:hover:border-primary/25"
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary border border-primary/10 shadow-inner dark:bg-primary/8 text-primary dark:border-primary/15">
                        <ShieldCheck className="h-7 w-7" />
                      </div>
                      <div>
                        <span className="block text-xs sm:text-sm font-bold text-text leading-tight">{badge.name}</span>
                        <span className="block text-[10px] text-text-subtle mt-1 line-clamp-2 leading-relaxed">{badge.description}</span>
                      </div>
                    </m.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center flex-1 py-8">
                <EmptyState
                  imageSrc="/images/home/undraw-online-learning.svg"
                  imageAlt="Ilustração unDraw de perfil sem conquistas"
                  title="Ainda sem medalhas."
                  description="Complete atividades diárias e jogue Blitz para desbloquear medalhas de proficiência."
                  variant="compact"
                  className="bg-transparent py-4 shadow-none border-none max-w-sm"
                  imageClassName="max-w-28 opacity-80"
                />
              </div>
            )}
          </m.section>
        </div>
      </div>
    </m.div>
  )
}
