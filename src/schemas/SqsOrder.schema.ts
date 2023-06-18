import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { SqsOrderStatus } from 'src/sqs-order/sqs-order.enum';

export type SqsOrderDocument = HydratedDocument<SqsOrder>;

@Schema()
export class SqsOrder {
  @Prop({ required: true })
  orderItems: string[];

  @Prop({ required: true, enum: SqsOrderStatus })
  orderStatus: SqsOrderStatus;

  @Prop()
  orderNumber: number;
}

export const SqsOrderSchema = SchemaFactory.createForClass(SqsOrder);
