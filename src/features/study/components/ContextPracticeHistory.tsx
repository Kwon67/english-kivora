import Link from 'next/link'
import { TODAY_LESSONS } from '../lib/todayLesson'
import { TRAVEL_LESSONS } from '../lib/travelUnit'
const lessons = [...Object.values(TODAY_LESSONS), ...TRAVEL_LESSONS]
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatAppDate } from '@/lib/timezone'

/** Self-reviewed writing is evidence of practice, separate from scored exercise accuracy. */
export default async function ContextPracticeHistory({ db, userId }: { db: SupabaseClient; userId: string }) {
  const enabled = process.env.CONTEXT_PRACTICE_PERSISTENCE_ENABLED === 'true'
  const result = enabled ? await db.from('context_practice_attempts')
    .select('attempt_id,lesson_id,level,response,revision,self_checks,first_choice,hints_used,oral_self_report,completed_at')
    .eq('user_id', userId).order('completed_at', { ascending: false }).limit(10) : null
  return <article>
    <h2>Inglês em contexto</h2>
    <p className="mt-2 text-sm text-brand-secondary">Produções com autoavaliação. Não entram no percentual de acertos nem comprovam proficiência.</p>
    {!enabled ? <p className="mt-4 text-sm">As práticas atuais ficam no navegador em que foram feitas. Abra a prática de hoje para retomar sua versão.</p>
      : result?.error ? <p role="status" className="mt-4 text-sm">Não foi possível carregar suas produções. Atualize a página para tentar novamente.</p>
        : !result?.data?.length ? <p className="mt-4 text-sm">Sua primeira produção aparecerá aqui depois de ser salva na conta.</p>
          : <ul className="mt-4 space-y-4">{result.data.map(attempt => <li key={attempt.attempt_id}>
            <details className="study-insight">
              <summary className="cursor-pointer font-semibold">{lessons.find(lesson => lesson.id === attempt.lesson_id)?.title ?? 'Prática contextual'} · faixa {attempt.level} · {formatAppDate(attempt.completed_at, { day: '2-digit', month: 'long', year: 'numeric' })}</summary>
              <p className="mt-3 text-sm text-brand-secondary">Critérios reconhecidos por você: {attempt.self_checks.filter(Boolean).length}/3. Sem avaliação externa.</p>
              <p className="mt-3 text-sm">Compreensão: {attempt.first_choice === null ? 'primeira escolha não registrada' : attempt.first_choice === lessons.find(lesson => lesson.id === attempt.lesson_id)?.answer ? 'primeira escolha correta' : 'primeira escolha precisou de revisão'}. {attempt.hints_used ? 'Consulta de apoio registrada.' : 'Sem consulta de apoio registrada.'}</p><p className="text-sm">Fala: {attempt.oral_self_report ? 'você informou ter praticado' : 'sem relato de prática oral'}. Sem avaliação externa.</p><h3 className="mt-3 font-semibold">Primeira versão</h3><p lang="en" className="whitespace-pre-wrap break-words">{attempt.response}</p>
              <h3 className="mt-3 font-semibold">Versão revisada</h3><p lang="en" className="whitespace-pre-wrap break-words">{attempt.revision}</p>
            </details>
          </li>)}</ul>}
    <Link href="/practice-context" className="product-text-link mt-4 inline-block">Abrir prática em contexto</Link>
  </article>
}
