# Contest lifecycle runbook

B2B sponsor inbound → brief negotiation → dataset curation → private test-set split →
legal contract → prize pool escrow → launch announcement → submission review →
eval run → leaderboard freeze → winner announcement → payout processing → post-mortem.

## Stages

1. **Inbound** — email от заказчика, заполняется form `/contests/request` или лично.
2. **Brief** — call, zero-draft brief в `docs/launch/contest-<N>-brief.md`.
3. **Dataset** — 70/15/15 split (train/valid/**private test**); private test закрыт на S3 admin-only.
4. **Legal** — контракт по `/contest-host-agreement` + 15% org. fee.
5. **Escrow** — призовой фонд на отдельный счёт, double-sign-off на payout.
6. **Announcement** — Telegram, ODS, blog. Обычно T-14 дней до дедлайна.
7. **Submission review** — auto-scoring + admin модерация borderline cases.
8. **Eval run** — приватный test-set выполняется в изолированной sandbox'е.
9. **Freeze** — leaderboard зафиксирован.
10. **Winner announcement** — blog + TG + email победителям.
11. **Payout** — через 10 рабочих дней (НДФЛ handled самозанятыми/ИП самими).
12. **Post-mortem** — `docs/contests/<N>-postmortem.md`.
