import { Router } from 'express';
import * as aiAnalysisController from './ai-analysis.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', aiAnalysisController.listAiAnalyses);
router.get('/:id', aiAnalysisController.getAiAnalysisById);
router.post('/', aiAnalysisController.createAiAnalysis);
router.put('/:id', aiAnalysisController.updateAiAnalysis);
router.delete('/:id', aiAnalysisController.deleteAiAnalysis);
router.post('/:id/process', aiAnalysisController.processAiAnalysis);

export default router;
