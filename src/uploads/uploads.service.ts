import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectModel } from '@nestjs/mongoose';
import { S3Upload } from 'src/schemas/S3Upload.schema';
import { Model } from 'mongoose';
import { GetAllImagesResponse } from './uploads.interface';

@Injectable()
export class UploadsService {
  private readonly s3Client = new S3Client({
    region: this.configService.getOrThrow('AWS_S3_REGION'),
    credentials: {
      accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY'),
      secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
    },
  });
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(S3Upload.name) private S3UploadModel: Model<S3Upload>,
  ) {}

  async upload(fileName: string, file: Buffer): Promise<void> {
    const result = await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_S3_BUCKET_NAME'),
        Key: fileName,
        Body: file,
      }),
    );
    console.log('result', result);
  }

  async uploadSingleFile(
    file: Express.Multer.File,
    caption: string,
  ): Promise<S3Upload> {
    try {
      const randomImageName = (bytes = 32) =>
        randomBytes(bytes).toString('hex');
      const formattedKey = `${randomImageName(32)} ${file.originalname}`;
      const result = await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.configService.getOrThrow('AWS_S3_BUCKET_NAME'),
          Key: formattedKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      const createdS3Upload = new this.S3UploadModel({
        imageName: formattedKey,
        caption,
      });
      return createdS3Upload.save();
    } catch (error) {
      console.log('error', error);
    }
  }

  async getAllImages() {
    const uploads: S3Upload[] = await this.S3UploadModel.find().exec();
    let res: GetAllImagesResponse = {
      images: [],
    };
    try {
      for (let upload of uploads) {
        const getObjectParams = {
          Bucket: this.configService.getOrThrow('AWS_S3_BUCKET_NAME'),
          Key: upload.imageName,
        };
        const command = new GetObjectCommand(getObjectParams);
        // const imageName = await getSignedUrl(this.s3Client, command, {
        //   expiresIn: 60 * 60 * 24,
        // });
        const imageUrl = `${this.configService.getOrThrow(
          'AWS_CLOUDFRONT_DOMAIN',
        )}/${upload.imageName}`;
        res = {
          images: [
            ...res.images,
            {
              imageUrl,
              imageName: upload.imageName,
              caption: upload.caption,
            },
          ],
        };
      }
      return res;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async deleteImageByImageName(imageName: string): Promise<void> {
    const imageToBeDeleted = await this.S3UploadModel.findOne({ imageName });
    if (!imageToBeDeleted) {
      throw new Error(`${imageName} cannot be found`);
    }
    try {
      await this.S3UploadModel.deleteOne({ imageName });
    } catch (err) {
      throw new Error('error when deleting from mongo');
    }
    // delete from mongo first
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.configService.getOrThrow('AWS_S3_BUCKET_NAME'),
          Key: imageName,
        }),
      );
    } catch (err) {
      throw new Error('error when deleting from s3');
    }
  }
}
