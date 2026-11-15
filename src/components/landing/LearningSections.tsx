import Link from 'next/link'
import { ArrowRight, BookOpen, Check, Headphones, MessageCircle, Mic, RotateCcw, Sparkles, TrendingUp } from 'lucide-react'
import ConversationIllustration from '@/components/illustrations/ConversationIllustration'
import LearningMotion from './LearningMotion'
import LevelExplorer from './LevelExplorer'
import PracticePreview from './PracticePreview'
import styles from './LearningLanding.module.css'

function Heading({ number, label, title, children }: { number: string; label: string; title: React.ReactNode; children?: React.ReactNode }) {
  return <div className={styles.sectionHeading} data-entrance><p className={styles.eyebrow}><span className={styles.sectionNumber}>{number}</span>{label}</p><h2>{title}</h2>{children && <p className={styles.sectionDescription}>{children}</p>}</div>
}

export default function LearningSections() {
  return <>
    <section id="seu-caminho" className={styles.pathSection}>
      <LearningMotion className={styles.sectionInner}>
        <Heading number="01" label="UM CAMINHO QUE É SEU" title={<>De um primeiro <em lang="en">hello</em><br />a tudo que você quer dizer.</>}>Seis níveis, novas possibilidades. Explore o inglês que cabe na sua vida.</Heading>
        <div data-entrance><LevelExplorer /></div>
      </LearningMotion>
    </section>

    <section id="como-funciona" className={styles.practiceSection}>
      <LearningMotion className={styles.practiceGrid}>
        <div className={styles.practiceCopy}>
          <Heading number="02" label="MENOS PASSIVIDADE. MAIS PRÁTICA." title={<>Aprender inglês<br />é <em>fazer inglês.</em></>}>Escolha, construa, escute e relembre. Cada tentativa vem com um próximo passo para você entender o que está aprendendo.</Heading>
          <ol className={styles.methodList}>
            <li data-entrance data-tone="grammar"><span>01</span><div><strong>Pense antes de revelar</strong><p>Busque a resposta na memória. Reconhecer é só o começo.</p></div></li>
            <li data-entrance data-tone="listening"><span>02</span><div><strong>Use mais de uma habilidade</strong><p>Combine leitura, escuta, escrita e fala nas suas lições.</p></div></li>
            <li data-entrance data-tone="review"><span>03</span><div><strong>Aprenda com a resposta</strong><p>Veja o que acertou e volte ao que ainda precisa de prática.</p></div></li>
          </ol>
          <p className={styles.handNote}>Sua primeira descoberta começa aqui <ArrowRight size={23} aria-hidden="true" /></p>
        </div>
        <div className={styles.practiceFrame} data-entrance><PracticePreview /></div>
      </LearningMotion>
    </section>

    <section id="revisoes" className={styles.recallSection}>
      <LearningMotion className={styles.recallGrid}>
        <div className={styles.memoryVisual} data-entrance>
          <div className={styles.memoryWord}><span>NA SUA COLEÇÃO</span><strong lang="en">make it happen</strong><p>fazer acontecer</p><BookOpen size={23} aria-hidden="true" /></div>
          <svg className={styles.memoryTrail} viewBox="0 0 440 170" fill="none" aria-hidden="true"><path d="M25 122C65 122 44 35 114 35S164 128 229 128s76-93 184-93" stroke="#b1c2b7" strokeWidth="2" strokeDasharray="5 7" /><path data-draw-path d="M25 122C65 122 44 35 114 35S164 128 229 128s76-93 184-93" stroke="var(--brand-green)" strokeWidth="3" /><circle cx="25" cy="122" r="10" fill="#F3D778" stroke="var(--brand-green)" /><circle cx="114" cy="35" r="13" fill="var(--brand-sage)" stroke="var(--brand-green)" /><circle cx="229" cy="128" r="16" fill="#789684" stroke="var(--brand-green)" /><circle cx="413" cy="35" r="20" fill="var(--brand-green)" /><path d="m403 35 7 7 13-14" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg>
          <div className={styles.memoryStages}><span>Descobrir</span><span>Relembrar</span><span>Consolidar</span></div>
          <p className={styles.visualCaption}>Um exemplo de percurso. O intervalo acompanha suas respostas.</p>
        </div>
        <div><Heading number="03" label="MEMÓRIA COM MÉTODO" title={<>Não é revisar mais.<br />É revisar <em>na sua hora.</em></>}>O que ainda está difícil volta mais cedo. O que você já lembra ganha espaço. A repetição espaçada usa suas respostas para organizar as próximas revisões.</Heading><div className={styles.featureTags}><span data-tone="review"><RotateCcw size={16} /> Repetição espaçada</span><span data-tone="vocabulary"><BookOpen size={16} /> Seu vocabulário</span></div><Link href="/register" className={styles.textLink}>Construir minha coleção <ArrowRight size={18} aria-hidden="true" /></Link></div>
      </LearningMotion>
    </section>

    <section id="conversacao" className={styles.conversationSection}>
      <LearningMotion className={styles.conversationGrid}>
        <div><Heading number="04" label="INGLÊS PARA SAIR DO PAPEL" title={<>Uma conversa abre<br /><em>um mundo.</em></>}>Do pedido no café à entrevista de trabalho. Pratique por texto ou voz com o tutor de IA e receba dicas enquanto a conversa acontece.</Heading><div className={styles.scenarioTags}><span>Um café</span><span>Uma viagem</span><span>Uma nova oportunidade</span></div><Link href="/register?plan=pro" className={styles.primary}>Conhecer o tutor <ArrowRight size={18} aria-hidden="true" /></Link><p className={styles.featureNote}>Conversação com IA disponível no Pro.</p></div>
        <div className={styles.conversationVisual} data-entrance><ConversationIllustration className={styles.conversationArt} /><div className={styles.chatSample}><span className={styles.exampleLabel}>EXEMPLO DE CONVERSA</span><p lang="en"><MessageCircle size={17} aria-hidden="true" /> What would you like today?</p><p className={styles.chatReply} lang="en">I’d like a coffee, please.</p><div className={styles.chatTip}><Sparkles size={16} aria-hidden="true" /><span>“I’d like” deixa o seu pedido mais natural.</span></div><div className={styles.chatInput}><span>Você tem espaço para tentar.</span><Mic size={18} aria-hidden="true" /></div></div></div>
      </LearningMotion>
    </section>

    <section className={styles.progressSection}>
      <LearningMotion className={styles.progressGrid}>
        <div className={styles.planVisual} data-entrance><div className={styles.planHeading}><CompassIcon /><span>SEU PRÓXIMO PASSO</span></div><h3>Um pouco de cada vez.<br />Um caminho só seu.</h3><ul><li data-tone="review"><span><RotateCcw size={19} /></span><div><strong>Relembre o que importa</strong><small>Palavras que precisam de atenção</small></div><Check size={18} /></li><li data-tone="listening"><span><Headphones size={19} /></span><div><strong>Descubra algo novo</strong><small>Uma lição no seu nível</small></div><ArrowRight size={18} /></li><li data-tone="tutor"><span><MessageCircle size={19} /></span><div><strong>Leve para uma conversa</strong><small>Inglês aplicado a situações reais</small></div><ArrowRight size={18} /></li></ul><span className={styles.visualCaption}>Uma rotina possível. Seu plano considera nível, objetivos e dificuldades.</span></div>
        <div><Heading number="05" label="SEU ESFORÇO TEM DIREÇÃO" title={<>Pequenos passos.<br /><em>Progresso de verdade.</em></>}>Seu plano conecta nível, interesses e pontos que precisam de atenção. Acompanhe suas revisões, explore suas dificuldades e veja sua evolução ao longo do tempo.</Heading><div className={styles.progressPromise}><TrendingUp size={25} aria-hidden="true" /><p>Mais que uma sequência de dias.<br /><strong>Saiba o que praticar a seguir.</strong></p></div><Link href="/register" className={styles.textLink}>Encontrar meu ponto de partida <ArrowRight size={18} aria-hidden="true" /></Link></div>
      </LearningMotion>
    </section>
  </>
}

function CompassIcon() {
  return <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" /><path d="m20 10-3 9-7 3 3-9Z" fill="var(--brand-yellow)" stroke="currentColor" strokeWidth="1.5" /></svg>
}
