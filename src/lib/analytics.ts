'use client'

import posthog from 'posthog-js'

/**
 * Product analytics, deliberately small.
 *
 * The point is to answer questions the team cannot answer today: how many finish onboarding,
 * who comes back on day 2/7/30, where the drop-off is, whether checkout converts. Every event
 * here maps to one of those. Anything that does not earn its place stays out — a analytics
 * install nobody reads is just tracking for its own sake.
 *
 * Privacy: this ships alongside the LGPD work in /settings, so it is configured to not undo it.
 * Autocapture and session recording are off, inputs are masked, and we identify by the Supabase
 * user id only — never email or name. No event below carries free text a learner typed.
 */

/** The funnel. Keep this list short and the names stable — renaming breaks historical data. */
export const ANALYTICS_EVENT = {
  SIGNUP: 'signup',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PLACEMENT_DONE: 'placement_done',
  SESSION_STARTED: 'session_started',
  SESSION_COMPLETED: 'session_completed',
  REVIEW_COMPLETED: 'review_completed',
  STREAK_BROKEN: 'streak_broken',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_ACTIVE: 'subscription_active',
} as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT]

/** Only scalars, so nothing a learner typed can leak into a property by accident. */
export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>

let started = false

export function isAnalyticsEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
}

export function initAnalytics() {
  if (started || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return // No key configured: every call below becomes a no-op.

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    // Off on purpose: autocapture records clicks and form interactions indiscriminately, which
    // is how a learner's typed answers end up on a third-party server.
    autocapture: false,
    disable_session_recording: true,
    mask_all_text: false,
    mask_all_element_attributes: false,
    persistence: 'localStorage+cookie',
  })

  started = true
}

export function trackEvent(event: AnalyticsEvent, props?: AnalyticsProps) {
  if (!started) return
  posthog.capture(event, props)
}

/** Ties events to a user by id only. Never pass email, username or any free text. */
export function identifyUser(userId: string, props?: AnalyticsProps) {
  if (!started) return
  posthog.identify(userId, props)
}

export function resetAnalytics() {
  if (!started) return
  posthog.reset()
}
