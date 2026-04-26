# Alert: CircuitBreakerOpen (severity: high)

## Что означает
Circuit breaker для какого-то upstream провайдера открыт >5 мин — gateway не пропускает запросы.

## Немедленные действия
- [ ] Посмотреть `aiag_circuit_breaker_state{provider=...}` за последний час — когда открылся.
- [ ] Проверить upstream status (см. upstream-failure-rate.md).
- [ ] Если upstream восстановился — дать breaker'у перейти в half-open (таймер в gateway config).

## Manual override
Если нужно force-close breaker (провайдер ОК, но breaker завис):
```bash
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://127.0.0.1:3001/internal/circuit-breaker/<provider>/close
```

## Escalation
>30 мин open — уведомить пользователей через /status с оценкой времени восстановления.
