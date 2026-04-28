'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { Camera, Loader2, Save, User } from 'lucide-react'
import { updateProfileAction } from '@/app/actions'

interface ProfileEditorProps {
  username: string
  bio: string
  description: string
  avatarUrl: string
}

export default function ProfileEditor({ username, bio: initialBio, description: initialDescription, avatarUrl: initialAvatarUrl }: ProfileEditorProps) {
  const [bio, setBio] = useState(initialBio)
  const [description, setDescription] = useState(initialDescription)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      // Preview the image immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)
      formData.append('folder', 'kivora/avatars')

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )

      if (!response.ok) {
        throw new Error('Falha no upload da imagem')
      }

      const data = await response.json()
      setAvatarUrl(data.secure_url)
      setAvatarPreview(data.secure_url)
      setMessage({ type: 'success', text: 'Foto carregada! Clique em Salvar para confirmar.' })
    } catch {
      setMessage({ type: 'error', text: 'Erro ao fazer upload da foto. Tente novamente.' })
      setAvatarPreview(initialAvatarUrl)
    } finally {
      setIsUploading(false)
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione uma imagem.' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' })
      return
    }

    handleAvatarUpload(file)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    const formData = new FormData()
    formData.set('bio', bio)
    formData.set('description', description)
    formData.set('avatar_url', avatarUrl)

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar Section */}
      <div className="premium-card p-6 sm:p-8">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">Foto de Perfil</h2>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full border-2 border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-container-low)] flex items-center justify-center">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt={username}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-[var(--color-text-muted)]" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            >
              {isUploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
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
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--color-text)]">{username}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Clique na foto para alterar. JPG, PNG ou WebP, máximo 5MB.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)] transition-colors"
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

      {/* Bio & Description Section */}
      <div className="premium-card p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-[var(--color-text)]">Sobre Você</h2>

        <div>
          <label htmlFor="profile-bio" className="block text-sm font-semibold text-[var(--color-text)] mb-2">
            Bio
          </label>
          <textarea
            id="profile-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={2}
            placeholder="Uma frase que te descreve..."
            className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
          />
          <p className="mt-1 text-right text-xs text-[var(--color-text-subtle)]">
            {bio.length}/160
          </p>
        </div>

        <div>
          <label htmlFor="profile-description" className="block text-sm font-semibold text-[var(--color-text)] mb-2">
            Descrição
          </label>
          <textarea
            id="profile-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={5}
            placeholder="Conte mais sobre você, seus objetivos com o inglês..."
            className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
          />
          <p className="mt-1 text-right text-xs text-[var(--color-text-subtle)]">
            {description.length}/500
          </p>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          message.type === 'success'
            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20'
            : 'bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20'
        }`}>
          {message.text}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || isUploading}
        className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Salvar Perfil
          </>
        )}
      </button>
    </form>
  )
}
