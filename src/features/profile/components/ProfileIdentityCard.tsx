'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { AlertCircle, Camera, CheckCircle2, ImagePlus, Loader2, Pencil, Save, ShieldCheck, ShieldAlert, User } from 'lucide-react'
import { updateProfileAction } from '@/app/actions'
import { glassPanel, primaryBtn, profileField, sectionScrollMt, softKicker } from '@/features/profile/lib/profileUi'
import { AnimatePresence, m } from 'framer-motion'

type ProfileIdentityCardProps = {
  username: string
  bio: string
  description: string
  avatarUrl: string
  coverUrl: string
  isMFAEnabled: boolean
}

export default function ProfileIdentityCard({
  username,
  bio: initialBio,
  description: initialDescription,
  avatarUrl: initialAvatarUrl,
  coverUrl: initialCoverUrl,
  isMFAEnabled,
}: ProfileIdentityCardProps) {
  const [bio, setBio] = useState(initialBio)
  const [description, setDescription] = useState(initialDescription)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl)
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl)
  const [coverPreview, setCoverPreview] = useState(initialCoverUrl)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverFileInputRef = useRef<HTMLInputElement>(null)

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  const isDirty = useMemo(
    () =>
      bio !== initialBio ||
      description !== initialDescription ||
      avatarUrl !== initialAvatarUrl ||
      coverUrl !== initialCoverUrl,
    [avatarUrl, bio, coverUrl, description, initialAvatarUrl, initialBio, initialCoverUrl, initialDescription]
  )

  async function handleAvatarUpload(file: File) {
    if (!cloudName || !uploadPreset) {
      setMessage({ type: 'error', text: 'Cloudinary não configurado. Contate o administrador.' })
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      const reader = new FileReader()
      reader.onload = (e) => setAvatarPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error?.message || 'Falha no upload da imagem')
      }

      const data = await response.json()
      setAvatarUrl(data.secure_url)
      setAvatarPreview(data.secure_url)
      setMessage({ type: 'success', text: 'Foto carregada! Salve para confirmar.' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tente novamente.'
      setMessage({ type: 'error', text: `Erro ao fazer upload: ${errorMessage}` })
      setAvatarPreview(initialAvatarUrl)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleCoverUpload(file: File) {
    if (!cloudName || !uploadPreset) {
      setMessage({ type: 'error', text: 'Cloudinary não configurado. Contate o administrador.' })
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      const reader = new FileReader()
      reader.onload = (e) => setCoverPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Falha no upload da capa')

      const data = await response.json()
      setCoverUrl(data.secure_url)
      setCoverPreview(data.secure_url)
      setMessage({ type: 'success', text: 'Capa carregada! Salve para confirmar.' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setMessage({ type: 'error', text: `Erro ao fazer upload: ${errorMessage}` })
      setCoverPreview(initialCoverUrl)
    } finally {
      setIsUploading(false)
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione uma imagem.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' })
      return
    }
    handleAvatarUpload(file)
  }

  function handleCoverSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setMessage({ type: 'error', text: 'Por favor, selecione uma imagem.' })
    if (file.size > 5 * 1024 * 1024) return setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' })
    handleCoverUpload(file)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    const formData = new FormData()
    formData.set('bio', bio)
    formData.set('description', description)
    formData.set('avatar_url', avatarUrl)
    formData.set('cover_url', coverUrl)

    startTransition(async () => {
      const result = await updateProfileAction(formData)
      if (result.success) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao atualizar perfil.' })
      }
    })
  }

  const MFAIcon = isMFAEnabled ? ShieldCheck : ShieldAlert

  return (
    <section id="identidade" className={sectionScrollMt}>
      <form onSubmit={handleSubmit} className={`${glassPanel} overflow-hidden`}>
        {/* ─── Cover photo ─── */}
        <div className="relative isolate h-44 w-full overflow-hidden sm:h-56">
          {coverPreview ? (
            <Image src={coverPreview} alt="Capa do perfil" fill className="object-cover transition-transform duration-700 hover:scale-[1.03]" priority />
          ) : (
            <div className="profile-cover-empty flex h-full w-full items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-[#5a664e] dark:text-[#9ea98b]">
                <ImagePlus className="h-6 w-6 opacity-50" />
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] opacity-60">
                  Adicionar capa
                </span>
              </div>
            </div>
          )}

          {/* Gradient overlay: blends cover into content */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#fbfcf2] via-[#fbfcf2]/40 to-transparent dark:from-[#11160e] dark:via-[#11160e]/40" />

          {/* Decorative noise texture on cover */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay [background-image:url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC43IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbHRlcj0idXJsKCNuKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

          {/* Cover upload button */}
          <button
            type="button"
            onClick={() => coverFileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3.5 py-2 text-[0.68rem] font-bold text-white/90 shadow-lg backdrop-blur-md transition-all hover:bg-black/65 hover:text-white active:scale-95"
          >
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            Trocar capa
          </button>

          <input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
        </div>

        {/* ─── Profile identity area ─── */}
        <div className="relative z-10 bg-[#fbfcf2] px-5 pb-6 dark:bg-[#11160e] sm:px-7 sm:pb-8">
          {/* Avatar + Identity row */}
          <div className="-mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end sm:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="profile-avatar-ring relative h-28 w-28 sm:h-32 sm:w-32">
                <div className="h-full w-full overflow-hidden rounded-full border-[3.5px] border-[#fbfcf2] bg-[#eef3d6] shadow-[0_8px_32px_rgba(24,59,22,0.18)] dark:border-[#11160e] dark:bg-[#080b06]">
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt={username} width={128} height={128} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e3ecc2] to-[#dfe9bd] dark:from-[#11160e] dark:to-[#183b16]/30">
                      <User className="h-10 w-10 text-[#5a664e]/60 dark:text-[#9ea98b]/60" />
                    </div>
                  )}
                </div>
              </div>

              {/* Avatar upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#fbfcf2] bg-[#183b16] text-[#f7f8ef] shadow-[0_4px_14px_rgba(24,59,22,0.28)] transition-all hover:bg-[#24551d] hover:shadow-[0_6px_20px_rgba(24,59,22,0.35)] active:scale-90 dark:border-[#11160e] dark:bg-[#b8ff5c] dark:text-[#050704] dark:hover:bg-[#cbff83]"
                aria-label="Trocar foto de perfil"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </div>

            {/* Identity info */}
            <div className="flex min-w-0 flex-1 flex-col gap-3 pb-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className={softKicker}>Identidade</p>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold transition-colors ${
                    isMFAEnabled
                      ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-700 dark:border-[#b8ff5c]/20 dark:bg-[#b8ff5c]/8 dark:text-[#b8ff5c]'
                      : 'border-amber-500/25 bg-amber-500/8 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/8 dark:text-amber-300'
                  }`}
                >
                  <MFAIcon className="h-3 w-3" strokeWidth={2.5} />
                  {isMFAEnabled ? '2FA ativo' : '2FA recomendado'}
                </span>
              </div>

              <h2 className="w-full break-words font-montserrat text-2xl font-bold leading-tight text-[#10130f] dark:text-[#f4f7e9] sm:text-[1.75rem]">
                {username}
              </h2>
            </div>
          </div>

          {/* ─── Divider ─── */}
          <div className="mt-7 h-px bg-gradient-to-r from-transparent via-[#172113]/12 to-transparent dark:via-[#d5e6a9]/12" />

          {/* ─── Form fields ─── */}
          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            {/* Bio */}
            <div className="group">
              <div className="mb-2.5 flex items-center justify-between">
                <label htmlFor="profile-bio" className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5a664e] dark:text-[#9ea98b]">
                  <Pencil className="h-3 w-3 opacity-50" />
                  Bio rápida
                </label>
                <span className={`text-[10px] font-semibold tabular-nums transition-colors ${bio.length > 140 ? 'text-amber-600 dark:text-amber-400' : 'text-[#5a664e]/60 dark:text-[#9ea98b]/60'}`}>
                  {bio.length}/160
                </span>
              </div>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Uma frase curta que te descreve..."
                className={`${profileField} resize-none transition-shadow focus:shadow-[0_0_0_4px_rgba(24,59,22,0.06)] dark:focus:shadow-[0_0_0_4px_rgba(184,255,92,0.06)]`}
              />
            </div>

            {/* Description */}
            <div className="group">
              <div className="mb-2.5 flex items-center justify-between">
                <label htmlFor="profile-description" className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#5a664e] dark:text-[#9ea98b]">
                  <Pencil className="h-3 w-3 opacity-50" />
                  História e objetivos
                </label>
                <span className={`text-[10px] font-semibold tabular-nums transition-colors ${description.length > 450 ? 'text-amber-600 dark:text-amber-400' : 'text-[#5a664e]/60 dark:text-[#9ea98b]/60'}`}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                id="profile-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={5}
                placeholder="Conte mais sobre você e seus objetivos com o inglês..."
                className={`${profileField} resize-none transition-shadow focus:shadow-[0_0_0_4px_rgba(24,59,22,0.06)] dark:focus:shadow-[0_0_0_4px_rgba(184,255,92,0.06)]`}
              />
            </div>
          </div>

          {/* ─── Feedback message ─── */}
          <AnimatePresence mode="wait">
            {message && (
              <m.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className={`mt-6 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-xs font-bold sm:text-sm ${
                  message.type === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:border-[#b8ff5c]/20 dark:bg-[#b8ff5c]/8 dark:text-[#b8ff5c]'
                    : 'border-red-500/20 bg-red-500/8 text-red-600 dark:text-red-400'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{message.text}</span>
              </m.div>
            )}
          </AnimatePresence>

          {/* ─── Submit bar ─── */}
          <div
            className={`mt-6 border-t border-dashed border-[#172113]/15 pt-5 dark:border-[#d5e6a9]/15 ${
              isDirty ? 'sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-10 -mx-5 bg-[#fbfcf2]/95 px-5 py-3 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none dark:bg-[#11160e]/95 sm:dark:bg-transparent' : ''
            }`}
          >
            <m.button
              type="submit"
              disabled={isPending || isUploading || !isDirty}
              whileHover={{ scale: isDirty ? 1.01 : 1 }}
              whileTap={{ scale: isDirty ? 0.98 : 1 }}
              className={`${primaryBtn} w-full py-3.5 sm:w-auto sm:min-w-[200px]`}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando alterações...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar perfil
                </>
              )}
            </m.button>
          </div>
        </div>
      </form>
    </section>
  )
}