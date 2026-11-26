'use client'

import BrandMark from '@/components/ui/BrandMark'
import PushpinTearFooter from '@/components/ui/pushpin-tear-footer'
import { saveRegistrationEmail } from '@/features/auth/lib/registrationEmailDraft'
import styles from './LandingFooter.module.css'
import { paperOrange } from './paperPalette'

const email = 'kivora.dev@outlook.com'
const contact = 'mailto:' + email

export default function LandingFooter({ year }: { year: number }) {
  return (
    <PushpinTearFooter
      id="rodape"
      contactId="contato"
      className={styles.poster}
      locale="pt-BR"
      brand="kivora."
      name="Kivora English"
      logo={<BrandMark compact tone="light" />}
      logoHref="#main-content"
      topHref="#main-content"
      sheet={paperOrange}
      paper="#f1ede4"
      paperInk="#1b1712"
      fontSans="var(--font-kivora), Arial, sans-serif"
      seed={23}
      email={email}
      newsletter={{
        label: 'Comece seu cadastro gratuito',
        placeholder: 'Seu e-mail',
        submitLabel: 'Continuar para o cadastro',
        action: '/register',
      }}
      onSubscribe={saveRegistrationEmail}
      status={{ label: 'Fale com a Kivora', href: contact }}
      mark="A1 — C2"
      timeZone="America/Sao_Paulo"
      timeLabel="Brasília"
      socials={[
        { icon: 'globe', label: 'Explore os níveis de inglês', href: '#seu-caminho' },
        { icon: 'chat', label: 'Perguntas frequentes', href: '#faq' },
      ]}
      columns={[
        {
          title: 'Explore',
          links: [{ label: 'Seu caminho', href: '#seu-caminho' }, { label: 'Como funciona', href: '#como-funciona' }],
          cta: { label: 'Praticar', href: '#practice-demo' },
        },
        {
          title: 'Sua conta',
          links: [{ label: 'Planos', href: '#precos' }, { label: 'Dúvidas', href: '#faq' }],
          cta: { label: 'Entrar', href: '/login' },
        },
      ]}
      sideLinks={[
        { icon: 'shield', label: 'Privacidade', href: '/privacy' },
        { icon: 'doc', label: 'Termos de uso', href: '/terms' },
      ]}
      chat={{ label: 'Enviar e-mail', href: contact }}
      copyright={'© ' + year + ' Kivora English'}
      credit=""
      handle={{ label: 'Criar conta grátis', href: '/register' }}
    />
  )
}
