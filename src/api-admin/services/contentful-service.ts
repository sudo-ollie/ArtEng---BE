import { contentfulClient } from '../lib/contentful'
import { managementClient } from '../lib/contentful-management'
import { previewClient } from '../lib/contentful-preview'
import { Article, ArticleFields } from '../../types/typesRepo'
import { richTextFromMarkdown } from '@contentful/rich-text-from-markdown';

interface UploadImageParams {
  file: Express.Multer.File;
  title: string;
  description?: string;
}

export class ContentfulService {

  // Get all published articles
  static async getAllArticles(): Promise<Article[]> {
    try {
      const response = await contentfulClient.getEntries({
        content_type: 'demoArticle',
        order: ['-sys.updatedAt'],
      })
      
      return response.items as unknown as Article[]
    } catch (error) {
      console.error('Error fetching articles:', error)
      throw error
    }
  }

  // Get all articles including drafts
  static async getAllArticlesIncludingDrafts(): Promise<Article[]> {
    try {
      const response = await previewClient.getEntries({
        content_type: 'demoArticle',
        order: ['-sys.updatedAt'],
      })
      
      return response.items as unknown as Article[]
    } catch (error) {
      console.error('Error fetching articles with drafts:', error)
      throw error
    }
  }

  // Get single article by slug
static async getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const response = await contentfulClient.getEntries({
      content_type: 'demoArticle',
      'fields.slug': slug,
      limit: 1,
      include: 2,
    })
    
    if (!response.items.length) {
      return null;
    }
    
    let article = response.items[0] as any;
    
    // Process the rich text content
    if (article.fields.content) {
      const content = article.fields.content;
      if (content.content?.[0]?.content?.[0]?.value) {
        const textValue = content.content[0].content[0].value;
        
        // If it contains markdown-style formatting, convert it
        if (textValue.includes('###') || textValue.includes('**')) {
          try {
            // Convert markdown to proper Contentful rich text
            const convertedContent = await richTextFromMarkdown(textValue);
            article.fields.content = convertedContent;
            console.log('Successfully converted markdown to rich text');
            console.log(article.fields.content)
          } catch (error) {
            console.error('Failed to convert markdown to rich text:', error);
            // If conversion fails, create a simple fallback structure
            article.fields.content = {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: textValue,
                      marks: [],
                      data: {}
                    }
                  ]
                }
              ]
            };
          }
        }
      }
    }
    
    // Handle featured image resolution
    if (article.fields.featuredImage?.sys?.linkType === 'Asset') {
      try {
        const asset = await contentfulClient.getAsset(article.fields.featuredImage.sys.id);
        article.fields.featuredImage = asset;
      } catch (assetError) {
        console.warn('Failed to fetch featured image:', assetError);
        article.fields.featuredImage = null;
      }
    }
    
    return article as Article;
  } catch (error) {
    console.error('Error fetching article:', error)
    throw error
  }
}

  // Management API - Update an article
  static async updateArticle(articleId: string, fields: Partial<ArticleFields>) {
    try {
      const space = await managementClient.getSpace(process.env.CONTENTFUL_SPACE_ID!)
      const environment = await space.getEnvironment('master')
      
      const entry = await environment.getEntry(articleId)
      
      // Update fields
      Object.keys(fields).forEach(key => {
        const value = fields[key as keyof ArticleFields]
        if (value !== undefined) {
          entry.fields[key] = {
            'en-US': value
          }
        }
      })
      
      const updatedEntry = await entry.update()
      await updatedEntry.publish()
      
      return updatedEntry
    } catch (error) {
      console.error('Error updating article:', error)
      throw error
    }
  }

  // Management API - Create new article
  static async createArticle(articleData: ArticleFields) {
    try {
      const space = await managementClient.getSpace(process.env.CONTENTFUL_SPACE_ID!)
      const environment = await space.getEnvironment('master')
      
      const fields: any = {
        title: { 'en-US': articleData.title },
        slug: { 'en-US': articleData.slug },
      }

      // Only add fields that have values
      if (articleData.excerpt) {
        fields.excerpt = { 'en-US': articleData.excerpt }
      }
      if (articleData.content) {
        fields.content = { 'en-US': articleData.content }
      }
      if (articleData.author) {
        fields.author = { 'en-US': articleData.author }
      }
      if (articleData.tags) {
        fields.tags = { 'en-US': articleData.tags }
      }
      if (articleData.publishDateScheduled) {
        fields.publishDateScheduled = { 'en-US': articleData.publishDateScheduled.toISOString() }
      }
      if (articleData.unpublishDateScheduled) {
        fields.unpublishDateScheduled = { 'en-US': articleData.unpublishDateScheduled.toISOString() }
      }
      if (articleData.featuredImage) {
        fields.featuredImage = { 'en-US': articleData.featuredImage }
      }
      
      const entry = await environment.createEntry('demoArticle', { fields })
      
      // Don't auto-publish
      return entry
    } catch (error) {
      console.error('Error creating article:', error)
      throw error
    }
  }

  //Publish/unpublish articles
  static async publishArticle(articleId: string) {
    try {
      const space = await managementClient.getSpace(process.env.CONTENTFUL_SPACE_ID!)
      const environment = await space.getEnvironment('master')
      
      const entry = await environment.getEntry(articleId)
      await entry.publish()
      
      return entry
    } catch (error) {
      console.error('Error publishing article:', error)
      throw error
    }
  }

  static async unpublishArticle(articleId: string) {
    try {
      const space = await managementClient.getSpace(process.env.CONTENTFUL_SPACE_ID!)
      const environment = await space.getEnvironment('master')
      
      const entry = await environment.getEntry(articleId)
      await entry.unpublish()
      
      return entry
    } catch (error) {
      console.error('Error unpublishing article:', error)
      throw error
    }
  }

  static async uploadImage(params: UploadImageParams) {
  try {
    const { file, title, description = '' } = params;
    
    const space = await managementClient.getSpace(process.env.CONTENTFUL_SPACE_ID!);
    const environment = await space.getEnvironment('master');

    const asset = await environment.createAsset({
      fields: {
        title: {
          'en-US': title
        },
        description: {
          'en-US': description
        },
        file: {
          'en-US': {
            contentType: file.mimetype,
            fileName: file.originalname,
            upload: file.buffer
          }
        }
      }
    });

    const processedAsset = await asset.processForAllLocales();
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const updatedAsset = await environment.getAsset(processedAsset.sys.id);
      
      if (updatedAsset.fields.file?.['en-US']?.url) {
        const publishedAsset = await updatedAsset.publish();
        return publishedAsset;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Asset processing timed out');
    
  } catch (error) {
    console.error('Error uploading image to Contentful:', error);
    throw error;
  }
}
}