/**
 * A disciplina da fila de cards do Blitz.
 *
 * Estava no componente como uma função só, `rotateQueue(fila, n)`, usada para tudo. Ela move os
 * n primeiros cards para o fim — o que é certo quando a rodada CONSUMIU n cards (o modo
 * combinação usa quatro de uma vez), e errado quando consumiu um só: os outros n−1 são pulados
 * sem terem sido jogados.
 *
 * O efeito era grave e silencioso. Com passo constante, pular de n em n visita apenas os índices
 * múltiplos de n módulo o tamanho da fila, e o ciclo tem tamanho `len / mdc(n, len)`. Como o passo
 * do acerto era `teto(len/3)`, um baralho de 12 cards visitava os índices 0, 4, 8, 0, 4, 8… para
 * sempre: TRÊS frases, em looping, com as outras nove nunca aparecendo. Baralhos de 6 e 9 davam o
 * mesmo três; um de 40 mostrava só metade.
 *
 * Isso é anterior à seleção inteligente, mas ficou visível com ela: antes o baralho era
 * embaralhado a cada partida, então as três frases sorteadas mudavam e o problema passava por
 * azar. Com a fila ordenada por relevância, as mesmas três voltam sempre — e como a ordenação põe
 * na frente o que a pessoa mais erra, o looping cai exatamente nas frases que ela errou.
 */

/**
 * Tira o card da frente e o reinsere `distance` posições adiante.
 *
 * Ninguém é pulado: todos os outros cards aparecem antes que este volte, e ele volta depois de
 * exatamente `distance` rodadas. É o que faz a distância significar o que o nome diz.
 */
export function reinsertHead<T>(queue: T[], distance: number): T[] {
  if (queue.length <= 1) return queue

  const [head, ...rest] = queue
  const position = Math.min(Math.max(Math.round(distance), 1), rest.length)

  return [...rest.slice(0, position), head, ...rest.slice(position)]
}

/**
 * Move os `count` primeiros cards para o fim.
 *
 * Só para rodadas que consumiram vários cards de uma vez — hoje, o modo combinação. Para rodada de
 * um card, use `reinsertHead`.
 */
export function rotateQueue<T>(queue: T[], count: number): T[] {
  if (queue.length === 0) return queue

  const safeCount = Math.min(Math.max(count, 0), queue.length)
  return [...queue.slice(safeCount), ...queue.slice(0, safeCount)]
}
