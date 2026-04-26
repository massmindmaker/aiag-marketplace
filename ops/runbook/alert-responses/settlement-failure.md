# Alert: SettlementFailureRate (severity: CRITICAL)

## Что означает
>0.1% запросов завершились без корректного списания с баланса. **Деньги в лимбе** — серьёзный бизнес-риск.

## Immediate (P0)
- [ ] WAKE UP OWNER. Это critical.
- [ ] Grafana → Billing Metrics → settlement_failures_total.
- [ ] Остановить новые платные запросы: kill-switch всех dynamic моделей через admin UI.
- [ ] Query: `{job="pm2",app="gateway"} |= "settlement_failed"` + correlate с `requests` table.

## Investigation
```sql
SELECT request_id, user_id, amount, error FROM settlement_failures
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

## Resolution
1. **DB lock contention** — restart gateway, check pg_stat_activity.
2. **Schema drift** — balance-table out of sync; rebalance script (см. `ops/scripts/rebalance.ts`).
3. **Code bug** — rollback на prev release (pm2 reload with prev symlink).

## Post-mortem требование
Обязательный post-mortem в 48h (`docs/security/incidents/<date>-postmortem.md`).
