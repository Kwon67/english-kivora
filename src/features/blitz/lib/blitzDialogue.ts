// Short dialogue excerpts for first exposure. Only cards already in the public catalog are played.
// StarWars.com/news/40-quotes-star-wars-the-empire-strikes-back and
// AFI.com/afis-100-years-100-movie-quotes (Titanic, The Wizard of Oz, Apollo 13, Jerry Maguire).
export const BLITZ_DIALOGUE_PHRASES = [
  'I am your father.',
  "It's not my fault!",
  "I'm the king of the world!",
  "There's no place like home.",
  'Houston, we have a problem.',
  'You had me at hello.',
] as const

const CORE_VERB_PACKS: Record<string, number> = {
  'O verbo to be': 3,
  'Contando o fim de semana': 3,
  'Contando o que aconteceu': 2,
  'Verbos do dia a dia': 2,
  'Passado simples: verbos regulares': 2,
  'Passado simples: verbos irregulares': 2,
  'Presente contínuo: agora e nestes dias': 1,
}

export function blitzVerbPackPriority(name: string | null | undefined) {
  return name ? CORE_VERB_PACKS[name] ?? 0 : 0
}
