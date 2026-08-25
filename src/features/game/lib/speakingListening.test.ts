import { describe, expect, it } from 'vitest'
import type { LocalPronunciationAssessment } from './pronunciation-assessment'
import {
  evaluateSpeakingAnswer,
  evaluateSpeakingAnswerDetailed,
  getExpectedWordCount,
  getListeningWordCoverage,
  getPhraseQuickSettleDelayMs,
  getPhraseSettleDelayMs,
  isPerfectSpeakingPhrase,
  shouldAutoFinishListening,
  shouldRestartListeningAfterEnd,
  shouldUseQuickSilenceSettle,
} from './speakingListening'

describe('getPhraseSettleDelayMs', () => {
  it('scales delay with phrase length', () => {
    expect(getPhraseSettleDelayMs('hello')).toBe(940)
    expect(getPhraseSettleDelayMs('i would like a coffee please')).toBe(2140)
  })

  it('caps delay for long phrases', () => {
    expect(
      getPhraseSettleDelayMs(
        'i would like a coffee please today right now because i am very hungry and tired'
      )
    ).toBe(3200)
  })

  it('uses a shorter fast profile for arcade-style modes', () => {
    expect(getPhraseSettleDelayMs('i would like a coffee please', { fast: true })).toBe(1380)
  })
})

describe('getPhraseQuickSettleDelayMs', () => {
  it('waits for a short silence tail once the phrase is nearly complete', () => {
    expect(getPhraseQuickSettleDelayMs('hello')).toBe(615)
    expect(getPhraseQuickSettleDelayMs('i would like a coffee please')).toBe(940)
  })
})

describe('shouldUseQuickSilenceSettle', () => {
  const expected = 'I would like a coffee please'

  it('does not use the quick tail while the phrase is still partial', () => {
    expect(shouldUseQuickSilenceSettle(expected, 'I would like')).toBe(false)
  })

  it('uses the quick tail when coverage is nearly complete', () => {
    expect(shouldUseQuickSilenceSettle(expected, 'I would like a coffee please')).toBe(true)
  })
})

describe('shouldAutoFinishListening', () => {
  const expected = 'I would like a coffee please'

  it('does not auto-finish on partial transcript', () => {
    expect(shouldAutoFinishListening(expected, 'I would like')).toBe(false)
    expect(shouldRestartListeningAfterEnd(expected, 'I would like')).toBe(true)
  })

  it('auto-finishes on perfect transcript', () => {
    expect(shouldAutoFinishListening(expected, 'I would like a coffee please')).toBe(true)
    expect(shouldRestartListeningAfterEnd(expected, 'I would like a coffee please')).toBe(false)
  })

  it('auto-finishes when coverage is high enough', () => {
    const transcript = 'I would like a coffee please'
    expect(getListeningWordCoverage(expected, transcript)).toBeGreaterThanOrEqual(0.72)
    expect(shouldAutoFinishListening(expected, transcript)).toBe(true)
  })
})

describe('getExpectedWordCount', () => {
  it('normalizes contractions and punctuation', () => {
    expect(getExpectedWordCount("I'm ready, thanks.")).toBe(4)
  })
})

describe('isPerfectSpeakingPhrase', () => {
  it('treats expanded and contracted forms as equivalent', () => {
    expect(isPerfectSpeakingPhrase("Where's the nearest bus stop", 'Where is the nearest bus stop')).toBe(true)
    expect(isPerfectSpeakingPhrase('Where is the nearest bus stop', "Where's the nearest bus stop")).toBe(true)
  })
})

describe('evaluateSpeakingAnswer', () => {
  const expected = 'I forgot my keys at home again'

  it('accepts a perfect transcript', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: expected,
        transcript: 'i forgot my keys at home again',
      })
    ).toBe(true)
  })

  it('recusa quando falta uma palavra de conteúdo no fim', () => {
    // Este teste afirmava o contrário: engolir "again" era aceito porque 6 de 7 palavras davam
    // 86 e passavam do limiar de 85. Mas "esqueci minhas chaves em casa" e "...de novo" são
    // frases diferentes, e o exercício é repetir a frase da tela.
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: expected,
        transcript: 'i forgot my keys at home',
      })
    ).toBe(false)
  })

})

describe('falar português não passa num exercício de pronúncia em inglês', () => {
  // O exercício é "Ouça e Repita", com a frase em inglês na tela. A regra antiga aceitava a
  // tradução em português do card, então dizer "onde fica o banheiro" em "Where is the bathroom?"
  // valia ponto — comprovado no app rodando antes da correção.
  it('recusa a tradução falada no lugar da frase', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'Hello, how are you?',
        transcript: 'ola como vai voce',
      })
    ).toBe(false)

    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'Where is the bathroom?',
        transcript: 'onde fica o banheiro',
      })
    ).toBe(false)

    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'Thank you so much!',
        transcript: 'muito obrigado',
      })
    ).toBe(false)
  })
})

describe('uma palavra trocada reprova, não importa o tamanho da frase', () => {
  // A régra antiga era `score >= 85` com score = 1 − distância/palavras: como o denominador
  // crescia com a frase, a partir de 7 palavras uma palavra inteira trocada passava.
  const trocas: Array<[string, string]> = [
    ['I forgot my keys at home', 'I forgot my books at home'],
    ['I usually finish my report by Friday', 'I usually finish my report by Monday'],
    ['We need to discuss the budget before the meeting starts', 'We need to discuss the budget before the meeting ends'],
    ['She mentioned that the client wants a revised proposal by Monday', 'She mentioned that the client wants a revised proposal by Sunday'],
  ]

  it.each(trocas)('recusa "%s" quando a pessoa diz "%s"', (esperado, dito) => {
    expect(evaluateSpeakingAnswer({ expectedPhrase: esperado, transcript: dito })).toBe(false)
  })

  it('recusa palavra de conteúdo omitida, mesmo em frase longa', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'I want to buy a ticket to London',
        transcript: 'I want to buy a ticket London',
      })
    ).toBe(false)
  })

  it('continua aceitando a frase dita corretamente', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'We need to discuss the budget before the meeting starts',
        transcript: 'we need to discuss the budget before the meeting starts',
      })
    ).toBe(true)
  })
})

describe('ruído do reconhecedor não reprova quem falou certo', () => {
  it('perdoa UM artigo comido', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'Where is the bathroom?',
        transcript: 'where is bathroom',
      })
    ).toBe(true)
  })

  it('não perdoa dois artigos', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'The man gave the book to a friend',
        transcript: 'man gave book to a friend',
      })
    ).toBe(false)
  })

  it('ignora hesitação', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'See you later!',
        transcript: 'uh see you later',
      })
    ).toBe(true)
  })

  it('recusa quando a pessoa emenda outra frase depois', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'See you later!',
        transcript: 'see you later my dear friend',
      })
    ).toBe(false)
  })
})

describe('número por extenso e dígito são a mesma coisa', () => {
  // O ASR devolve dígito onde o card escreveu por extenso; antes isso reprovava quem falou certo.
  const equivalentes: Array<[string, string]> = [
    ['I have two cats at home', 'I have 2 cats at home'],
    ['My brother is five years old', 'My brother is 5 years old'],
    ['I need twenty dollars', 'I need 20 dollars'],
    ['She is twenty five years old', 'She is 25 years old'],
    ['It costs one hundred dollars', 'It costs 100 dollars'],
  ]

  it.each(equivalentes)('aceita "%s" transcrito como "%s"', (esperado, dito) => {
    expect(evaluateSpeakingAnswer({ expectedPhrase: esperado, transcript: dito })).toBe(true)
  })

  it('não confunde ordinal com cardinal', () => {
    expect(
      evaluateSpeakingAnswer({ expectedPhrase: 'Take the first one', transcript: 'take the 1st one' })
    ).toBe(true)

    expect(
      evaluateSpeakingAnswer({ expectedPhrase: 'Take the first one', transcript: 'take the one one' })
    ).toBe(false)
  })

  it('continua detectando número errado', () => {
    expect(
      evaluateSpeakingAnswer({ expectedPhrase: 'I have two cats at home', transcript: 'I have 3 cats at home' })
    ).toBe(false)
  })
})

describe('a pronúncia derruba acerto, mas nunca aprova sozinha', () => {
  const palavrasCertas = { expectedPhrase: 'See you later!', transcript: 'see you later' }

  const analise = (over: Partial<LocalPronunciationAssessment>): LocalPronunciationAssessment => ({
    accepted: true, score: 80, clarityScore: 80, durationScore: 80, paceScore: 80,
    rhythmScore: 80, durationMs: 1200, voicedDurationMs: 900, referenceDurationMs: 1100,
    reasons: [], ...over,
  })

  it('reprova quando o áudio é confiável e claramente ruim', () => {
    const resultado = evaluateSpeakingAnswerDetailed({
      ...palavrasCertas,
      assessment: analise({ clarityScore: 20, reasons: ['Sua voz saiu muito baixa.'] }),
      requirePronunciation: true,
    })

    expect(resultado.accepted).toBe(false)
    expect(resultado.pronunciationRejection).toBe('Sua voz saiu muito baixa.')
  })

  it('não reprova quando a medição não é confiável (falha de decodificação, timeout)', () => {
    expect(
      evaluateSpeakingAnswer({
        ...palavrasCertas,
        assessment: analise({ clarityScore: 0, score: 0, voicedDurationMs: 0 }),
        requirePronunciation: true,
      })
    ).toBe(true)
  })

  it('não reprova no Blitz, onde a checagem de áudio fica desligada', () => {
    expect(
      evaluateSpeakingAnswer({
        ...palavrasCertas,
        assessment: analise({ clarityScore: 20 }),
        requirePronunciation: false,
      })
    ).toBe(true)
  })

  it('pronúncia impecável não salva frase errada', () => {
    expect(
      evaluateSpeakingAnswer({
        expectedPhrase: 'See you later!',
        transcript: 'i love pizza',
        assessment: analise({ clarityScore: 100, score: 100 }),
        requirePronunciation: true,
      })
    ).toBe(false)
  })
})