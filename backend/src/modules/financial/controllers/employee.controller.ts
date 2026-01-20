import { Request, Response } from 'express';
import { employeeService } from '../services/employee.service';
import { createEmployeeSchema, updateEmployeeSchema, employeeFilterSchema } from '../dto/employee.dto';
import { ZodError } from 'zod';

export class EmployeeController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = createEmployeeSchema.parse(req.body);
      const employee = await employeeService.create(userId, data);

      return res.status(201).json(employee);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Error creating employee:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const filters = employeeFilterSchema.parse(req.query);
      const result = await employeeService.findAll(userId, filters);

      return res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Filtros inválidos', details: error.errors });
      }
      console.error('Error fetching employees:', error);
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
      const employee = await employeeService.findById(userId, id);

      if (!employee) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }

      return res.json(employee);
    } catch (error) {
      console.error('Error fetching employee:', error);
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
      const data = updateEmployeeSchema.parse(req.body);
      const employee = await employeeService.update(userId, id, data);

      if (!employee) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }

      return res.json(employee);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Error updating employee:', error);
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
      const employee = await employeeService.delete(userId, id);

      if (!employee) {
        return res.status(404).json({ error: 'Funcionário não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting employee:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getPayroll(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const payroll = await employeeService.getMonthlyPayroll(userId);
      return res.json(payroll);
    } catch (error) {
      console.error('Error fetching payroll:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export const employeeController = new EmployeeController();
