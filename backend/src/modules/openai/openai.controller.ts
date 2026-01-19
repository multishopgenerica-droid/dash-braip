import { Request, Response, NextFunction } from 'express';
import { openAIService } from './openai.service';

// Get OpenAI config for current user
export async function getConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const config = await openAIService.getConfig(req.user!.id);

    // Don't expose the full API key
    const safeConfig = config
      ? {
          ...config,
          apiKey: config.apiKey ? '••••••••' + config.apiKey.slice(-4) : null,
        }
      : {
          enabled: false,
          apiKey: null,
          model: 'gpt-4o-mini',
          maxTokens: 1000,
          temperature: 0.7,
          totalTokensUsed: 0,
          totalRequests: 0,
          lastUsedAt: null,
        };

    res.json({
      success: true,
      data: safeConfig,
    });
  } catch (error) {
    next(error);
  }
}

// Update OpenAI config
export async function updateConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { enabled, apiKey, model, maxTokens, temperature } = req.body;

    const updateData: {
      enabled?: boolean;
      apiKey?: string;
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {};

    if (typeof enabled === 'boolean') updateData.enabled = enabled;
    if (apiKey) updateData.apiKey = apiKey;
    if (model) updateData.model = model;
    if (typeof maxTokens === 'number') updateData.maxTokens = maxTokens;
    if (typeof temperature === 'number') updateData.temperature = temperature;

    const config = await openAIService.updateConfig(req.user!.id, updateData);

    // Don't expose the full API key in response
    const safeConfig = {
      ...config,
      apiKey: config.apiKey ? '••••••••' + config.apiKey.slice(-4) : null,
    };

    res.json({
      success: true,
      data: safeConfig,
    });
  } catch (error) {
    next(error);
  }
}

// Test OpenAI connection
export async function testConnection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await openAIService.testConnection(req.user!.id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// Analyze data with AI
export async function analyzeData(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
      return;
    }

    const result = await openAIService.analyzeData(req.user!.id, prompt, context);

    res.json({
      success: result.success,
      data: result.success
        ? { analysis: result.analysis, tokensUsed: result.tokensUsed }
        : null,
      error: result.error,
    });
  } catch (error) {
    next(error);
  }
}

// Get usage statistics
export async function getUsageStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await openAIService.getUsageStats(req.user!.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

// Available models
export async function getAvailableModels(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const models = [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and affordable' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Powerful with vision' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cheap' },
    ];

    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    next(error);
  }
}
