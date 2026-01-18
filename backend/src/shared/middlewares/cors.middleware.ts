import cors from 'cors';
import { env } from '../../config/env';

const allowedOrigins = [env.FRONTEND_URL];

if (env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000');
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
