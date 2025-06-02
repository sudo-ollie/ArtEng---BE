interface AssetReference {
  sys: {
    type: "Link"
    linkType: "Asset"
    id: string
  }
}

// Resolved asset (when fetched)
interface ResolvedAsset {
  sys: {
    type: "Asset"
    id: string
    createdAt: string
    updatedAt: string
    locale: string
    revision: number
  }
  fields: {
    title?: string
    description?: string
    file: {
      url: string
      fileName: string
      contentType: string
      details: {
        size: number
        image?: {
          width: number
          height: number
        }
      }
    }
  }
}

// Updated ArticleFields interface
export interface ArticleFields {
  title: string
  slug: string
  excerpt?: string
  content?: any
  author?: string
  featuredImage?: AssetReference | ResolvedAsset | null  // Can be either type
  tags?: string[]
  publishDateScheduled?: Date
  unpublishDateScheduled?: Date
}

export interface Article {
  sys: {
    id: string
    createdAt: string
    updatedAt: string
    publishedAt?: string
    revision: number
    contentType: {
      sys: {
        id: string
      }
    }
  }
  fields: ArticleFields
}

// Helper function to check if asset is resolved
export function isResolvedAsset(asset: AssetReference | ResolvedAsset | null): asset is ResolvedAsset {
  return asset !== null && 'fields' in asset && asset.sys.type === 'Asset';
}

// Helper function to get image URL
export function getImageUrl(asset: AssetReference | ResolvedAsset | null): string | null {
  if (isResolvedAsset(asset)) {
    return asset.fields.file.url.startsWith('//') 
      ? `https:${asset.fields.file.url}` 
      : asset.fields.file.url;
  }
  return null;
}