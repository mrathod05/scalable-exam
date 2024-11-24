export enum LISTEN_EVENTS {
  JOIN = 'joinExam',
  EXISTING = 'existingExam',
  PAUSED = 'pauseExam',
  TIMER = 'examTimer',
  FINISHED = 'examFinished',
  START = 'createAndStartExam',
  RESTART = 'restartExam',
  RESET = 'resetExam',
}

export enum EMIT_ACTIONS {
  EXISTING = 'existingExam',
  STARTED = 'examStarted',
  PAUSED = 'examPaused',
  RESET = 'examReset',
  TIMER_UPDATE = 'examTimerUpdate',
  FINISHED = 'examFinished',
}

export enum TIMER_TYPE {
  EXAM = 'exam-timer',
  BREAK = 'break-timer',
}

export interface KafkaHandler {
  to: string;
  action: EMIT_ACTIONS;
  data: Partial<ExamRoomDto>;
}

export interface ExamRoomDto {
  examId: string;
  duration: number;
  timeLeft: number;
  isRunning: boolean;
  subject: string;
  isFinished: boolean;
}
