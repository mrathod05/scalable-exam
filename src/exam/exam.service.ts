import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Socket } from 'socket.io';
import { RedisService } from 'src/redis/redis.service';
import { EMIT_ACTIONS, ExamRoomDto } from 'src/types';

@Injectable()
export class ExamService {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly redisService: RedisService,
  ) {}

  private handleError(error: any) {
    console.error({ 'Socket Error': error });
    throw new Error('Something went wrong');
  }

  async kafkaEmit(action: EMIT_ACTIONS, data: ExamRoomDto) {
    this.kafkaClient.emit(action, data);
  }

  async joinExam(examId: string, socketClient: Socket) {
    try {
      let examRoom = await this.redisService.getExamRoom(examId);

      if (examRoom) {
        this.kafkaEmit(EMIT_ACTIONS.EXISTING, {
          ...examRoom,
          examId,
        });
      }

      console.log('JoinRoom::>', { examId });

      socketClient.join(examId);
    } catch (error) {
      this.handleError(error);
    }
  }

  async createAndStartExam(data: any) {
    const { examId, timeLeft } = data;
    const lock = await this.redisService.acquireLock({ resource: examId });

    try {
      let examRoom = await this.redisService.getExamRoom(examId);
      let isTimerAlreadyActive = false;

      if (!examRoom) {
        examRoom = data;

        await this.createExamRoom({
          examId,
          details: data,
        });
      } else {
        isTimerAlreadyActive = examRoom.isRunning;
        examRoom.isRunning = true;

        await this.redisService.setExamRoom(examId, {
          ...examRoom,
          timeLeft: examRoom?.timeLeft || timeLeft,
        });
      }

      // Publish to Redis to sync across instances
      this.kafkaEmit(EMIT_ACTIONS.STARTED, {
        ...examRoom,
        examId,
      });
      // Start timer on this instance
      if (!isTimerAlreadyActive) {
        this.runExamTimer(examId);
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      await this.redisService.releaseLock(lock);
    }
  }

  async restartExam(data: ExamRoomDto) {
    const { examId } = data;

    const lock = await this.redisService.acquireLock({ resource: examId });

    try {
      await this.redisService.setExamRoom(examId, {
        ...data,
        isRunning: true,
        isFinished: false,
      });

      this.runExamTimer(examId);
    } catch (error) {
      this.handleError(error);
    } finally {
      await this.redisService.releaseLock(lock);
    }
  }

  async pauseExam(examId: string) {
    const lock = await this.redisService.acquireLock({ resource: examId });
    try {
      const examRoom = await this.redisService.getExamRoom(examId);

      examRoom.isRunning = false;

      await this.redisService.setExamRoom(examId, examRoom);

      // Publish to Redis to sync across instances
      this.kafkaEmit(EMIT_ACTIONS.PAUSED, {
        ...examRoom,
        examId,
      });
    } catch (error) {
      this.handleError(error);
    } finally {
      await this.redisService.releaseLock(lock);
    }
  }

  async resetExam(examId: string) {
    const lock = await this.redisService.acquireLock({ resource: examId });
    try {
      const examRoom = await this.redisService.getExamRoom(examId);

      const resetExamRoom: ExamRoomDto = {
        ...examRoom,
        timeLeft: examRoom.duration,
        isRunning: false,
      };

      await this.redisService.setExamRoom(examId, resetExamRoom);

      // Publish to Redis to sync across instances
      this.kafkaEmit(EMIT_ACTIONS.RESET, {
        examId,
        ...resetExamRoom,
      });

      await this.redisService.deleteExamRoom({ examId });
    } catch (error) {
      this.handleError(error);
    } finally {
      await this.redisService.releaseLock(lock);
    }
  }

  private async createExamRoom({
    examId,
    details,
  }: {
    examId: string;
    details: ExamRoomDto;
  }) {
    try {
      await this.redisService.setExamRoom(examId, details);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Handle timer logic
  private async runExamTimer(examId: string) {
    try {
      const intervalId = setInterval(async () => {
        let examRoom = await this.redisService.getExamRoom(examId);
        // intervalId[Symbol.toPrimitive]();

        if (!examRoom || !examRoom?.isRunning) {
          clearInterval(intervalId);
          return;
        }

        if (examRoom?.timeLeft <= 0) {
          examRoom.isRunning = false;
          examRoom.isFinished = true;
          await this.handleFinishExam(examRoom);
          clearInterval(intervalId);
          return;
        }

        examRoom.timeLeft--;

        await this.redisService.setExamRoom(examId, examRoom);

        // Publish updates to other instances
        this.kafkaEmit(EMIT_ACTIONS.TIMER_UPDATE, {
          ...examRoom,
          examId,
        });
      }, 1000);
    } catch (error) {
      this.handleError(error);
    }
  }
  // Handle incoming messages from Redis Pub/Sub

  private async handleFinishExam(examRoom: ExamRoomDto): Promise<boolean> {
    try {
      this.kafkaEmit(EMIT_ACTIONS.EXISTING, examRoom);

      await this.redisService.deleteExamRoom({ examId: examRoom.examId });

      return true;
    } catch (error) {
      console.error({ handleFinishExam: error });
      this.handleError(error);
    }
  }
}
