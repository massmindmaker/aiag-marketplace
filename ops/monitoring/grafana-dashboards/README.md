# Grafana Dashboards — Plan 08 Task 7

Дашборды в форме JSON для импорта через Grafana UI (`+` → Import → Upload JSON).

## План

1. **gateway-overview.json** — RPS, p50/p95/p99 latency, error rate, total requests.
2. **upstream-health.json** — per-provider success rate, TTFT, circuit breaker status.
3. **billing-metrics.json** — topups/hour, balance exhaustion rate, settlement latency.
4. **db-performance.json** — connections, long queries, lock contention, replication lag.
5. **worker-queue-depth.json** — per-job queue length, job latency, error rate.

## Статус

Дашборды — **Phase 2 task** (after monitoring stack deployed на VPS). Создаются
вручную через Grafana UI (drag-drop metrics), экспортируются JSON → коммитятся сюда.

Это менее error-prone, чем pre-writing JSON вручную: Grafana meta-fields (uid,
version, time ranges) легко расходятся между версиями Grafana.

## Workflow

```bash
# После deploy monitoring stack:
# 1. Зайти в Grafana (grafana.ai-aggregator.ru)
# 2. Создать dashboard через UI, добавить панели из нужных метрик
# 3. Share → Export → Save to file
# 4. git add ops/monitoring/grafana-dashboards/<name>.json
```

## Ключевые метрики (из `packages/api-gateway/src/metrics.ts`)

| Метрика | Тип | Лейблы |
|---------|-----|--------|
| `aiag_requests_total` | counter | provider, model, status |
| `aiag_request_duration_seconds` | histogram | provider, model |
| `aiag_ttft_seconds` | histogram | provider, model |
| `aiag_circuit_breaker_state` | gauge | provider |
| `aiag_balance_exhaustion_total` | counter | — |
| `aiag_settlement_failures_total` | counter | — |
| `aiag_pii_detections_total` | counter | type |
| `aiag_moderation_blocks_total` | counter | provider, reason |
| `aiag_transborder_gate_blocks_total` | counter | — |
