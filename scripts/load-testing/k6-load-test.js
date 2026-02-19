// ═══════════════════════════════════════════════════════════════════════════════
// K6 Load Test Script
// Multi-Agent System v7.0 - Enterprise Complete Edition
// ═══════════════════════════════════════════════════════════════════════════════
//
// Uso: k6 run scripts/load-testing/k6-load-test.js
//
// ═══════════════════════════════════════════════════════════════════════════════

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

// Configuração
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up
    { duration: '3m', target: 50 },   // Sustain
    { duration: '1m', target: 100 },  // Spike
    { duration: '2m', target: 50 },   // Recovery
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1s
    errors: ['rate<0.05'],                           // Error rate < 5%
    http_req_failed: ['rate<0.01'],                  // Request failure < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Cenários de teste
const scenarios = [
  { name: 'health', path: '/health', method: 'GET', weight: 10 },
  { name: 'api_list', path: '/api/items', method: 'GET', weight: 30 },
  { name: 'api_get', path: '/api/items/1', method: 'GET', weight: 25 },
  { name: 'api_search', path: '/api/items?q=test', method: 'GET', weight: 20 },
  { name: 'api_create', path: '/api/items', method: 'POST', weight: 10, body: { name: 'test' } },
  { name: 'api_update', path: '/api/items/1', method: 'PUT', weight: 5, body: { name: 'updated' } },
];

// Seleciona cenário baseado em peso
function selectScenario() {
  const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const scenario of scenarios) {
    random -= scenario.weight;
    if (random <= 0) return scenario;
  }
  return scenarios[0];
}

export default function () {
  const scenario = selectScenario();
  const url = `${BASE_URL}${scenario.path}`;
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': `k6-${__VU}-${__ITER}`,
    },
    tags: { scenario: scenario.name },
  };

  let response;
  const start = Date.now();

  switch (scenario.method) {
    case 'POST':
      response = http.post(url, JSON.stringify(scenario.body), params);
      break;
    case 'PUT':
      response = http.put(url, JSON.stringify(scenario.body), params);
      break;
    default:
      response = http.get(url, params);
  }

  const latency = Date.now() - start;
  apiLatency.add(latency, { scenario: scenario.name });

  // Verificações
  const success = check(response, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response has body': (r) => r.body && r.body.length > 0,
  });

  errorRate.add(!success);

  // Think time
  sleep(Math.random() * 2 + 1);
}

// Relatório final
export function handleSummary(data) {
  console.log('\n=== LOAD TEST SUMMARY ===\n');
  
  const metrics = data.metrics;
  
  console.log(`Total Requests: ${metrics.http_reqs.values.count}`);
  console.log(`Failed Requests: ${metrics.http_req_failed.values.passes}`);
  console.log(`Error Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%`);
  console.log(`\nLatency:`);
  console.log(`  P50: ${metrics.http_req_duration.values.med.toFixed(2)}ms`);
  console.log(`  P95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  P99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
