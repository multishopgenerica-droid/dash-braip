#!/bin/bash
# GENERATE-COMPONENT.sh - Gera componente React
# Multi-Agent System v7.0

set -e

COMPONENT_NAME="${1:-}"
COMPONENT_DIR="${2:-src/components}"

if [ -z "$COMPONENT_NAME" ]; then
    echo "Uso: $0 <NomeComponente> [diretório]"
    echo "Exemplo: $0 UserCard src/components"
    exit 1
fi

COMPONENT_PATH="${COMPONENT_DIR}/${COMPONENT_NAME}"
mkdir -p "$COMPONENT_PATH"

# Componente principal
cat > "${COMPONENT_PATH}/${COMPONENT_NAME}.tsx" << EOFCOMPONENT
import { cn } from '@/lib/utils';

export interface ${COMPONENT_NAME}Props {
  className?: string;
  children?: React.ReactNode;
}

export function ${COMPONENT_NAME}({ className, children }: ${COMPONENT_NAME}Props) {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  );
}
EOFCOMPONENT

# Arquivo de teste
cat > "${COMPONENT_PATH}/${COMPONENT_NAME}.test.tsx" << EOFTEST
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ${COMPONENT_NAME} } from './${COMPONENT_NAME}';

describe('${COMPONENT_NAME}', () => {
  it('should render children', () => {
    render(<${COMPONENT_NAME}>Test Content</${COMPONENT_NAME}>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<${COMPONENT_NAME} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
EOFTEST

# Index para export
cat > "${COMPONENT_PATH}/index.ts" << EOFINDEX
export { ${COMPONENT_NAME} } from './${COMPONENT_NAME}';
export type { ${COMPONENT_NAME}Props } from './${COMPONENT_NAME}';
EOFINDEX

echo "✅ Componente criado: $COMPONENT_PATH"
echo "   - ${COMPONENT_NAME}.tsx"
echo "   - ${COMPONENT_NAME}.test.tsx"
echo "   - index.ts"
