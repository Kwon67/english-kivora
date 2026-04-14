import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Flame,
  Percent,
  Users,
} from 'lucide-react'
import { type CardReview } from '@/lib/spacedRepetition'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import ExportReportButton from './ExportReportButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminReportsPage() {
  const supabase = createAdminClient() ?? await createClient()
  const today = getAppDateString()
  const thirtyDaysAgo = shiftAppDate(today, -30)

  const [membersResult, reviewsResult] = await Promise.all([
    supabase.from('profiles').select('id, username, role').order('username'),
    supabase
      .from('card_reviews')
      .select('*')
      .gte('review_date', getAppDayStartUtcIso(thirtyDaysAgo))
      .order('review_date', { ascending: false }),
  ])

  if (membersResult.error || reviewsResult.error) {
    console.error('Admin reports query failed', {
      membersError: membersResult.error,
      reviewsError: reviewsResult.error,
    })
    throw new Error('Falha ao carregar os relatórios administrativos.')
  }

  const members = (membersResult.data ?? []).filter((member) => member.role !== 'admin')
  const reviews = (reviewsResult.data ?? []) as CardReview[]

  const todayReviews = reviews.filter((review) => getAppDateString(review.review_date) === today)
  const totalQuality = reviews.reduce((sum, review) => sum + review.quality, 0)
  const averageQuality = reviews.length > 0 ? totalQuality / reviews.length : 0
  const successRate =
    reviews.length > 0 ? Math.round((reviews.filter((review) => review.quality >= 3).length / reviews.length) * 100) : 0
  const bestRepetition = reviews.reduce((best, review) => Math.max(best, review.repetitions), 0)

  const memberRows = members.map((member) => {
    const memberReviews = reviews.filter((review) => review.user_id === member.id)
    const memberQualityTotal = memberReviews.reduce((sum, review) => sum + review.quality, 0)
    const memberAverageQuality = memberReviews.length > 0 ? memberQualityTotal / memberReviews.length : 0
    const memberGoodReviews = memberReviews.filter((review) => review.quality >= 3).length
    const memberGoodRate = memberReviews.length > 0
      ? Math.round((memberGoodReviews / memberReviews.length) * 100)
      : 0

    return {
      id: member.id,
      username: member.username,
      reviews: memberReviews.length,
      averageQuality: memberAverageQuality,
      goodRate: memberGoodRate,
      bestRepetition: memberReviews.reduce((best, review) => Math.max(best, review.repetitions), 0),
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="surface-hero p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Reports</p>
            <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
              Relatórios consolidados de revisões dos últimos 30 dias.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
              Leitura rápida de volume, consistência e qualidade das revisões para acompanhar o ritmo da equipe.
            </p>
          </div>
          <ExportReportButton
            memberRows={memberRows}
            totalMembers={members.length}
            todayReviews={todayReviews.length}
            averageQuality={averageQuality}
            successRate={successRate}
            bestRepetition={bestRepetition}
            totalReviews={reviews.length}
            totalGoodReviews={reviews.filter((review) => review.quality >= 3).length}
          />
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-4">
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Equipe ativa</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{members.length}</p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Membros não-admin monitorados</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Revisões hoje</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">
              {todayReviews.length}
            </p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Revisões registradas no dia atual</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Qualidade média</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{averageQuality.toFixed(1)}/5</p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{successRate}% das revisões foram boas</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Maior repetição</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{bestRepetition}</p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Maior ciclo de revisão registrado</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <Users className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Revisões</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--color-text)]">{reviews.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
              <BookOpen className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Revisões boas</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--color-text)]">{reviews.filter((review) => review.quality >= 3).length}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(43,122,11,0.08)] text-[var(--color-primary)]">
              <Flame className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Repetições máximas</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--color-text)]">{bestRepetition}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <p className="section-kicker">Member report</p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">Resumo por membro nas revisões</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-white/72 text-[var(--color-text-muted)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Membro</th>
                <th className="px-6 py-4 text-center font-semibold">Revisões</th>
                <th className="px-6 py-4 text-center font-semibold">Qualidade média</th>
                <th className="px-6 py-4 text-center font-semibold">Taxa boa</th>
                <th className="px-6 py-4 text-center font-semibold">Maior repetição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {memberRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-white/72">
                  <td className="px-6 py-4 font-semibold text-[var(--color-text)]">{row.username}</td>
                  <td className="px-6 py-4 text-center">{row.reviews}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      {row.averageQuality.toFixed(1)}/5
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex rounded-full bg-[var(--color-secondary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-secondary)]">
                      {row.goodRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">{row.bestRepetition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={1.8} />
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Consistência</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Acompanhe quem está mantendo a rotina de revisão sem ficar preso no detalhe operacional.
          </p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <Percent className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={1.8} />
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Qualidade</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            A qualidade média separa volume de revisão de retenção real.
          </p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={1.8} />
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Tendência</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Use este recorte como leitura semanal e mensal da revisão, não só como fotografia do dia.
          </p>
        </div>
      </section>
    </div>
  )
}
