import { Request, Response } from 'express';
import { toolService } from '../services/tool.service';
import { createToolSchema, updateToolSchema, toolFilterSchema } from '../dto/tool.dto';
import { ZodError } from 'zod';

export class ToolController {
  async create(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = createToolSchema.parse(req.body);
      const tool = await toolService.create(userId, data);

      return res.status(201).json(tool);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Error creating tool:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const filters = toolFilterSchema.parse(req.query);
      const result = await toolService.findAll(userId, filters);

      return res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Filtros inválidos', details: error.errors });
      }
      console.error('Error fetching tools:', error);
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
      const tool = await toolService.findById(userId, id);

      if (!tool) {
        return res.status(404).json({ error: 'Ferramenta não encontrada' });
      }

      return res.json(tool);
    } catch (error) {
      console.error('Error fetching tool:', error);
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
      const data = updateToolSchema.parse(req.body);
      const tool = await toolService.update(userId, id, data);

      if (!tool) {
        return res.status(404).json({ error: 'Ferramenta não encontrada' });
      }

      return res.json(tool);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Error updating tool:', error);
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
      const tool = await toolService.delete(userId, id);

      if (!tool) {
        return res.status(404).json({ error: 'Ferramenta não encontrada' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting tool:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getMonthlyCost(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const cost = await toolService.getMonthlyToolsCost(userId);
      return res.json({ monthlyCost: cost });
    } catch (error) {
      console.error('Error fetching tools cost:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export const toolController = new ToolController();
