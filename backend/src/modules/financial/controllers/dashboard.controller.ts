import { Request, Response } from 'express';
import { financialDashboardService } from '../services/dashboard.service';

export class FinancialDashboardController {
  async getMacroView(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { startDate, endDate } = req.query;
      const parsedStart = startDate ? new Date(startDate as string) : undefined;
      const parsedEnd = endDate ? new Date(endDate as string) : undefined;

      if ((parsedStart && isNaN(parsedStart.getTime())) || (parsedEnd && isNaN(parsedEnd.getTime()))) {
        return res.status(400).json({ error: 'Datas inválidas. Use formato ISO 8601.' });
      }

      const result = await financialDashboardService.getMacroView(
        userId,
        parsedStart,
        parsedEnd
      );

      return res.json(result);
    } catch (error) {
      console.error('Error fetching macro view:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getMonthlyTrend(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const months = Math.min(Math.max(parseInt(req.query.months as string, 10) || 6, 1), 24);
      const result = await financialDashboardService.getMonthlyTrend(userId, months);

      return res.json(result);
    } catch (error) {
      console.error('Error fetching monthly trend:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getSummaryCards(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { startDate, endDate } = req.query;
      const parsedStart = startDate ? new Date(startDate as string) : undefined;
      const parsedEnd = endDate ? new Date(endDate as string) : undefined;

      if ((parsedStart && isNaN(parsedStart.getTime())) || (parsedEnd && isNaN(parsedEnd.getTime()))) {
        return res.status(400).json({ error: 'Datas inválidas. Use formato ISO 8601.' });
      }

      const result = await financialDashboardService.getSummaryCards(userId, parsedStart, parsedEnd);
      return res.json(result);
    } catch (error) {
      console.error('Error fetching summary cards:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export const financialDashboardController = new FinancialDashboardController();
