import type { TodayLesson } from './todayLesson'
import { z } from 'zod'

/** Original A1–A2 pilot. Completing it is not a CEFR placement or an oral proficiency score. */
export const TRAVEL_UNIT = {
  id: 'travel-foundations-v1', band: 'A1–A2', title: 'Uma viagem, três situações',
  objectives: ['Localizar uma informação e pedir confirmação.', 'Explicar uma necessidade e negociar uma alternativa.', 'Transmitir uma mudança sem perder os detalhes essenciais.'],
} as const

export const TRAVEL_LESSONS: TodayLesson[] = [
  {
    id: 'travel-arrival-01', title: '1. Do aeroporto à cidade',
    preparation: 'Você acabou de chegar. Descubra qual transporte usar e confirme a informação com uma pessoa da equipe.',
    text: 'Welcome to North Airport. The train to Central Station leaves from platform 2 at 10:20. It takes twenty minutes. The bus leaves at 10:10, but it takes fifty minutes. Train tickets are available at the blue machine.',
    question: 'Você quer chegar ao centro antes das onze. Qual plano funciona?',
    choices: ['Trem das 10:20, na plataforma 2.', 'Ônibus das 10:10, que chega às 10:30.', 'Trem das 10:10, na plataforma 3.'], answer: 0,
    explanation: 'O trem sai às 10:20 e leva vinte minutos: chega às 10:40. O ônibus chega às 11:00. O bilhete do trem está disponível na máquina azul.',
    prompt: 'Peça ajuda em inglês: diga que quer ir à Central Station, confirme a plataforma e pergunte onde comprar o bilhete.',
    example: 'Excuse me. I need to go to Central Station. Is this platform 2? Where can I buy a ticket?',
    criteria: ['Eu disse meu destino.', 'Eu pedi confirmação da plataforma.', 'Eu perguntei onde comprar o bilhete.'],
    shadowing: 'Excuse me. Where can I buy a ticket?',
    speakingPrompt: 'Imagine a pessoa da estação à sua frente. Diga seu destino e faça as duas perguntas em voz alta, sem ler a versão completa.',
  },
  {
    id: 'travel-hotel-02', title: '2. Uma alternativa no hotel',
    preparation: 'Você chega cedo ao hotel e precisa guardar uma mala. A recepcionista oferece uma alternativa.',
    recall: 'Sem consultar a atividade anterior, lembre como chamar a atenção de alguém e pedir uma informação.',
    text: 'Receptionist: Your room will be ready at three. You can leave your bag here now. Guest: Can I collect it at two? Receptionist: Yes. Please keep this ticket and show it when you come back. The café next door is open until four.',
    question: 'Qual combinação respeita o que a recepcionista informou?',
    choices: ['Entrar no quarto às duas e deixar o bilhete no café.', 'Guardar a mala agora e mostrar o bilhete ao buscá-la às duas.', 'Buscar a mala apenas depois das quatro.'], answer: 1,
    explanation: 'O quarto só estará pronto às três, mas a mala pode ser guardada agora e retirada às duas, mediante apresentação do bilhete.',
    prompt: 'Responda à recepcionista em inglês. Explique que deseja guardar a mala, confirme a retirada às duas e pergunte onde fica o café.',
    example: 'Thank you. I would like to leave my bag here. Can I collect it at two with this ticket? Where is the café?',
    criteria: ['Eu expliquei o que preciso.', 'Eu confirmei horário e condição para retirar a mala.', 'Eu fiz uma pergunta útil sobre o café.'],
    shadowing: 'Can I collect it at two with this ticket?',
    speakingPrompt: 'Diga seu pedido à recepcionista. Depois imagine que ela pergunta “At two or at three?” e esclareça o horário.',
  },
  {
    id: 'travel-outing-03', title: '3. O passeio mudou',
    preparation: 'Você combinou um passeio com um amigo. Leia o aviso e explique a mudança para que ele encontre o grupo.',
    recall: 'Lembre como confirmar um horário. Agora use essa estrutura para evitar que seu amigo vá ao lugar errado.',
    text: 'Message from the guide: The walking tour will start at the museum entrance at 2:30, not at the fountain at two. The fountain area is closed today. If it rains, we will meet inside the museum café. Please tell anyone who has not seen this message.',
    question: 'Qual informação seu amigo precisa receber?',
    choices: ['O grupo continua na fonte às duas.', 'Se chover, o passeio começa às quatro.', 'O encontro é às 2:30 na entrada do museu; se chover, no café de dentro.'], answer: 2,
    explanation: 'Mudaram o lugar e o horário. O café interno é a alternativa em caso de chuva. O aviso pede que a informação seja repassada.',
    prompt: 'Escreva ao amigo em inglês: explique a mudança, diga o horário e o lugar corretos, informe o plano para chuva e peça confirmação.',
    example: 'The fountain area is closed, so we are meeting at the museum entrance at 2:30. If it rains, meet us in the café inside. Can you confirm that you got this message?',
    criteria: ['Eu preservei o novo horário e lugar.', 'Eu expliquei a alternativa para chuva.', 'Eu pedi confirmação de recebimento.'],
    shadowing: 'Can you confirm that you got this message?',
    speakingPrompt: 'Deixe um recado de voz imaginário para o amigo. Inclua os detalhes essenciais sem ler frase por frase.',
  },
  {
    id: 'travel-transfer-04', title: 'Situação nova: a oficina', transfer: true,
    preparation: 'Use o que praticou em uma situação diferente. Não há modelo antes da sua resposta. Se consultar apoio, isso será registrado como prática com apoio.',
    text: 'Your pottery workshop was booked for Tuesday at 11:00 in Room 4. The organiser writes: “Room 4 is being repaired. We can offer Tuesday at 12:00 in Room 6, or Wednesday at 11:00 in Room 2. Please reply today.” You are free on Tuesday only until 11:30. On Wednesday, you are free all morning. Your friend has not read the message.',
    question: 'Qual alternativa cabe na sua disponibilidade?',
    choices: ['Terça às 12:00, sala 6.', 'Quarta às 11:00, sala 2.', 'Terça às 11:00, sala 4.'], answer: 1,
    explanation: 'A sala original está indisponível. Terça às 12:00 conflita com sua agenda. Quarta às 11:00, na sala 2, é a alternativa compatível.',
    prompt: 'Escreva duas mensagens curtas em inglês: confirme uma alternativa com a organização e explique a mudança ao amigo. Inclua uma pergunta para conferir que ele entendeu.',
    example: 'To the organiser: Wednesday at eleven in Room 2 works for me. Please confirm my booking. To my friend: The room is being repaired, so our workshop is now on Wednesday at eleven in Room 2. Does that work for you?',
    criteria: ['Minha escolha respeita a disponibilidade e o aviso.', 'As duas mensagens preservam dia, horário e sala.', 'Eu adaptei o pedido a cada destinatário.'],
    shadowing: 'Please confirm my booking.',
    speakingPrompt: 'Sem ler sua resposta, explique a mudança ao amigo em voz alta. Faça uma pausa e imagine que ele pede para confirmar a sala.',
  },
]

export const TravelProgressSchema = z.object({
  version: z.literal(1), completed: z.array(z.string()).max(4), updatedAt: z.string().datetime(),
})
export type TravelProgress = z.infer<typeof TravelProgressSchema>
export function restoreTravelProgress(raw: string | null): TravelProgress | null {
  try {
    const value = TravelProgressSchema.parse(JSON.parse(raw || 'null'))
    const ids = TRAVEL_LESSONS.map(lesson => lesson.id)
    if (new Set(value.completed).size !== value.completed.length || value.completed.some((id, index) => id !== ids[index])) return null
    return value
  } catch { return null }
}
export function nextTravelEpisode(completed: string[]) { return Math.min(completed.length, TRAVEL_LESSONS.length - 1) }
