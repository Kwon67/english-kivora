#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const srcDir = join(root, 'src')

const replacements = [
  // structural hex → tokens
  ['border-[#172113]/', 'border-border-muted/'],
  ['outline-[#172113]/', 'outline-border-muted/'],
  ['dark:border-[#d5e6a9]/', 'dark:border-border-accent/'],
  ['dark:outline-[#d5e6a9]/', 'dark:outline-border-accent/'],
  ['hover:bg-[#dfe9bd]', 'hover:bg-hero-lime'],
  ['bg-[#dfe9bd]', 'bg-hero-lime'],
  ['bg-[#f4f5e8]', 'bg-surface'],
  ['bg-[#fbfcf2]', 'bg-card'],
  ['dark:bg-[#11160e]', 'dark:bg-card'],
  ['dark:bg-[#080b06]', 'dark:bg-surface-container-low'],
  ['text-[#10130f]', 'text-text'],
  ['dark:text-[#f4f7e9]', 'dark:text-text'],
  ['text-[#425039]', 'text-text-muted'],
  ['dark:text-[#b9c3a4]', 'dark:text-text-muted'],
  ['text-[#5a664e]', 'text-text-subtle'],
  ['dark:text-[#9ea98b]', 'dark:text-text-subtle'],
  ['text-[#f7f8ef]', 'text-on-primary'],
  ['dark:text-[#d5e6a9]', 'dark:text-primary-container'],

  // emerald + primary collisions → token-only
  ['bg-emerald-50 text-emerald-800 dark:border-primary/20 bg-primary/10 text-primary', 'border-primary/20 bg-primary-light text-primary dark:bg-primary/10'],
  ['border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-primary/20 bg-primary/10 text-primary', 'border-primary/20 bg-primary-light text-primary dark:bg-primary/10'],
  ['bg-emerald-50 text-emerald-800 bg-primary/10 text-primary', 'bg-primary-light text-primary dark:bg-primary/10'],
  ['text-emerald-800 text-primary', 'text-primary'],
  ['text-emerald-800 dark:text-primary', 'text-primary'],
  ['bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-900/10 bg-primary/12 text-primary', 'bg-primary-light text-primary ring-1 ring-primary/10 dark:bg-primary/12'],
  ['ring-emerald-500/20 focus:ring-primary/20', 'focus:ring-primary/20'],
  ['focus:ring-emerald-600 focus:ring-offset-white', 'focus:ring-primary/40 focus:ring-offset-surface'],
  ['focus:text-emerald-800', 'focus:text-primary'],

  // light+dark tint collisions
  ['bg-primary-light bg-primary/8', 'bg-primary-light dark:bg-primary/8'],
  ['bg-primary-light bg-primary/10', 'bg-primary-light dark:bg-primary/10'],
  ['bg-primary-container text-primary dark:bg-primary/12', 'bg-primary-container text-primary dark:bg-primary/12'],
  ['bg-surface/50 bg-primary/8', 'bg-surface/50 dark:bg-primary/8'],
  ['bg-[#f4f5e8]/40 bg-primary/8', 'bg-surface/40 dark:bg-primary/8'],
  ['bg-[#f4f5e8]/50', 'bg-surface/50'],

  // duplicate patterns
  ['hover:text-primary hover:text-primary', 'hover:text-primary'],
  ['bg-primary/5 bg-primary/5', 'bg-primary/5'],
  ['bg-primary/10 bg-primary/10', 'bg-primary/10'],
  ['text-primary text-primary', 'text-primary'],

  // skip link / gray
  ['focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-emerald-800 focus:shadow-md dark:focus:bg-gray-900', 'focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary focus:shadow-md'],

  // missing dark: on opacity bg after dark:border
  ['dark:border-border-accent/18 bg-primary/8', 'dark:border-border-accent/18 dark:bg-primary/8'],
  ['dark:border-border-accent/20 bg-primary/8', 'dark:border-border-accent/20 dark:bg-primary/8'],
  ['dark:border-border-accent/14 bg-primary/8', 'dark:border-border-accent/14 dark:bg-primary/8'],
  ['dark:border-border-accent/18 bg-primary/10', 'dark:border-border-accent/18 dark:bg-primary/10'],
  ['dark:border-border-accent/18 bg-primary/12', 'dark:border-border-accent/18 dark:bg-primary/12'],

  // duplicate border emerald
  ['border-emerald-200 border-primary/20', 'border-primary/20'],

  // home bottom cards pills
  ['border border-emerald-900/10 bg-emerald-50/65 px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-emerald-800 dark:border-primary/20 bg-primary/12 text-primary', 'border border-primary/10 bg-primary-light px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-primary/20 dark:bg-primary/12'],

  ['text-emerald-800 opacity-70 text-primary', 'text-primary opacity-70'],

  // speaking mode correct/wrong
  ['text-emerald-600 text-primary', 'text-primary'],
  ['text-emerald-500 text-primary', 'text-primary'],

  // illustration/login
  ['bg-emerald-800 bg-primary', 'bg-primary'],
  ['bg-emerald-800 rounded-[32px] shadow-[0px_8px_15px_0px_rgba(0,0,0,0.10)] shadow-[0px_4px_8.5px_0px_rgba(202,202,202,1.00)] inline-flex justify-center items-center gap-2 overflow-hidden w-full cursor-pointer hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-primary hover:bg-primary-dark focus:ring-primary dark:shadow-none', 'bg-primary rounded-[32px] shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] inline-flex justify-center items-center gap-2 overflow-hidden w-full cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/40 dark:shadow-none'],

  // profile/account tints
  ['bg-primary-light/60 bg-primary/5', 'bg-primary-light/60 dark:bg-primary/5'],

  // arena history
  ['dark:border-border-accent/18 bg-primary/8 dark:text-text-muted', 'dark:border-border-accent/18 dark:bg-primary/8 dark:text-text-muted'],

  // home footer gradient
  ['via-emerald-700/25', 'via-primary/25'],

  // user packs emerald icon
  ['h-4.5 w-4.5 shrink-0 text-emerald-500 text-primary', 'h-4.5 w-4.5 shrink-0 text-primary'],

  // public profile
  ['hover:border-emerald-500/25 hover:shadow-sm dark:hover:border-primary/25', 'hover:border-primary/25 hover:shadow-sm dark:hover:border-primary/25'],
  ['bg-emerald-500/5 text-emerald-600 border border-emerald-500/10 shadow-inner bg-primary/8', 'bg-primary/5 text-primary border border-primary/10 shadow-inner dark:bg-primary/8'],

  // user pack folders badge
  ['bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 bg-primary/10 text-primary dark:border-primary/20', 'bg-primary-light text-primary border border-primary/20 dark:bg-primary/10 dark:border-primary/20'],

  // review client banners
  ['border border-emerald-900/10 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900 dark:border-primary/20 bg-primary/10 text-primary', 'border border-primary/10 bg-primary-light px-4 py-3 text-sm text-primary dark:border-primary/20 dark:bg-primary/10'],
  ['rounded-md bg-emerald-800 px-3 py-2 text-xs font-bold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-95 bg-primary hover:bg-primary-dark', 'rounded-md bg-primary px-3 py-2 text-xs font-bold text-on-primary transition-all duration-150 hover:bg-primary-dark active:scale-95'],
  ['rounded-md border border-emerald-900/10 bg-white px-3 py-2 text-xs font-bold text-emerald-800 transition-all duration-150 hover:bg-emerald-50 active:scale-95 dark:border-primary/20 dark:bg-card text-primary dark:hover:bg-primary/10', 'rounded-md border border-primary/10 bg-card px-3 py-2 text-xs font-bold text-primary transition-all duration-150 hover:bg-primary-light active:scale-95 dark:border-primary/20 dark:hover:bg-primary/10'],

  // arena client overlays — keep game emerald in light, fix dark collision
  ['border-emerald-500/35 bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.34)] hover:bg-emerald-600 active:scale-95 dark:border-primary/35 bg-primary dark:shadow-[0_0_24px_rgba(184,255,92,0.34)] hover:bg-primary-dark', 'border-primary/35 bg-primary text-on-primary shadow-[0_0_24px_rgba(24,59,22,0.34)] hover:bg-primary-dark active:scale-95 dark:shadow-[0_0_24px_rgba(184,255,92,0.34)]'],
  ['text-emerald-200 text-primary', 'text-primary'],
  ['text-emerald-100/70 text-primary/70', 'text-primary/70'],

  // active battle
  ['border-emerald-300/20 bg-emerald-400/10 text-emerald-100 dark:border-primary/20 bg-primary/10 text-primary', 'border-primary/20 bg-primary-light text-primary dark:border-primary/20 dark:bg-primary/10'],

  // testimonials
  ['dark:bg-primary/8 text-[#d5e6a9]', 'dark:bg-primary/8 dark:text-primary-container'],

  // home page ring hex leftover
  ['ring-[#172113]/18', 'ring-border-muted/18'],
  ['dark:ring-[#d5e6a9]/18', 'dark:ring-border-accent/18'],

  // softBtn strings with bg-primary/8 without dark
  ['dark:border-border-accent/20 bg-primary/8 text-primary hover:bg-primary/16', 'dark:border-border-accent/20 dark:bg-primary/8 text-primary dark:hover:bg-primary/16'],
]

let changed = 0

for (const abs of globSync(join(srcDir, '**/*.{ts,tsx}'))) {
  if (abs.includes('fix-colors.mjs') || abs.includes('migrate-brand')) continue
  let content = readFileSync(abs, 'utf8')
  const original = content
  for (const [from, to] of replacements) {
    content = content.split(from).join(to)
  }
  if (content !== original) {
    writeFileSync(abs, content)
    changed++
    console.log(relative(root, abs))
  }
}

console.log(`\nUpdated ${changed} files`)