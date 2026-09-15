import { describe, expect, it } from 'vitest'
import { matchEnglishAnswer } from '@/features/game/lib/englishAnswerMatching'

describe('matchEnglishAnswer (produção PT → EN)', () => {
  describe('aceita', () => {
    it('a frase exata, ignorando maiúscula, pontuação e aspas', () => {
      expect(matchEnglishAnswer('i do not know', 'I do not know.')).toBe('exact')
      expect(matchEnglishAnswer("where's the nearest station", "Where's the nearest station?")).toBe('exact')
    })

    it('contração e forma longa como a mesma frase', () => {
      expect(matchEnglishAnswer("I don't know", 'I do not know.')).toBe('exact')
      expect(matchEnglishAnswer('I do not know', "I don't know.")).toBe('exact')
      expect(matchEnglishAnswer("I'm ready to go", 'I am ready to go.')).toBe('exact')
      expect(matchEnglishAnswer("Let's go now", 'Let us go now.')).toBe('exact')
      expect(matchEnglishAnswer('I cannot hear you', "I can't hear you.")).toBe('exact')
    })

    it('números por extenso ou em dígito', () => {
      expect(matchEnglishAnswer('I have 2 brothers', 'I have two brothers.')).toBe('exact')
    })
  })

  describe('quase (passa raspando, nunca como acerto limpo)', () => {
    it('erro de digitação pequeno em palavra longa', () => {
      expect(matchEnglishAnswer('I want to go outsdie', 'I want to go outside.')).toBe('partial')
      expect(matchEnglishAnswer('She drinks orenge juice', 'She drinks orange juice.')).toBe('partial')
      expect(matchEnglishAnswer('My favorite colour is blue', 'My favorite color is blue.')).toBe('partial')
    })

    it('palavra curta não tolera erro de digitação: uma letra já é outra palavra', () => {
      expect(matchEnglishAnswer('I want to live hree', 'I want to live here.')).toBe('wrong')
      expect(matchEnglishAnswer('I love here', 'I live here.')).toBe('wrong')
    })

    it('um artigo a mais ou a menos', () => {
      expect(matchEnglishAnswer('I have meeting in the morning', 'I have a meeting in the morning.')).toBe('partial')
      expect(matchEnglishAnswer('She works in the hotel', 'She works in a hotel.')).toBe('partial')
    })
  })

  describe('reprova', () => {
    it('negação removida ou acrescentada — "not" nunca é opcional nem aproximado', () => {
      expect(matchEnglishAnswer('I know', 'I do not know.')).toBe('wrong')
      expect(matchEnglishAnswer('I do know', 'I do not know.')).toBe('wrong')
      expect(matchEnglishAnswer('I like cold weather', 'I do not like cold weather.')).toBe('wrong')
      expect(matchEnglishAnswer('She is here today', 'She is not here today.')).toBe('wrong')
      expect(matchEnglishAnswer('I not know', 'I do not know.')).toBe('wrong')
    })

    it('palavra de conteúdo trocada, mesmo parecida', () => {
      expect(matchEnglishAnswer('I want to leave here', 'I want to live here.')).toBe('wrong')
      expect(matchEnglishAnswer('See you on Monday', 'See you on Friday.')).toBe('wrong')
      expect(matchEnglishAnswer('He hates waiting', 'He loves waiting.')).toBe('wrong')
      expect(matchEnglishAnswer('I saw a ship', 'I saw a sheep.')).toBe('wrong')
      expect(matchEnglishAnswer('My bed is not bad', 'My bad is not bed.')).toBe('wrong')
    })

    it('sujeito, pronome ou preposição trocados', () => {
      expect(matchEnglishAnswer('You need more time', 'I need more time.')).toBe('wrong')
      expect(matchEnglishAnswer('She is my best friend', 'He is my best friend.')).toBe('wrong')
      expect(matchEnglishAnswer('I get up in 7', 'I get up at 7.')).toBe('wrong')
      expect(matchEnglishAnswer('Give me your keys', 'Give me my keys.')).toBe('wrong')
    })

    it('frase truncada ou com palavra a mais', () => {
      expect(matchEnglishAnswer('I want to', 'I want to go out.')).toBe('wrong')
      expect(matchEnglishAnswer('I really like your house', 'I like your house.')).toBe('wrong')
      expect(matchEnglishAnswer('Where are you from', 'Where are you?')).toBe('wrong')
    })

    it('dois artigos errados já é erro', () => {
      expect(matchEnglishAnswer('Blue shirt looks nicer than red one', 'The blue shirt looks nicer than the red one.')).toBe('wrong')
    })

    it('português no lugar do inglês', () => {
      expect(matchEnglishAnswer('Eu não sei', 'I do not know.')).toBe('wrong')
    })

    it('resposta vazia', () => {
      expect(matchEnglishAnswer('   ', 'I do not know.')).toBe('wrong')
    })
  })
})
