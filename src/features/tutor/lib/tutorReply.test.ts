import { expect, it } from 'vitest'
import { parseTutorReply } from './tutorReply'

it('preserva a fala e separa a dica completa mesmo quando ocupa mais de uma linha', () => {
  expect(parseTutorReply('Welcome!\n[TIP]Uma dica\nem duas linhas.[/TIP]')).toEqual({ content: 'Welcome!', tip: 'Uma dica\nem duas linhas.' })
  expect(parseTutorReply('Welcome!')).toEqual({ content: 'Welcome!', tip: null })
})
it('permite repetir uma resposta vazia ou grande demais para o próximo turno', () => {
  for (const text of [' ', '[TIP]Somente uma dica.', 'x'.repeat(2001)]) expect(parseTutorReply(text)).toHaveProperty('error')
})
