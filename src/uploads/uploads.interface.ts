export interface GetAllImagesResponse {
  images: S3File[];
}

export interface S3File {
  imageUrl: string;
  caption: string;
  imageName: string;
}
