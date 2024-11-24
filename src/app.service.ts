import { Inject, Injectable } from '@nestjs/common';
import { KafkaHandler } from './types';
import { ExamGateway } from './exam/exam.gateway';

@Injectable()
export class AppService {
  constructor(@Inject(ExamGateway) private readonly examGateway: ExamGateway) {}

  async handleAction({ to, action, data }: KafkaHandler) {
    console.log({ to, action, data });
    this.examGateway.server.to(to).emit(action, data);
  }
}
