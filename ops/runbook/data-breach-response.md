# Data Breach Response — 152-ФЗ ч.3.1 ст.21 (H1)

## Классификация

| Severity | Условие | Действие |
|----------|---------|---------|
| LOW | <10 записей, обычные ПДн, authenticated access | Internal log only, РКН не уведомляется |
| MEDIUM | 10-1000 записей, обычные ПДн (ФИО, email, IP) | РКН 72h, субъектам 72h |
| HIGH | >1000 записей ИЛИ спец.категории ИЛИ payment data | **РКН 24h**, субъектам 72h, public incident report |
| CRITICAL | Активная эксплуатация / leaked secrets / ongoing exfiltration | HIGH + ротация secrets + kill-switch моделей |

## Immediate response (first 1 hour)

- [ ] **Identify scope** — `SELECT count(*) FROM <table> WHERE ...` + Loki query за период.
- [ ] **Isolate** — revoke compromised keys; `pm2 stop <affected-app>` ИЛИ nginx `return 503`.
- [ ] **Preserve evidence** — pg_dump snapshot в encrypted tarball; audit_log freeze export.
- [ ] **Assemble team** — owner + DPO + юрист (для HIGH/CRITICAL).
- [ ] **Create incident в /admin/incidents** — status=investigating, public UI visible, деталей пока мало.

## РКН notification (24h для HIGH+)

Форма: pd.rkn.gov.ru → «Уведомления об инцидентах».

Содержание:
- Дата, время обнаружения
- Описание (3-5 предложений, без технического жаргона)
- Предположительные причины
- Категории и число затронутых субъектов
- Принятые меры по локализации
- Контакт DPO

Template — `ops/legal/templates/rkn-breach-notification.md` (TODO: создать по получению финальных legal-шаблонов).

После подачи — ID уведомления в `audit_log` + `docs/legal/breach-incidents/<date>-<id>.md`.

## Subject notification (72h для MEDIUM+)

Email-рассылка затронутым user_ids через Unisender Go. Template — `packages/email/src/templates/breach-notification.tsx` (TODO: добавить в Task 10 email-шаблоны).

Тема: «Уведомление об инциденте безопасности данных».

Структура:
- Что случилось (без спекуляций)
- Какие данные затронуты
- Что мы делаем
- Что нужно сделать вам (сменить пароль, проверить сессии)
- РКН-уведомление: подано DATE, ID #...
- Вопросы: dpo@

## Technical remediation

- Postmortem — `docs/security/incidents/<date>-postmortem.md`:
  - Root cause + blast radius + fix timeline
  - Action items (assigned, dated)
  - Review через 30 дней: все AI closed?

## Public incident report (optional, HIGH+)

Transparent blog post в 7 дней, если утечка публично известна.

## Drill

Раз в 6 месяцев — tabletop drill с симулированной утечкой (fake data). Document в `docs/security/breach-drills/`. Pre-launch — один обязательный drill.
