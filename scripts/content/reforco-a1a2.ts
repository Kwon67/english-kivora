import type { SeedPack } from './types'

/**
 * Reforço de A1/A2, guiado por medição e não por intuição.
 *
 * A auditoria de 28/08 contou marcadores gramaticais nas 937 frases dos dois níveis. O que estava
 * saudável ficou de fora daqui; o que estava furado virou pack:
 *
 *   A1 — negativas em 4% (19 de 468). Negar é das primeiras coisas que alguém precisa dizer num
 *        idioma ("não entendi", "não tenho", "não é isso"), e estava quase ausente.
 *   A2 — passado em 7% e comparativo em 3%. São as duas marcas que DEFINEM o A2: contar o que
 *        aconteceu e comparar duas coisas. Sem elas o nível é A1 com vocabulário maior.
 *
 * Os packs abaixo levam esses três números para uma faixa saudável sem inchar o catálogo.
 */
export const REFORCO_PACKS: SeedPack[] = [
  {
    name: 'Dizendo não',
    description: 'Negar com naturalidade: não sei, não tenho, não é isso.',
    level: 'A1',
    category: 'Gramática',
    cards: [
      ['I do not know.', 'Eu não sei.'],
      ['That is not correct.', 'Isso não está certo.'],
      ['She is not here today.', 'Ela não está aqui hoje.'],
      ['We do not have time for that.', 'Nós não temos tempo para isso.'],
      ['He cannot come tonight.', 'Ele não pode vir hoje à noite.'],
      ['I am not ready yet.', 'Eu ainda não estou pronto.'],
      ['They do not live here anymore.', 'Eles não moram mais aqui.'],
      ['It is not a problem.', 'Não é um problema.'],
      ['I do not want anything.', 'Eu não quero nada.'],
      ['You are not late.', 'Você não está atrasado.'],
      ['She does not speak Portuguese.', 'Ela não fala português.'],
      ['That is not what I said.', 'Não foi isso que eu disse.'],
    ],
  },
  {
    name: 'Não, não e não: respostas negativas',
    description: 'Recusar, discordar e corrigir sem soar rude.',
    level: 'A1',
    category: 'Conversação',
    cards: [
      ['No, thank you.', 'Não, obrigado.'],
      ['Sorry, I cannot.', 'Desculpe, eu não posso.'],
      ['Not right now.', 'Agora não.'],
      ['I do not think so.', 'Eu acho que não.'],
      ['Maybe another day.', 'Talvez outro dia.'],
      ['I am sorry, I do not understand.', 'Desculpe, eu não entendo.'],
      ['That is not mine.', 'Isso não é meu.'],
      ['No, it is over there.', 'Não, é ali.'],
      ['I never do that.', 'Eu nunca faço isso.'],
      ['Nobody is home.', 'Não tem ninguém em casa.'],
      ['There is nothing here.', 'Não tem nada aqui.'],
      ['Not yet, sorry.', 'Ainda não, desculpe.'],
    ],
  },
  {
    name: 'Ontem: mais verbos irregulares',
    description: 'A segunda leva dos irregulares que aparecem toda hora.',
    level: 'A2',
    category: 'Gramática',
    cards: [
      ['I woke up very early.', 'Eu acordei muito cedo.'],
      ['She wrote me a long message.', 'Ela me escreveu uma mensagem longa.'],
      ['We drove for three hours.', 'Nós dirigimos por três horas.'],
      ['He read the whole book.', 'Ele leu o livro inteiro.'],
      ['They left without saying goodbye.', 'Eles foram embora sem se despedir.'],
      ['I forgot my password again.', 'Eu esqueci minha senha de novo.'],
      ['She brought something for us.', 'Ela trouxe algo para nós.'],
      ['We spent too much money.', 'Nós gastamos dinheiro demais.'],
      ['He found it under the table.', 'Ele achou isso embaixo da mesa.'],
      ['I felt tired all day.', 'Eu me senti cansado o dia todo.'],
      ['They understood the problem.', 'Eles entenderam o problema.'],
      ['She kept the receipt.', 'Ela guardou o recibo.'],
    ],
  },
  {
    name: 'Contando uma história curta',
    description: 'Encadear o que aconteceu: primeiro, depois, no fim.',
    level: 'A2',
    category: 'Conversação',
    cards: [
      ['It happened last week.', 'Aconteceu semana passada.'],
      ['First, I missed the bus.', 'Primeiro, eu perdi o ônibus.'],
      ['Then it started to rain.', 'Aí começou a chover.'],
      ['I did not have an umbrella.', 'Eu não tinha guarda-chuva.'],
      ['After that, my phone died.', 'Depois disso, meu celular morreu.'],
      ['I arrived an hour late.', 'Eu cheguei uma hora atrasado.'],
      ['Nobody was angry, luckily.', 'Ninguém ficou bravo, por sorte.'],
      ['In the end, it was fine.', 'No fim, deu tudo certo.'],
      ['It was a really long day.', 'Foi um dia muito longo.'],
      ['I will never forget it.', 'Eu nunca vou esquecer.'],
      ['We laughed about it later.', 'Nós rimos disso depois.'],
      ['That is what happened.', 'Foi isso que aconteceu.'],
    ],
  },
  {
    name: 'Comparativos e superlativos',
    description: 'Maior, melhor, o mais barato: comparar duas coisas ou todas.',
    level: 'A2',
    category: 'Gramática',
    cards: [
      ['This one is cheaper.', 'Este é mais barato.'],
      ['My apartment is smaller than yours.', 'Meu apartamento é menor que o seu.'],
      ['She is taller than her brother.', 'Ela é mais alta que o irmão.'],
      ['This is the best option.', 'Esta é a melhor opção.'],
      ['That was the worst part.', 'Aquela foi a pior parte.'],
      ['Today is warmer than yesterday.', 'Hoje está mais quente que ontem.'],
      ['It is more expensive than I thought.', 'É mais caro do que eu pensava.'],
      ['This is the biggest room.', 'Este é o maior quarto.'],
      ['The second one is easier.', 'O segundo é mais fácil.'],
      ['He works harder than everyone.', 'Ele trabalha mais que todo mundo.'],
      ['It is not as good as before.', 'Não está tão bom quanto antes.'],
      ['That is the fastest way.', 'Esse é o caminho mais rápido.'],
    ],
  },
  {
    name: 'Negando no passado e no futuro',
    description: 'Não fui, não vou, não consegui: negar fora do presente.',
    level: 'A2',
    category: 'Gramática',
    cards: [
      ['I did not go yesterday.', 'Eu não fui ontem.'],
      ['She did not answer my message.', 'Ela não respondeu minha mensagem.'],
      ['We were not at home.', 'Nós não estávamos em casa.'],
      ['He was not feeling well.', 'Ele não estava se sentindo bem.'],
      ['They did not tell me anything.', 'Eles não me disseram nada.'],
      ['I will not be there tomorrow.', 'Eu não vou estar lá amanhã.'],
      ['It is not going to work.', 'Isso não vai funcionar.'],
      ['She is not going to like it.', 'Ela não vai gostar disso.'],
      ['I could not find the address.', 'Eu não consegui achar o endereço.'],
      ['We did not have enough time.', 'Nós não tivemos tempo suficiente.'],
      ['He has not arrived yet.', 'Ele ainda não chegou.'],
      ['I have not seen that movie.', 'Eu não vi esse filme.'],
    ],
  },
]
