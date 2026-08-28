import type { SeedPack } from './types'

/**
 * Pronúncia — a dimensão que faltava inteira.
 *
 * Auditoria de 28/08: das 1902 frases do catálogo, ZERO trabalhavam som. O aluno praticava
 * vocabulário, gramática e tradução, e nunca a forma como as palavras são ditas — que é
 * exatamente o que separa "entendo inglês escrito" de "converso".
 *
 * Duas decisões de formato aqui:
 *
 * 1. Cada card é uma frase REAL e traduzível, nunca um exercício solto de fonética. Isso é o que
 *    permite que estes packs funcionem em todos os modos do app — flashcard, digitação, múltipla
 *    escolha — e não só no speaking. Um card "ship /ʃɪp/ vs sheep /ʃiːp/" quebraria os outros.
 *
 * 2. O contraste vem DENTRO da frase, para o ouvido ter referência. "I saw a ship and a sheep."
 *    ensina mais que as duas palavras isoladas, porque o aluno ouve a diferença no mesmo fôlego.
 *
 * Há pack em todos os níveis de propósito: som não é conteúdo avançado. Um A1 que não distingue
 * /ɪ/ de /iː/ carrega esse erro até o C1.
 */
export const PRONUNCIA_PACKS: SeedPack[] = [
  {
    name: 'Sons que confundem',
    description: 'Pares que mudam a palavra inteira: ship e sheep, bad e bed.',
    level: 'A1',
    category: 'Conversação',
    cards: [
      ['I saw a ship and a sheep.', 'Eu vi um navio e uma ovelha.'],
      ['This is a big beach.', 'Esta é uma praia grande.'],
      ['Sit down on this seat.', 'Sente-se neste assento.'],
      ['My bed is not bad.', 'Minha cama não é ruim.'],
      ['He has a full cup.', 'Ele tem um copo cheio.'],
      ['I want to live here.', 'Eu quero morar aqui.'],
      ['Please fill the glass.', 'Por favor, encha o copo.'],
      ['That man is very tall.', 'Aquele homem é muito alto.'],
      ['She is thirty years old.', 'Ela tem trinta anos.'],
      ['Thanks for everything, Beth.', 'Obrigado por tudo, Beth.'],
      ['The food is hot.', 'A comida está quente.'],
      ['Look at the blue sky.', 'Olhe para o céu azul.'],
    ],
  },
  {
    name: 'Contrações do dia a dia',
    description: 'I am vira I am dito rápido: como o nativo realmente fala.',
    level: 'A1',
    category: 'Conversação',
    cards: [
      ["I'm ready to go.", 'Estou pronto para ir.'],
      ["It's very late.", 'Está muito tarde.'],
      ["She's my best friend.", 'Ela é minha melhor amiga.'],
      ["We're almost there.", 'Nós estamos quase lá.'],
      ["They're waiting outside.", 'Eles estão esperando lá fora.'],
      ["I haven't finished yet.", 'Eu ainda não terminei.'],
      ["He doesn't live here.", 'Ele não mora aqui.'],
      ["That's not my bag.", 'Essa não é minha bolsa.'],
      ["You're right about that.", 'Você está certo sobre isso.'],
      ["I can't hear you.", 'Eu não consigo te ouvir.'],
      ["Let's go now.", 'Vamos agora.'],
      ["Where's the nearest station?", 'Onde fica a estação mais próxima?'],
    ],
  },
  {
    name: 'O -ed do passado',
    description: 'Worked, wanted, played: a mesma letra com três sons diferentes.',
    level: 'A2',
    category: 'Conversação',
    cards: [
      ['I worked until eight.', 'Eu trabalhei até as oito.'],
      ['She walked to the station.', 'Ela foi a pé até a estação.'],
      ['We watched the whole game.', 'Nós assistimos o jogo inteiro.'],
      ['He wanted to help.', 'Ele queria ajudar.'],
      ['They waited for an hour.', 'Eles esperaram uma hora.'],
      ['I needed more time.', 'Eu precisava de mais tempo.'],
      ['She played very well.', 'Ela jogou muito bem.'],
      ['We arrived before you.', 'Nós chegamos antes de você.'],
      ['He called me twice.', 'Ele me ligou duas vezes.'],
      ['I opened the window.', 'Eu abri a janela.'],
      ['They finished the project.', 'Eles terminaram o projeto.'],
      ['She decided to stay.', 'Ela decidiu ficar.'],
    ],
  },
  {
    name: 'Onde cai a força',
    description: 'A sílaba tônica muda o sentido — e às vezes a classe da palavra.',
    level: 'A2',
    category: 'Conversação',
    cards: [
      ['I need to record this call.', 'Eu preciso gravar esta ligação.'],
      ['That was a great record.', 'Aquele foi um ótimo disco.'],
      ['They present the report today.', 'Eles apresentam o relatório hoje.'],
      ['I have a present for you.', 'Eu tenho um presente para você.'],
      ['We import most of it.', 'Nós importamos a maior parte.'],
      ['That is an important detail.', 'Esse é um detalhe importante.'],
      ['Please repeat the address.', 'Por favor, repita o endereço.'],
      ['I would like to introduce my friend.', 'Eu gostaria de apresentar meu amigo.'],
      ['She works in a hotel.', 'Ela trabalha em um hotel.'],
      ['The photograph is beautiful.', 'A fotografia está linda.'],
      ['He is a photographer.', 'Ele é fotógrafo.'],
      ['We need to develop the idea.', 'Precisamos desenvolver a ideia.'],
    ],
  },
  {
    name: 'Fala conectada',
    description: 'O nativo não separa as palavras: onde elas se colam na fala.',
    level: 'B1',
    category: 'Conversação',
    cards: [
      ['What are you doing tonight?', 'O que você vai fazer hoje à noite?'],
      ['I want to go out.', 'Eu quero sair.'],
      ['Give me a couple of minutes.', 'Me dê alguns minutos.'],
      ['Did you eat already?', 'Você já comeu?'],
      ['I have a lot of work.', 'Eu tenho muito trabalho.'],
      ['Come on in and sit down.', 'Entre e sente-se.'],
      ['Let me know if it works.', 'Me avise se funcionar.'],
      ['I picked it up yesterday.', 'Eu peguei isso ontem.'],
      ['Take a look at this.', 'Dê uma olhada nisto.'],
      ['It is kind of complicated.', 'É meio complicado.'],
      ['I have not made up my mind.', 'Eu ainda não me decidi.'],
      ['We are running out of time.', 'Estamos ficando sem tempo.'],
    ],
  },
  {
    name: 'Entonação: pergunta ou afirmação',
    description: 'A mesma frase sobe ou desce, e muda o que ela significa.',
    level: 'B1',
    category: 'Conversação',
    cards: [
      ['You are coming, right?', 'Você vem, né?'],
      ['So that is the plan.', 'Então esse é o plano.'],
      ['Are you sure about this?', 'Você tem certeza disso?'],
      ['I thought you knew.', 'Eu achei que você soubesse.'],
      ['You did what?', 'Você fez o quê?'],
      ['Hold on, let me check.', 'Espera, deixa eu verificar.'],
      ['Really, you think so?', 'Sério, você acha?'],
      ['I am not saying no.', 'Eu não estou dizendo não.'],
      ['Would you mind repeating that?', 'Você se importaria de repetir?'],
      ['It could work, I guess.', 'Poderia funcionar, eu acho.'],
      ['Wait, say that again.', 'Espera, fala isso de novo.'],
      ['That is exactly my point.', 'Esse é exatamente o meu ponto.'],
    ],
  },
  {
    name: 'Ritmo e redução',
    description: 'As palavras fracas somem na fala rápida — e é assim que soa natural.',
    level: 'B2',
    category: 'Conversação',
    cards: [
      ['I have been thinking about it.', 'Eu tenho pensado nisso.'],
      ['You should have told me earlier.', 'Você deveria ter me contado antes.'],
      ['There is nothing we can do about it.', 'Não há nada que possamos fazer sobre isso.'],
      ['It depends on what you want.', 'Depende do que você quer.'],
      ['I was going to ask you the same thing.', 'Eu ia te perguntar a mesma coisa.'],
      ['We might as well start now.', 'É melhor começarmos agora mesmo.'],
      ['That is the best we can do.', 'Isso é o melhor que podemos fazer.'],
      ['I would rather not talk about it.', 'Eu prefiro não falar sobre isso.'],
      ['As far as I know, it is fine.', 'Até onde eu sei, está tudo bem.'],
      ['It is not as simple as it looks.', 'Não é tão simples quanto parece.'],
      ['I could have sworn I locked it.', 'Eu poderia jurar que tranquei.'],
      ['Let us get this over with.', 'Vamos acabar logo com isso.'],
    ],
  },
]
