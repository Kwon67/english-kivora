'use client'

import { type CSSProperties, useState } from 'react'
import Link from 'next/link'

export default function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div data-layer="Password Field" className="PasswordField self-stretch flex flex-col justify-start items-start gap-1.5 w-full">
      <div data-layer="Container" className="Container self-stretch inline-flex justify-between items-center w-full">
        <div data-layer="Label" className="Label inline-flex flex-col justify-start items-start">
          <label
            htmlFor="password"
            className="Text justify-center text-xs font-semibold font-inter leading-5 cursor-pointer text-[#425039] dark:text-[#b9c3a4]"
          >
            Senha
          </label>
        </div>
        <div data-layer="Link" className="Link inline-flex flex-col justify-start items-start">
          <Link
            href="/forgot-password"
            className="Forgot justify-center text-xs font-semibold font-inter leading-4 hover:underline cursor-pointer focus:outline-none"
            style={{ color: 'var(--color-primary)' }}
          >
            Esqueceu?
          </Link>
        </div>
      </div>
      <div data-layer="Container" className="Container self-stretch relative flex flex-col justify-start items-start w-full">
        <div
          data-layer="Input"
          className="Input self-stretch pl-4 pr-10 py-3 bg-[#f4f5e8]/50 rounded-xl border border-dashed border-[#172113]/24 inline-flex justify-center items-start overflow-hidden w-full transition-all focus-within:border-solid focus-within:border-[#183b16] focus-within:shadow-[0_0_14px_rgba(24,59,22,0.12)] focus-within:bg-[#fbfcf2]/90 dark:bg-[#b8ff5c]/8/30 dark:border-[#d5e6a9]/24 dark:focus-within:border-solid dark:focus-within:border-[#b8ff5c] dark:focus-within:bg-[#11160e]/90 dark:focus-within:shadow-[0_0_14px_rgba(184,255,92,0.12)]"
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
              className="w-full bg-transparent outline-none border-none p-0 text-base font-normal font-inter focus:ring-0 focus:outline-none"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="h-12 pr-3 right-0 top-0 absolute inline-flex justify-start items-center cursor-pointer focus:outline-none text-[#425039] dark:text-[#b9c3a4] hover:text-[#183b16] dark:hover:text-[#b8ff5c]"
          aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
        >
          <div data-svg-wrapper data-layer="Container" className="Container">
            {showPassword ? (
              <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 3.2C12.9167 3.2 14.6542 3.69583 16.2125 4.6875C17.7708 5.67917 18.9667 7.01667 19.8 8.7C18.9667 10.3833 17.7708 11.7208 16.2125 12.7125C14.6542 13.7042 12.9167 14.2 11 14.2C9.08333 14.2 7.34583 13.7042 5.7875 12.7125C4.22917 11.7208 3.03333 10.3833 2.2 8.7C2.48333 8.1 2.825 7.54167 3.225 7.025C3.625 6.50833 4.06667 6.03333 4.55 5.6C5.03333 5.16667 5.5375 4.8 6.0625 4.5C6.5875 4.2 7.125 3.96667 7.675 3.8C8.225 3.63333 8.775 3.51667 9.325 3.45C9.875 3.38333 10.4333 3.35 11 3.2ZM11 1.2C8.48333 1.2 6.24167 1.89583 4.275 3.2875C2.30833 4.67917 0.883333 6.48333 0 8.7C0.883333 10.9167 2.30833 12.7208 4.275 14.1125C6.24167 15.5042 8.48333 16.2 11 16.2C13.5167 16.2 15.7583 15.5042 17.725 14.1125C19.6917 12.7208 21.1167 10.9167 22 8.7C21.1167 6.48333 19.6917 4.67917 17.725 3.2875C15.7583 1.89583 13.5167 1.2 11 1.2ZM11 5.2C11.9667 5.2 12.7875 5.5375 13.4625 6.2125C14.1375 6.8875 14.475 7.70833 14.475 8.7C14.475 9.69167 14.1375 10.5125 13.4625 11.1875C12.7875 11.8625 11.9667 12.2 11 12.2C10.0333 12.2 9.2125 11.8625 8.5375 11.1875C7.8625 10.5125 7.525 9.69167 7.525 8.7C7.525 7.70833 7.8625 6.8875 8.5375 6.2125C9.2125 5.5375 10.0333 5.2 11 5.2ZM11 7.2C10.5833 7.2 10.2292 7.34583 9.9375 7.6375C9.64583 7.92917 9.5 8.28333 9.5 8.7C9.5 9.11667 9.64583 9.47083 9.9375 9.7625C10.2292 10.0542 10.5833 10.2 11 10.2C11.4167 10.2 11.7708 10.0542 12.0625 9.7625C12.3542 9.47083 12.5 9.11667 12.5 8.7C12.5 8.28333 12.3542 7.92917 12.0625 7.6375C11.7708 7.34583 11.4167 7.2 11 7.2Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.1 10.5L13.65 9.05C13.8 8.26667 13.575 7.53333 12.975 6.85C12.375 6.16667 11.6 5.9 10.65 6.05L9.2 4.6C9.48333 4.46667 9.77083 4.36667 10.0625 4.3C10.3542 4.23333 10.6667 4.2 11 4.2C12.25 4.2 13.3125 4.6375 14.1875 5.5125C15.0625 6.3875 15.5 7.45 15.5 8.7C15.5 9.03333 15.4667 9.34583 15.4 9.6375C15.3333 9.92917 15.2333 10.2167 15.1 10.5ZM18.3 13.65L16.85 12.25C17.4833 11.7667 18.0458 11.2375 18.5375 10.6625C19.0292 10.0875 19.45 9.43333 19.8 8.7C18.9667 7.01667 17.7708 5.67917 16.2125 4.6875C14.6542 3.69583 12.9167 3.2 11 3.2C10.5167 3.2 10.0417 3.23333 9.575 3.3C9.10833 3.36667 8.65 3.46667 8.2 3.6L6.65 2.05C7.33333 1.76667 8.03333 1.55417 8.75 1.4125C9.46667 1.27083 10.2167 1.2 11 1.2C13.5167 1.2 15.7583 1.89583 17.725 3.2875C19.6917 4.67917 21.1167 6.48333 22 8.7C21.6167 9.68333 21.1125 10.5958 20.4875 11.4375C19.8625 12.2792 19.1333 13.0167 18.3 13.65ZM18.8 19.8L14.6 15.65C14.0167 15.8333 13.4292 15.9708 12.8375 16.0625C12.2458 16.1542 11.6333 16.2 11 16.2C8.48333 16.2 6.24167 15.5042 4.275 14.1125C2.30833 12.7208 0.883333 10.9167 0 8.7C0.35 7.81667 0.791667 6.99583 1.325 6.2375C1.85833 5.47917 2.46667 4.8 3.15 4.2L0.4 1.4L1.8 0L20.2 18.4L18.8 19.8ZM4.55 5.6C4.06667 6.03333 3.625 6.50833 3.225 7.025C2.825 7.54167 2.48333 8.1 2.2 8.7C3.03333 10.3833 4.22917 11.7208 5.7875 12.7125C7.34583 13.7042 9.08333 14.2 11 14.2C11.3333 14.2 11.6583 14.1792 11.975 14.1375C12.2917 14.0958 12.6167 14.05 12.95 14L12.05 13.05C11.8667 13.1 11.6917 13.1375 11.525 13.1625C11.3583 13.1875 11.1833 13.2 11 13.2C9.75 13.2 8.6875 12.7625 7.8125 11.8875C6.9375 11.0125 6.5 9.95 6.5 8.7C6.5 8.51667 6.5125 8.34167 6.5375 8.175C6.5625 8.00833 6.6 7.83333 6.65 7.65L4.55 5.6Z" fill="currentColor" />
              </svg>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}
