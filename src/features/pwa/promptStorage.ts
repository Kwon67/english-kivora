export function isPromptDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    // Keep optional prompts out of the learner's way when preferences are unavailable.
    return true
  }
}

export function rememberPromptDismissal(key: string): void {
  try {
    localStorage.setItem(key, '1')
  } catch {
    // The component still dismisses the prompt for this visit.
  }
}
