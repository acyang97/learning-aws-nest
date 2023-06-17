import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { MongooseModule } from '@nestjs/mongoose';
import { S3Upload, S3UploadSchema } from 'src/schemas/S3Upload.schema';

// Possible to rate limit it as well using a ThrottlerModule
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: S3Upload.name, schema: S3UploadSchema },
    ]),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
