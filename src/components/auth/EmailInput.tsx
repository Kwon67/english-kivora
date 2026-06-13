'use client';

import { type CSSProperties, useState } from 'react';

type EmailInputProps = {
  onBlurEmail?: (email: string) => void;
  label?: string;
  className?: string;
};

export default function EmailInput({ onBlurEmail, label = "Email", className }: EmailInputProps) {
  const [email, setEmail] = useState('');

  return (
    <div data-layer="Email Field" className="EmailField self-stretch flex flex-col justify-start items-start gap-1.5 w-full">
      <div data-layer="Label" className="Label self-stretch flex flex-col justify-start items-start">
        <label
          htmlFor="username"
          className={className ?? "EmailAddress self-stretch justify-center text-xs font-semibold font-inter leading-5 cursor-pointer text-[#425039] dark:text-[#b9c3a4]"}
        >
          {label}
        </label>
      </div>
      <div data-layer="Container" className="Container self-stretch relative flex flex-col justify-start items-start w-full">
        <div
          data-layer="Input"
          className="Input self-stretch px-4 py-3 bg-[#f4f5e8]/50 rounded-xl border border-dashed border-[#172113]/24 inline-flex justify-center items-start overflow-hidden w-full transition-all focus-within:border-solid focus-within:border-[#183b16] focus-within:shadow-[0_0_14px_rgba(24,59,22,0.12)] focus-within:bg-[#fbfcf2]/90 dark:bg-[#b8ff5c]/8/30 dark:border-[#d5e6a9]/24 dark:focus-within:border-solid dark:focus-within:border-[#b8ff5c] dark:focus-within:bg-[#11160e]/90 dark:focus-within:shadow-[0_0_14px_rgba(184,255,92,0.12)]"
        >
          <div data-layer="Container" className="Container flex-1 inline-flex flex-col justify-start items-start overflow-hidden w-full">
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Enter"
              data-testid="login-username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => onBlurEmail?.(email)}
              className="w-full bg-transparent outline-none border-none p-0 text-base font-normal font-inter focus:ring-0 focus:outline-none"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties} />
          </div>
        </div>
      </div>
    </div>);

}
