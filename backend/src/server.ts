import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getRedis, disconnectRedis } from './config/redis';
import { startSyncScheduler, stopSyncScheduler } from './modules/sync';
import { verifyAccessToken } from './config/jwt';

const httpServer = createServer(app);

// WebSocket setup
const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// WebSocket authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = verifyAccessToken(token);
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} (User: ${socket.data.userId})`);

  socket.on('subscribe:gateway', (gatewayId: string) => {
    socket.join(`gateway:${gatewayId}`);
    console.log(`Socket ${socket.id} subscribed to gateway:${gatewayId}`);
  });

  socket.on('unsubscribe:gateway', (gatewayId: string) => {
    socket.leave(`gateway:${gatewayId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Export io for use in other modules
export { io };

// Emit functions for real-time updates
export function emitNewSale(gatewayId: string, sale: unknown): void {
  io.to(`gateway:${gatewayId}`).emit('sale:new', sale);
}

export function emitMetricsUpdate(gatewayId: string, metrics: unknown): void {
  io.to(`gateway:${gatewayId}`).emit('metrics:update', metrics);
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log('Shutting down...');

  stopSyncScheduler();

  io.close();

  await disconnectRedis();
  await disconnectDatabase();

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    await connectDatabase();
    getRedis();
    startSyncScheduler();

    httpServer.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
