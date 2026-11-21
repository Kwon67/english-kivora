import Link from 'next/link'
import SpotIllustration from '@/components/illustrations/SpotIllustration'
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import LandingFAQ from './LandingFAQ'
import LandingNavigation from './LandingNavigation'
import LandingWordmark from './LandingWordmark'
import LevelExplorer from './LevelExplorer'
import PracticePreview from './PracticePreview'
import styles from './MindmarketLanding.module.css'
import heroStyles from './HeroMotion.module.css'
import JourneyRibbon from './JourneyRibbon'
import JourneyMotion from './JourneyMotion'
import LandingIntro from './LandingIntro'
import { ConversationScene, DiscoveryScene, JourneyMotif, JourneySpark, MemoryScene } from './JourneyArt'

const links = [
  { href: '#seu-caminho', label: 'Seu caminho' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#precos', label: 'Planos' },
  { href: '#faq', label: 'Dúvidas' },
]

const includedFeatures = ['Modos de prática e flashcards', 'Tutor e Blitz com IA', 'Coleções e progresso de estudo', 'Ranking semanal']

const faqs = [
  ['Preciso saber inglês para começar?', 'Não. Você pode começar pelo A1 ou encontrar um ponto de partida compatível com o que já sabe. As trilhas organizam seu caminho do básico ao avançado.'],
  ['O que torna as revisões inteligentes?', 'Você tenta lembrar antes de ver a resposta e informa como foi. A Kivora usa seu histórico e essa resposta para calcular o próximo intervalo: o que está difícil volta mais cedo; o que está consolidado ganha espaço.'],
  ['Como funciona o AI Tutor?', 'Escolha uma situação, como pedir um café ou participar de uma entrevista, e converse por voz ou texto. O tutor dá dicas durante a prática. A entrada por voz depende do suporte do navegador.'],
  ['Posso assinar o Pro agora?', 'As novas assinaturas estão indisponíveis. Você pode criar uma conta gratuita e usar as ferramentas de estudo.'],
  ['Funciona no celular?', 'Sim. Use no navegador ou adicione à tela inicial para ter a Kivora sempre por perto.'],
]

function Action({ href = '/register', children, className = '', magnetic }: { href?: string; children: React.ReactNode; className?: string; magnetic?: boolean }) {
  return <Link href={href} transitionTypes={href === '/register' ? ['kivora-auth'] : undefined} data-magnetic={magnetic ? true : undefined} className={`${styles.action} ${className}`}><span>{children}</span><span data-action-icon className={styles.actionIcon}><ArrowUpRight size={22} strokeWidth={1.8} aria-hidden="true" /></span></Link>
}

function Eyebrow({ number, children }: { number?: string; children: React.ReactNode }) {
  return <p className={styles.eyebrow}>{number && <span>{number}</span>}{children}</p>
}

export default function MindmarketLanding({ riveAssets }: { riveAssets: Partial<Record<'discovery' | 'memory' | 'conversation', string>> }) {
  return <JourneyMotion>
    <LandingIntro />
    <LandingNavigation links={links} />
    <div className={styles.journey} data-ribbon-journey>
    <main id="main-content">
      <JourneyRibbon />
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy} data-hero-copy>
            <Eyebrow>INGLÊS PARA A VIDA ACONTECER</Eyebrow>
            <h1 id="hero-title" className={heroStyles.headline} aria-label="Seu inglês. Um mundo mais aberto.">
              <span data-title-ink aria-hidden="true">
                <span data-title-line>Seu inglês.</span>{' '}
                <span data-title-line>Um mundo</span>{' '}
                <span data-title-line>mais <span data-hero-keyword className={heroStyles.keyword}><span data-hero-letters>aberto.</span><span data-hero-underline className={heroStyles.underline} /></span></span>
              </span>
            </h1>
            <Action magnetic>Começar grátis</Action>
          </div>
          <div className={styles.heroVisual} data-hero-parallax data-pointer-area>
            <div data-hero-art className={styles.heroArt}>
              <DiscoveryScene riveSrc={riveAssets.discovery} />
            </div>
            <span className={`${styles.floatingWord} ${styles.hello}`} data-float lang="en"><span data-cursor>hello, world! <JourneySpark /></span></span>
            <span className={`${styles.floatingWord} ${styles.discover}`} data-float lang="en"><span data-cursor>let’s discover <ArrowUpRight size={21} aria-hidden="true" /></span></span>
          </div>
          <Link href="#seu-caminho" className={styles.scrollHint}><span>Uma nova descoberta a cada dia</span><ArrowDown size={19} aria-hidden="true" /></Link>
        </section>

        <section id="seu-caminho" className={styles.pathSection} aria-labelledby="path-title">
          <div className={styles.sectionIntro} data-reveal><Eyebrow number="01">O MUNDO NÃO TEM LEGENDA</Eyebrow><h2 id="path-title"><span data-title-ink>Mas você pode<br /><span className={styles.softText}>encontrar sua voz.</span></span></h2><p>Da primeira palavra à conversa que flui.<br />Um caminho de inglês que começa onde você está.</p></div>
          <div className={styles.levelWrap} data-tilt data-reveal><LevelExplorer /></div>
          <div className={styles.smallManifesto}><span>Seis níveis.</span><span>Muitas descobertas.</span><span>Um caminho seu. <ArrowUpRight size={20} aria-hidden="true" /></span></div>
        </section>

        <section data-pointer-area id="como-funciona" className={styles.practiceSection} aria-labelledby="practice-title">
          <div className={styles.storyCardShell}><div className={styles.practiceCopy} data-tilt data-story-card><Eyebrow number="02">APRENDA COLOCANDO EM PRÁTICA</Eyebrow><h2 id="practice-title"><span data-title-ink>Menos decorar.<br />Mais{' '}<span data-mark className={styles.highlightPink}>descobrir.</span></span></h2><p>É usando o inglês que ele começa a fazer sentido.</p><div className={styles.practiceActions}><Link href="#practice-demo" className={styles.textLink}>Experimente <ArrowRight size={22} aria-hidden="true" /></Link><JourneyMotif kind="pencil" className={styles.practiceProp} /></div></div></div>
          <div id="practice-demo" data-tilt className={styles.demoWrap} data-reveal><span className={styles.demoSticker} aria-hidden="true">sua vez!</span><PracticePreview /></div>
        </section>

      <section id="revisoes" className={styles.memorySection} aria-labelledby="memory-title"><div className={styles.storyStage} data-pointer-area>
        <div className={styles.memoryArtWrap} data-scene-travel><MemoryScene riveSrc={riveAssets.memory} footer={<span className={styles.wordTag} data-float lang="en">remember <ArrowUpRight size={20} strokeWidth={1.8} aria-hidden="true" /></span>} /></div>
        <div className={styles.storyCardShell}><div className={styles.memoryCopy} data-tilt data-story-card><Eyebrow number="03">O QUE VOCÊ APRENDE FICA</Eyebrow><h2 id="memory-title"><span data-title-ink>Uma memória<br />que <span data-mark className={styles.highlightYellow}>floresce.</span></span></h2><p>A revisão espaçada usa suas respostas para trazer cada palavra de volta na hora certa.</p><Link href="/register" transitionTypes={['kivora-auth']} className={styles.textLink}>Cultivar meu vocabulário <ArrowUpRight size={22} aria-hidden="true" /></Link></div></div>
        </div>
      </section>

      <section id="conversacao" className={styles.conversationSection} aria-labelledby="conversation-title"><div className={styles.storyStage} data-pointer-area>
        <div className={styles.storyCardShell}><div className={styles.conversationCopy} data-tilt data-story-card><Eyebrow number="04">DO SEU MUNDO PARA O MUNDO</Eyebrow><h2 id="conversation-title"><span data-title-ink>Uma conversa.<br /><span data-mark className={styles.blueText}>Tantas portas.</span></span></h2><p>Um café. Uma viagem. Uma nova oportunidade. Pratique situações reais por voz ou texto com o tutor de IA.</p><Action>Dar voz ao meu inglês</Action></div></div>
        <div className={styles.conversationVisual} data-scene-travel><ConversationScene riveSrc={riveAssets.conversation} /><div className={styles.conversationBubble} data-float><span lang="en" data-type>“I’d like a coffee, please.”</span><small>Seu próximo pedido pode ser em inglês.</small></div></div>
        </div>
      </section>

      <section className={styles.blitzBand} data-reveal aria-labelledby="blitz-title"><div><Eyebrow>POUCOS MINUTOS. MUITA ENERGIA.</Eyebrow><h2 id="blitz-title"><span data-title-ink>O seu inglês<br />entra no jogo<span className={styles.blitzDot}>.</span></span></h2></div><div className={styles.blitzMark} data-float aria-hidden="true"><SpotIllustration motif="bolt" /></div><div className={styles.blitzCopy}><p>Desafios rápidos, combos e ranking semanal. Uma dose de diversão para manter a prática viva.</p><Link href="/register" transitionTypes={['kivora-auth']} className={styles.lightLink}>Conhecer o Blitz <ArrowUpRight size={24} aria-hidden="true" /></Link></div>
        <div className={styles.ranking} data-ranking>
          <p>Ranking simulado <span>PTS</span></p>
          <ol>{[['Lia', '320'], ['Você', '280'], ['Caio', '240']].map(([name, score]) =>
            <li key={name}><span>{name}</span><strong data-score={score}>{score}</strong></li>
          )}</ol>
          <div className={styles.combo}><span>Combo simulado</span><strong data-score="008">008</strong></div>
        </div>
      </section>

      <section id="precos" className={styles.pricingSection} aria-labelledby="pricing-title"><div className={styles.pricingHeading} data-reveal><Eyebrow>ESPAÇO PARA O SEU PRÓXIMO PASSO</Eyebrow><h2 id="pricing-title"><span data-title-ink>Seu ritmo.<br /><span className={styles.softText}>Seu plano.</span></span></h2><p>Crie sua conta e use as ferramentas de estudo.</p></div><div className={styles.plans} data-plan-stack>
        <article className={styles.plan} data-tilt data-landing-plan="standard"><div className={styles.planTop}><h3>Free</h3><span>O primeiro passo</span></div><p className={styles.price}>R$0<span>para sempre</span></p><ul>{includedFeatures.map(feature => <li key={feature}><Check size={17} aria-hidden="true" />{feature}</li>)}</ul><Action className={styles.outlineAction}>Começar grátis</Action></article>
        <article className={`${styles.plan} ${styles.proPlan}`} data-tilt data-landing-plan="featured"><div className={styles.planTop}><h3>Pro<JourneySpark /></h3><span className={styles.comingSoon}>Em breve</span></div><p className={styles.featureNote}>Novas assinaturas indisponíveis no momento.</p><ul aria-label="Recursos do Free incluídos">{includedFeatures.map(feature => <li key={feature}><Check size={17} aria-hidden="true" />{feature}</li>)}</ul></article>
      </div></section>

      <section id="faq" className={styles.faqSection} aria-labelledby="faq-title"><div><Eyebrow>A CURIOSIDADE É BEM-VINDA</Eyebrow><h2 id="faq-title"><span data-title-ink>Mais alguma<br /><span className={styles.softText}>descoberta?</span></span></h2><div className={styles.questionDoodle} data-float aria-hidden="true"><SpotIllustration motif="question" /></div></div><LandingFAQ items={faqs} /></section>

      <section className={styles.finalCta} data-reveal aria-labelledby="final-title"><p className={styles.eyebrow}>O PRÓXIMO CAPÍTULO É SEU</p><h2 id="final-title"><span data-title-ink>Um pequeno <span lang="en">hello.</span><br />Um mundo de <span data-mark className={styles.finalPossibility}>possibilidades</span>.</span></h2><Action>Começar minha jornada</Action><div className={styles.finalStar} data-spin><JourneySpark /></div><div className={styles.finalSpark} data-float><SpotIllustration motif="moon" /></div></section>
    </main>
    <footer className={styles.footer}><div className={styles.wordBelt} aria-hidden="true"><div data-word-belt>{[0, 1].map(copy => <div key={copy}><span>hello, world</span><JourneySpark /><span>um mundo mais aberto</span><JourneySpark /></div>)}</div></div><div className={styles.footerTop}><Link href="/" aria-label="Kivora English, início"><LandingWordmark /></Link><p>Inglês para a vida acontecer.</p><Link href="#hero-title" className={styles.backTop}>Voltar ao início <ArrowUpRight size={21} aria-hidden="true" /></Link></div><div className={styles.footerExplore}>
      <div>
        <h2>Inglês para o seu dia a dia.</h2>
        <p>Pratique com frases reais, volte ao que está aprendendo e ganhe confiança para conversar.</p>
        <Action>Começar grátis</Action>
      </div>
      <nav aria-label="Explore a Kivora">
        {links.map(link => <Link key={link.href} href={link.href}>{link.label}<ArrowUpRight size={18} aria-hidden="true" /></Link>)}
      </nav>
    </div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} Kivora English</span><div><Link href="/privacy" prefetch={false}>Privacidade</Link><Link href="/terms" prefetch={false}>Termos de uso</Link><Link href="/login" transitionTypes={['kivora-auth']}>Entrar</Link></div><span>Feito para quem tem curiosidade.</span></div></footer>
    </div>
    <div className={styles.mobileDock} data-hero-dock><Action>Começar grátis</Action></div>
  </JourneyMotion>
}
