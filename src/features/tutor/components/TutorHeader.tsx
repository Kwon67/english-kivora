import ConversationIllustration from '@/components/illustrations/ConversationIllustration'
import SpotIllustration from '@/components/illustrations/SpotIllustration'

export default function TutorHeader() {
  return (
    <header className="tutor-introduction">
      <div>
        <p className="product-kicker flex items-center gap-2">
          <SpotIllustration motif="chat" className="h-6 w-6 shrink-0" />
          CONVERSAÇÃO COM IA · PRO
        </p>
        <h1>Tutor de conversação</h1>
        <p>Pratique inglês por voz ou texto em situações do dia a dia.</p>
      </div>
      <ConversationIllustration className="tutor-introduction-art" />
    </header>
  )
}
