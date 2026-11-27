'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { saveRegistrationEmail } from '@/features/auth/lib/registrationEmailDraft'
import styles from './Editorial.module.css'

const navigation = [
  ['Como funciona', '#como-funciona'], ['Seu nível', '#seu-caminho'],
  ['Plano gratuito', '#precos'], ['Dúvidas', '#faq'],
] as const

export function Navigation() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  return <nav className={styles.nav} aria-label="Navegação principal" onKeyDown={event => {
    if (event.key === 'Escape' && open) {
      setOpen(false)
      trigger.current?.focus()
    }
  }}>
    <button className={styles.menuToggle} type="button" ref={trigger} aria-controls="nav-links" aria-expanded={open}
      onClick={() => setOpen(!open)}>{open ? <X size={19} /> : <Menu size={19} />} Menu</button>
    <div id="nav-links" data-open={open} className={styles.navLinks}>
      {navigation.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
    </div>
    <a className={styles.secondary} href="/login">Entrar <ArrowRight size={15} /></a>
  </nav>
}

export function RegistrationForm() {
  const router = useRouter()
  return <form className={styles.signupForm} action="/register" onSubmit={event => {
    const input = event.currentTarget.elements.namedItem('signup-address') as HTMLInputElement
    saveRegistrationEmail(input.value.trim())
    event.preventDefault()
    router.push('/register')
  }}>
    <label htmlFor="signup-address">Comece seu cadastro gratuito</label>
    <div><input id="signup-address" type="email" placeholder="Seu e-mail" autoComplete="email" required />
    <button aria-label="Continuar para o cadastro"><ArrowRight size={20} /></button></div>
  </form>
}
