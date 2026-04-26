# Alert: TtftP95High (severity: medium)

## Что означает
Time-to-first-token p95 >5 секунд за 5 минут. UX-деградация — пользователь видит "зависание".

## Immediate
- [ ] Grafana → Upstream Health → per-provider p95 TTFT.
- [ ] Identify провайдера: `histogram_quantile(0.95, sum by (provider, le) (rate(aiag_ttft_seconds_bucket[5m])))`.
- [ ] Check сеть: ping провайдера из VPS; `mtr openai.com`.

## Resolution
1. Если один провайдер — alert UpstreamFailureRate скоро сработает; Red indicator на /status.
2. Если все провайдеры — локальная проблема: CPU/memory нагрузка, network congestion; проверить `node_exporter` метрики.
3. Временно: поднять RPM-лимит для cached-responses, если кеш живой.
