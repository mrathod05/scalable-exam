# Project: Scalable Exam System - NestJS

This project showcases a scalable and real-time exam management system developed using **NestJS**, **Kafka**, **Redis**, and **Socket.IO**. The system is designed to handle multiple concurrent users, real-time exam functionalities, and distributed event handling for large-scale applications.

## Features

- **Real-time WebSocket Communication**: Utilizes Socket.IO to provide real-time exam updates (e.g., live timer, exam status).
- **Redis for Shared State Management**: Employs a single Redis instance to store and share the state of critical data, such as exam timers, across multiple server instances.
- **Kafka Event Streaming**: Uses Kafka to distribute and process messages related to exam events, such as starting/stopping exams and user activity tracking.
- **Scalable Architecture**: Designed to support horizontal scaling, leveraging Redis to maintain a consistent state across multiple instances.
- **Global Exam Timers**: Redis stores exam timers, ensuring that users receive synchronized updates regardless of their connection state.
- **Fault Tolerance**: Kafka and Redis ensure high availability, fault tolerance, and data persistence for critical exam workflows.

## Technologies Used

- **NestJS**: Framework for building server-side applications.
- **Kafka**: Distributed event streaming platform.
- **Redis**: In-memory data structure store for caching, timers, and state management.
- **Socket.IO**: Real-time communication library for WebSocket-based updates.
- **TypeScript**: A programming language for static typing.

## Project Setup

### Prerequisites

- Node.js (v20+)
- Redis (Single instance)
- Kafka (Cluster recommended for scaling)
- Docker (Optional, for containerized services)
