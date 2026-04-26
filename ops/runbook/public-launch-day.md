# Public launch day (T-0)

## Pre-checks (за 1 час до анонса)

- [ ] `/status` — all green.
- [ ] All 9 alerts в quiet state.
- [ ] Grafana dashboards открыты (мониторы включены).
- [ ] Support channels manned (Telegram, email).
- [ ] Press kit ссылки работают.

## Таймлайн MSK

- **09:00** — Habr статья publish + Telegram `@aiag_ru` pin + ODS thread + blog post go live.
- **09:15** — Seed interactions: друзья регистрируются + делают ≥1 API request.
- **11:00** — DTF / vc.ru пост.
- **15:00** — Follow-up Telegram: «Already N signups».
- **20:00** — Team retro meeting + adjustments на завтра.

## Monitoring-heavy (first 72h)

- Grafana открыт постоянно, on-call 24/7.
- Любой alert acknowledged + handled в SLA.
- Support tickets: paid <1h response, free <4h (tighter than SLA чтобы показать care).
- P0 → incident на `/status` в 15 мин.

## T+72h действия

- [ ] Создать tag `v1.0.0-launch`:
```bash
git tag -a v1.0.0-launch -m "Public launch — AI-Aggregator MVP live on ai-aggregator.ru"
git push --tags
```
- [ ] Update `brain/Projects/AIAG/_dashboard.md` → status «LAUNCHED».
- [ ] First lessons-learned post (internal + external).

## T+7 post-launch retro

Blog post «Week 1 post-launch: metrics + lessons»:
- Signups, paid conversions, uptime
- Top-3 surprises
- Next 30-day roadmap
