/** Server actions can reject before their normal, typed response reaches the browser. */
export function onboardingConnectionError() {
  return { ok: false as const, error: 'Não foi possível confirmar esta etapa. Verifique a conexão e tente novamente.' }
}
