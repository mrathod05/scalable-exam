import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';
import { ExamGateway } from './exam/exam.gateway';
import { RedisService } from './redis/redis.service';
import { ExamService } from './exam/exam.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          producer: {
            createPartitioner: Partitioners.LegacyPartitioner,
          },
          client: {
            clientId: `admin`,
            brokers: ['192.168.97.64:9092'],
          },
          consumer: {
            groupId: `exam-group-${process.env.PORT}`, // Static group ID
            allowAutoTopicCreation: true,
            sessionTimeout: 30000, // Adjust session timeout
            heartbeatInterval: 10000, // Adjust heartbeat interval
          },
          subscribe: {
            fromBeginning: false,
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, ExamGateway, RedisService, ExamService, ClientKafka],
})
export class AppModule {}
