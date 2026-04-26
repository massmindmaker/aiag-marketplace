# Support Playbook — AI-Aggregator

## Каналы и SLA

| Канал | Цель | SLA (ack / resolve) |
|-------|------|--------------------|
| `support@ai-aggregator.ru` | Общий inbox | paid 2h / 8h, free 24h / 72h |
| Telegram `@aiag_support_bot` | Быстрые вопросы | ≤2h в рабочее время, 8-20 MSK |
| `/report` page | Жалобы на контент | 24h paid, 72h free |
| `dpo@ai-aggregator.ru` | Запросы субъектов ПДн (152-ФЗ) | 30 дней max |
| `abuse@ai-aggregator.ru` | CSAM / критично | 4h (24/7) |

## Priority matrix

- **P0** — service down / data loss / auth broken → ack ≤15 мин, resolve ≤2h, wake owner.
- **P1** — paying user заблокирован, payment failure → ack ≤2h, resolve ≤8h.
- **P2** — paying user minor issue → ack ≤24h, resolve ≤72h.
- **P3** — free user, docs question → ack ≤24h, best-effort.

## Типовые вопросы

### «Как пополнить баланс?»
→ `/account/billing/topup` → выбрать сумму → Т-Banк или ЮKassa. Чек приходит в email от оператора фискальных данных в течение 24h.

### «Почему 402 Insufficient Balance?»
→ Проверить `/account/billing` — сколько bonus + paid credits. Если topup есть в T-Bank кабинете, но не зачислен: webhook lost; прислать payment_id, admin replay.

### «Как отозвать согласие на трансграничную передачу?»
→ `/account/settings#consents` → `Revoke transborder`. После этого foreign-моделей не будет в маркетплейсе; останутся только Yandex/Сбер.

### «Как экспортировать мои данные (152-ФЗ)?»
→ `POST /api/account/export` или кнопка на `/account/settings#privacy`. В течение ~1 минуты приходит email со signed S3 URL (ссылка живёт 24h).

### «Как удалить аккаунт?»
→ `/account/settings#delete` → подтверждение → 10 рабочих дней "soft delete" period (отмена), потом hard delete.

### «Моя модель выдаёт 503»
→ Проверить `/status`. Если модель в kill-switch — будет явное сообщение. Если просто провайдер лежит — circuit breaker auto-tripped.

### Refund policy
→ Неизрасходованные кредиты — в течение 14 раб.дней по запросу в support@. Израсходованные — только при доказанном сбое платформы.

## Escalation chain

support-agent → dev (owner через TG DM) → юрист (если запрос субъекта ПДн / жалоба в РКН)

## Canned responses

В `docs/support/canned/` — готовые шаблоны на русском. Формат: `<topic>.md`, one-per-file.
