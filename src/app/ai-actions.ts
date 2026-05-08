'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function generateDeckAction(topic: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const apiKey = process.env.OPENAI_API_KEY

  let cards: { en: string; pt: string }[] = []

  if (!apiKey) {
    // Fallback: mock cards if no API key
    console.warn('OPENAI_API_KEY não encontrada. Usando dados mockados para demonstração.')
    cards = [
      { en: "I'm looking forward to working with you.", pt: "Estou ansioso para trabalhar com você." },
      { en: "Could you please elaborate on that?", pt: "Você poderia explicar melhor isso?" },
      { en: "Let's touch base next week.", pt: "Vamos entrar em contato na próxima semana." },
      { en: "I'll get back to you as soon as possible.", pt: "Entrarei em contato com você o mais breve possível." },
      { en: "That sounds like a great plan.", pt: "Isso parece um ótimo plano." },
      { en: "What are the next steps for this project?", pt: "Quais são os próximos passos para este projeto?" },
      { en: "I would like to schedule a meeting.", pt: "Eu gostaria de agendar uma reunião." },
      { en: "Thank you for your feedback.", pt: "Obrigado pelo seu feedback." }
    ]
  } else {
    try {
      const prompt = `Gere um conjunto de 10 frases em inglês e suas traduções em português focadas no tema: "${topic}". 
      Retorne um objeto JSON com uma chave "cards" contendo um array de objetos com "en" e "pt".
      Exemplo: {"cards": [{"en": "Hello", "pt": "Olá"}]}`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você é um professor de inglês especialista em criar materiais de estudo.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0].message.content
      const parsed = JSON.parse(content)
      cards = parsed.cards || []
    } catch (error) {
      console.error('Erro na geração por IA:', error)
      throw new Error('Falha ao gerar o deck. Tente novamente mais tarde.')
    }
  }

  if (cards.length === 0) {
    throw new Error('Nenhum cartão foi gerado.')
  }

  // 1. Criar o Pack
  const { data: pack, error: packError } = await supabase
    .from('packs')
    .insert({
      name: `IA: ${topic.substring(0, 30)}${topic.length > 30 ? '...' : ''}`,
      description: `Deck gerado automaticamente por IA sobre o tema: ${topic}`,
      level: 'medium'
    })
    .select('id')
    .single()

  if (packError) throw new Error(`Erro ao criar pack: ${packError.message}`)

  // 2. Criar os Cards
  const cardInserts = cards.map((c, index) => ({
    pack_id: pack.id,
    english_phrase: c.en,
    portuguese_translation: c.pt,
    order_index: index
  }))

  const { error: cardsError } = await supabase.from('cards').insert(cardInserts)
  if (cardsError) throw new Error(`Erro ao criar cards: ${cardsError.message}`)

  // 3. Criar a atribuição (Assignment) para o usuário
  const { error: assignmentError } = await supabase.from('assignments').insert({
    user_id: user.id,
    pack_id: pack.id,
    game_mode: 'flashcard',
    status: 'pending'
  })

  if (assignmentError) throw new Error(`Erro ao atribuir lição: ${assignmentError.message}`)

  revalidatePath('/home')
  return { success: true, packId: pack.id }
}
