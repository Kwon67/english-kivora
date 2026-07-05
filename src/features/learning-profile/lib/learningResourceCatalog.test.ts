import { describe, expect, it } from 'vitest'
import { getRecommendedLearningResources } from './learningResourceCatalog'

describe('getRecommendedLearningResources', () => {
  it('returns resources for the requested level only', () => {
    const resources = getRecommendedLearningResources({
      level: 'A2',
      interests: ['conversation'],
      limit: 3,
    })

    expect(resources).toHaveLength(3)
    expect(resources.every((resource) => resource.level === 'A2')).toBe(true)
  })

  it('boosts resources that match member interests', () => {
    const resources = getRecommendedLearningResources({
      level: 'B1',
      interests: ['conversation'],
      limit: 1,
    })

    expect(resources[0]?.id).toBe('b1-youtube-shadowing')
  })
})
