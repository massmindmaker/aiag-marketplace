# Alert: BalanceExhaustionRate (severity: medium)

## Что означает
>10% запросов за час завершились 402 Insufficient Balance. Возможны причины:
- проблема с topup-флоу (пополнение не зачисляется)
- massscale bonus-abuse (abuseрам не хватает кредитов и они давят API)
- неправильный тариф (цена выше чем bonus/credit pool)

## Immediate
- [ ] Посмотреть `/admin/billing/recent-topups` — есть ли pending/failed платежи?
- [ ] Query Loki: `{job="pm2",app="gateway"} |= "balance_exhaustion"` за 1h.
- [ ] Проверить correlation: одни и те же user_id повторно триггерят 402?

## Resolution
1. **Topup-сбой** — чек T-Bank / ЮKassa webhook delivery; replay stuck events.
2. **Abuse** — найти pattern в `fraud_flags`, temp-block abusers.
3. **Цена скакнула** — rollback ценовой конфиг.
