import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type S3UploadDocument = HydratedDocument<S3Upload>;

@Schema()
export class S3Upload {
  @Prop({ required: true })
  imageName: string;

  @Prop({ required: true })
  caption: string;
}

export const S3UploadSchema = SchemaFactory.createForClass(S3Upload);
