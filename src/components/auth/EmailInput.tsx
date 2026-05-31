'use client';

import { type CSSProperties, useState } from 'react';

type EmailInputProps = {
  onBlurEmail?: (email: string) => void;label?: string;veZ1vbjlaClassName?: string;
};

export default function EmailInput({ onBlurEmail, label = "Email Address", veZ1vbjlaClassName }: EmailInputProps) {
  const [email, setEmail] = useState('');

  return (
    <div data-layer="Email Field" className="EmailField self-stretch flex flex-col justify-start items-start gap-2 w-full">
      <div data-layer="Label" className="Label self-stretch flex flex-col justify-start items-start">
        <label
          htmlFor="username"
          className={veZ1vbjlaClassName || "EmailAddress self-stretch justify-center text-sm font-semibold font-inter leading-5 cursor-pointer"}
          style={{ color: 'var(--color-text)' }}>{label}


        </label>
      </div>
      <div data-layer="Container" className="Container self-stretch relative flex flex-col justify-start items-start w-full">
        <div
          data-layer="Input"
          className="Input self-stretch pl-10 pr-4 py-3.5 bg-gray-50/20 rounded-[32px] outline outline-1 outline-offset-[-1px] outline-stone-300 inline-flex justify-center items-start overflow-hidden focus-within:outline-2 w-full transition-all focus-within:shadow-[0_0_12px_rgba(39,99,86,0.12)] focus-within:bg-white/50"
          style={{ outlineColor: 'var(--color-border)' }}>
          
          <div data-layer="Container" className="Container flex-1 inline-flex flex-col justify-start items-start overflow-hidden w-full">
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="learner@example.com"
              data-testid="login-username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => onBlurEmail?.(email)}
              className="w-full bg-transparent outline-none border-none p-0 text-base font-normal font-inter focus:ring-0 focus:outline-none"
              style={{ color: 'var(--color-text)', '--tw-placeholder-color': 'var(--color-text-subtle)' } as CSSProperties} />
            
          </div>
        </div>
        <div data-layer="Container" className="Container h-12 pl-3 left-0 top-0 absolute inline-flex justify-start items-center pointer-events-none">
          <div data-svg-wrapper data-layer="Container" className="Container">
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V14C20 14.55 19.8042 15.0208 19.4125 15.4125C19.0208 15.8042 18.55 16 18 16H2ZM10 9L2 4V14H18V4L10 9ZM10 7L18 2H2L10 7ZM2 4V2V4V14V4Z" fill="var(--color-text-subtle)" />
            </svg>
          </div>
        </div>
      </div>
    </div>);

}