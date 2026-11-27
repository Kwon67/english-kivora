// A continuous landscape for the vocabulary exercise. Coordinates stay independent
// of the responsive headline and the interactive card layered over the foreground.
export default function StreetScene() {
  return (
    <svg viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <g id="kivora-tree">
          <path fill="var(--brand-highlight, #8ed462)" d="M-34 80Q-55 56-32 35Q-34 9-9 8Q9-11 25 9Q52 13 45 42Q63 70 36 83Q4 101-34 80Z"/>
          <path d="M4 121V40m0 32L-12 56m16 7 14-16" fill="none" stroke="#2C2E2A" strokeWidth="3" strokeLinecap="round"/>
        </g>
        <g id="kivora-terrace">
          <path d="M0 36 32 4l36 32v75H0Z" fill="#FF705D"/>
          <path d="M-6 38 32 0l41 38" stroke="#2C2E2A" strokeWidth="5" fill="none" strokeLinejoin="round"/>
          <path d="M10 49h14v21H10zm31 0h14v21H41z" fill="#F5F1E4"/>
          <path d="M27 111V83a8 8 0 0 1 16 0v28" fill="#2C2E2A"/>
        </g>
        <clipPath id="kivora-landscape">
          <path d="M0 395Q252 241 561 294T1083 318Q1298 239 1440 260V0H0Z"/>
        </clipPath>
      </defs>
      <g clipPath="url(#kivora-landscape)">
        <circle cx="1120" cy="137" r="55" fill="#F5E211"/>
        <path d="M0 232Q154 139 335 231T694 239Q893 136 1067 172T1440 111V420H0Z" fill="#E0DBCE"/>
        <g fill="#EBC1FF">
          <path d="M0 213Q143 94 299 187T596 253Q758 227 852 246T1111 211Q1256 159 1440 221V420H0Z"/>
        </g>
        <g transform="translate(270 117)"><use href="#kivora-terrace"/><use href="#kivora-terrace" x="72" y="6"/>
          <g transform="translate(0 18)">
          <path d="M145 9h59v105h-59Z" fill="#2BA0FF"/><path d="m140 11 35-30 34 30Z" fill="#2C2E2A"/>
          <path d="M157 24h11v17h-11zm23 0h11v17h-11zm-23 32h11v17h-11zm23 0h11v17h-11z" fill="#F5F1E4"/>
          </g>
        </g>
        <use href="#kivora-tree" transform="translate(526 178) scale(.6)"/>
        <g fill="none" stroke="#2C2E2A" strokeWidth="3" strokeLinecap="round">
          <path d="M563 258V239h29v13m-30-8h31m-27-9h23" />
          <path d="M604 251v-27"/><circle cx="604" cy="220" r="4" fill="#F5E211"/>
        </g>
        <path d="M0 241Q231 164 473 236T967 239Q1177 169 1440 219V420H0Z" fill="var(--brand-highlight, #8ed462)"/>
        <g transform="translate(112 107)"><use href="#kivora-tree"/><use href="#kivora-tree" transform="translate(72 34) scale(.76)"/></g>
        <g transform="translate(1230 93)"><use href="#kivora-tree" transform="scale(1.12)"/><use href="#kivora-tree" transform="translate(89 31) scale(.85)"/></g>
      </g>
      <g data-hero-birds fill="none" stroke="#2C2E2A" strokeWidth="2.4" strokeLinecap="round"><path d="m542 115 9 4 8-8m608 17 9 4 8-8m-595 9 7 3 6-6m54-36 6 3 7-6m27 14 5 2 5-5"/></g>
    </svg>
  )
}
