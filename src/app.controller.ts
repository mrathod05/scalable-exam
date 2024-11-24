import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientKafka, EventPattern } from '@nestjs/microservices';
import { EMIT_ACTIONS } from './types';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    @Inject(AppService) private readonly appService: AppService,
  ) {}
  async onModuleInit() {
    const requiredTopics = Object.values(EMIT_ACTIONS);
    for (const topic of requiredTopics) {
      this.kafkaClient.subscribeToResponseOf(topic);
    }
    await this.kafkaClient.connect();
  }

  async handleError(error: any) {
    Logger.error('Redis Error:', error);
    throw Error('Something went wrong');
  }

  @EventPattern(EMIT_ACTIONS.STARTED)
  async startExam(data: { examId: string }) {
    await this.appService.handleAction({
      to: data.examId,
      action: EMIT_ACTIONS.STARTED,
      data,
    });
  }

  @EventPattern(EMIT_ACTIONS.RESET)
  async resetExam(data: { examId: string; duration: number }) {
    await this.appService.handleAction({
      to: data.examId,
      action: EMIT_ACTIONS.RESET,
      data,
    });
  }

  @EventPattern(EMIT_ACTIONS.PAUSED)
  async pauseExam(data: {
    examId: string;
    timeLeft: number;
    isRunning: boolean;
  }) {
    await this.appService.handleAction({
      to: data.examId,
      action: EMIT_ACTIONS.PAUSED,
      data: data,
    });
  }

  @EventPattern(EMIT_ACTIONS.EXISTING)
  async existingExam(data: {
    examId: string;
    timeLeft: number;
    isRunning: boolean;
    duration: number;
  }) {
    await this.appService.handleAction({
      to: data.examId,
      action: EMIT_ACTIONS.EXISTING,
      data,
    });
  }

  @EventPattern(EMIT_ACTIONS.TIMER_UPDATE)
  async timerUpdate(data: {
    examId: string;
    timeLeft: number;
    isRunning: boolean;
    duration: number;
  }) {
    await this.appService.handleAction({
      to: data.examId,
      action: EMIT_ACTIONS.TIMER_UPDATE,
      data,
    });
  }

  @EventPattern(EMIT_ACTIONS.FINISHED)
  async finishedExam(data: { examId: string; duration: number }) {
    await this.appService.handleAction({
      to: data.examId,
      action: EMIT_ACTIONS.FINISHED,
      data,
    });
  }
}
