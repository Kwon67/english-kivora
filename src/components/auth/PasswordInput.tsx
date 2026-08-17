'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { landingInputClass } from '@/lib/landingStyles'

export default function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div data-layer="Password Field" className="PasswordField self-stretch flex flex-col justify-start items-start gap-1.5 w-full">
      <div data-layer="Container" className="Container self-stretch inline-flex justify-between items-center w-full">
        <div data-layer="Label" className="Label inline-flex flex-col justify-start items-start">
          <label
            htmlFor="password"
            className="Text justify-center text-xs font-semibold leading-5 cursor-pointer text-brand-secondary"
          >
            Senha
          </label>
        </div>
        <div data-layer="Link" className="Link inline-flex flex-col justify-start items-start">
          <Link
            href="/forgot-password"
            className="Forgot justify-center text-xs font-semibold leading-4 cursor-pointer text-brand-dark underline underline-offset-4 focus:outline-none"
          >
            Esqueceu?
          </Link>
        </div>
      </div>
      <div data-layer="Container" className="Container self-stretch relative flex flex-col justify-start items-start w-full">
        <div
          data-layer="Input"
          className={`Input self-stretch py-3 pl-4 pr-11 inline-flex items-center overflow-hidden w-full ${landingInputClass}`}
        >
          <div data-layer="Container" className="Container flex-1 inline-flex flex-col justify-start items-start overflow-hidden w-full">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Enter"
              data-testid="login-password"
              className="w-full border-none bg-transparent p-0 font-body text-base font-normal text-brand-dark outline-none placeholder:text-brand-secondary/70 focus:outline-none focus:ring-0"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-brand-secondary hover:text-brand-dark focus:outline-none"
          aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
        >
          <span data-svg-wrapper data-layer="Container" className="inline-flex items-center justify-center">
            {showPassword ? (
              <Eye className="h-5 w-5" aria-hidden="true" />
            ) : (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
        </button>
      </div>
    </div>
  )
}
