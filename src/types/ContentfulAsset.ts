export interface ContentfulAsset {
  sys: {
    id: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    version: number;
  };
  fields: {
    title: {
      'en-US': string;
    };
    description?: {
      'en-US': string;
    };
    file: {
      'en-US': {
        url: string;
        details: {
          size: number;
          image?: {
            width: number;
            height: number;
          };
        };
        fileName: string;
        contentType: string;
      };
    };
  };
}