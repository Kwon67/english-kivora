export function parseTutorReply(raw: string) {
  const marker = raw.indexOf('[TIP]')
  const content = (marker < 0 ? raw : raw.slice(0, marker)).trim()
  const tip = marker < 0 ? null : raw.slice(marker + 5).replace(/\[\/TIP\]\s*$/, '').trim() || null
  // Each assistant turn must also be valid input on the next request.
  if (!content || content.length > 2000 || (tip && tip.length > 4000)) {
    return { error: 'O Tutor não retornou uma resposta completa. Tente novamente.' }
  }
  return { content, tip }
}
