import { Request, Response } from 'express';
import { expenseService } from '../services/expense.service';
import { createExpenseSchema, updateExpenseSchema, expenseFilterSchema } from '../dto/expense.dto';
import { ZodError } from 'zod';

export class ExpenseController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = createExpenseSchema.parse(req.body);
      const expense = await expenseService.create(userId, data);

      return res.status(201).json(expense);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Error creating expense:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const filters = expenseFilterSchema.parse(req.query);
      const result = await expenseService.findAll(userId, filters);

      return res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Filtros inválidos', details: error.errors });
      }
      console.error('Error fetching expenses:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const expense = await expenseService.findById(userId, id);

      if (!expense) {
        return res.status(404).json({ error: 'Gasto não encontrado' });
      }

      return res.json(expense);
    } catch (error) {
      console.error('Error fetching expense:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const data = updateExpenseSchema.parse(req.body);
      const expense = await expenseService.update(userId, id, data);

      if (!expense) {
        return res.status(404).json({ error: 'Gasto não encontrado' });
      }

      return res.json(expense);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Error updating expense:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const expense = await expenseService.delete(userId, id);

      if (!expense) {
        return res.status(404).json({ error: 'Gasto não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting expense:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export const expenseController = new ExpenseController();
