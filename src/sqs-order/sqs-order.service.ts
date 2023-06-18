import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteMessageBatchCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import { InjectModel } from '@nestjs/mongoose';
import { SqsOrder, SqsOrderDocument } from 'src/schemas/SqsOrder.schema';
import { Model } from 'mongoose';
import { MESSAGE_GROUP_ID } from './sqs-order.constants';
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
    const count = (await this.SqsOrderModel.find()).length;
    const created = new this.SqsOrderModel({
      orderItems,
      orderStatus: SqsOrderStatus.SENT,
      orderNumber: count + 1,
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
        MessageBody: createdSqsOrder.orderNumber.toString(),
        QueueUrl: this.configService.get('AWS_SQS_DOMAIN'),
        MessageGroupId: MESSAGE_GROUP_ID,
        // For sqs to detect duplicate messages
        MessageDeduplicationId: Math.random().toString(),
      });
      const result = await this.sqsClient.send(command);
      console.log('successful result', result);
    } catch (error) {
      console.log('unsuccessful', error);
      throw new Error(error);
    }
  }

  // Create an endpoint to do this manually first
  // Afterwards, try creating a worker to do this for us
  public async pollOrders() {
    try {
      const command = new ReceiveMessageCommand({
        MaxNumberOfMessages: 5,
        QueueUrl: this.configService.get('AWS_SQS_DOMAIN'),
        WaitTimeSeconds: 5,
        MessageAttributeNames: ['All'],
      });
      const result = await this.sqsClient.send(command);
      console.log('successfully get message from queue', result);
      const messages = result.Messages;

      if (!messages) {
        return; // nothing to process
      }
      // update status in database
      messages.forEach(async (message) => this.updateStatus(message));
      // delete message in sqs
      await this.deleteOrdersFromQueue(messages);
    } catch (error) {
      console.log('unsuccessful');
      throw new Error(error);
    }
  }

  private async updateStatus(message: Message) {
    const sqsOrder = await this.SqsOrderModel.findOne({
      orderNumber: Number(message.Body),
    });
    console.log(sqsOrder);
    // update
    await this.SqsOrderModel.findOneAndUpdate(
      {
        orderNumber: Number(message.Body),
      },
      { orderStatus: SqsOrderStatus.PROCESSED },
      {},
    );
  }

  private async deleteOrdersFromQueue(messages: Message[]) {
    const entries = messages.map((message) => {
      return { Id: message.MessageId, ReceiptHandle: message.ReceiptHandle };
    });
    const command = new DeleteMessageBatchCommand({
      Entries: entries,
      QueueUrl: this.configService.get('AWS_SQS_DOMAIN'),
    });
    await this.sqsClient.send(command);
  }

  // just for test
  public async deleteAllOrdersFromDb(): Promise<void> {
    await this.SqsOrderModel.deleteMany({});
  }
}
