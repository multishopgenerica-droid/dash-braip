import { Request, Response } from 'express';
import { reportService, ReportType, ReportFormat } from '../services/report.service';

const VALID_TYPES: ReportType[] = ['summary', 'detailed', 'expenses', 'traffic'];
const VALID_FORMATS: ReportFormat[] = ['csv', 'json'];

export class ReportController {
  async generate(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { type, startDate, endDate, format } = req.query;

      const reportType = (type as ReportType) || 'summary';
      const reportFormat = (format as ReportFormat) || 'csv';

      if (!VALID_TYPES.includes(reportType)) {
        return res.status(400).json({ error: `Tipo inválido. Use: ${VALID_TYPES.join(', ')}` });
      }

      if (!VALID_FORMATS.includes(reportFormat)) {
        return res.status(400).json({ error: `Formato inválido. Use: ${VALID_FORMATS.join(', ')}` });
      }

      const parsedStart = startDate ? new Date(startDate as string) : undefined;
      const parsedEnd = endDate ? new Date(endDate as string) : undefined;

      if ((parsedStart && isNaN(parsedStart.getTime())) || (parsedEnd && isNaN(parsedEnd.getTime()))) {
        return res.status(400).json({ error: 'Datas inválidas. Use formato ISO 8601.' });
      }

      const result = await reportService.generateReport(userId, {
        type: reportType,
        startDate: parsedStart,
        endDate: parsedEnd,
        format: reportFormat,
      });

      if (reportFormat === 'csv') {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        return res.send('\uFEFF' + result.data); // BOM for Excel UTF-8
      }

      return res.json({ data: result.data, filename: result.filename });
    } catch (error) {
      console.error('Error generating report:', error);
      return res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }
}

export const reportController = new ReportController();
