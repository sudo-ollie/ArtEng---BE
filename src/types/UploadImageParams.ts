export interface UploadImageParams {
  file: Express.Multer.File;
  title: string;
  description?: string;
}