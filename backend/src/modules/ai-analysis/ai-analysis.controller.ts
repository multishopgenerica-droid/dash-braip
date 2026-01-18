import { Request, Response, NextFunction } from 'express';
import * as aiAnalysisService from './ai-analysis.service';
import {
  createAiAnalysisSchema,
  updateAiAnalysisSchema,
  aiAnalysisQuerySchema,
} from './ai-analysis.dto';

export async function listAiAnalyses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = aiAnalysisQuerySchema.parse(req.query);
    const result = await aiAnalysisService.listAiAnalyses(req.user!.id, query);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAiAnalysisById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const analysis = await aiAnalysisService.getAiAnalysisById(
      req.user!.id,
      req.params.id
    );

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error) {
    next(error);
  }
}

export async function createAiAnalysis(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = createAiAnalysisSchema.parse(req.body);
    const analysis = await aiAnalysisService.createAiAnalysis(req.user!.id, data);

    res.status(201).json({
      success: true,
      data: { analysis },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAiAnalysis(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = updateAiAnalysisSchema.parse(req.body);
    const analysis = await aiAnalysisService.updateAiAnalysis(
      req.user!.id,
      req.params.id,
      data
    );

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAiAnalysis(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await aiAnalysisService.deleteAiAnalysis(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Analise removida com sucesso',
    });
  } catch (error) {
    next(error);
  }
}

export async function processAiAnalysis(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const analysis = await aiAnalysisService.processAiAnalysis(
      req.user!.id,
      req.params.id
    );

    res.json({
      success: true,
      data: { analysis },
    });
  } catch (error) {
    next(error);
  }
}
