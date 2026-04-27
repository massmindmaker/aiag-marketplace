# AIAG Payments — Setup & Operations

This document covers configuration, environment variables, webhook setup, and
operational procedures for the AIAG payment integration (Tinkoff Acquiring +
YooKassa REST API + СБП via YooKassa).

## 1. Architecture overview

```
+-------------+      +-------------------------+       +----------------+
| pricing.tsx |  →   | /api/subscriptions/     |  →    |  Provider      |
| billing.tsx |      |   create | cancel       |       |  (Tinkoff |    |
|             |      | /api/payments/topup     |       |   YooKassa |   |
+-------------+      +-------------------------+       |   YooKassa-SBP)|
                                                       +-------+--------+
                                                               |
                                                       (Idempotence-Key
                                                        | Tinkoff token)
                                                               v
+-------------------------+   webhook   +-------------------------+
| /api/subscriptions/     |  ←--------- |  Provider event source  |
|   webhook/[provider]    |             +-------------------------+
+-------------------------+
            |
            v
   verify signature / IP
            |
            v
  settle → aiag_settle_charge
  (subscription_credits → payg_credits)
```

The **provider abstraction** lives at
`apps/web/src/lib/payments/providers.ts`. New providers add a class implementing
`PaymentProvider` and register in `getPaymentProvider`.

## 2. Environment variables

Add to `apps/web/.env.production` (and `.env.local` for dev):

| Variable | Required | Description |
|---|---|---|
| `TINKOFF_TERMINAL_KEY` | Yes (for Tinkoff) | Терминал из ЛК Тинькофф |
| `TINKOFF_PASSWORD` | Yes (for Tinkoff) | Пароль терминала |
| `TINKOFF_API_URL` | No | Override (default `https://securepay.tinkoff.ru/v2`) |
| `YOOKASSA_SHOP_ID` | Yes (for YooKassa+СБП) | shopId из ЛК ЮKassa |
| `YOOKASSA_SECRET_KEY` | Yes (for YooKassa+СБП) | Секретный ключ |
| `YOOKASSA_ENFORCE_IP` | No (`true`/`false`) | Гасить webhook'и не из IP-whitelist |
| `NEXT_PUBLIC_BASE_URL` | Yes | Public origin (e.g. `https://ai-aggregator.ru`) |

Без переменных провайдеры остаются **enabled=false** в `ALL_PROVIDERS`,
кнопки в UI возвращают `INIT_FAILED`. Tests используют моки.

## 3. Webhook setup

### Tinkoff Acquiring
1. ЛК Тинькофф → Терминал → Настройки → URL уведомлений:
   `https://ai-aggregator.ru/api/subscriptions/webhook/tinkoff`
2. Метод: `POST`. Отвечаем плейн-текст `OK` (200) при успехе.
3. Подпись: SHA-256 от отсортированных значений + Password.

### YooKassa
1. ЛК ЮKassa → Интеграция → HTTP-уведомления:
   `https://ai-aggregator.ru/api/subscriptions/webhook/yookassa`
2. События: `payment.succeeded`, `payment.canceled`, `refund.succeeded`.
3. YooKassa **не** подписывает webhook'и HMAC-ом. Защита:
   - IP-whitelist (см. `YOOKASSA_WEBHOOK_IPS_V4` в `@aiag/yookassa/utils`),
     включается через `YOOKASSA_ENFORCE_IP=true`.
   - Re-fetch payment по id через API (делается автоматически в `verifyAndFetch`).

### СБП
СБП использует тот же вебхук YooKassa. Платежи СБП приходят как
`payment_method.type === 'sbp'`.

## 4. Provider matrix

| Метод | Провайдер | Поддержка | Комиссия (~) |
|---|---|---|---|
| Карты RU/MIR | Tinkoff Acquiring | да | 2.5–3.5% |
| Карты RU/MIR | YooKassa | да | 3.5% |
| СБП | YooKassa | да | 0.4–0.7% |
| Tinkoff Pay | Tinkoff Acquiring | да | 2.5% |

## 5. Refund flow (per Knowledge/08)

* Подписка возвращается полностью первые 14 дней.
* Со дня 15 — `cancelAtPeriodEnd=true`, без возврата.
* Pay-per-use top-up — возврат любой суммы по запросу пользователя.
* Ручной admin refund — UI: `/admin/payments` → колонка «Возврат» (вызывает
  `POST /api/admin/payments/refund`).

## 6. API routes

| Route | Method | Назначение |
|---|---|---|
| `/api/subscriptions/create` | POST | Создать pending sub + init payment |
| `/api/subscriptions/cancel` | POST | Отмена / возврат |
| `/api/subscriptions/webhook/[provider]` | POST | Унифицированный webhook |
| `/api/payments/topup` | POST | Pay-per-use пополнение |
| `/api/admin/payments/refund` | POST | Ручной возврат (admin) |

## 7. Settlement

При API-запросе gateway вызывает `aiag_settle_charge(org_id, request_id, total_rub)` —
PG stored function (`packages/database/src/functions/settle-charge.sql`) с
атомарной двух-bucket settlement: сначала `subscription_credits`, остаток с
`payg_credits`. Идемпотентность — через partial unique index по
`(request_id, source) WHERE type='api_usage'`.

Wrapper: `packages/api-gateway/src/billing/settle.ts`.

## 8. Тесты

```
npm test                            # все unit-тесты
npm test -- packages/yookassa       # YooKassa adapter
npm test -- packages/tinkoff        # Tinkoff adapter
npm test -- apps/web/src/lib/payments  # provider abstraction
```

Минимум: 30 новых тестов (fulfilled). Покрытие: amount conversion, idempotence
key, basic auth, webhook shape validation, IP CIDR check, signature verification
(Tinkoff HMAC), provider routing, tier resolution.

## 9. Известные TODO

* Миграция `organizations.subscription_credits/payg_credits/expires_at` —
  подтянуть Plan 04 schema в payments worktree (сейчас работает форвард-совместимо).
* Полный INSERT в `payment_webhook_logs` + `payments` + `subscriptions` UPDATE —
  ждёт схемы Plan 04 и Plan 01 в master.
* Provider matrix admin UI (вкл/выкл методов, fees) — отложено.
