'use client';

import { useState } from 'react';
import { landingInputClass } from '@/lib/landingStyles';

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
            className={className ?? 'EmailAddress self-stretch justify-center text-xs font-semibold leading-5 cursor-pointer text-brand-secondary'}
        >
          {label}
        </label>
      </div>
      <div data-layer="Container" className="Container self-stretch relative flex flex-col justify-start items-start w-full">
        <div
          data-layer="Input"
          className={`Input self-stretch px-4 py-3 inline-flex justify-center items-start overflow-hidden w-full ${landingInputClass}`}
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
              className="w-full border-none bg-transparent p-0 font-body text-base font-normal text-brand-dark outline-none placeholder:text-brand-secondary/70 focus:outline-none focus:ring-0" />
          </div>
        </div>
      </div>
    </div>);

}
