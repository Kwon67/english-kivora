// Transfer the address in this tab without putting it in the URL or analytics.
const key = 'kivora:registration-email'

export function saveRegistrationEmail(email: string) {
  try {
    sessionStorage.setItem(key, email)
  } catch {
    // Registration also works when browser storage is unavailable.
  }
}

export function takeRegistrationEmail() {
  try {
    const email = sessionStorage.getItem(key)
    sessionStorage.removeItem(key)
    return email
  } catch {
    return null
  }
}
