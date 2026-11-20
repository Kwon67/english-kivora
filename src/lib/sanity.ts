import 'server-only'
import { createClient } from 'next-sanity'
import { createImageUrlBuilder } from '@sanity/image-url'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export const sanity = projectId && dataset
  ? createClient({ projectId, dataset, apiVersion: '2026-11-01', useCdn: true })
  : null
export const sanityImages = sanity ? createImageUrlBuilder(sanity) : null
