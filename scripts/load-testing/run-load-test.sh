#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# RUN-LOAD-TEST.sh - Executa teste de carga
# Multi-Agent System v7.0 - Enterprise Complete Edition
# ═══════════════════════════════════════════════════════════════════════════════

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

BASE_URL="${1:-http://localhost:3000}"
OUTPUT_DIR="./reports/load-tests"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$OUTPUT_DIR"

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   📊 LOAD TESTING                                             ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Target: $BASE_URL"
echo "Output: $OUTPUT_DIR"
echo ""

# Verificar se k6 está instalado
if ! command -v k6 &> /dev/null; then
    echo "Instalando k6..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install k6
    else
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    fi
fi

# Executar teste
echo "🚀 Iniciando teste de carga..."
k6 run \
    --out json="${OUTPUT_DIR}/result-${TIMESTAMP}.json" \
    --summary-export="${OUTPUT_DIR}/summary-${TIMESTAMP}.json" \
    -e BASE_URL="$BASE_URL" \
    scripts/load-testing/k6-load-test.js

echo ""
echo -e "${GREEN}✅ Teste concluído${NC}"
echo "Resultados: ${OUTPUT_DIR}/summary-${TIMESTAMP}.json"
