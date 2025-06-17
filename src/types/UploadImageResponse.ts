export interface UploadImageResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    url: string;
    title: string;
    description: string;
    contentType: string;
    fileName: string;
    size: number;
  };
  error?: string;
}