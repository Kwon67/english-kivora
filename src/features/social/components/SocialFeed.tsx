'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Flame, Trophy, Zap } from 'lucide-react'

type FeedItem = {
  id: string
  completed_at: string
  correct_answers: number
  max_streak: number
  pack_name: string
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'agora mesmo'
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} h`
  const diffInDays = Math.floor(diffInSeconds / 86400)
  if (diffInDays === 1) return 'ontem'
  return `há ${diffInDays} dias`
}

export default function SocialFeed({ items }: { items: FeedItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border text-text-muted text-sm">
        <p>Nenhuma atividade recente.</p>
        <p className="text-xs opacity-70 mt-1">Siga mais pessoas para ver o feed delas aqui.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.id} className="premium-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between group">
          <div className="flex items-start gap-4">
            <Link href={`/profile/${item.user.username}`} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[var(--color-surface-container)] bg-[var(--color-surface-container-low)] transition-transform hover:scale-105">
              {item.user.avatar_url ? (
                <Image src={item.user.avatar_url} alt={item.user.username} fill sizes="48px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                  {item.user.username[0]?.toUpperCase() || '?'}
                </div>
              )}
            </Link>
            <div>
              <p className="text-sm text-text">
                <Link href={`/profile/${item.user.username}`} className="font-bold hover:text-primary hover:underline">
                  @{item.user.username}
                </Link>
                {' '}completou uma sessão de{' '}
                <span className="font-semibold text-primary">{item.pack_name}</span>
              </p>
              <p className="text-xs text-text-muted mt-1">
                {formatRelativeTime(item.completed_at)}
              </p>
              
              <div className="mt-3 flex gap-3">
                <span className="flex items-center gap-1 text-xs font-bold text-text bg-[var(--color-surface-container)] px-2 py-1 rounded-md">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  {item.correct_answers} acertos
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-text bg-[var(--color-surface-container)] px-2 py-1 rounded-md">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {item.max_streak} streak
                </span>
              </div>
            </div>
          </div>
          
          <div className="sm:shrink-0 flex items-center justify-end border-t border-border sm:border-0 pt-4 sm:pt-0">
            <Link href="/blitz" className="btn-primary py-2 px-4 text-xs">
              <Zap className="h-4 w-4" />
              Jogar Blitz
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
