'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

interface ProfileHeaderProps {
  isMFAEnabled: boolean
}

export default function ProfileHeader({ isMFAEnabled }: ProfileHeaderProps) {
  return (
    <header className="premium-card relative overflow-hidden border-[var(--color-border)]/70 p-6 sm:p-8 lg:p-10 group">
      {/* Decorative background glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-light)/0.3,transparent_60%)] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-[var(--color-primary)]/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-center relative z-10">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="stitch-pill bg-[var(--color-primary-container)] text-[var(--color-primary)] font-black text-[10px] tracking-wider uppercase">
              Configurações
            </span>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                isMFAEnabled 
                  ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isMFAEnabled ? 'bg-green-500' : 'bg-amber-500'}`} />
              {isMFAEnabled ? 'Segurança Forte (2FA)' : '2FA Recomendado'}
            </motion.div>
          </div>

          <h1 className="text-3xl font-black leading-tight text-[var(--color-text)] tracking-tight sm:text-4xl">
            Meu Perfil
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-[var(--color-text-muted)] max-w-xl">
            Personalize sua identidade no Kivora. Altere sua foto de avatar, capa de fundo, sua biografia e detalhes de contato.
          </p>
        </div>

        {/* Animated unDraw Illustration */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-[var(--color-border)]/80 bg-gradient-to-br from-[var(--color-surface-container-lowest)] via-[var(--color-surface-container-low)] to-[var(--color-primary-light)]/10 p-4 shadow-sm min-h-[140px] flex items-center justify-center"
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            className="w-full max-w-[180px]"
          >
            <Image
              src="/images/home/undraw-profile-settings.svg"
              alt="Ilustração de Perfil"
              width={260}
              height={200}
              unoptimized
              priority
              className="mx-auto h-auto w-full object-contain filter drop-shadow-sm select-none"
            />
          </motion.div>
        </motion.div>
      </div>
    </header>
  )
}
