# Business Logic

**Source:** `C:\Users\боб\brain\Projects\AIAG\Knowledge\08-business-logic.md`
**Updated:** 2026-04-18

## Actors

| Actor | Who | Goal |
|---|---|---|
| Developer | Разработчик / CTO SaaS | Встроить AI-модель в продукт через API |
| ML Engineer | Автор модели | Заработать на API-подписках через конкурсы |
| Business | Корп-заказчик | Получить кастомную модель через конкурс |
| Admin | Мы | Модерация, расчёты, поддержка |
| Platform | AIAG system | Роутинг, метеринг, settlement |

## Supply sources

```
AIAG CATALOG
├── External via OpenRouter (closed): GPT-5, Claude 4.6, Gemini 3
├── External via Replicate/Fal/HF (open): SD 3.5, Flux 1.1, Whisper, Nano Banana, Suno v4
└── Internal Self-hosted GPU (contest winners): custom SD LoRA, custom Whisper, custom classifier
```

## Pricing model

### Units
- **1 credit = 1 ₽**
- Все цены — в credits (показываем и ₽)
- Клиент платит ₽ через T-Bank / ЮKassa / СБП → пишем в `balance_credits`

### Cost formula

```
request_cost = upstream_cost_USD
             × USD_to_RUB
             × markup
             × batch_discount       // 0.5 if /v1/batches, else 1.0
             × caching_discount     // 0.5 на cached_input_tokens

(caching применяется покомпонентно — D#11)

USD_to_RUB fixed daily 09:00 UTC by CBR + 2% spread.
Markup buffer 5% inside для intra-day volatility.
```

**Markup tiers:**
- Proprietary LLM via OpenRouter: 1.05–1.10×
- Open-source LLM via Together: 1.10–1.20×
- Fastest mode via Groq: 1.15×
- Media via Fal.ai: 1.15–1.20×
- Media via Kie.ai: 1.15–1.25×
- Community models (internal GPU): revshare
- RU-models (Yandex, GigaChat): 1.05–1.10×
- BYOK: fixed 0.5 credits/req

Batch и caching скидки **passthrough клиенту** (не берём маржу).

### Tiered revshare (D#7)

| Сценарий | Автору | Нам | Триггер |
|---|---|---|---|
| Baseline (мы хостим) | 70% | 30% | default |
| Volume (≥100k ₽/mo автор) | 75% | 25% | 3 мес подряд |
| Self-hosted (автор хостит) | 80% | 20% | opt-in в контракте |
| Exclusive self-hosted (12 мес only-us) | 85% | 15% | exclusive clause |

Monthly settlement (1-го числа):
```
For each internal_model:
  total_revenue = SUM(request_cost) for the month
  author_share = total_revenue × resolve_revshare_tier(author_id, model_id)
  platform_share = total_revenue - author_share
  author_earnings[author_id] += author_share

When author requests payout AND author_earnings >= 1000 ₽:
  payout = earnings - withholding_tax(13% if физлицо)
  bank transfer → zero out
```

### Atomic settlement

```sql
BEGIN;
  UPDATE organizations SET balance_credits = balance_credits - :cost
  WHERE id = :org_id AND balance_credits >= :cost
  RETURNING balance_credits;
  -- if no rows → 402

  INSERT INTO transactions (org_id, delta, type, request_id, ...)
  VALUES (:org_id, -:cost, 'api_usage', :request_id, ...);

  INSERT INTO requests (id, org_id, model_id, cost_credits, ...)
  VALUES (:request_id, :org_id, :model_id, :cost, ...);
COMMIT;
```

## Key invariants (нельзя нарушать)

1. **balance_credits ≥ 0 всегда** (UPDATE WHERE balance ≥ cost + RETURNING)
2. **request.cost_credits фиксируется в момент списания** (курс может меняться)
3. **request.response фиксируется** только при `status = completed`
4. **author_earnings пересчитываются раз в день** (batch job)
5. **submission.private_score скрыт от автора** до завершения конкурса
6. **model.source не меняется** после approve (нельзя превратить proxy → internal)
7. **payment_webhook идемпотентны** (transaction_id unique)
8. **API key revoked = мгновенно** (Redis cache invalidation < 1 сек)

## Rate limits

| Plan | RPM (sync) | Concurrent | Daily cap | Batch API rate |
|---|---|---|---|---|
| Free | 10 | 2 | 500 req | 100 items/day |
| Basic | 60 | 5 | ∞ | 5 000 items/day |
| Starter | 120 | 10 | ∞ | 20 000 items/day |
| Growth | 200 | 15 | ∞ | 50 000 items/day |
| Pro | 300 | 30 | ∞ | 100 000 items/day |
| Business | 1 000 | 100 | ∞ | 1 000 000 items/day |
| Enterprise | negotiable | negotiable | negotiable | negotiable |

Rate limit hit → 429 + `Retry-After` header.

**Daily burn rate cap:** ≤50% plan credits/day на Basic/Starter, 80% Growth/Pro, 100% Business.

## Overage mechanism (dual-bucket)

Подписочные клиенты имеют два баланса:
- `subscription_credits` — обновляются 1-го числа, rollover 50% (cap = plan × 1)
- `payg_credits` — куплены отдельно через топап, не сгорают

**Charge order:** subscription_credits → payg_credits → 402.

Modes (выбор клиента в `/dashboard/billing`):
- **Soft block** (default Free/Basic) — 402 при исчерпании
- **Auto pay-go rollover** (opt-in Starter+) — переключение на payg без перерыва
- **Auto-topup** (opt-in Pro+, привязанная карта) — async топап при payg < threshold
- **Invoice-based** (Business/Enterprise) — работа в «минус», счёт в конце месяца

## Main flows

### Flow 1: Developer подключает модель
register → verify email (+100 credits bonus) → /marketplace → выбор модели → /playground (5 free req/day per IP) → Get API Key → /dashboard/keys/new → curl request → autoalert на balance < 20% → /dashboard/billing/topup.

### Flow 2: ML Engineer участвует в конкурсе
/contests → /contests/<slug>/join → скачивает dataset → /me/submissions/new → background worker scan + eval против private test → leaderboard update → конкурс finishes → топ-3 уведомление → /me/models/new/from-contest → upload weights → admin approve → деплой → earnings → /me/earnings → payout.

### Flow 3: Business заказывает конкурс
/for-business → /contests/host → бриф (задача, метрика, dataset, призовой фонд от 100k ₽, срок 2-8 нед, эксклюзивность) → submit → admin review → договор → invoice (приз + 20% комиссия) → запуск → monitoring → финал → клиент выбирает победителя → деплой с эксклюзивом N мес → API key с free лимитом.

### Flow 4: Routing API request (gateway)
1. Auth: parse API key → load org_id + permissions
2. Rate limit: Redis token bucket → reject if exceeded
3. Resolve model: lookup → upstream + upstream_id
4. Check balance: SELECT → if < est_cost → 402
5. Check policy: org.allowed_providers
6. Upstream call: streaming response
7. Metering: extract usage on stream finish
8. Cost calc: upstream × USD_to_RUB × markup
9. Settlement (atomic UPDATE/INSERT)
10. Response flush

## State machines

**Model:** draft → submitted → under_review → approved → deployed → active ↔ paused → deprecated → archived
**Contest:** draft → under_review → approved → announced → open → evaluation → finished → model_deployment → archived (cancelled returns funds)
**Submission:** uploaded → scanning → pending_eval → evaluating → scored → final → winner / runner_up
**Payment:** initiated → pending → redirected → completed (failed / refunded)
**Payout:** accruing → locked → pending_payout → processing → paid (reversed rare)

## Security model

- API keys: SHA-256 hash with project-scope prefix
- Webhook secrets: HMAC SHA-256 (T-Bank, authors)
- RLS на users/orgs/models/requests by org_id
- Admin actions → `audit_log` (who/what/when/ip)
- Contest private test set inaccessible outside eval-runner
- Author model weights inaccessible to buyers (only inference endpoint)

## North-star metrics

- **MRR** (₽/mo from API subscriptions)
- **Active Developers** (unique orgs ≥1 req / month)
- **Active Models** (models ≥100 req / month)
- **Contest Participation** (unique participants in active contests)
- **Time-to-First-Request** (registration → first API call, target <10 min)
- **Author Earnings Paid** (proof revshare works end-to-end)
