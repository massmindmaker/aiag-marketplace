# Alert: PiiDetectionSpike (severity: medium)

## Что означает
PII detection rate за 10 мин на 3σ выше 7-дневного baseline. Возможные сценарии:
- Реальный incident: bot / злой актор засылает prompts с массивом ПДн.
- Ошибка в фильтре: false-positive, regex начал ловить нормальный текст.

## Immediate
- [ ] Grafana → PII Detection Metrics: какой `type` дал спайк (phone/email/passport/inn)?
- [ ] Loki: `{app="gateway"} |= "pii_detected"` — откуда (IP, user_id, provider)?
- [ ] Не смотреть сам prompt body (ПДн не должны логироваться).

## Resolution
1. **Abuse** — найти user_id, установить `fraud_flag` severity=high, отключить API key.
2. **False positive** — зарегистрировать issue, правка regex, hotfix deploy.

## Post-review
В weekly ops review отдельный раздел «PII-spikes».
