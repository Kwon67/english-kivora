declare module 'befree-visual-edit' {
  const befreeVisualEdit: unknown

  export default befreeVisualEdit
}

declare module 'befree-visual-edit/next' {
  import type { NextConfig } from 'next'

  export function withVisualEdit(nextConfig?: NextConfig): NextConfig
}
