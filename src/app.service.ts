import { Injectable } from '@nestjs/common';
import { ProducerService } from './kafka/producer.service';

@Injectable()
export class AppService {
  constructor(private readonly producerService: ProducerService) {}

  async getHello() {
    await this.producerService.produceMessage({
      topic: 'test',
      messages: [
        {
          value: 'Hello World 1',
        },
        {
          value: 'Hello World 2',
        },
      ],
    });
    return 'Hello World';
  }
}
