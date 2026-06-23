'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { followUser, unfollowUser } from '@/app/actions'
import { notify } from '@/lib/toast'

interface SocialFollowButtonProps {
  userId: string
  isFollowing: boolean
}

export default function SocialFollowButton({ userId, isFollowing: initialFollowing }: SocialFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = isFollowing ? await unfollowUser(userId) : await followUser(userId)

        if (!result.success) {
          notify.error('error' in result && result.error ? result.error : 'Não foi possível atualizar.')
          return
        }

        setIsFollowing((value) => !value)
        notify.success(isFollowing ? 'Você deixou de seguir este membro.' : 'Agora você segue este membro.')
      } catch {
        notify.error('Não foi possível atualizar o follow. Tente novamente.')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={
        isFollowing
          ? 'w-full rounded-full border border-border py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-container-low hover:text-text disabled:cursor-not-allowed disabled:opacity-60'
          : 'w-full rounded-full bg-primary py-2 text-sm font-semibold text-on-primary shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
      }
    >
      {isPending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Atualizando...
        </span>
      ) : isFollowing ? (
        'Deixar de Seguir'
      ) : (
        'Seguir'
      )}
    </button>
  )
}