import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { S3Upload } from 'src/schemas/S3Upload.schema';
import { GetAllImagesResponse } from './uploads.interface';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFromReact(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    file: Express.Multer.File,
    @Body() data: { caption: string },
  ): Promise<S3Upload> {
    return this.uploadsService.uploadSingleFile(file, data.caption);
  }

  @Get('all')
  async getAllImages(): Promise<GetAllImagesResponse> {
    return this.uploadsService.getAllImages();
  }

  @Delete(':id')
  async findOne(@Param('id') imageName: string): Promise<void> {
    return this.uploadsService.deleteImageByImageName(imageName);
  }
}
