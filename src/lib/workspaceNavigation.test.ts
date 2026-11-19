import { describe, expect, it } from 'vitest'
import { learningNavigation, administrationNavigation, learningPrimary, destinationIsActive } from './workspaceNavigation'

describe('workspace navigation', () => {
  const learner = learningNavigation.flatMap(group => group.items)
  const admin = administrationNavigation.flatMap(group => group.items)
  it('keeps all existing learner areas reachable without exposing administration', () => {
    expect(learner.map(item => item.href)).toEqual(expect.arrayContaining(['/home', '/add', '/courses', '/explore', '/tutor', '/blitz', '/history', '/problem-words', '/library', '/settings']))
    expect(learner.some(item => item.href.startsWith('/admin'))).toBe(false)
    expect(new Set(learner.map(item => item.href)).size).toBe(learner.length)
    expect(learningPrimary.map(item => item.href)).toEqual(['/today', '/home', '/add'])
  })
  it('matches nested destinations without matching similarly named siblings', () => {
    const explore = learner.find(item => item.href === '/explore')!
    expect(destinationIsActive('/explore/pack/123', explore)).toBe(true)
    expect(destinationIsActive('/explorer', explore)).toBe(false)
    const review = learner.find(item => item.href === '/home')!
    expect(destinationIsActive('/review', review)).toBe(true)
  })
  it('selects exactly one admin area for a member details route', () => {
    expect(admin.filter(item => destinationIsActive('/admin/members/123', item)).map(item => item.href)).toEqual(['/admin/members'])
    expect(admin.filter(item => destinationIsActive('/admin', item)).map(item => item.href)).toEqual(['/admin/dashboard'])
  })
})
