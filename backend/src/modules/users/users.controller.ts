import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';
import { createUserSchema, updateUserSchema } from './users.dto';

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await usersService.listUsers(req.query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await usersService.getUserById(req.params.id);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await usersService.createUser(data);

    res.status(201).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await usersService.updateUser(req.params.id, data);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await usersService.deleteUser(req.params.id);

    res.json({
      success: true,
      message: 'Usuario removido com sucesso',
    });
  } catch (error) {
    next(error);
  }
}
