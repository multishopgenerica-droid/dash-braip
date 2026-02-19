#!/bin/bash
# GENERATE-TEST.sh - Gera esqueleto de teste para arquivo existente
# Multi-Agent System v7.0

set -e

SOURCE_FILE="${1:-}"

if [ -z "$SOURCE_FILE" ]; then
    echo "Uso: $0 <arquivo_fonte>"
    echo "Exemplo: $0 src/services/userService.ts"
    exit 1
fi

if [ ! -f "$SOURCE_FILE" ]; then
    echo "Arquivo não encontrado: $SOURCE_FILE"
    exit 1
fi

EXT="${SOURCE_FILE##*.}"
BASENAME=$(basename "$SOURCE_FILE" ".$EXT")
DIRNAME=$(dirname "$SOURCE_FILE")

case "$EXT" in
    ts|tsx|js|jsx)
        TEST_FILE="${DIRNAME}/${BASENAME}.test.${EXT}"
        FUNCTIONS=$(grep -E "^export (async )?(function|const)" "$SOURCE_FILE" | \
            sed -E 's/export (async )?(function|const) ([a-zA-Z0-9_]+).*/\3/' || true)
        
        cat > "$TEST_FILE" << EOFTSTEST
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
$(echo "$FUNCTIONS" | sed 's/^/  /' | sed 's/$/,/')
} from './${BASENAME}';

describe('${BASENAME}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

$(echo "$FUNCTIONS" | while read fn; do
    [ -n "$fn" ] && cat << EOFFN

  describe('${fn}', () => {
    it('should work correctly with valid input', async () => {
      // Arrange
      const input = {}; // TODO: Defina input válido
      
      // Act
      const result = await ${fn}(input);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should handle edge cases', async () => {
      // TODO: Teste casos de borda
    });
  });
EOFFN
done)
});
EOFTSTEST
        ;;
    
    py)
        TEST_FILE="${DIRNAME}/test_${BASENAME}.py"
        FUNCTIONS=$(grep -E "^(def |async def )" "$SOURCE_FILE" | \
            sed -E 's/(async )?def ([a-zA-Z0-9_]+).*/\2/' | grep -v "^_" || true)
        
        cat > "$TEST_FILE" << EOFPYTEST
import pytest
from unittest.mock import Mock, patch
from ${BASENAME} import (
$(echo "$FUNCTIONS" | sed 's/^/    /' | sed 's/$/,/')
)

class Test${BASENAME^}:
    @pytest.fixture(autouse=True)
    def setup(self):
        pass
    
$(echo "$FUNCTIONS" | while read fn; do
    [ -n "$fn" ] && cat << EOFFN

    def test_${fn}_with_valid_input(self):
        input_data = {}  # TODO: Defina input válido
        result = ${fn}(input_data)
        assert result is not None

    def test_${fn}_handles_edge_cases(self):
        pass
EOFFN
done)
EOFPYTEST
        ;;
    
    *)
        echo "Extensão não suportada: $EXT"
        exit 1
        ;;
esac

echo "✅ Arquivo de teste gerado: $TEST_FILE"
