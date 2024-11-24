import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamGateway } from './exam.gateway';

@Module({
  providers: [ExamGateway, ExamService],
})
export class ExamModule {}
