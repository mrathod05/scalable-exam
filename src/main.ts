import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Partitioners } from 'kafkajs';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 4000;

  const groupId = `exam-group-${port}`;

  app.connectMicroservice<MicroserviceOptions>({
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
        groupId: groupId, // Static group ID
        allowAutoTopicCreation: true,
        sessionTimeout: 30000, // Adjust session timeout
        heartbeatInterval: 10000, // Adjust heartbeat interval
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  });

  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(port);
  await app.startAllMicroservices();

  const url = await app.getUrl();

  Logger.log(`Application is running on ${url} `);
}

async function callBootstrap() {
  await bootstrap();
}

callBootstrap();
