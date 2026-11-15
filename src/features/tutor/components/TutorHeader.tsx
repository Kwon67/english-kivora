import { MessageCircle, Mic } from 'lucide-react'
import ConversationIllustration from '@/components/illustrations/ConversationIllustration'
import MotionSurface from '@/components/motion/MotionSurface'

export default function TutorHeader() {
  return <MotionSurface className="tutor-introduction"><div><p className="product-kicker">CONVERSAÇÃO COM IA · PRO</p><h1>Seu inglês merece<br />uma <em>conversa.</em></h1><p>Você não precisa ter todas as palavras. Escolha uma situação, tente uma frase e construa a conversa.</p><div className="tutor-introduction-tags"><span><Mic size={16} aria-hidden="true" /> Pratique por voz</span><span><MessageCircle size={16} aria-hidden="true" /> Ou comece por texto</span></div></div><ConversationIllustration className="tutor-introduction-art" /></MotionSurface>
}
