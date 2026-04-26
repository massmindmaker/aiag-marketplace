# On-Call Rotation — AI-Aggregator

## Первые 30 дней после публичного запуска

**Primary:** Owner (24/7 availability для P0/P1).

**Backup:** TBD — назначается до публичного запуска (contractor / friend-admin), оформляется через Telegram thread.

## Уведомления

- Telegram canal `@aiag_alerts` — все alerts от Prometheus/Alertmanager.
- Phone notifications — Telegram push включён + silence-bypass для критических алертов.
- Email `support@ai-aggregator.ru` — fallback.

## SLA (от момента прихода alert до human acknowledge)

- P0 / critical — 15 минут 24/7.
- P1 / high — 30 минут в рабочее время (08:00-22:00 MSK), 2h ночью.
- P2 / medium — 4 часа в рабочее время.
- P3 / low — next business day.

## Hand-off протокол

Primary недоступен (отпуск, болезнь):
1. Создаётся thread в Telegram `@aiag_internal_ops` с датами отсутствия + контакт backup.
2. Обновляется `ops/runbook/on-call-rotation.md` — primary меняется на backup.
3. Alertmanager rerouting (при необходимости) — менять `TELEGRAM_ALERT_CHAT_ID`.
4. По возвращении: retro через Telegram.

## Runbooks

Все alerts имеют runbook в `ops/runbook/alert-responses/<alert>.md`. Ссылка прокидывается через annotation `runbook` в alert-rule.

## Drill

Раз в месяц — artificial alert → проверка chain (Prometheus → Alertmanager → Telegram → phone ack).
