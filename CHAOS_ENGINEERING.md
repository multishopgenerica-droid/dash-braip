# 🌪️ Chaos Engineering Guide

> Multi-Agent System v7.0 - Enterprise Complete Edition

## O que é Chaos Engineering?

Prática de testar resiliência do sistema injetando falhas controladas.

```
"A questão não é SE vai falhar, mas QUANDO vai falhar.
 Melhor descobrir isso num teste controlado do que em produção."
```

## Experimentos Disponíveis

### 1. Kill Random Container
```bash
./scripts/chaos/kill-random-container.sh
```
**Verifica:** Orquestrador recria container, health checks funcionam, alertas disparam

### 2. Network Latency
```bash
./scripts/chaos/network-latency.sh app 500 60
# Injeta 500ms de latência no container 'app' por 60 segundos
```
**Verifica:** Timeouts configurados corretamente, circuit breakers ativam

### 3. CPU Stress
```bash
docker exec app stress --cpu 4 --timeout 60s
```
**Verifica:** Autoscaling funciona, serviço continua respondendo

### 4. Memory Pressure
```bash
docker exec app stress --vm 2 --vm-bytes 512M --timeout 60s
```
**Verifica:** OOM killer não mata processo crítico, métricas alertam

### 5. Disk Full
```bash
docker exec app dd if=/dev/zero of=/tmp/fill bs=1M count=1000
```
**Verifica:** Logs não param de escrever, alertas de disco

## Princípios

1. **Ambiente controlado:** NUNCA em produção sem preparo
2. **Hipótese clara:** "Se X acontecer, Y deve ocorrer"
3. **Minimizar blast radius:** Começar pequeno
4. **Monitoramento ativo:** Observar métricas durante teste
5. **Botão de pânico:** Sempre poder reverter

## Checklist Pré-Chaos

- [ ] Ambiente é staging/dev?
- [ ] Monitoring está funcionando?
- [ ] Time sabe do teste?
- [ ] Tem plano de rollback?
- [ ] Blast radius é limitado?
