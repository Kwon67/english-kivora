/**
 * O mapa do que o catálogo deveria cobrir.
 *
 * As 16 coleções que existiam eram quase todas conversa social em A1–A2, todas na categoria
 * "Geral", e nada em C1/C2. Este plano preenche os buracos por dois eixos ao mesmo tempo:
 * o domínio da vida real (trabalho, saúde, viagem, moradia...) e a função da linguagem, que é
 * o que muda de verdade entre um nível e outro — A1 pede o essencial, B2 pede nuance e
 * negociação, C1 pede registro e implícito.
 *
 * Cada entrada vira uma coleção pública. O `topic` é o que vai para a IA; o `name` e a
 * `description` são o que a pessoa lê.
 */

export type CatalogEntry = {
  name: string
  description: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  category: 'Conversação' | 'Viagem' | 'Negócios' | 'Gramática' | 'Geral'
  topic: string
}

export const CATALOG_PLAN: CatalogEntry[] = [
  // ---------- Viagem: o domínio mais pedido e hoje quase inexistente ----------
  {
    name: 'No aeroporto',
    description: 'Check-in, bagagem, embarque e o que dizer quando algo atrasa.',
    level: 'A2',
    category: 'Viagem',
    topic: 'airport check-in, luggage, boarding, security and flight delays',
  },
  {
    name: 'Chegando no hotel',
    description: 'Reserva, quarto, pedidos na recepção e problemas comuns da estadia.',
    level: 'A2',
    category: 'Viagem',
    topic: 'hotel check-in, room requests, amenities and complaints at the front desk',
  },
  {
    name: 'Pedindo direção na rua',
    description: 'Se localizar, entender a resposta e confirmar que entendeu certo.',
    level: 'A1',
    category: 'Viagem',
    topic: 'asking for and understanding directions on the street, landmarks and distances',
  },
  {
    name: 'Transporte público e táxi',
    description: 'Comprar passagem, confirmar o trajeto e resolver quando erra a parada.',
    level: 'A2',
    category: 'Viagem',
    topic: 'buying tickets, taking buses, trains and taxis, confirming routes and stops',
  },
  {
    name: 'Alugando um carro',
    description: 'Contrato, seguro, combustível e o que falar se der problema na estrada.',
    level: 'B1',
    category: 'Viagem',
    topic: 'renting a car, insurance, fuel, traffic rules and roadside problems',
  },
  {
    name: 'Passando pela imigração',
    description: 'Responder ao oficial com clareza: motivo, tempo e onde vai ficar.',
    level: 'B1',
    category: 'Viagem',
    topic: 'immigration and customs questions, purpose of trip, length of stay, declarations',
  },

  // ---------- Saúde: ausente hoje, e é o domínio onde travar dói mais ----------
  {
    name: 'Na farmácia',
    description: 'Descrever um sintoma simples e entender a instrução do remédio.',
    level: 'A2',
    category: 'Geral',
    topic: 'buying medicine at a pharmacy, describing simple symptoms, dosage instructions',
  },
  {
    name: 'Consulta médica',
    description: 'Contar o que está sentindo, há quanto tempo, e entender o diagnóstico.',
    level: 'B1',
    category: 'Geral',
    topic: 'doctor appointment, describing symptoms and duration, understanding a diagnosis',
  },
  {
    name: 'Emergência e socorro',
    description: 'As frases que precisam sair rápido e sem pensar quando algo dá errado.',
    level: 'A2',
    category: 'Geral',
    topic: 'emergencies, calling for help, accidents, urgent medical situations',
  },

  // ---------- Trabalho: a categoria "Negócios" existe e está vazia ----------
  {
    name: 'Primeiro dia no trabalho',
    description: 'Se apresentar, entender o que esperam de você e pedir ajuda sem constrangimento.',
    level: 'A2',
    category: 'Negócios',
    topic: 'first day at a new job, introductions, asking where things are and what is expected',
  },
  {
    name: 'Reunião de equipe',
    description: 'Entrar na conversa, concordar, discordar e pedir para repetir.',
    level: 'B1',
    category: 'Negócios',
    topic: 'team meetings, taking turns, agreeing, disagreeing politely, asking for repetition',
  },
  {
    name: 'E-mail profissional',
    description: 'Abrir, pedir, cobrar e fechar um e-mail sem soar rude nem robótico.',
    level: 'B1',
    category: 'Negócios',
    topic: 'professional email phrases: openings, requests, follow-ups, closings',
  },
  {
    name: 'Ligação de trabalho',
    description: 'Atender, se identificar, segurar a linha e lidar com áudio ruim.',
    level: 'B1',
    category: 'Negócios',
    topic: 'work phone calls, identifying yourself, holding, transferring, bad connection',
  },
  {
    name: 'Entrevista de emprego',
    description: 'Falar da sua experiência, dos seus pontos fracos e fazer as suas perguntas.',
    level: 'B2',
    category: 'Negócios',
    topic: 'job interview answers, describing experience, strengths and weaknesses, asking questions',
  },
  {
    name: 'Apresentando uma ideia',
    description: 'Estruturar o argumento, sustentar sob pergunta e ceder quando faz sentido.',
    level: 'B2',
    category: 'Negócios',
    topic: 'presenting an idea, structuring an argument, handling questions and pushback',
  },
  {
    name: 'Negociando prazo e escopo',
    description: 'Dizer não, propor alternativa e fechar acordo sem queimar a relação.',
    level: 'C1',
    category: 'Negócios',
    topic: 'negotiating deadlines and scope, saying no diplomatically, proposing alternatives',
  },
  {
    name: 'Feedback difícil',
    description: 'Dar e receber crítica no trabalho com o cuidado que o inglês exige.',
    level: 'C1',
    category: 'Negócios',
    topic: 'giving and receiving difficult feedback at work, hedging, softening criticism',
  },

  // ---------- Casa e vida prática ----------
  {
    name: 'Procurando onde morar',
    description: 'Visitar, perguntar do contrato e entender o que está incluso.',
    level: 'B1',
    category: 'Geral',
    topic: 'renting an apartment, viewing, lease terms, what is included, deposits',
  },
  {
    name: 'Problemas em casa',
    description: 'Chamar o conserto, explicar o defeito e combinar horário.',
    level: 'B1',
    category: 'Geral',
    topic: 'household problems, calling a repair service, describing what broke, scheduling',
  },
  {
    name: 'Banco e dinheiro',
    description: 'Abrir conta, resolver cobrança errada e entender taxa.',
    level: 'B1',
    category: 'Geral',
    topic: 'bank accounts, cards, wrong charges, fees and transfers',
  },
  {
    name: 'No supermercado',
    description: 'Achar o produto, perguntar preço e lidar com o caixa.',
    level: 'A1',
    category: 'Geral',
    topic: 'grocery shopping, finding products, prices, quantities, checkout',
  },
  {
    name: 'Cozinhando e receitas',
    description: 'Ingredientes, modo de preparo e restrição alimentar.',
    level: 'A2',
    category: 'Geral',
    topic: 'cooking, ingredients, recipe steps, dietary restrictions and allergies',
  },

  // ---------- Conversação: profundidade que hoje para em small talk ----------
  {
    name: 'Contando o que aconteceu',
    description: 'Narrar um episódio do começo ao fim, com os tempos verbais certos.',
    level: 'B1',
    category: 'Conversação',
    topic: 'telling a story about a past event, sequencing with past simple and past continuous',
  },
  {
    name: 'Falando de planos',
    description: 'O que é certo, o que é provável e o que é só ideia.',
    level: 'A2',
    category: 'Conversação',
    topic: 'talking about future plans, degrees of certainty, going to vs will vs present continuous',
  },
  {
    name: 'Concordando e discordando',
    description: 'Discordar sem brigar e concordar sem parecer puxa-saco.',
    level: 'B1',
    category: 'Conversação',
    topic: 'agreeing and disagreeing, partial agreement, softening a disagreement',
  },
  {
    name: 'Descrevendo pessoas',
    description: 'Aparência, personalidade e o que a pessoa costuma fazer.',
    level: 'A2',
    category: 'Conversação',
    topic: 'describing people: appearance, personality, habits and relationships',
  },
  {
    name: 'Dando e pedindo conselho',
    description: 'Sugerir, ponderar e responder a quem está em dúvida.',
    level: 'B1',
    category: 'Conversação',
    topic: 'giving and asking for advice, suggestions, should and would',
  },
  {
    name: 'Reclamando de um problema',
    description: 'Explicar o que deu errado e pedir solução com firmeza educada.',
    level: 'B1',
    category: 'Conversação',
    topic: 'complaining about a product or service, explaining the problem, requesting a solution',
  },
  {
    name: 'Se desculpando',
    description: 'Do "foi mal" ao pedido de desculpa sério, com a força certa.',
    level: 'A2',
    category: 'Conversação',
    topic: 'apologizing at different levels of seriousness, taking responsibility, making amends',
  },
  {
    name: 'Conversa difícil',
    description: 'Encerrar, recusar e cobrar sem estragar a relação.',
    level: 'B2',
    category: 'Conversação',
    topic: 'difficult conversations: declining, setting boundaries, following up on unmet promises',
  },
  {
    name: 'Humor e ironia',
    description: 'Perceber quando não é literal — e responder à altura.',
    level: 'C1',
    category: 'Conversação',
    topic: 'humor, sarcasm and irony in everyday English, understatement, playful teasing',
  },

  // ---------- Gramática viva: a categoria existe e está vazia ----------
  {
    name: 'Phrasal verbs do dia a dia',
    description: 'Os que aparecem toda hora e mudam de sentido com a partícula.',
    level: 'B1',
    category: 'Gramática',
    topic: 'the most common everyday phrasal verbs used in full natural sentences',
  },
  {
    name: 'Se e talvez: condicionais',
    description: 'Hipótese, consequência e arrependimento nas três formas mais usadas.',
    level: 'B1',
    category: 'Gramática',
    topic: 'first, second and third conditionals in natural spoken sentences',
  },
  {
    name: 'Present perfect na prática',
    description: 'O tempo que não existe em português, em frases que você usaria.',
    level: 'B1',
    category: 'Gramática',
    topic: 'present perfect vs past simple in real conversation, already, yet, just, ever',
  },
  {
    name: 'Pedidos indiretos',
    description: 'A estrutura que transforma ordem em pedido educado.',
    level: 'B2',
    category: 'Gramática',
    topic: 'indirect questions and polite requests: could you tell me, I was wondering if',
  },
  {
    name: 'Voz passiva sem susto',
    description: 'Quando o que importa é o que aconteceu, não quem fez.',
    level: 'B2',
    category: 'Gramática',
    topic: 'passive voice in everyday and workplace English',
  },
  {
    name: 'Expressões idiomáticas',
    description: 'O que os nativos dizem e o dicionário não explica.',
    level: 'B2',
    category: 'Gramática',
    topic: 'common English idioms used naturally in context, with meaning clear from the sentence',
  },
  {
    name: 'Conectando ideias',
    description: 'However, though, whereas: a costura que separa B1 de C1.',
    level: 'C1',
    category: 'Gramática',
    topic: 'advanced linking and discourse markers: however, whereas, nonetheless, in fact',
  },
  // =====================================================================================
  // Segunda leva: equilíbrio entre níveis.
  //
  // Depois da primeira semeadura o acervo tinha 242 frases em B1 e só 82 em B2, 48 em C1 e
  // nenhuma em C2. Quem faz o nivelamento e cai em B2 encontrava oito dias de material. Estas
  // entradas existem para corrigir o formato da curva, não para aumentar o total: o grosso vai
  // para as pontas famintas, e B1 recebe só o que faltava de assunto.
  // =====================================================================================

  // ---------- A1: a rampa de entrada, hoje curta demais ----------
  {
    name: 'Números e horas',
    description: 'Dizer quantidade, preço e que horas são sem travar.',
    level: 'A1',
    category: 'Geral',
    topic: 'numbers, prices, telling the time and asking what time it is',
  },
  {
    name: 'Dias, meses e datas',
    description: 'Marcar quando as coisas acontecem.',
    level: 'A1',
    category: 'Geral',
    topic: 'days of the week, months, dates, saying when something happens',
  },
  {
    name: 'Cores, formas e tamanhos',
    description: 'Descrever um objeto para alguém achar.',
    level: 'A1',
    category: 'Geral',
    topic: 'colors, shapes, sizes and simple physical descriptions of objects',
  },
  {
    name: 'Minha família',
    description: 'Quem é quem em casa e como falar deles.',
    level: 'A1',
    category: 'Conversação',
    topic: 'family members, relationships and simple facts about your family',
  },
  {
    name: 'Comidas e bebidas',
    description: 'O que você gosta, o que você quer e o que você não come.',
    level: 'A1',
    category: 'Geral',
    topic: 'basic food and drink, likes and dislikes, ordering something simple',
  },
  {
    name: 'O tempo lá fora',
    description: 'Clima: o assunto que todo mundo puxa quando não sabe o que dizer.',
    level: 'A1',
    category: 'Conversação',
    topic: 'weather, seasons and simple small talk about the weather',
  },
  {
    name: 'Onde as coisas estão',
    description: 'In, on, under, next to: a gramática que resolve o dia a dia.',
    level: 'A1',
    category: 'Gramática',
    topic: 'prepositions of place in simple sentences: in, on, under, next to, between',
  },
  {
    name: 'Respostas curtas',
    description: 'Yes, I do. No, I am not. Responder sem repetir a frase inteira.',
    level: 'A1',
    category: 'Gramática',
    topic: 'short answers with do, does, am, is, are, can in natural conversation',
  },

  // ---------- A2 ----------
  {
    name: 'Meu trabalho e meus estudos',
    description: 'Contar o que você faz e onde estuda sem decorar um texto.',
    level: 'A2',
    category: 'Conversação',
    topic: 'talking about your job, studies, daily responsibilities and schedule',
  },
  {
    name: 'Roupas e tamanhos',
    description: 'Provar, trocar e pedir outro número.',
    level: 'A2',
    category: 'Geral',
    topic: 'clothes shopping, sizes, trying on, exchanging and returning items',
  },
  {
    name: 'Convites e recusas',
    description: 'Chamar alguém e dizer não sem parecer grosso.',
    level: 'A2',
    category: 'Conversação',
    topic: 'inviting someone, accepting and declining invitations politely',
  },
  {
    name: 'Comparando coisas',
    description: 'Maior, mais barato, o melhor de todos.',
    level: 'A2',
    category: 'Gramática',
    topic: 'comparatives and superlatives in everyday comparisons',
  },
  {
    name: 'Tecnologia do dia a dia',
    description: 'Celular, senha, aplicativo e o que dizer quando não funciona.',
    level: 'A2',
    category: 'Geral',
    topic: 'phones, apps, passwords, wifi and simple tech problems',
  },
  {
    name: 'Marcando um horário',
    description: 'Agendar, remarcar e confirmar.',
    level: 'A2',
    category: 'Geral',
    topic: 'making, changing and confirming appointments by phone or in person',
  },

  // ---------- B1: só os assuntos que faltavam ----------
  {
    name: 'Notícias e atualidades',
    description: 'Comentar o que está acontecendo sem virar debate.',
    level: 'B1',
    category: 'Conversação',
    topic: 'talking about current events and news, reacting to what you heard',
  },
  {
    name: 'Entendendo instruções',
    description: 'Seguir um passo a passo e pedir para repetir a parte que escapou.',
    level: 'B1',
    category: 'Geral',
    topic: 'following and clarifying instructions, asking someone to repeat or slow down',
  },
  {
    name: 'Verbos modais no cotidiano',
    description: 'Must, might, should: obrigação, possibilidade e conselho.',
    level: 'B1',
    category: 'Gramática',
    topic: 'modal verbs for obligation, possibility, advice and deduction',
  },
  {
    name: 'Mensagens e redes sociais',
    description: 'O inglês encurtado de chat, comentário e legenda.',
    level: 'B1',
    category: 'Conversação',
    topic: 'texting, chat abbreviations, comments and captions in informal written English',
  },

  // ---------- B2: o maior buraco do acervo ----------
  {
    name: 'Argumentando com dados',
    description: 'Sustentar um ponto com número, fonte e ressalva.',
    level: 'B2',
    category: 'Negócios',
    topic: 'making an argument with data, citing evidence, adding caveats',
  },
  {
    name: 'Reuniões online',
    description: 'Áudio ruim, interrupção e o pedido de compartilhar tela.',
    level: 'B2',
    category: 'Negócios',
    topic: 'video calls: connection problems, interrupting, screen sharing, wrapping up',
  },
  {
    name: 'Conflito no time',
    description: 'Divergir, mediar e chegar num acordo sem escalar.',
    level: 'B2',
    category: 'Negócios',
    topic: 'workplace disagreement, mediating, finding common ground, de-escalating',
  },
  {
    name: 'Falando de carreira',
    description: 'Promoção, mudança de área e o que você quer daqui a três anos.',
    level: 'B2',
    category: 'Negócios',
    topic: 'career paths, promotions, changing fields, long-term professional goals',
  },
  {
    name: 'Meio ambiente',
    description: 'Clima, consumo e a conversa que aparece em qualquer mesa hoje.',
    level: 'B2',
    category: 'Conversação',
    topic: 'environment, climate, sustainable habits and consumption',
  },
  {
    name: 'Saúde mental e bem-estar',
    description: 'Falar de cansaço, limite e cuidado com as palavras certas.',
    level: 'B2',
    category: 'Conversação',
    topic: 'mental health, burnout, boundaries and wellbeing in careful language',
  },
  {
    name: 'Educação e aprendizado',
    description: 'Como se aprende, o que não funcionou e o que você mudaria.',
    level: 'B2',
    category: 'Conversação',
    topic: 'education systems, learning methods, reflecting on how you learn',
  },
  {
    name: 'Dinheiro e investimento',
    description: 'Poupar, arriscar e explicar uma decisão financeira.',
    level: 'B2',
    category: 'Geral',
    topic: 'saving, investing, financial decisions and explaining trade-offs',
  },
  {
    name: 'Cultura e entretenimento',
    description: 'Recomendar, criticar e discordar de gosto.',
    level: 'B2',
    category: 'Conversação',
    topic: 'films, music, books and shows: recommending, criticizing, disagreeing about taste',
  },
  {
    name: 'Tecnologia e privacidade',
    description: 'Dados, algoritmo e o que você aceita entregar.',
    level: 'B2',
    category: 'Conversação',
    topic: 'technology, data privacy, algorithms and their trade-offs',
  },
  {
    name: 'Discurso reportado',
    description: 'Contar o que a outra pessoa disse, com o tempo verbal certo.',
    level: 'B2',
    category: 'Gramática',
    topic: 'reported speech in natural conversation, backshifting, reporting verbs',
  },
  {
    name: 'Gerúndio ou infinitivo',
    description: 'Stop doing, stop to do: a escolha que muda o sentido.',
    level: 'B2',
    category: 'Gramática',
    topic: 'verbs followed by gerund or infinitive, including pairs that change meaning',
  },
  {
    name: 'Advérbios e ênfase',
    description: 'Onde colocar a palavra que muda o peso da frase.',
    level: 'B2',
    category: 'Gramática',
    topic: 'adverb placement, intensifiers and emphasis in spoken English',
  },
  {
    name: 'Contando uma história longa',
    description: 'Segurar a atenção do começo ao fim, com ritmo e virada.',
    level: 'B2',
    category: 'Conversação',
    topic: 'telling an extended anecdote with pacing, suspense and a punchline',
  },

  // ---------- C1: nível real, não só frase comprida ----------
  {
    name: 'Meias-palavras',
    description: 'Dizer sem dizer: atenuação, insinuação e o não dito.',
    level: 'C1',
    category: 'Conversação',
    topic: 'hedging, implying, understatement and saying things indirectly',
  },
  {
    name: 'Debate e contra-argumento',
    description: 'Conceder um ponto para ganhar o próximo.',
    level: 'C1',
    category: 'Conversação',
    topic: 'debating, conceding a point, rebutting and reframing an argument',
  },
  {
    name: 'Linguagem acadêmica',
    description: 'O registro de artigo, resumo e defesa de tese.',
    level: 'C1',
    category: 'Geral',
    topic: 'academic English: describing research, hedged claims, citing and concluding',
  },
  {
    name: 'Apresentações de alto nível',
    description: 'Abrir forte, conduzir a atenção e fechar com chamada.',
    level: 'C1',
    category: 'Negócios',
    topic: 'high-stakes presentations: strong openings, signposting, memorable closes',
  },
  {
    name: 'Liderança e influência',
    description: 'Alinhar gente sem dar ordem.',
    level: 'C1',
    category: 'Negócios',
    topic: 'leadership language: aligning people, delegating, influencing without authority',
  },
  {
    name: 'Entrevista executiva',
    description: 'Responder o que não foi perguntado e ainda sair bem.',
    level: 'C1',
    category: 'Negócios',
    topic: 'senior-level interviews: strategic answers, handling probing questions',
  },
  {
    name: 'Colocações avançadas',
    description: 'As palavras que só andam juntas, e soam erradas separadas.',
    level: 'C1',
    category: 'Gramática',
    topic: 'advanced collocations that native speakers use as fixed pairs',
  },
  {
    name: 'Inversão e ênfase formal',
    description: 'Never have I seen: a estrutura que dá peso à frase.',
    level: 'C1',
    category: 'Gramática',
    topic: 'inversion, cleft sentences and fronting for formal emphasis',
  },
  {
    name: 'Metáforas do cotidiano',
    description: 'As imagens que o inglês usa sem perceber que são imagens.',
    level: 'C1',
    category: 'Gramática',
    topic: 'conventional metaphors in everyday English and what they reveal',
  },
  {
    name: 'Política e sociedade',
    description: 'Assunto sensível com a precisão que ele exige.',
    level: 'C1',
    category: 'Conversação',
    topic: 'discussing politics and society precisely and diplomatically',
  },
  {
    name: 'Escrita formal e relatórios',
    description: 'O inglês que vai por escrito e fica registrado.',
    level: 'C1',
    category: 'Negócios',
    topic: 'formal written English: reports, executive summaries, recommendations',
  },

  // ---------- C2: o topo, que não existia ----------
  {
    name: 'Registro e código social',
    description: 'A mesma ideia dita de cinco jeitos, cada um para uma sala.',
    level: 'C2',
    category: 'Conversação',
    topic: 'shifting register: the same idea expressed formally, casually and bluntly',
  },
  {
    name: 'Ambiguidade proposital',
    description: 'Quando a frase é vaga de propósito e todo mundo entende.',
    level: 'C2',
    category: 'Conversação',
    topic: 'deliberate vagueness, diplomatic ambiguity and what is left unsaid',
  },
  {
    name: 'Sotaques e variedades',
    description: 'Britânico, americano, australiano: a mesma coisa com outra palavra.',
    level: 'C2',
    category: 'Conversação',
    topic: 'differences between British, American and other varieties of English',
  },
  {
    name: 'Referência cultural',
    description: 'A citação que todo nativo pega e nenhum dicionário explica.',
    level: 'C2',
    category: 'Geral',
    topic: 'cultural references, allusions and idioms rooted in shared context',
  },
  {
    name: 'Retórica e persuasão',
    description: 'Repetição, tríade e contraste: as figuras que convencem.',
    level: 'C2',
    category: 'Negócios',
    topic: 'rhetorical devices in persuasive English: tricolon, antithesis, repetition',
  },
  {
    name: 'Jargão profissional',
    description: 'A gíria de dentro da área, e quando ela vira barreira.',
    level: 'C2',
    category: 'Negócios',
    topic: 'professional jargon and insider language across industries',
  },
  {
    name: 'Trocadilho e jogo de palavras',
    description: 'Humor que depende do som, não do sentido.',
    level: 'C2',
    category: 'Gramática',
    topic: 'puns, wordplay and humor that depends on sound and double meaning',
  },
  {
    name: 'Quase intraduzível',
    description: 'O que o inglês diz numa palavra e o português precisa de cinco.',
    level: 'C2',
    category: 'Gramática',
    topic: 'English expressions with no direct Portuguese equivalent, requiring paraphrase',
  },
]
