import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { InjectModel } from '@nestjs/mongoose';
import { SqsOrder, SqsOrderDocument } from 'src/schemas/SqsOrder.schema';
import { Model } from 'mongoose';
import {
  MESSAGE_DEDUPLICATION_ID,
  MESSAGE_GROUP_ID,
} from './sqs-order.constants';
import { SqsOrderStatus } from './sqs-order.enum';
import { CreateSqsOrderDto } from './sqs-order.dto';

@Injectable()
export class SqsOrderService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(SqsOrder.name) private SqsOrderModel: Model<SqsOrder>,
  ) {}

  private readonly sqsClient = new SQSClient({
    // TODO: find out how to adjust this
    region: 'ap-southeast-1',
    credentials: {
      accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY'),
      secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
    },
  });

  // create the order and add to mongo
  private async createSqsOrder(
    orderItems: string[],
  ): Promise<SqsOrderDocument> {
    const created = new this.SqsOrderModel({
      orderItems,
      orderStatus: SqsOrderStatus.SENT,
    });
    return created.save();
  }

  public async sendMessageToQueue(createSqsOrderDto: CreateSqsOrderDto) {
    const { orderItems } = createSqsOrderDto;
    let createdSqsOrder: SqsOrderDocument;
    try {
      createdSqsOrder = await this.createSqsOrder(orderItems);
    } catch (error) {
      throw new Error('error creating to mongo');
    }

    try {
      const command = new SendMessageCommand({
        MessageBody: 'Successfully created',
        QueueUrl: this.configService.get('AWS_SQS_DOMAIN'),
        MessageAttributes: {
          OrderId: {
            DataType: 'String',
            StringValue: createdSqsOrder._id.toString(),
          },
        },
        MessageGroupId: MESSAGE_GROUP_ID,
        MessageDeduplicationId: MESSAGE_DEDUPLICATION_ID,
      });
      const result = await this.sqsClient.send(command);
      console.log('successful result', result);
    } catch (error) {
      console.log('unsuccessful', error);
      throw new Error(error);
    }
  }
}
