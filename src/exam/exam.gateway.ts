import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ExamRoomDto, LISTEN_EVENTS } from 'src/types';
import { ExamService } from './exam.service';

@WebSocketGateway({
  namespace: '/exam',

  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
})
export class ExamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly examService: ExamService) {}

  async handleConnection(socket: Socket) {
    console.log('Client connected:', socket.id);
  }

  async handleDisconnect(socket: Socket) {
    console.log('Client disconnected:', socket.id);
  }

  handleError(error: any) {
    console.error({ 'Socket Error': error });
    throw new Error('Something went wrong');
  }

  // Join the exam
  @SubscribeMessage(LISTEN_EVENTS.JOIN)
  async joinExam(
    @MessageBody() { examId }: { examId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.examService.joinExam(examId, client);
  }

  // Start the exam timer
  @SubscribeMessage(LISTEN_EVENTS.START)
  async createAndStartExam(
    @MessageBody()
    data: {
      examId: string;
      timeLeft: string;
    },
  ) {
    await this.examService.createAndStartExam(data);
  }

  // Restart the exam timer
  @SubscribeMessage(LISTEN_EVENTS.RESTART) // "restartExam"
  async examRestarted(@MessageBody() data: ExamRoomDto) {
    await this.examService.restartExam(data);
  }

  // Pause the exam timer
  @SubscribeMessage(LISTEN_EVENTS.PAUSED)
  async pauseExam(@MessageBody() { examId }: { examId: string }) {
    await this.examService.pauseExam(examId);
  }

  // Reset the exam timer
  @SubscribeMessage(LISTEN_EVENTS.RESET)
  async resetExam(@MessageBody() { examId }: { examId: string }) {
    await this.examService.resetExam(examId);
  }
}
