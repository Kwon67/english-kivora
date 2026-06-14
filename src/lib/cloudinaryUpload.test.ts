import { afterEach, describe, expect, it, vi } from 'vitest'

describe('cloudinaryUpload helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('accepts delivery URLs from the configured Cloudinary cloud', async () => {
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'diuh0ditl')
    const { isAllowedCloudinaryDeliveryUrl } = await import('./cloudinaryUpload')

    expect(
      isAllowedCloudinaryDeliveryUrl(
        'https://res.cloudinary.com/diuh0ditl/image/upload/v123/kivora/profiles/user-1/avatar/photo.jpg'
      )
    ).toBe(true)
    expect(isAllowedCloudinaryDeliveryUrl('https://evil.test/photo.jpg')).toBe(false)
  })

  it('rejects unsupported image types', async () => {
    const { validateProfileImageFile } = await import('./cloudinaryUpload')
    const file = new File(['x'], 'test.svg', { type: 'image/svg+xml' })
    expect(validateProfileImageFile(file)).toMatch(/Formato inválido/)
  })
})