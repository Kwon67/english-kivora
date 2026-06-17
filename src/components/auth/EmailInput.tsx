'use client';

import { type CSSProperties, useState } from 'react';
import { authInput } from '@/lib/brandUi';

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
          className={className ?? "EmailAddress self-stretch justify-center text-xs font-semibold font-inter leading-5 cursor-pointer text-text-muted dark:text-text-muted"}
        >
          {label}
        </label>
      </div>
      <div data-layer="Container" className="Container self-stretch relative flex flex-col justify-start items-start w-full">
        <div
          data-layer="Input"
          className={`${authInput} px-4`}
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
