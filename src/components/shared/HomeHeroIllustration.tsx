'use client'

import { m } from 'framer-motion'

export default function HomeHeroIllustration({ className = '' }: { className?: string }) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1],
        scale: { type: 'spring', damping: 15 }
      }}
      className={`relative select-none pointer-events-none ${className}`}
    >
      <m.div
        animate={{ 
          y: [0, -12, 0],
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 500 500"
          className="w-full h-auto drop-shadow-[0_20px_50px_rgba(146,227,169,0.2)]"
        >
          {/* Background blob */}
          <defs>
            <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#92E3A9', stopOpacity: 0.25 }} />
              <stop offset="100%" style={{ stopColor: '#5BC47A', stopOpacity: 0.15 }} />
            </linearGradient>
            <linearGradient id="bookGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#92E3A9', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#6DBF8B', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="bookGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#FFD97D', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#F5C542', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="bookGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#7EC8E3', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#4DA8DA', stopOpacity: 1 }} />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#1a1a2e" floodOpacity="0.12" />
            </filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Organic background shape */}
          <path d="M380,100 C430,130 460,200 440,280 C420,360 370,410 290,430 C210,450 130,420 80,360 C30,300 20,220 60,150 C100,80 170,60 250,70 C310,77 340,80 380,100Z" fill="url(#greenGrad)" />
          
          {/* Decorative dots */}
          <circle cx="100" cy="120" r="4" fill="#92E3A9" opacity="0.4" />
          <circle cx="420" cy="380" r="5" fill="#92E3A9" opacity="0.3" />
          <circle cx="380" cy="110" r="3" fill="#92E3A9" opacity="0.5" />
          <circle cx="130" cy="400" r="6" fill="#92E3A9" opacity="0.25" />
          <circle cx="440" cy="200" r="3.5" fill="#FFD97D" opacity="0.4" />
          <circle cx="70" cy="300" r="4" fill="#7EC8E3" opacity="0.35" />
          
          {/* Sparkles */}
          <g opacity="0.5">
            <path d="M110,160 L113,168 L121,171 L113,174 L110,182 L107,174 L99,171 L107,168Z" fill="#92E3A9" />
            <path d="M400,350 L402,355 L407,357 L402,359 L400,364 L398,359 L393,357 L398,355Z" fill="#FFD97D" />
            <path d="M350,90 L352,94 L356,96 L352,98 L350,102 L348,98 L344,96 L348,94Z" fill="#7EC8E3" />
          </g>

          {/* === STACK OF BOOKS === */}
          <g filter="url(#softShadow)">
            {/* Bottom book (blue) */}
            <g>
              <rect x="130" y="310" width="200" height="32" rx="4" fill="url(#bookGrad3)" />
              <rect x="130" y="310" width="12" height="32" rx="2" fill="#3D8EB5" />
              <rect x="155" y="320" width="80" height="3" rx="1.5" fill="white" opacity="0.5" />
              <rect x="155" y="327" width="50" height="2" rx="1" fill="white" opacity="0.3" />
            </g>
            
            {/* Middle book (yellow) */}
            <g transform="rotate(-3, 230, 300)">
              <rect x="140" y="282" width="190" height="30" rx="4" fill="url(#bookGrad2)" />
              <rect x="140" y="282" width="12" height="30" rx="2" fill="#D4A830" />
              <rect x="165" y="291" width="90" height="3" rx="1.5" fill="white" opacity="0.5" />
              <rect x="165" y="298" width="55" height="2" rx="1" fill="white" opacity="0.3" />
            </g>
            
            {/* Top book (green - English) */}
            <g transform="rotate(2, 230, 270)">
              <rect x="125" y="256" width="210" height="32" rx="4" fill="url(#bookGrad)" />
              <rect x="125" y="256" width="14" height="32" rx="2" fill="#4DA872" />
              {/* "ENGLISH" text on book */}
              <text x="230" y="277" textAnchor="middle" fill="white" fontFamily="Inter, Arial, sans-serif" fontSize="13" fontWeight="700" letterSpacing="2">ENGLISH</text>
            </g>
          </g>

          {/* === OPEN BOOK === */}
          <g filter="url(#softShadow)" transform="translate(230, 200)">
            {/* Book shadow */}
            <ellipse cx="0" cy="55" rx="75" ry="8" fill="#1a1a2e" opacity="0.06" />
            
            {/* Left page */}
            <path d="M-5,0 C-5,0 -70,5 -70,10 L-70,50 C-70,55 -5,50 -5,50Z" fill="#FFF9EC" stroke="#E8E0D0" strokeWidth="0.5" />
            {/* Right page */}
            <path d="M5,0 C5,0 70,5 70,10 L70,50 C70,55 5,50 5,50Z" fill="#FFFDF7" stroke="#E8E0D0" strokeWidth="0.5" />
            {/* Spine */}
            <path d="M-5,0 L0,-3 L5,0 L5,50 L0,53 L-5,50Z" fill="#F0E8D8" />
            
            {/* Left page lines */}
            <line x1="-60" y1="18" x2="-15" y2="16" stroke="#C8C0B0" strokeWidth="0.8" opacity="0.5" />
            <line x1="-58" y1="24" x2="-18" y2="22" stroke="#C8C0B0" strokeWidth="0.8" opacity="0.5" />
            <line x1="-56" y1="30" x2="-15" y2="28" stroke="#C8C0B0" strokeWidth="0.8" opacity="0.5" />
            <line x1="-60" y1="36" x2="-20" y2="35" stroke="#C8C0B0" strokeWidth="0.8" opacity="0.4" />
            <line x1="-57" y1="42" x2="-18" y2="41" stroke="#C8C0B0" strokeWidth="0.8" opacity="0.3" />
            
            {/* Right page content - ABC */}
            <text x="38" y="22" textAnchor="middle" fill="#92E3A9" fontFamily="Inter, Arial, sans-serif" fontSize="16" fontWeight="800">ABC</text>
            <line x1="15" y1="30" x2="60" y2="30" stroke="#C8C0B0" strokeWidth="0.8" opacity="0.5" />
            <line x1="18" y1="36" x2="55" y2="36" stroke="#C8C0B0" strokeWidth="0.8" opacity="0.4" />
            <line x1="15" y1="42" x2="58" y2="42" stroke="#C8C0B0" strokeWidth="0.8" opacity="0.3" />
          </g>

          {/* === SPEECH BUBBLE - "Hello!" === */}
          <g filter="url(#softShadow)">
            <path d="M310,120 C310,105 325,95 345,95 L395,95 C415,95 425,105 425,120 L425,145 C425,160 415,170 395,170 L365,170 L355,190 L350,170 L345,170 C325,170 310,160 310,145Z" fill="white" />
            <path d="M310,120 C310,105 325,95 345,95 L395,95 C415,95 425,105 425,120 L425,145 C425,160 415,170 395,170 L365,170 L355,190 L350,170 L345,170 C325,170 310,160 310,145Z" fill="none" stroke="#92E3A9" strokeWidth="2.5" />
            <text x="367" y="140" textAnchor="middle" fill="#2D3748" fontFamily="Inter, Arial, sans-serif" fontSize="22" fontWeight="700">Hello!</text>
          </g>

          {/* === SPEECH BUBBLE - "Hi!" (smaller) === */}
          <g filter="url(#softShadow)">
            <path d="M85,165 C85,155 95,148 108,148 L148,148 C161,148 170,155 170,165 L170,182 C170,192 161,198 148,198 L125,198 L118,212 L114,198 L108,198 C95,198 85,192 85,182Z" fill="white" />
            <path d="M85,165 C85,155 95,148 108,148 L148,148 C161,148 170,155 170,165 L170,182 C170,192 161,198 148,198 L125,198 L118,212 L114,198 L108,198 C95,198 85,192 85,182Z" fill="none" stroke="#FFD97D" strokeWidth="2" />
            <text x="128" y="180" textAnchor="middle" fill="#2D3748" fontFamily="Inter, Arial, sans-serif" fontSize="17" fontWeight="700">Hi!</text>
          </g>

          {/* === PENCIL === */}
          <g filter="url(#softShadow)" transform="translate(360, 270) rotate(35)">
            {/* Pencil body */}
            <rect x="0" y="0" width="100" height="14" rx="2" fill="#FFD97D" />
            <rect x="0" y="0" width="100" height="5" rx="2" fill="#FFE5A0" />
            {/* Metal band */}
            <rect x="90" y="-1" width="14" height="16" rx="1" fill="#D4A8A8" />
            <rect x="90" y="-1" width="14" height="5" rx="1" fill="#E0BEBE" />
            {/* Eraser */}
            <rect x="104" y="0" width="12" height="14" rx="3" fill="#F08080" />
            {/* Tip */}
            <polygon points="0,0 -14,7 0,14" fill="#F5DEB3" />
            <polygon points="-8,5 -14,7 -8,9" fill="#333" />
          </g>

          {/* === GRADUATION CAP === */}
          <g filter="url(#softShadow)" transform="translate(115, 85)">
            {/* Cap board */}
            <polygon points="0,20 50,-5 100,20 50,45" fill="#2D3748" />
            <polygon points="0,20 50,45 50,48 0,23" fill="#1a1a2e" />
            <polygon points="100,20 50,45 50,48 100,23" fill="#232B3A" />
            {/* Tassel */}
            <line x1="50" y1="-5" x2="50" y2="10" stroke="#FFD97D" strokeWidth="2" />
            <line x1="50" y1="10" x2="70" y2="35" stroke="#FFD97D" strokeWidth="2" />
            <circle cx="70" cy="38" r="3" fill="#FFD97D" />
            {/* Button */}
            <circle cx="50" cy="-5" r="3" fill="#FFD97D" />
          </g>

          {/* === GLOBE === */}
          <g filter="url(#softShadow)" transform="translate(85, 330)">
            {/* Stand */}
            <rect x="25" y="55" width="30" height="4" rx="2" fill="#C8C0B0" />
            <rect x="37" y="40" width="6" height="18" rx="3" fill="#C8C0B0" />
            
            {/* Globe circle */}
            <circle cx="40" cy="30" r="28" fill="#7EC8E3" />
            <circle cx="40" cy="30" r="28" fill="none" stroke="#4DA8DA" strokeWidth="1.5" />
            
            {/* Continents (simplified) */}
            <ellipse cx="35" cy="22" rx="8" ry="10" fill="#92E3A9" opacity="0.8" />
            <ellipse cx="50" cy="32" rx="6" ry="8" fill="#92E3A9" opacity="0.8" />
            <ellipse cx="30" cy="38" rx="5" ry="4" fill="#92E3A9" opacity="0.7" />
            
            {/* Grid lines */}
            <ellipse cx="40" cy="30" rx="28" ry="14" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <ellipse cx="40" cy="30" rx="14" ry="28" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <line x1="12" y1="30" x2="68" y2="30" stroke="white" strokeWidth="0.5" opacity="0.3" />
          </g>

          {/* === FLOATING LETTERS === */}
          <g filter="url(#glow)">
            <text x="195" y="155" fill="#92E3A9" fontFamily="Inter, Arial, sans-serif" fontSize="30" fontWeight="800" opacity="0.6">A</text>
            <text x="260" y="130" fill="#FFD97D" fontFamily="Inter, Arial, sans-serif" fontSize="24" fontWeight="800" opacity="0.5">B</text>
            <text x="220" y="175" fill="#7EC8E3" fontFamily="Inter, Arial, sans-serif" fontSize="20" fontWeight="800" opacity="0.45">C</text>
          </g>

          {/* === HEADPHONES === */}
          <g transform="translate(370, 320)" filter="url(#softShadow)">
            {/* Band */}
            <path d="M5,30 C5,10 15,0 30,0 C45,0 55,10 55,30" fill="none" stroke="#2D3748" strokeWidth="4" strokeLinecap="round" />
            {/* Left ear */}
            <rect x="0" y="25" width="12" height="20" rx="5" fill="#2D3748" />
            <rect x="2" y="28" width="8" height="14" rx="4" fill="#92E3A9" />
            {/* Right ear */}
            <rect x="48" y="25" width="12" height="20" rx="5" fill="#2D3748" />
            <rect x="50" y="28" width="8" height="14" rx="4" fill="#92E3A9" />
          </g>

          {/* === LIGHTBULB (idea) === */}
          <g transform="translate(440, 240)" filter="url(#softShadow)">
            <path d="M15,0 C6,0 0,8 0,16 C0,22 4,26 7,30 L7,36 L23,36 L23,30 C26,26 30,22 30,16 C30,8 24,0 15,0Z" fill="#FFD97D" />
            <rect x="9" y="36" width="12" height="4" rx="1" fill="#D4A830" />
            <rect x="10" y="40" width="10" height="3" rx="1" fill="#D4A830" />
            {/* Filament */}
            <path d="M12,20 L15,12 L18,20" fill="none" stroke="#F5C542" strokeWidth="1.5" />
            {/* Rays */}
            <line x1="15" y1="-6" x2="15" y2="-2" stroke="#FFD97D" strokeWidth="2" strokeLinecap="round" />
            <line x1="-4" y1="8" x2="0" y2="10" stroke="#FFD97D" strokeWidth="2" strokeLinecap="round" />
            <line x1="30" y1="10" x2="34" y2="8" stroke="#FFD97D" strokeWidth="2" strokeLinecap="round" />
            <line x1="-2" y1="22" x2="2" y2="20" stroke="#FFD97D" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="28" y1="20" x2="32" y2="22" stroke="#FFD97D" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* === CHAT DOTS (typing indicator) === */}
          <g transform="translate(240, 380)">
            <rect x="0" y="0" width="70" height="30" rx="15" fill="white" stroke="#E2E8F0" strokeWidth="1.5" />
            <circle cx="20" cy="15" r="4" fill="#92E3A9" opacity="0.9" />
            <circle cx="35" cy="15" r="4" fill="#92E3A9" opacity="0.6" />
            <circle cx="50" cy="15" r="4" fill="#92E3A9" opacity="0.3" />
          </g>

          {/* === CHECKMARK BADGE === */}
          <g transform="translate(155, 350)" filter="url(#softShadow)">
            <circle cx="15" cy="15" r="15" fill="#92E3A9" />
            <path d="M8,15 L13,20 L23,10" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>

          {/* === STAR === */}
          <g transform="translate(430, 150)">
            <path d="M15,0 L19,11 L30,11 L21,18 L24,29 L15,22 L6,29 L9,18 L0,11 L11,11Z" fill="#FFD97D" opacity="0.7" />
          </g>
          <g transform="translate(70, 240)">
            <path d="M10,0 L13,7 L20,7 L14,12 L16,19 L10,15 L4,19 L6,12 L0,7 L7,7Z" fill="#92E3A9" opacity="0.5" />
          </g>
        </svg>
      </m.div>
    </m.div>
  )
}
