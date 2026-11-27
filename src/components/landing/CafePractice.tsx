'use client'

import { useRef } from 'react'
import { MessageCircle, X } from 'lucide-react'
import ConversationPreview from './ConversationPreview'
import styles from './Editorial.module.css'

export default function CafePractice() {
  const dialog = useRef<HTMLDialogElement>(null)
  return <>
    <button type="button" className={styles.cafePrompt} aria-haspopup="dialog"
      onClick={() => dialog.current?.showModal()}>
      <MessageCircle size={17} aria-hidden="true" /> Praticar no café
    </button>
    <dialog ref={dialog} className={styles.cafeDialog} aria-labelledby="cafe-practice-title">
      <div className={styles.dialogHeader}><h2 id="cafe-practice-title">Conversa no café</h2>
        <button type="button" aria-label="Fechar prática" onClick={() => dialog.current?.close()}><X size={20} /></button>
      </div>
      <ConversationPreview editorial />
    </dialog>
  </>
}
