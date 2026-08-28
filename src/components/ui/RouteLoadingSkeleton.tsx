import type { ReactNode } from 'react'
import { homeCardClass, homeFrostedSurface } from '@/lib/homeStyles'

/**
 * Sistema de skeleton do app.
 *
 * Um bom skeleton é a SILHUETA da tela que vem, não um aviso de que algo está carregando: quando
 * ele acerta a forma, o conteúdo real aparece no lugar onde o olho já estava. O anterior falhava
 * nos dois papéis — eram blocos cáqui chapados, sem relação com o layout de destino, e ainda
 * traziam um spinner embaixo dizendo o que os próprios blocos já diziam.
 *
 * Daí as duas peças aqui: `Skeleton` é a barra de conteúdo, `SkeletonSurface` é o card que a
 * contém — e ele usa o mesmo material frosted das telas reais, para a troca não piscar de um
 * visual para outro.
 */

/** Barra de conteúdo. O raio vem de fora porque texto, pílula e avatar têm raios diferentes. */
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton-block ${className}`} />
}

/**
 * Linhas de texto com a última mais curta.
 *
 * Parágrafo real não termina alinhado à direita, e um bloco de barras do mesmo comprimento lê
 * como tabela, não como texto. A última linha em 60% é o que faz o olho reconhecer "parágrafo".
 */
function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={`h-3.5 rounded-full ${index === lines - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

/** Card no material das telas reais, para o skeleton ter a mesma moldura do conteúdo. */
function SkeletonSurface({ className = '', children }: { className?: string; children?: ReactNode }) {
  return <div className={`${homeCardClass} ${homeFrostedSurface} ${className}`}>{children}</div>
}

interface RouteLoadingSkeletonProps {
  /**
   * Só para leitor de tela. O spinner com texto que existia aqui foi removido: ele repetia a
   * informação que os blocos já passam, e um elemento girando embaixo de placeholders estáticos
   * puxa o olho para o canto errado da tela.
   */
  label: string
  children?: ReactNode
}

export default function RouteLoadingSkeleton({ label, children }: RouteLoadingSkeletonProps) {
  return (
    <div className="animate-fade-in space-y-4 pb-8" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonSurface }
