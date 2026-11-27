import CafePractice from './CafePractice'
import EditorialMotion from './EditorialMotion'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import BrandMark from '@/components/ui/BrandMark'
import { Navigation, RegistrationForm } from './EditorialControls'
import HeroFlashcard from './HeroFlashcard'
import LevelExplorer from './LevelExplorer'
import PracticePreview from './PracticePreview'
import { levels } from './levels'
import styles from './Editorial.module.css'

const faqs = [
  ['Preciso saber inglês para começar?', 'Você pode começar do zero, no A1, ou escolher seu nível.'],
  ['Como funcionam as revisões?', 'Você indica o que lembrou. A Kivora usa seu histórico para trazer as palavras difíceis de volta mais cedo.'],
  ['Como funciona o tutor de IA?', 'Escolha uma situação e converse por texto ou voz. O tutor dá dicas durante a conversa. O modo de voz depende do navegador.'],
  ['Posso assinar o Pro agora?', 'Por enquanto, os novos cadastros são pelo plano gratuito.'],
  ['Funciona no celular?', 'Sim. Abra a Kivora no navegador ou adicione à tela inicial.'],
]

function Wordmark() {
  return <a className={styles.brand} aria-label="Kivora English, início" href="#inicio"><BrandMark showSubtitle={false} /></a>
}

function Signup() {
  return <a className={styles.primary} href="/register">Começar grátis <ArrowUpRight aria-hidden="true" size={17} /></a>
}

export default function EditorialLanding() {
  return <EditorialMotion>
    <header className={styles.header}><div className={styles.wrap}><Wordmark /><Navigation /></div></header>
    <main id="main-content">
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.wrap}>
          <div data-hero-copy className={styles.heroCopy}>
            <h1 id="hero-title">Seu inglês,<br /> no mundo real.</h1>
            <Signup />
          </div>
          <figure data-phone className={styles.phone}>
            <Image src="/images/editorial/hero.webp" width={1402} height={1122} alt="Uma conversa no balcão de um café, na tela do celular." preload />
            <HeroFlashcard />
          </figure>
        </div>
      </section>
      <nav className={styles.strip} aria-label="Explore os níveis de inglês"><div className={styles.wrap}>
        {levels.map(({ level, name }) => <a key={level} href={'#nivel-' + level}><strong>{level}</strong><span>{name}</span></a>)}
      </div></nav>
      <section className={styles.practice} id="como-funciona"><div className={styles.wrap}>
        <p className={styles.eyebrow}>Como funciona</p>
        <h2>Aprenda fazendo.</h2><p className={styles.intro}>Escolha um exercício e experimente agora, sem criar uma conta.</p>
        <PracticePreview />
      </div></section>
      <section className={styles.conversation} id="conversacao"><div className={styles.wrap}>
        <CafePractice />
        <Image data-scroll-art className={styles.cafe} src="/images/editorial/cafe.webp" width={1920} height={640} alt="Dois estudantes conversam com o barista em um café." />
        <div className={styles.conversationCopy}><p className={styles.eyebrow}>Conversação com IA</p>
          <h2>Um café,<br />por favor.</h2><p>Como você faria esse pedido em inglês? Pratique por voz ou texto com o tutor.</p>
          <a className={styles.secondary} href="/register">Conversar com o tutor <ArrowUpRight size={16} /></a></div>
      </div></section>
      <section className={styles.guide} id="seu-caminho"><div className={styles.wrap}>
        <Image data-scroll-art className={styles.levelArt} src="/images/editorial/levels.webp" width={679} height={547} alt="" />
        <div><p className={styles.eyebrow}>Do A1 ao C2</p><h2>Seu ponto de partida.</h2><p>Explore uma frase de cada nível.</p><LevelExplorer /></div>
      </div></section>
      <section className={styles.closing} id="precos"><div className={styles.wrap}>
        <div><p className={styles.eyebrow}>Plano gratuito</p><h2>Comece no<br />seu ritmo.</h2>
          <p>Tenha acesso a flashcards, tutor de IA e ao desafio semanal Blitz. Acompanhe seu progresso a cada prática.</p>
          <Signup /><Image src="/images/editorial/study.webp" width={900} height={600} alt="" className={styles.study} /></div>
        <div id="faq" className={styles.faq}><h2>Dúvidas frequentes</h2>
          {faqs.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
      </div></section>
    </main>
    <footer id="rodape" className={styles.footer}><div className={styles.wrap}>
      <div><Wordmark /><a id="contato" href="mailto:kivora.dev@outlook.com">kivora.dev@outlook.com</a></div>
      <div><strong>Explore</strong><a href="#como-funciona">Como funciona</a><a href="#seu-caminho">Seu nível</a><a href="#practice-choose">Praticar</a></div>
      <div><strong>Sua conta</strong><a href="#precos">Plano gratuito</a><a href="/login">Entrar</a><a href="#faq">Dúvidas</a></div>
      <RegistrationForm />
      <div className={styles.legal}><span>© {new Date().getUTCFullYear()} Kivora English</span><a href="/privacy">Privacidade</a><a href="/terms">Termos de uso</a><a href="#inicio">Voltar ao início <ArrowRight size={13} /></a></div>
    </div></footer>
  </EditorialMotion>
}
