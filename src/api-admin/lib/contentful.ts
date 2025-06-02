import { createClient } from 'contentful'

export const contentfulClient = createClient({
  space: process.env.SPACE_ID!,
  accessToken: process.env.CONTENT_DELIVERY_KEY!,
})