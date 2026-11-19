import './PracticePathEntry.css'
import Link from 'next/link'
import { ArrowRight, MessagesSquare } from 'lucide-react'

/** Shared by the learner workspace and its local preview. */
export default function PracticePathEntry() {
  return <Link href="/practice-path" className="competency-entry">
    <span className="competency-entry-icon"><MessagesSquare size={25} strokeWidth={1.5} aria-hidden="true" /></span>
    <span className="competency-entry-copy"><strong>Prática por competências</strong><span>Leia, responda e leve seu inglês para novas situações.</span></span>
    <span className="competency-entry-cta"><span className="sr-only">Explorar práticas</span><ArrowRight size={18} aria-hidden="true" /></span>
  </Link>
}
