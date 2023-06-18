import { Body, Controller, Post, Put } from '@nestjs/common';
import { SqsOrderService } from './sqs-order.service';
import { CreateSqsOrderDto } from './sqs-order.dto';

@Controller('sqs-order')
export class SqsOrderController {
  constructor(private readonly sqsOrderService: SqsOrderService) {}

  @Post()
  public async sendMessageToQueue(
    @Body() createSqsOrderDto: CreateSqsOrderDto,
  ) {
    return this.sqsOrderService.sendMessageToQueue(createSqsOrderDto);
  }

  @Put('poll')
  public async pollOrders() {
    return this.sqsOrderService.pollOrders();
  }
}
