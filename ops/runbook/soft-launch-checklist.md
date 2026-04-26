# Soft-launch checklist (T-7 → T-0)

## HARD GATES (C2)

- [ ] `RKN_OPERATOR_NUMBER` задан в `/srv/aiag/shared/.env` AND оператор виден в pd.rkn.gov.ru registry.
- [ ] Boot-time check активен: `scripts/preflight-check.ts` запускается при старте gateway и падает если `NODE_ENV=production` + нет `RKN_OPERATOR_NUMBER`.
- [ ] DPO приказ подписан + сохранён в `ops/legal/dpo-appointment-order-signed.pdf` (git-ignored).
- [ ] `dpo@ai-aggregator.ru` форвардится на owner inbox (тест-email bounces=0).

## T-7 (за неделю)

- [ ] Все 20 upstream моделей отвечают корректно (staging smoke).
- [ ] Topup flow: тест 100 ₽ через T-Bank + ЮKassa — оба успешны.
- [ ] Consent flows end-to-end (3 документа подписываются + видны в `/account/settings#consents`).
- [ ] Все 9 alerts триггерятся вручную → Telegram @aiag_alerts получает.
- [ ] Email templates deliver (Gmail, Yandex, Mail.ru — score >8/10 на mail-tester.com).
- [ ] Cookie banner работает + DNT respected (H2 verified).
- [ ] Transborder gate блокирует foreign model без consent (H6 verified, 403 returned, prompt в upstream НЕ ушёл — проверено через Loki).
- [ ] Prompt retention sweep worker запущен — `journalctl -u aiag-worker | grep prompt-retention-sweep`.
- [ ] `/status` page отвечает 200 + показывает live health.
- [ ] `/report` + `/account/request-human-review` формы рабочие.

## T-1 (за день)

- [ ] Code freeze после 18:00 MSK (только P0 hotfix).
- [ ] RED-team mini-audit: попытка unauth access в admin, попытка прочитать чужие requests — все 404/403.
- [ ] Backup verification сегодня-утро: зелёный.
- [ ] Status page — all green.
- [ ] Press kit готов, все drafts финальны.

## T-0

- [ ] Invite 50 beta-user через invite codes + 500 bonus credits each.
- [ ] Monitor Grafana open continuously.
- [ ] Slack/Telegram на связи 24h первые.
- [ ] Feedback form `/beta-feedback` опубликована.

## T+7 GO/NO-GO для public launch

- [ ] ≥30/50 beta users сделали ≥1 API request.
- [ ] Error rate <1%.
- [ ] Ноль P0 unresolved.
- [ ] Юрист confidence в 152-ФЗ compliance.
- [ ] Owner confidence в monitoring + on-call.

Если все YES → Task 20 (public launch). Иначе — slip +1 week.
