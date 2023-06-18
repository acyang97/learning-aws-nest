import { Module } from '@nestjs/common';
import { SqsOrderController } from './sqs-order.controller';
import { SqsOrderService } from './sqs-order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SqsOrder, SqsOrderSchema } from 'src/schemas/SqsOrder.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SqsOrder.name, schema: SqsOrderSchema },
    ]),
  ],
  controllers: [SqsOrderController],
  providers: [SqsOrderService],
})
export class SqsOrderModule {}
