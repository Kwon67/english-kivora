import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 15

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 })
  }

  try {
    const { expected, transcript } = await request.json()

    if (!expected || !transcript) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Usando o Llama-3-70b-8192, um dos melhores LLMs Open Source disponíveis via Groq e gratuito
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: `Você é um professor de inglês nativo e divertido focado em pronúncia.
Seu aluno tentou dizer uma frase em inglês, mas a IA de reconhecimento de voz entendeu algo diferente, indicando um erro de pronúncia.

Regras do seu feedback:
1. Deve ser extremamente curto (máximo de 2 frases curtas).
2. Fale em português de forma encorajadora.
3. Diga onde esteve o erro fonético baseando-se no que ele falou (transcript) vs o esperado (expected).
4. Dê uma dica rápida de como posicionar a boca ou qual som imitar em português para acertar.
5. Não use saudações ou despedidas ("Olá", "Espero ter ajudado"). Vá direto ao ponto.

Exemplo: "Você falou 'shit' em vez de 'sheet'. Cuidado! Estique mais o som do 'i' (fale 'xiiiiit') para não parecer um palavrão."`
          },
          {
            role: 'user',
            content: `Frase esperada (o que ele devia dizer): "${expected}"
O que o microfone ouviu (o que ele realmente disse ou soou): "${transcript}"

Dê o feedback focando no erro principal.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    if (!response.ok) {
      throw new Error('Groq API Error')
    }

    const data = await response.json()
    const feedback = data.choices[0]?.message?.content?.trim()

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Groq Feedback Error:', error)
    return NextResponse.json({ error: 'Failed to generate feedback' }, { status: 500 })
  }
}
