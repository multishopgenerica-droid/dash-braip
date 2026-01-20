import { Request, Response } from 'express';
import { trafficService } from '../services/traffic.service';
import { createTrafficSpendSchema, updateTrafficSpendSchema, trafficFilterSchema } from '../dto/traffic.dto';
import { ZodError } from 'zod';

export class TrafficController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = createTrafficSpendSchema.parse(req.body);
      const traffic = await trafficService.create(userId, data);

      return res.status(201).json(traffic);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Error creating traffic spend:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const filters = trafficFilterSchema.parse(req.query);
      const result = await trafficService.findAll(userId, filters);

      return res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Filtros inválidos', details: error.errors });
      }
      console.error('Error fetching traffic spends:', error);
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
      const traffic = await trafficService.findById(userId, id);

      if (!traffic) {
        return res.status(404).json({ error: 'Gasto de tráfego não encontrado' });
      }

      return res.json(traffic);
    } catch (error) {
      console.error('Error fetching traffic spend:', error);
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
      const data = updateTrafficSpendSchema.parse(req.body);
      const traffic = await trafficService.update(userId, id, data);

      if (!traffic) {
        return res.status(404).json({ error: 'Gasto de tráfego não encontrado' });
      }

      return res.json(traffic);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Error updating traffic spend:', error);
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
      const traffic = await trafficService.delete(userId, id);

      if (!traffic) {
        return res.status(404).json({ error: 'Gasto de tráfego não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting traffic spend:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getByPlatform(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { startDate, endDate } = req.query;
      const result = await trafficService.getByPlatform(
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      return res.json(result);
    } catch (error) {
      console.error('Error fetching traffic by platform:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export const trafficController = new TrafficController();
