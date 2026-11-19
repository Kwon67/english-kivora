/** Preserve keyboard focus without letting a sticky navigation bar cover the next instruction. */
export function focusStudyStep(heading: HTMLElement) {
  const navigation = document.querySelector<HTMLElement>('.workspace-navigation')
  const offset = Math.max(0, navigation?.getBoundingClientRect().bottom ?? 80) + 20
  heading.style.scrollMarginTop = `${offset}px`
  heading.focus({ preventScroll: true })
  heading.scrollIntoView({ block: 'start', behavior: 'instant' })
}
