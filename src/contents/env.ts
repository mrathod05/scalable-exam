import * as dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  APP_PORT: process.env.APP_PORT,
  KAFKA_GROUP_PORT: process.env.APP_PORT,
  KAFKA_BROKER: process.env.KAFKA_BROKER,
  REDIS_URL: process.env.REDIS_URL,
};
