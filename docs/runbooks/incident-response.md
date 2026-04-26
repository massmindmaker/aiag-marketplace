# Incident Response — Master Runbook

Общий протокол реагирования на инциденты AI-Aggregator. Привязан к
конкретным runbooks в `ops/runbook/` и `ops/runbook/alert-responses/`.

## Severity Matrix

| Уровень | Определение | Response Time | Эскалация |
|---------|-------------|---------------|-----------|
| **P0 (Critical)** | Сервис лежит / данные утекают / платежи не идут | 15 мин | Owner + DPO + юрист (если ПДн) сразу |
| **P1 (High)** | Деградация UX / часть функций недоступна | 1 час | Owner |
| **P2 (Medium)** | Инцидент локализован, есть workaround | 4 часа | On-call |
| **P3 (Low)** | Косметические дефекты | 24 часа | Тикет в backlog |

## Common Runbook (применимо ко всем P0/P1)

### First 5 minutes — Detect & Acknowledge

1. Уведомление пришло (Telegram alert / клиент / ручное обнаружение).
2. Открыть `/status` (https://ai-aggregator.ru/status) — есть ли уже incident?
3. Если нет — создать в `/admin/incidents` со статусом `investigating`.
4. Acknowledge alert в Alertmanager (предотвращает re-fire спама).
5. Зайти в Grafana (https://grafana.ai-aggregator.ru) → дашборд `Overview`.

### First 30 minutes — Triage & Isolate

| Симптом | Первый шаг | Runbook |
|---------|------------|---------|
| 5xx rate spike | Identify failing endpoint в Loki | `ops/runbook/alert-responses/5xx-rate.md` |
| TTFT p95 deg | Check upstream provider status | `ops/runbook/alert-responses/ttft-p95.md` |
| Upstream failures | Activate circuit breaker | `ops/runbook/alert-responses/upstream-failure-rate.md` |
| Disk usage > 85% | Очистить старые releases / Loki chunks | `ops/runbook/alert-responses/disk-usage.md` |
| Settlement failure | Stop payouts, audit transactions | `ops/runbook/alert-responses/settlement-failure.md` |
| PII detection spike | Включить kill-switch на upstream | `ops/runbook/alert-responses/pii-detection-spike.md` |
| Data breach detected | **152-ФЗ протокол 24h/72h** | `ops/runbook/data-breach-response.md` |
| Cert expiry < 7d | `certbot renew --force-renewal` | См. ниже |
| DDoS | Cloudflare WAF rate-limit + nginx 503 | См. ниже |
| DB corruption | Restore из pgbackrest | См. ниже |

### Communications

- **P0/P1:** обновлять `/status` каждые 15 минут (`investigating → identified → monitoring → resolved`).
- **P0 с ПДн:** уведомить РКН (24h для HIGH, 72h для MEDIUM) — `ops/runbook/data-breach-response.md`.
- **P1+ длиннее 1ч:** уведомить subscribers через email (status_subscribers table).
- **Telegram канал** `@aiag_ru`: только confirmed user-facing incidents.

### Post-Incident (within 5 days)

1. Postmortem — `docs/security/incidents/<date>-postmortem.md` (template:
   `docs/runbooks/post-mortem-template.md`).
2. Root cause + blast radius + timeline + action items.
3. Add detection rule если не обнаружили автоматически.
4. Update runbook если процесс был неоптимальным.
5. 30-day follow-up: все action items closed?

---

## Specific Scenarios

### A. Data Breach (152-ФЗ)

См. `ops/runbook/data-breach-response.md`. **Ключевое:**
- HIGH severity (>1000 записей или special categories) → РКН **24 часа**.
- MEDIUM (10-1000 обычных) → РКН **72 часа** + субъекты 72 часа.
- Формы РКН: pd.rkn.gov.ru → «Уведомления об инцидентах».
- Шаблон уведомления — `docs/legal/rkn-notification.md` (черновик), 
  для breach — отдельная форма «Об инциденте».

### B. DDoS Attack

**Detection:** node-exporter `node_network_receive_bytes_total` rate spike + 5xx + Cloudflare alert.

**Mitigation (ordered):**
1. Cloudflare → Security → set "Under Attack" mode.
2. Cloudflare → WAF → add rate-limit rule (10 req/min per IP).
3. nginx: уменьшить `client_max_body_size` до 64K, добавить `limit_req_zone`.
4. Если упорство атаки — `geo $allow { default 0; <prefix-РФ> 1; }` + `if ($allow = 0) { return 503; }`.
5. Открыть incident на /status, severity P1.
6. Связаться с Timeweb support — они могут добавить anti-DDoS на L4.

### C. Cert Expiry (< 7 days)

Alert уже сработал. Действия:
1. SSH на VPS: `certbot certificates` — проверить expiry.
2. `certbot renew` — стандартный путь.
3. Если упало (rate-limit / DNS): `certbot renew --force-renewal --debug`.
4. Перезапустить nginx: `nginx -t && systemctl reload nginx`.
5. Проверить через `curl -vI https://ai-aggregator.ru` (Server cert exp).
6. Если совсем плохо — временный self-signed + статус "degraded".

**Профилактика:** alert на 30d (warning) + 7d (critical), см. alert-rules.yml.

### D. DB Corruption

**Detection:** `pg_isready` fails / planned check fails / 5xx spike в Loki.

**Action:**
1. Stop application traffic: `pm2 stop all` ИЛИ nginx returns 503.
2. `sudo -u postgres pg_dumpall | gzip > /tmp/dump-corrupt-$(date +%s).sql.gz` (forensic snapshot).
3. Identify corrupt table: `pg_amcheck --heapallindexed -d aiag_prod`.
4. Restore из pgbackrest: `pgbackrest --stanza=aiag --type=time --target='<timestamp>' restore`.
5. Replay WAL до точки до corruption.
6. `pg_isready && psql -c 'SELECT count(*) FROM users;'` — sanity.
7. Restart pm2; первые 5 минут под наблюдением (Loki query 5xx).
8. Postmortem обязателен; если потеря данных → notify пользователей.

### E. Payment Provider Outage (T-Bank / ЮKassa)

**Detection:** `payment_failures_total{provider=...}` rate spike или клиенты пишут.

**Action:**
1. /status → создать incident, провайдер = маркер.
2. Включить feature-flag `DISABLE_PROVIDER_<X>=1` → web показывает только альтернативу.
3. На странице топапа — баннер «<провайдер> временно недоступен, используйте <альтернативу>».
4. Мониторить статус-страницу провайдера.
5. Когда восстановится — снять feature-flag, обновить /status.

### F. Upstream Model Provider Outage

**Detection:** `upstream_failure_rate{provider=...}` > 50% за 5 мин.

**Action:**
1. Circuit breaker должен сработать автоматически (`packages/api-gateway/src/upstreams/circuitBreaker.ts`).
2. Verify в Grafana → "Upstream Health" дашборд.
3. Failover на альтернативную модель того же класса (если включён router).
4. Для пользователей — баннер на карточке модели «недоступна».
5. Если провайдер мёртв >1ч — temporary kill_switch + email-broadcast.

### G. Certbot rate-limit during outage

Let's Encrypt лимит = 5 fails/hour per account. Если упёрлись:
- Временно: zerossl.com или Buypass (бесплатные альтернативы).
- nginx: можно отключить SSL для конкретного host если совсем критично 
  (НО: cookie-based auth сломается, sameSite=none requires https).

---

## Escalation Tree

```
P0 detected
   ↓
On-call engineer (acknowledge < 15 min)
   ↓ если не справляется за 30 мин
Owner (massmindmaker@gmail.com)
   ↓ если ПДн / payment / breach
DPO + юрист
   ↓ если public-facing impact
Comms lead → /status update + Telegram
```

## Contacts

| Роль | Контакт | Канал |
|------|---------|-------|
| Owner | massmindmaker@gmail.com | tg @b0brov |
| DPO | dpo@ai-aggregator.ru | email + tg |
| Юрист | (из договора аутсорс) | telegram/email |
| Timeweb support | https://timeweb.cloud/my/support | тикет |
| T-Bank API support | https://www.tbank.ru/kassa/dev/payments/ | email |
| ЮKassa support | https://yookassa.ru/developers | merchant cabinet |

## Drill Schedule

- **Q1 (раз в квартал):** tabletop drill с одним из сценариев A-G.
- **Pre-launch:** обязательный drill сценария A (Breach).
- Документировать в `docs/security/breach-drills/`.
