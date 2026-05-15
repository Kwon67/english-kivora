export default function LoginHeroIllustration() {
  return (
    <svg
      role="img"
      aria-labelledby="login-hero-illustration-title"
      className="h-auto w-full"
      viewBox="0 0 760 540"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="login-hero-illustration-title">SVG animado de aprendizado na capa do Kivora</title>
      <style>
        {`
          .login-float-main {
            animation: loginFloatMain 4.8s ease-in-out infinite;
            transform-origin: 382px 270px;
          }

          .login-float-a {
            animation: loginFloatA 5.6s ease-in-out infinite;
            transform-origin: center;
          }

          .login-float-b {
            animation: loginFloatB 6.2s ease-in-out infinite;
            transform-origin: center;
          }

          .login-wave {
            animation: loginWave 2.7s ease-in-out infinite;
            transform-origin: 274px 278px;
          }

          .login-pulse {
            animation: loginPulse 2.2s ease-in-out infinite;
            transform-origin: center;
          }

          .login-dash {
            animation: loginDash 2.4s ease-in-out infinite;
            stroke-dasharray: 46 22;
          }

          @keyframes loginFloatMain {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-14px); }
          }

          @keyframes loginFloatA {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(0, -12px) rotate(-2deg); }
          }

          @keyframes loginFloatB {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(0, 12px) rotate(2deg); }
          }

          @keyframes loginWave {
            0%, 100% { transform: rotate(-4deg); }
            50% { transform: rotate(9deg); }
          }

          @keyframes loginPulse {
            0%, 100% { opacity: 0.58; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.08); }
          }

          @keyframes loginDash {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -68; }
          }

          @media (prefers-reduced-motion: reduce) {
            .login-float-main,
            .login-float-a,
            .login-float-b,
            .login-wave,
            .login-pulse,
            .login-dash {
              animation: none;
            }
          }
        `}
      </style>

      <rect x="44" y="50" width="672" height="440" rx="44" fill="#F8FBF7" opacity="0.14" />
      <path
        className="login-dash"
        d="M95 410C154 377 218 381 281 402C336 420 374 451 433 442C498 432 523 373 592 371C633 370 664 389 693 411"
        stroke="#D7EEE8"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.6"
      />

      <g className="login-float-a">
        <rect x="112" y="136" width="172" height="112" rx="26" fill="#FFF0D6" />
        <path d="M150 177H249" stroke="#9A5B13" strokeWidth="12" strokeLinecap="round" />
        <path d="M150 209H220" stroke="#9A5B13" strokeWidth="12" strokeLinecap="round" opacity="0.5" />
        <circle className="login-pulse" cx="273" cy="150" r="18" fill="#F4BD75" />
      </g>

      <g className="login-float-b">
        <rect x="500" y="120" width="140" height="92" rx="24" fill="#DCEBFF" />
        <path d="M532 157H602" stroke="#315A86" strokeWidth="11" strokeLinecap="round" />
        <path d="M532 185H576" stroke="#315A86" strokeWidth="11" strokeLinecap="round" opacity="0.5" />
        <circle className="login-pulse" cx="621" cy="131" r="18" fill="#9EE0CF" />
      </g>

      <g className="login-float-main">
        <ellipse cx="382" cy="419" rx="178" ry="20" fill="#08231E" opacity="0.24" />
        <circle cx="382" cy="262" r="156" fill="#FFFFFF" opacity="0.18" />
        <rect x="255" y="235" width="254" height="158" rx="28" fill="#FFFFFF" />
        <rect x="281" y="261" width="202" height="106" rx="18" fill="#E9F6F2" />
        <path d="M316 301H446" stroke="#276356" strokeWidth="13" strokeLinecap="round" />
        <path d="M316 335H408" stroke="#276356" strokeWidth="13" strokeLinecap="round" opacity="0.48" />
        <path d="M357 366L386 332L421 366" stroke="#315A86" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M364 222C338 212 324 188 331 162C339 130 368 111 399 117C429 123 450 150 446 181C442 212 414 234 384 230" fill="#18201D" />
        <circle cx="386" cy="178" r="45" fill="#F5C7A9" />
        <path d="M337 159C365 163 390 146 407 123C379 111 342 127 337 159Z" fill="#18201D" />
        <path d="M358 176C361 171 365 168 371 169" stroke="#18201D" strokeWidth="5" strokeLinecap="round" />
        <path d="M399 170C404 167 409 168 413 172" stroke="#18201D" strokeWidth="5" strokeLinecap="round" />
        <path d="M375 196C385 203 398 202 407 194" stroke="#18201D" strokeWidth="5" strokeLinecap="round" />

        <path d="M302 391C314 318 345 281 392 281C442 281 473 320 489 391H302Z" fill="#276356" />
        <path d="M344 299C354 321 371 333 393 333C416 333 433 321 443 299" stroke="#D7FFF3" strokeWidth="10" strokeLinecap="round" />
        <path className="login-wave" d="M320 331C289 325 262 307 244 282" stroke="#F5C7A9" strokeWidth="24" strokeLinecap="round" />
        <path d="M488 333C524 321 550 299 566 264" stroke="#F5C7A9" strokeWidth="24" strokeLinecap="round" />
      </g>

      <g className="login-float-b">
        <rect x="142" y="304" width="122" height="94" rx="24" fill="#FFFFFF" />
        <path d="M172 341H233" stroke="#276356" strokeWidth="11" strokeLinecap="round" />
        <path d="M172 369H210" stroke="#276356" strokeWidth="11" strokeLinecap="round" opacity="0.48" />
      </g>

      <g className="login-float-a">
        <rect x="506" y="303" width="124" height="96" rx="24" fill="#FFFFFF" />
        <path d="M537 340H598" stroke="#9A5B13" strokeWidth="11" strokeLinecap="round" />
        <path d="M537 368H575" stroke="#9A5B13" strokeWidth="11" strokeLinecap="round" opacity="0.5" />
      </g>

      <circle className="login-pulse" cx="119" cy="323" r="16" fill="#F4BD75" />
      <circle className="login-pulse" cx="647" cy="323" r="18" fill="#9EE0CF" />
      <circle className="login-pulse" cx="429" cy="88" r="12" fill="#F4BD75" />
      <path d="M100 226C126 209 151 210 172 229" stroke="#D7EEE8" strokeWidth="9" strokeLinecap="round" />
      <path d="M620 86C650 101 666 124 669 158" stroke="#D7EEE8" strokeWidth="9" strokeLinecap="round" />
    </svg>
  )
}
