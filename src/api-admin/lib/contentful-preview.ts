import { createClient } from 'contentful'

export const previewClient = createClient({
  space: process.env.SPACE_ID!,
  accessToken: process.env.CONTENT_PREVIEW_KEY!,
  host: 'preview.contentful.com',
})