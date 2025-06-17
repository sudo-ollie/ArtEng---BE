import { ContentfulService } from '../services/contentful-service'
import { ArticleFields } from '../../types/typesRepo'
import multer from 'multer';
import { Request, Response } from 'express';

export class ContentfulController {
  // GET /articles - Get all published articles
  static async getAllArticles(req: Request, res: Response) {
    try {
      const articles = await ContentfulService.getAllArticles()
      res.status(200).json({
        success: true,
        data: articles,
        count: articles.length
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch articles',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // GET /articles/drafts - Get all articles including drafts
  static async getAllArticlesIncludingDrafts(req: Request, res: Response) {
    try {
      const articles = await ContentfulService.getAllArticlesIncludingDrafts()
      res.status(200).json({
        success: true,
        data: articles,
        count: articles.length
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch articles with drafts',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // GET /articles/:slug - Get single article by slug
  static async getArticleBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params
      
      if (!slug) {
        return res.status(400).json({
          success: false,
          message: 'Slug parameter is required'
        })
      }

      const article = await ContentfulService.getArticleBySlug(slug)
      
      if (!article) {
        return res.status(404).json({
          success: false,
          message: 'Article not found'
        })
      }

      res.status(200).json({
        success: true,
        data: article
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch article',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // POST /articles - Create new article
  static async createArticle(req: Request, res: Response) {
    try {
      const articleData: ArticleFields = req.body

      // Basic validation
      if (!articleData.title || !articleData.slug) {
        return res.status(400).json({
          success: false,
          message: 'Title and slug are required fields'
        })
      }

      // Convert date strings to Date objects if provided
      if (articleData.publishDateScheduled && typeof articleData.publishDateScheduled === 'string') {
        articleData.publishDateScheduled = new Date(articleData.publishDateScheduled)
      }
      if (articleData.unpublishDateScheduled && typeof articleData.unpublishDateScheduled === 'string') {
        articleData.unpublishDateScheduled = new Date(articleData.unpublishDateScheduled)
      }

      const newArticle = await ContentfulService.createArticle(articleData)
      
      res.status(201).json({
        success: true,
        message: 'Article created successfully',
        data: newArticle
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create article',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // PUT /articles/:id - Update existing article
  static async updateArticle(req: Request, res: Response) {
    try {
      const { id } = req.params
      const updates: Partial<ArticleFields> = req.body

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Article ID is required'
        })
      }

      // Convert date strings to Date objects if provided
      if (updates.publishDateScheduled && typeof updates.publishDateScheduled === 'string') {
        updates.publishDateScheduled = new Date(updates.publishDateScheduled)
      }
      if (updates.unpublishDateScheduled && typeof updates.unpublishDateScheduled === 'string') {
        updates.unpublishDateScheduled = new Date(updates.unpublishDateScheduled)
      }

      const updatedArticle = await ContentfulService.updateArticle(id, updates)
      
      res.status(200).json({
        success: true,
        message: 'Article updated successfully',
        data: updatedArticle
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update article',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // POST /articles/:id/publish - Publish article
  static async publishArticle(req: Request, res: Response) {
    try {
      const { id } = req.params

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Article ID is required'
        })
      }

      const publishedArticle = await ContentfulService.publishArticle(id)
      
      res.status(200).json({
        success: true,
        message: 'Article published successfully',
        data: publishedArticle
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to publish article',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // POST /articles/:id/unpublish - Unpublish article
  static async unpublishArticle(req: Request, res: Response) {
    try {
      const { id } = req.params

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Article ID is required'
        })
      }

      const unpublishedArticle = await ContentfulService.unpublishArticle(id)
      
      res.status(200).json({
        success: true,
        message: 'Article unpublished successfully',
        data: unpublishedArticle
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to unpublish article',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

static async uploadImage(req: Request, res: Response) {
    try {
      const upload = multer({ 
        storage: multer.memoryStorage(),
        limits: {
          fileSize: 10 * 1024 * 1024,
        },
        fileFilter: (req, file, cb) => {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(null, false);
          }
        }
      }).single('file');

      upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
          console.error('Multer error:', err);
          return res.status(400).json({
            success: false,
            message: err.message || 'File upload error'
          });
        } else if (err) {
          console.error('Upload error:', err);
          return res.status(400).json({
            success: false,
            message: 'File upload failed'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file provided'
          });
        }

        if (!req.file.mimetype.startsWith('image/')) {
          return res.status(400).json({
            success: false,
            message: 'Only image files are allowed'
          });
        }

        const { title, description } = req.body;

        if (!title) {
          return res.status(400).json({
            success: false,
            message: 'Title is required'
          });
        }

        try {
          const uploadedAsset = await ContentfulService.uploadImage({
            file: req.file,
            title,
            description: description || ''
          });

          const fileData = uploadedAsset.fields.file?.['en-US'];
          const assetTitle = uploadedAsset.fields.title?.['en-US'];
          const assetDescription = uploadedAsset.fields.description?.['en-US'];

          if (!fileData) {
            throw new Error('Failed to get file data from uploaded asset');
          }

          res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
              id: uploadedAsset.sys.id,
              url: fileData.url != null ? fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url : "Url Null",
              title: assetTitle || title,
              description: assetDescription || description || '',
              contentType: fileData.contentType,
              fileName: fileData.fileName,
              size: fileData.details?.size || 0
            }
          });
        } catch (uploadError) {
          console.error('Contentful upload error:', uploadError);
          res.status(500).json({
            success: false,
            message: 'Failed to upload image to Contentful',
            error: uploadError instanceof Error ? uploadError.message : 'Unknown error'
          });
        }
      });
    } catch (error) {
      console.error('Upload endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

}