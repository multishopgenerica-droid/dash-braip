#!/bin/bash
# GENERATE-API.sh - Gera endpoint de API
# Multi-Agent System v7.0

set -e

RESOURCE_NAME="${1:-}"
API_DIR="${2:-src/api}"

if [ -z "$RESOURCE_NAME" ]; then
    echo "Uso: $0 <resource> [diretório]"
    echo "Exemplo: $0 users src/api"
    exit 1
fi

RESOURCE_LOWER=$(echo "$RESOURCE_NAME" | tr '[:upper:]' '[:lower:]')
RESOURCE_UPPER=$(echo "${RESOURCE_NAME:0:1}" | tr '[:lower:]' '[:upper:]')${RESOURCE_NAME:1}
RESOURCE_PATH="${API_DIR}/${RESOURCE_LOWER}"

mkdir -p "$RESOURCE_PATH"

# Controller
cat > "${RESOURCE_PATH}/${RESOURCE_LOWER}.controller.ts" << EOFCONTROLLER
import { Request, Response, NextFunction } from 'express';
import { ${RESOURCE_LOWER}Service } from './${RESOURCE_LOWER}.service';
import { Create${RESOURCE_UPPER}Dto, Update${RESOURCE_UPPER}Dto } from './${RESOURCE_LOWER}.dto';

export class ${RESOURCE_UPPER}Controller {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await ${RESOURCE_LOWER}Service.findAll();
      res.json(items);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await ${RESOURCE_LOWER}Service.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: Create${RESOURCE_UPPER}Dto = req.body;
      const item = await ${RESOURCE_LOWER}Service.create(dto);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: Update${RESOURCE_UPPER}Dto = req.body;
      const item = await ${RESOURCE_LOWER}Service.update(req.params.id, dto);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ${RESOURCE_LOWER}Service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const ${RESOURCE_LOWER}Controller = new ${RESOURCE_UPPER}Controller();
EOFCONTROLLER

# Service
cat > "${RESOURCE_PATH}/${RESOURCE_LOWER}.service.ts" << EOFSERVICE
import { Create${RESOURCE_UPPER}Dto, Update${RESOURCE_UPPER}Dto } from './${RESOURCE_LOWER}.dto';

class ${RESOURCE_UPPER}Service {
  async findAll() {
    // TODO: Implementar query no banco
    return [];
  }

  async findById(id: string) {
    // TODO: Implementar query por ID
    return null;
  }

  async create(dto: Create${RESOURCE_UPPER}Dto) {
    // TODO: Implementar criação
    return { id: '1', ...dto };
  }

  async update(id: string, dto: Update${RESOURCE_UPPER}Dto) {
    // TODO: Implementar atualização
    return { id, ...dto };
  }

  async delete(id: string) {
    // TODO: Implementar deleção
  }
}

export const ${RESOURCE_LOWER}Service = new ${RESOURCE_UPPER}Service();
EOFSERVICE

# DTO
cat > "${RESOURCE_PATH}/${RESOURCE_LOWER}.dto.ts" << EOFDTO
import { z } from 'zod';

export const create${RESOURCE_UPPER}Schema = z.object({
  name: z.string().min(1),
  // TODO: Adicionar campos
});

export const update${RESOURCE_UPPER}Schema = create${RESOURCE_UPPER}Schema.partial();

export type Create${RESOURCE_UPPER}Dto = z.infer<typeof create${RESOURCE_UPPER}Schema>;
export type Update${RESOURCE_UPPER}Dto = z.infer<typeof update${RESOURCE_UPPER}Schema>;
EOFDTO

# Routes
cat > "${RESOURCE_PATH}/${RESOURCE_LOWER}.routes.ts" << EOFROUTES
import { Router } from 'express';
import { ${RESOURCE_LOWER}Controller } from './${RESOURCE_LOWER}.controller';
import { validateBody } from '@/middleware/validate';
import { create${RESOURCE_UPPER}Schema, update${RESOURCE_UPPER}Schema } from './${RESOURCE_LOWER}.dto';

const router = Router();

router.get('/', ${RESOURCE_LOWER}Controller.list);
router.get('/:id', ${RESOURCE_LOWER}Controller.getById);
router.post('/', validateBody(create${RESOURCE_UPPER}Schema), ${RESOURCE_LOWER}Controller.create);
router.put('/:id', validateBody(update${RESOURCE_UPPER}Schema), ${RESOURCE_LOWER}Controller.update);
router.delete('/:id', ${RESOURCE_LOWER}Controller.delete);

export default router;
EOFROUTES

# Index
cat > "${RESOURCE_PATH}/index.ts" << EOFINDEX
export { default as ${RESOURCE_LOWER}Routes } from './${RESOURCE_LOWER}.routes';
export * from './${RESOURCE_LOWER}.dto';
EOFINDEX

echo "✅ API criada: $RESOURCE_PATH"
echo "   - ${RESOURCE_LOWER}.controller.ts"
echo "   - ${RESOURCE_LOWER}.service.ts"
echo "   - ${RESOURCE_LOWER}.dto.ts"
echo "   - ${RESOURCE_LOWER}.routes.ts"
echo "   - index.ts"
echo ""
echo "Adicione ao router principal:"
echo "   import { ${RESOURCE_LOWER}Routes } from './${RESOURCE_LOWER}';"
echo "   app.use('/api/${RESOURCE_LOWER}', ${RESOURCE_LOWER}Routes);"
