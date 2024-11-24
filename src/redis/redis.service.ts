import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';
import { ENV } from 'src/contents/env';
import { ExamRoomDto } from 'src/types';

const TIMER_LOCK_PREFIX = 'timer-lock:';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private subscriberClient: Redis;
  private lockService: Redlock;

  constructor() {
    // this.client = new Redis({ host: 'localhost', port: 6379 });
    this.client = new Redis(ENV.REDIS_URL);

    this.lockService = new Redlock([this.client], {
      retryCount: 10, // retry if lock is not acquired immediately
      retryDelay: 200, // wait 200ms before retrying
      retryJitter: 50,
    });

    this.client.on('connect', () => {
      // this.client.flushall();
      Logger.log('Redis Connected');
    });

    this.subscriberClient = this.client.duplicate();

    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  async handleError(error: any) {
    Logger.error('Redis Error:', error);
    throw Error('Something went wrong');
  }

  async onModuleDestroy() {
    try {
      if (this.client.status === 'ready') {
        this.client.disconnect();
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  getClient(): Redis {
    try {
      return this.client;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async publish(channel: string, message: ExamRoomDto): Promise<void> {
    try {
      await this.getClient().publish(channel, JSON.stringify(message));
    } catch (error) {
      this.handleError(error);
    }
  }

  // Subscribe to a Redis channel
  public async subscribe(
    channel: string,
    listener: (message: any) => void,
  ): Promise<void> {
    try {
      await this.subscriberClient.subscribe(channel, (err, count) => {
        if (err) {
          this.handleError(err);
        } else {
          Logger.log(
            `Subscribed to ${count} channel(s). Listening for updates on the ${channel} channel.`,
          );
        }
      });

      this.subscriberClient.on('message', (ch, message) => {
        if (ch === channel) {
          listener(JSON.parse(message));
        }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  public async getExamRoom(examId: string): Promise<ExamRoomDto> {
    try {
      const examRooms = await this.client.get(examId);
      return examRooms ? JSON.parse(examRooms) : null;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async setExamRoom(
    examId: string,
    examDetails: ExamRoomDto,
  ): Promise<void> {
    try {
      await this.client.set(examId, JSON.stringify(examDetails));
    } catch (error) {
      this.handleError(error);
    }
  }

  public async deleteExamRoom({ examId }: { examId: string }) {
    try {
      await this.client.del(examId);
    } catch (error) {
      this.handleError(error);
    }
  }

  public async acquireLock({
    resource,
    ttl = 2000,
  }: {
    resource: string;
    ttl?: number;
  }) {
    try {
      const lockString = `${TIMER_LOCK_PREFIX}${resource}`;
      const lock = await this.lockService.acquire([lockString], ttl);

      console.log(`Lock acquired for resource: ${resource}`);

      return lock;
    } catch (error) {
      this.handleError(error);
    }
  }

  public async releaseLock(lock: Lock) {
    try {
      await this.lockService.release(lock);
      console.log(`Lock released`);
    } catch (error) {
      this.handleError(error);
    }
  }
}
