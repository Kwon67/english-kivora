-- Currículo por nível com prova final.
--
-- Até aqui o nível do aluno era só uma ESTIMATIVA estatística (acertos por nível + nivelamento) e
-- subia sozinho, sem exigir que o conteúdo do nível tivesse sido estudado: dava para "estar no B1"
-- com 0 dos 44 packs A1 concluídos. A regra nova é de domínio (mastery learning): o nível só muda
-- quando o aluno passa na prova final do nível atual (80%). A prova libera ao concluir todos os
-- packs do nível, ou antes, como "prova para pular" para quem já domina o conteúdo.
--
-- Duas mudanças, ambas aditivas (nada existente é alterado ou apagado):
--   1. packs.curriculum_position: ordem pedagógica dentro do nível.
--   2. level_exam_attempts: tentativas da prova final, com gabarito.

-- 1. Ordem pedagógica ----------------------------------------------------------
--
-- A ordem antiga era a de criação dos packs, o que punha "Onde as coisas estão" antes de
-- "O verbo to be". A sequência abaixo segue a progressão usual de um curso A1-B1: contato e
-- informação pessoal -> estruturas básicas -> vida cotidiana -> tempos verbais -> situações.
-- Packs sem posição (B2 em diante, ou criados depois) caem para o fim, pela data de criação.

ALTER TABLE public.packs ADD COLUMN IF NOT EXISTS curriculum_position integer;

UPDATE public.packs AS p
SET curriculum_position = v.pos
FROM (VALUES
  ('A1', 'Cumprimentos e cortesia', 1),
  ('A1', 'Primeiro contato', 2),
  ('A1', 'Como você está', 3),
  ('A1', 'O verbo to be', 4),
  ('A1', 'Países e nacionalidades', 5),
  ('A1', 'Perguntas essenciais', 6),
  ('A1', 'Respostas curtas', 7),
  ('A1', 'Números e horas', 8),
  ('A1', 'Dias, meses e datas', 9),
  ('A1', 'Minha família', 10),
  ('A1', 'Artigos: a, an, the', 11),
  ('A1', 'Singular e plural', 12),
  ('A1', 'Cores, formas e tamanhos', 13),
  ('A1', 'This, that, these, those', 14),
  ('A1', 'Profissões', 15),
  ('A1', 'A casa e os cômodos', 16),
  ('A1', 'Onde as coisas estão', 17),
  ('A1', 'There is e there are', 18),
  ('A1', 'In, on, at: onde e quando', 19),
  ('A1', 'Comidas e bebidas', 20),
  ('A1', 'No café', 21),
  ('A1', 'No supermercado', 22),
  ('A1', 'Compras e combinados rápidos', 23),
  ('A1', 'Roupas básicas', 24),
  ('A1', 'Partes do corpo', 25),
  ('A1', 'Como eu me sinto', 26),
  ('A1', 'Have got: o que eu tenho', 27),
  ('A1', 'Animais e bichos de estimação', 28),
  ('A1', 'Verbos do dia a dia', 29),
  ('A1', 'Meu dia: manhã, tarde e noite', 30),
  ('A1', 'Eu gosto, eu não gosto', 31),
  ('A1', 'Dizendo não', 32),
  ('A1', 'Não, não e não: respostas negativas', 33),
  ('A1', 'Can e cannot: o que eu sei fazer', 34),
  ('A1', 'Tempo livre e hobbies', 35),
  ('A1', 'O tempo lá fora', 36),
  ('A1', 'Na sala de aula', 37),
  ('A1', 'Instruções simples', 38),
  ('A1', 'Pedindo direção na rua', 39),
  ('A1', 'Como eu me locomovo', 40),
  ('A1', 'No telefone', 41),
  ('A1', 'Contrações do dia a dia', 42),
  ('A1', 'Sons que confundem', 43),
  ('A1', 'Despedidas', 44),
  ('A2', 'Presente contínuo: agora e nestes dias', 1),
  ('A2', 'A rotina do seu dia', 2),
  ('A2', 'Advérbios de frequência', 3),
  ('A2', 'Fazendo perguntas', 4),
  ('A2', 'Meu trabalho e meus estudos', 5),
  ('A2', 'Descrevendo pessoas', 6),
  ('A2', 'Frases completas do dia a dia', 7),
  ('A2', 'Some, any, much, many', 8),
  ('A2', 'Na rua e no restaurante', 9),
  ('A2', 'Cozinhando e receitas', 10),
  ('A2', 'Roupas e tamanhos', 11),
  ('A2', 'Trocas e devoluções', 12),
  ('A2', 'Comparando coisas', 13),
  ('A2', 'Comparativos e superlativos', 14),
  ('A2', 'Descrevendo lugares e cidades', 15),
  ('A2', 'Passado simples: verbos regulares', 16),
  ('A2', 'O -ed do passado', 17),
  ('A2', 'Passado simples: verbos irregulares', 18),
  ('A2', 'Ontem: mais verbos irregulares', 19),
  ('A2', 'Contando o fim de semana', 20),
  ('A2', 'Contando uma história curta', 21),
  ('A2', 'Férias e viagens passadas', 22),
  ('A2', 'Going to: planos e intenções', 23),
  ('A2', 'Falando de planos', 24),
  ('A2', 'Will: decisões e promessas', 25),
  ('A2', 'Negando no passado e no futuro', 26),
  ('A2', 'Convites e recusas', 27),
  ('A2', 'Marcando um horário', 28),
  ('A2', 'Reservas e agendamentos online', 29),
  ('A2', 'No aeroporto', 30),
  ('A2', 'Chegando no hotel', 31),
  ('A2', 'Transporte público e táxi', 32),
  ('A2', 'Me perdi: pedindo ajuda', 33),
  ('A2', 'Opiniões e sentimentos', 34),
  ('A2', 'Filmes, séries e música', 35),
  ('A2', 'Esportes e academia', 36),
  ('A2', 'Tarefas de casa', 37),
  ('A2', 'Tecnologia do dia a dia', 38),
  ('A2', 'Sintomas e mal-estar', 39),
  ('A2', 'Na farmácia', 40),
  ('A2', 'Emergência e socorro', 41),
  ('A2', 'Se desculpando', 42),
  ('A2', 'Primeiro dia no trabalho', 43),
  ('A2', 'No banco: operações básicas', 44),
  ('A2', 'Onde cai a força', 45),
  ('B1', 'Present perfect na prática', 1),
  ('B1', 'Conhecendo pessoas', 2),
  ('B1', 'Mantendo contato', 3),
  ('B1', 'Mensagens e redes sociais', 4),
  ('B1', 'Contando o que aconteceu', 5),
  ('B1', 'Used to: como era antes', 6),
  ('B1', 'Expressões do dia a dia', 7),
  ('B1', 'Phrasal verbs do dia a dia', 8),
  ('B1', 'Combinando programas', 9),
  ('B1', 'Pedidos educados e imprevistos', 10),
  ('B1', 'Verbos modais no cotidiano', 11),
  ('B1', 'Dando e pedindo conselho', 12),
  ('B1', 'Atrasos e mal-entendidos', 13),
  ('B1', 'Reclamando de um problema', 14),
  ('B1', 'Problemas em casa', 15),
  ('B1', 'Procurando onde morar', 16),
  ('B1', 'Se e talvez: condicionais', 17),
  ('B1', 'Arrependimento e desejo', 18),
  ('B1', 'Consulta médica', 19),
  ('B1', 'Banco e dinheiro', 20),
  ('B1', 'Alugando um carro', 21),
  ('B1', 'Passando pela imigração', 22),
  ('B1', 'Entendendo instruções', 23),
  ('B1', 'Voz passiva no dia a dia', 24),
  ('B1', 'Explicando um processo', 25),
  ('B1', 'Orações relativas: who, which, that', 26),
  ('B1', 'Concordando e discordando', 27),
  ('B1', 'Defendendo seu ponto de vista', 28),
  ('B1', 'Prós e contras', 29),
  ('B1', 'Notícias e atualidades', 30),
  ('B1', 'Discurso indireto', 31),
  ('B1', 'Entrevista de emprego', 32),
  ('B1', 'Reunião de equipe', 33),
  ('B1', 'E-mail profissional', 34),
  ('B1', 'Ligação de trabalho', 35),
  ('B1', 'Remarcando compromissos', 36),
  ('B1', 'Atendimento ao cliente', 37),
  ('B1', 'Negociando e pedindo mudanças', 38),
  ('B1', 'Fala conectada', 39),
  ('B1', 'Entonação: pergunta ou afirmação', 40)
) AS v(level, name, pos)
WHERE p.is_public = true AND p.level = v.level AND p.name = v.name;

CREATE INDEX IF NOT EXISTS packs_curriculum_order_idx
  ON public.packs (level, curriculum_position, created_at)
  WHERE is_public = true;

-- 2. Prova final de nível ------------------------------------------------------
--
-- `questions` guarda o gabarito, por isso a tabela NÃO tem policy nenhuma para `authenticated`:
-- com RLS ligada e sem policy, o cliente não lê nem escreve. Criar, corrigir e consultar
-- tentativas passa sempre pelas server actions, que usam service role depois de checar o
-- usuário. Assim a resposta certa nunca chega ao navegador antes da entrega.

CREATE TABLE IF NOT EXISTS public.level_exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  questions jsonb NOT NULL,
  answers jsonb,
  score integer,
  total integer NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);

CREATE INDEX IF NOT EXISTS level_exam_attempts_user_idx
  ON public.level_exam_attempts (user_id, level, started_at DESC);

ALTER TABLE public.level_exam_attempts ENABLE ROW LEVEL SECURITY;
