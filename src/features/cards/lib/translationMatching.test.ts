import { describe, expect, it } from 'vitest'
import {
  areTranslationsEquivalent,
  classifyTranslationAnswer,
  isAcceptedTranslationAnswer,
} from '@/features/cards/lib/translationMatching'

const accepted = (input: string, correct: string) => isAcceptedTranslationAnswer(input, [correct])
const classify = (input: string, correct: string) => classifyTranslationAnswer(input, [correct])

describe('translationMatching', () => {
  describe('o que continua passando', () => {
    it('aceita a resposta exata, ignorando acento, maiúscula e pontuação', () => {
      expect(classify('eu nao sei', 'Eu não sei.')).toBe('exact')
      expect(classify('ONDE FICA O BANHEIRO', 'Onde fica o banheiro?')).toBe('exact')
    })

    it('aceita sinônimos explícitos configurados no card como exatos', () => {
      const withSynonyms = ['Olá, como você está?', 'Olá, como vai você?']
      expect(classifyTranslationAnswer('Olá, como vai você?', withSynonyms)).toBe('exact')
    })

    it('aceita alternativas separadas por barra no gabarito', () => {
      expect(classifyTranslationAnswer('Desculpe', ['Com licença / Desculpe.'])).toBe('exact')
      expect(classifyTranslationAnswer('Com licença', ['Com licença / Desculpe.'])).toBe('exact')
    })

    it('aceita cumprimentos equivalentes do grupo de apelidos', () => {
      expect(areTranslationsEquivalent('Olá, como vai você?', 'Olá, como você está?')).toBe(true)
      expect(classify('Olá, como vai você?', 'Olá, como você está?')).toBe('equivalent')
    })

    it('aceita sujeito omitido — português deixa o pronome cair', () => {
      expect(classify('Não sei', 'Eu não sei')).toBe('equivalent')
      expect(classify('Eu não sei', 'Não sei')).toBe('equivalent')
      expect(classify('Quero ir pra casa', 'Eu quero ir para casa')).toBe('equivalent')
    })

    it('aceita registro coloquial (tá/está, vc/você, pra/para)', () => {
      expect(classify('Ela tá aqui', 'Ela está aqui')).toBe('equivalent')
      expect(classify('vc pode me ajudar', 'Você pode me ajudar?')).toBe('equivalent')
    })

    it('ignora artigos e preposições que só variam de registro', () => {
      expect(classify('Eu gosto do café', 'Eu gosto de café')).toBe('equivalent')
      expect(classify('Vou ao trabalho', 'Vou para o trabalho')).toBe('equivalent')
    })

    it('trata erro de digitação pequeno em palavra longa como "quase", não como erro', () => {
      expect(classify('Eu quero morrar aqui', 'Eu quero morar aqui')).toBe('close')
      expect(classify('Onde fica o banheirro', 'Onde fica o banheiro?')).toBe('close')
      expect(accepted('Eu quero morrar aqui', 'Eu quero morar aqui')).toBe(false)
    })
  })

  describe('o que passava e não pode mais', () => {
    it('reprova negação removida ou acrescentada', () => {
      expect(classify('Eu quero ir', 'Eu não quero ir')).toBe('wrong')
      expect(classify('Eu gosto de café', 'Eu não gosto de café')).toBe('wrong')
      expect(classify('Eu entendo', 'Eu não entendo')).toBe('wrong')
      expect(classify('Eu sei', 'Eu não sei')).toBe('wrong')
      expect(classify('Eu não posso ir', 'Eu posso ir')).toBe('wrong')
      expect(classify('Ela está aqui', 'Ela não está aqui')).toBe('wrong')
      expect(classify('Sim, obrigado', 'Não, obrigado')).toBe('wrong')
    })

    it('reprova polaridade trocada (nunca/sempre, com/sem)', () => {
      expect(classify('Eu sempre fui lá', 'Eu nunca fui lá')).toBe('wrong')
      expect(classify('Café com açúcar', 'Café sem açúcar')).toBe('wrong')
    })

    it('reprova sujeito trocado — omitir é normal, trocar é outra frase', () => {
      expect(classify('Você não quero nada', 'Eu não quero nada')).toBe('wrong')
      expect(classify('Onde ele mora?', 'Onde você mora?')).toBe('wrong')
      expect(classify('Você preciso de mais tempo', 'Eu preciso de mais tempo')).toBe('wrong')
    })

    it('reprova palavra de conteúdo trocada por outra parecida', () => {
      expect(classify('Eu vou para cama', 'Eu vou para casa')).toBe('wrong')
      expect(classify('Eu quero correr', 'Eu quero comer')).toBe('wrong')
      expect(classify('Eu estou com sono', 'Eu estou com fome')).toBe('wrong')
      expect(classify('Ela é minha mãe', 'Ela é minha irmã')).toBe('wrong')
      expect(classify('Onde fica o banco?', 'Onde fica o banheiro?')).toBe('wrong')
      expect(classify('Você deve me ajudar', 'Você pode me ajudar?')).toBe('wrong')
    })

    it('reprova antônimos e trocas de tempo', () => {
      expect(classify('Ele chegou depois', 'Ele chegou antes')).toBe('wrong')
      expect(classify('Eu trabalho amanhã', 'Eu trabalho hoje')).toBe('wrong')
      expect(classify('Eu quero menos', 'Eu quero mais')).toBe('wrong')
      expect(classify('Ele vendeu um carro', 'Ele comprou um carro')).toBe('wrong')
      expect(classify('Eu estou ensinando inglês', 'Eu estou aprendendo inglês')).toBe('wrong')
      expect(classify('Eu tenho três irmãos', 'Eu tenho dois irmãos')).toBe('wrong')
    })

    it('reprova frase truncada — a substring não é mais atalho', () => {
      expect(classify('Eu amo', 'Eu te amo')).toBe('wrong')
      expect(classify('Quanto custa?', 'Quanto custa isso?')).toBe('wrong')
      expect(classify('Eu gosto de você', 'Eu gosto muito de você')).toBe('wrong')
      expect(classify('Você sabe se tem uma farmácia perto', 'Você sabe se tem uma farmácia perto daqui?')).toBe('wrong')
    })

    it('reprova pronome de OBJETO omitido — só o sujeito pode cair', () => {
      expect(classify('Eu concordo com', 'Eu concordo com você')).toBe('wrong')
      expect(classify('O que aconteceu com', 'O que aconteceu com você?')).toBe('wrong')
      expect(classify('Prazer em conhecer', 'Prazer em conhecer você')).toBe('wrong')
      expect(classify('Foi bom conversar com', 'Foi bom conversar com você')).toBe('wrong')
    })

    it('não confunde o verbo "é" com a conjunção "e"', () => {
      expect(classify('De onde você', 'De onde você é?')).toBe('wrong')
      expect(classify('de onde voce e', 'De onde você é?')).toBe('equivalent')
      expect(classify('Não, ele não', 'Não, ele não é.')).toBe('wrong')
    })

    it('não confunde o pronome "nós" com a contração "nos"', () => {
      expect(classify('Ela trouxe algo para', 'Ela trouxe algo para nós.')).toBe('wrong')
      expect(classify('Ela trouxe algo para nos', 'Ela trouxe algo para nós.')).toBe('equivalent')
      expect(classify('Não temos tempo', 'Nós não temos tempo.')).toBe('equivalent')
      expect(classify('nos nao temos tempo', 'Nós não temos tempo.')).toBe('equivalent')
    })

    it('reprova palavra de conteúdo a mais', () => {
      expect(classify('Eu não quero nada agora', 'Eu não quero nada')).toBe('wrong')
    })

    it('não divide mais o gabarito em ";" nem em " ou "', () => {
      expect(
        classifyTranslationAnswer('você pode repetir mais devagar', ['Desculpe, não entendi; você pode repetir mais devagar?'])
      ).toBe('wrong')
      expect(classifyTranslationAnswer('inglês', ['Você fala português ou inglês?'])).toBe('wrong')
    })

    it('não deixa o apelido antigo "está = vai = bem" passar', () => {
      expect(classify('Ela vai', 'Ela está bem')).toBe('wrong')
    })

    it('rejects unrelated translations', () => {
      expect(isAcceptedTranslationAnswer('Bom dia, tudo certo?', ['Olá, como você está?'])).toBe(false)
    })
  })
})
