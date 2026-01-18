import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from './env';

export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function generateTokenPair(payload: Omit<TokenPayload, 'iat' | 'exp'>): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}

export function getRefreshTokenExpiration(): Date {
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * multipliers[unit]);
}
