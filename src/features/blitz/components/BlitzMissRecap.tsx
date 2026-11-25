'use client'

import { getBlitzModeLabel } from '@/features/blitz/lib/blitzModes'
import type { BlitzMiss } from '@/features/blitz/lib/blitzMisses'

interface BlitzMissRecapProps {
  misses: BlitzMiss[]
}

export default function BlitzMissRecap({ misses }: BlitzMissRecapProps) {
  if (misses.length === 0) return null

  const groups = new Map<string, BlitzMiss[]>()
  for (const miss of misses) {
    const attempts = groups.get(miss.englishPhrase)
    if (attempts) attempts.push(miss)
    else groups.set(miss.englishPhrase, [miss])
  }
  return (
    <section className="blitz-miss-recap" aria-labelledby="blitz-miss-title">
      <div className="blitz-miss-heading">
        <h2 id="blitz-miss-title">Frases para revisar</h2>
        <span>{misses.length} {misses.length === 1 ? 'erro' : 'erros'}</span>
      </div>

      <ul>
        {Array.from(groups, ([phrase, attempts]) => {
          const modes = [...new Set(attempts.map(miss => getBlitzModeLabel(miss.mode)))]
          const hints = [...new Set(attempts.map(miss => miss.portugueseHint).filter(Boolean))]
          const details = [...new Set(attempts.map(miss => miss.detail).filter(Boolean))]
          const matching = attempts.every(miss => miss.mode === 'matching')
          return (
            <li key={phrase} className="blitz-miss-row">
              {matching ? (
                <div className="blitz-miss-phrases">
                  {phrase.split(' · ').map((line, index) => (
                    <div key={index}>
                      <p lang="en">{line}</p>
                      {index === 0 && hints.map(hint => <p key={hint} className="blitz-result-detail">{hint}</p>)}
                    </div>
                  ))}
                </div>
              ) : <p lang="en">{phrase}</p>}
              {!matching && hints.map(hint => <p key={hint} className="blitz-result-detail">{hint}</p>)}
              {details.length > 0 && (
                <details className="blitz-miss-attempts">
                  <summary>{matching ? 'Ver combinações tentadas' : 'Ver detalhes da resposta'}</summary>
                  <ul>{details.map(detail => <li key={detail}>{detail}</li>)}</ul>
                </details>
              )}
              <div className="blitz-miss-tags">
                {modes.map(mode => <span key={mode}>{mode}</span>)}
                {attempts.length > 1 && <span>{attempts.length} erros nesta frase</span>}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
