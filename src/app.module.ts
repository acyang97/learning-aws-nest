import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadsModule } from './uploads/uploads.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SqsOrderModule } from './sqs-order/sqs-order.module';

@Module({
  imports: [
    UploadsModule,
    SqsOrderModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_DB_URL),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
