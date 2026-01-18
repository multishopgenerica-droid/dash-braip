import { User } from '@prisma/client';
import { prisma } from '../../config/database';
import {
  generateTokenPair,
  verifyRefreshToken,
  getRefreshTokenExpiration,
  TokenPair,
} from '../../config/jwt';
import { hashPassword, comparePassword } from '../../shared/utils/crypto';
import { AppError } from '../../shared/middlewares/error.middleware';
import { AUTH_MESSAGES } from '../../shared/constants/messages';
import { RegisterDTO, LoginDTO, ChangePasswordDTO } from './auth.dto';

export interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: TokenPair;
}

export async function register(data: RegisterDTO): Promise<AuthResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError(400, AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
    },
  });

  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiration(),
    },
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens,
  };
}

export async function login(data: LoginDTO): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw new AppError(401, AUTH_MESSAGES.USER_INACTIVE);
  }

  const isValidPassword = await comparePassword(data.password, user.password);

  if (!isValidPassword) {
    throw new AppError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiration(),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens,
  };
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError(401, AUTH_MESSAGES.TOKEN_INVALID);
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new AppError(401, AUTH_MESSAGES.TOKEN_EXPIRED);
  }

  try {
    verifyRefreshToken(refreshToken);
  } catch {
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });
    throw new AppError(401, AUTH_MESSAGES.TOKEN_INVALID);
  }

  await prisma.refreshToken.delete({
    where: { id: storedToken.id },
  });

  const tokens = generateTokenPair({
    userId: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role,
  });

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: storedToken.user.id,
      expiresAt: getRefreshTokenExpiration(),
    },
  });

  return tokens;
}

export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  } else {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}

export async function changePassword(
  userId: string,
  data: ChangePasswordDTO
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  const isValidPassword = await comparePassword(data.currentPassword, user.password);

  if (!isValidPassword) {
    throw new AppError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  const hashedPassword = await hashPassword(data.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

export async function getMe(userId: string): Promise<Omit<User, 'password'>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
