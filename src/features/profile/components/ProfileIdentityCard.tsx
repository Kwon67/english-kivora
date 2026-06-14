'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { AlertCircle, Camera, CheckCircle2, Loader2, Save, User } from 'lucide-react'
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

  return (
    <section id="identidade" className={sectionScrollMt}>
      <form onSubmit={handleSubmit} className={`${glassPanel} overflow-hidden`}>
        <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />

        <div className="relative z-10">
          <div className="relative h-36 w-full overflow-hidden sm:h-44">
            {coverPreview ? (
              <Image src={coverPreview} alt="Capa do perfil" fill className="object-cover" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e3ecc2] to-[#eef3d6] text-xs font-bold text-[#5a664e] dark:from-[#11160e] dark:to-[#183b16]/40 dark:text-[#9ea98b]">
                Sem imagem de capa
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#fbfcf2] via-black/10 to-transparent dark:from-[#11160e]" />

            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/45 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm sm:hidden"
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              Trocar capa
            </button>

            <button
              type="button"
              onClick={() => coverFileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 hidden items-center justify-center bg-black/45 opacity-0 transition-opacity hover:opacity-100 sm:flex"
            >
              {isUploading ? (
                <Loader2 className="h-7 w-7 animate-spin text-white" />
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Camera className="h-6 w-6 text-white" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">Alterar capa</span>
                </div>
              )}
            </button>

            <input ref={coverFileInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
          </div>

          <div className="px-5 pb-5 sm:px-7 sm:pb-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
                <div className="relative shrink-0">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-[#fbfcf2] bg-[#eef3d6] shadow-lg dark:border-[#11160e] dark:bg-[#080b06] sm:h-28 sm:w-28">
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt={username} width={112} height={112} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-8 w-8 text-[#5a664e] dark:text-[#9ea98b]" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[#172113]/20 bg-[#183b16] text-[#f7f8ef] shadow-md dark:border-[#d5e6a9]/20 dark:bg-[#b8ff5c] dark:text-[#050704]"
                    aria-label="Trocar foto de perfil"
                  >
                    {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </div>

                <div className="min-w-0 pb-1">
                  <p className={softKicker}>Identidade</p>
                  <h1 className="mt-2 truncate font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">{username}</h1>
                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-bold ${
                      isMFAEnabled
                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:border-[#b8ff5c]/25 dark:bg-[#b8ff5c]/10 dark:text-[#b8ff5c]'
                        : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isMFAEnabled ? 'bg-emerald-500 dark:bg-[#b8ff5c]' : 'bg-amber-500'}`} />
                    {isMFAEnabled ? '2FA ativo' : '2FA recomendado'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="self-start rounded-full border border-[#172113]/20 bg-[#eef3d6] px-3.5 py-2 text-xs font-bold text-[#183b16] sm:hidden dark:border-[#d5e6a9]/20 dark:bg-[#b8ff5c]/8 dark:text-[#b8ff5c]"
              >
                Trocar foto
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="profile-bio" className="text-xs font-bold uppercase tracking-wider text-[#5a664e] dark:text-[#9ea98b]">
                    Bio rápida
                  </label>
                  <span className="text-[10px] font-semibold text-[#5a664e] dark:text-[#9ea98b]">{bio.length}/160</span>
                </div>
                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  rows={2}
                  placeholder="Uma frase curta que te descreve..."
                  className={`${profileField} resize-none`}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="profile-description" className="text-xs font-bold uppercase tracking-wider text-[#5a664e] dark:text-[#9ea98b]">
                    História e objetivos
                  </label>
                  <span className="text-[10px] font-semibold text-[#5a664e] dark:text-[#9ea98b]">{description.length}/500</span>
                </div>
                <textarea
                  id="profile-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Conte mais sobre você e seus objetivos com o inglês..."
                  className={`${profileField} resize-none`}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {message && (
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`mt-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-bold sm:text-sm ${
                    message.type === 'success'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-[#b8ff5c]/20 dark:bg-[#b8ff5c]/10 dark:text-[#b8ff5c]'
                      : 'border-red-500/20 bg-red-500/10 text-red-600'
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

            <div
              className={`mt-5 border-t border-dashed border-[#172113]/20 pt-5 dark:border-[#d5e6a9]/20 ${
                isDirty ? 'sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-10 -mx-5 bg-[#fbfcf2]/95 px-5 py-3 backdrop-blur-md sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none dark:bg-[#11160e]/95 sm:dark:bg-transparent' : ''
              }`}
            >
              <m.button
                type="submit"
                disabled={isPending || isUploading || !isDirty}
                whileHover={{ scale: isDirty ? 1.01 : 1 }}
                whileTap={{ scale: isDirty ? 0.99 : 1 }}
                className={`${primaryBtn} w-full py-3.5`}
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
        </div>
      </form>
    </section>
  )
}