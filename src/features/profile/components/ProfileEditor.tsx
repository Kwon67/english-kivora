'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { Camera, Loader2, Save, User, CheckCircle2, AlertCircle } from 'lucide-react'
import { updateProfileAction } from '@/app/actions'
import { m, AnimatePresence } from 'framer-motion'

interface ProfileEditorProps {
  username: string
  bio: string
  description: string
  avatarUrl: string
  coverUrl: string
}

export default function ProfileEditor({ username, bio: initialBio, description: initialDescription, avatarUrl: initialAvatarUrl, coverUrl: initialCoverUrl }: ProfileEditorProps) {
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

  async function handleAvatarUpload(file: File) {
    if (!cloudName || !uploadPreset) {
      setMessage({ type: 'error', text: 'Cloudinary não configurado. Contate o administrador.' })
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.error('Cloudinary upload error:', errData)
        throw new Error(errData.error?.message || 'Falha no upload da imagem')
      }

      const data = await response.json()
      setAvatarUrl(data.secure_url)
      setAvatarPreview(data.secure_url)
      setMessage({ type: 'success', text: 'Foto carregada! Clique em Salvar para confirmar.' })
    } catch (err) {
      console.error('Upload catch error:', err)
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

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )

      if (!response.ok) throw new Error('Falha no upload da capa')
      const data = await response.json()
      setCoverUrl(data.secure_url)
      setCoverPreview(data.secure_url)
      setMessage({ type: 'success', text: 'Capa carregada! Clique em Salvar para confirmar.' })
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cover Section */}
        <m.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="premium-card p-5 sm:p-6 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)] mb-4">Capa do Perfil</h2>
            <div className="relative group w-full h-32 sm:h-44 rounded-xl border border-[var(--color-border)]/60 overflow-hidden bg-[var(--color-surface-container-low)]">
              {coverPreview ? (
                <Image
                  src={coverPreview}
                  alt="Capa"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-secondary-light)] flex items-center justify-center text-[var(--color-text-subtle)] text-xs font-semibold">
                  Sem imagem de capa
                </div>
              )}
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="h-7 w-7 text-white animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <Camera className="h-6 w-6 text-white" />
                    <span className="text-white text-xs font-bold uppercase tracking-wider">Alterar Capa</span>
                  </div>
                )}
              </button>
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
              />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-[var(--color-text-subtle)] mt-3">
            Recomendado: Imagens em formato paisagem (mínimo 800x300px).
          </p>
        </m.div>

        {/* Avatar Section */}
        <m.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="premium-card p-5 sm:p-6 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)] mb-4">Foto de Perfil</h2>
            <div className="flex flex-col gap-4 items-center text-center sm:flex-row sm:text-left sm:gap-5">
              <div className="relative group shrink-0">
                <div className="h-24 w-24 rounded-full border border-[var(--color-border)]/85 overflow-hidden bg-[var(--color-surface-container-low)] flex items-center justify-center shadow-inner">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={username}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <User className="h-8 w-8 text-[var(--color-text-subtle)]" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-[var(--color-text)] truncate">{username}</p>
                <p className="text-[11px] text-[var(--color-text-subtle)] mt-1 leading-relaxed">
                  JPG, PNG ou WebP. Limite de tamanho 5MB.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)]/80 px-3.5 py-1.5 text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] hover:border-[var(--color-primary)]/30 transition-all cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Camera className="h-3.5 w-3.5" />
                      Trocar foto
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] font-semibold text-[var(--color-text-subtle)] mt-3">
            Sua foto será exibida no ranking semanal e interações sociais.
          </p>
        </m.div>
      </div>

      {/* Bio & Description Section */}
      <m.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="premium-card p-5 sm:p-6 space-y-5"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-subtle)] border-b border-[var(--color-border)]/40 pb-3">Sobre Você</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="profile-bio" className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                Bio Rápida
              </label>
              <span className="text-[10px] font-semibold text-[var(--color-text-subtle)]">
                {bio.length}/160
              </span>
            </div>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={2}
              placeholder="Uma frase curta que te descreve..."
              className="w-full resize-none rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-surface-container-lowest)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="profile-description" className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                História & Objetivos
              </label>
              <span className="text-[10px] font-semibold text-[var(--color-text-subtle)]">
                {description.length}/500
              </span>
            </div>
            <textarea
              id="profile-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Conte mais sobre você, seus objetivos com o inglês..."
              className="w-full resize-none rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-surface-container-lowest)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>
        </div>
      </m.div>

      {/* Feedback Message with AnimatePresence */}
      <AnimatePresence mode="wait">
        {message && (
          <m.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-bold flex items-center gap-2.5 border ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-[var(--color-error)]" />
            )}
            <span>{message.text}</span>
          </m.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <m.button
        type="submit"
        disabled={isPending || isUploading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold cursor-pointer shadow-md select-none"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando alterações...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Salvar Perfil
          </>
        )}
      </m.button>
    </form>
  )
}
