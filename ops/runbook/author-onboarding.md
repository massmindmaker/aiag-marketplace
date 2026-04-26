# Author onboarding runbook

Помощь авторам с cog submission (Path 1) или pass-through (Path 2).

## Path 1 — Self-hosted cog-container

1. Автор читает `/docs/authors/cog-quickstart`.
2. Пишет `cog.yaml` + `predict.py`.
3. Локальная валидация: `cog build && cog predict -i input=...`.
4. Push на наш registry → submission через `/author/submit`.
5. Admin review: security scan (Trivy), performance test, billing-endpoint accuracy.
6. Publish → revshare 70% baseline.

## Path 2 — Pass-through

1. Автор указывает upstream URL + credentials (BYOK).
2. Мы billing'им через gateway без запуска ничего у нас.
3. Revshare 75% (меньше инфра-расходов).

## Revshare tiers

- до 100k ₽/mo — 70%
- 100k-500k ₽/mo — 75%
- 500k+ ₽/mo — 80%
- эксклюзив — 85%

## Первая выплата

30 дней после первого платного вызова. Минимальная сумма выплаты — 1000 ₽.
