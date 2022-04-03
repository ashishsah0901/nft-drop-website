import { SanityImageSource } from '@sanity/image-url/lib/types/types'
import createImageUrlBuilder from '@sanity/image-url'
import { createCurrentUserHook, createClient, ClientConfig } from 'next-sanity'

export const config: ClientConfig = {
  dataset: `${process.env.NEXT_PUBLIC_SANITY_DATASET}` || 'production',
  projectId: `${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`,
  apiVersion: '2022-04-02',
  useCdn: `${process.env.NODE_ENV}` === 'production',
}

export const sanityClient = createClient(config)

export const urlFor = (source: SanityImageSource) =>
  createImageUrlBuilder(config).image(source)

export const useCurrentUser = createCurrentUserHook(config)
