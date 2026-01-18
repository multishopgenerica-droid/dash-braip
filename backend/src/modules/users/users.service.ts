import { User } from '@prisma/client';
import { prisma } from '../../config/database';
import { hashPassword } from '../../shared/utils/crypto';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../shared/utils/pagination';
import { AppError } from '../../shared/middlewares/error.middleware';
import { AUTH_MESSAGES } from '../../shared/constants/messages';
import { CreateUserDTO, UpdateUserDTO } from './users.dto';

type UserWithoutPassword = Omit<User, 'password'>;

function excludePassword(user: User): UserWithoutPassword {
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function listUsers(
  query: Record<string, unknown>
): Promise<PaginatedResult<UserWithoutPassword>> {
  const { skip, take, page } = getPaginationParams(query);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return createPaginatedResult(
    users.map(excludePassword),
    total,
    page,
    take
  );
}

export async function getUserById(id: string): Promise<UserWithoutPassword> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  return excludePassword(user);
}

export async function createUser(data: CreateUserDTO): Promise<UserWithoutPassword> {
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
      role: data.role,
    },
  });

  return excludePassword(user);
}

export async function updateUser(
  id: string,
  data: UpdateUserDTO
): Promise<UserWithoutPassword> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  if (data.email && data.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(400, AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data,
  });

  return excludePassword(updatedUser);
}

export async function deleteUser(id: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError(404, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  await prisma.user.delete({
    where: { id },
  });
}
