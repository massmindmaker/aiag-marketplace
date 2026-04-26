# Alert: UpstreamFailureRate (severity: high)

## Что означает
Один upstream AI-провайдер возвращает ≥5% 5xx за последние 5 минут.

## Немедленные действия
- [ ] Открыть Grafana → Upstream Health dashboard, посмотреть per-provider success rate.
- [ ] Проверить status page провайдера:
  - OpenAI → https://status.openai.com
  - Anthropic → https://status.anthropic.com
  - Yandex → console Yandex Cloud
- [ ] Grep логи: `{job="pm2",app="gateway"} |= "upstream_error" |= "<provider>"`

## Investigation
```promql
sum by (status) (rate(aiag_requests_total{provider="<p>"}[5m]))
sum by (error_type) (rate(aiag_requests_total{provider="<p>", status=~"5.."}[5m]))
```

## Resolution paths
1. **Провайдер лёг** — circuit breaker авто-trip, ждём восстановления; публикуем на /status.
2. **Credentials expired** — rotate BYOK/direct key в admin UI; pm2 reload gateway.
3. **Rate-limited upstream'ом** — поднять concurrency-limit в config, либо резать own-RPM.

## Эскалация
>15 мин error rate без circuit breaker trip → будить primary on-call.
