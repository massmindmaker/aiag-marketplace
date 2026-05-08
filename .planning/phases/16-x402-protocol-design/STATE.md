# Phase 16 — x402 Protocol Implementation (Design)

**Status:** Design complete (no code) — design refined per user 2026-05-08
**Started:** 2026-05-08
**Owner:** founder
**Type:** Design phase — produces spec + wireframes only.

## Position

Phase 16 of roadmap. Integrate x402 (HTTP 402-based stablecoin micropayments) into AIAG gateway so external autonomous AI agents (ChatGPT plugins, Claude tool-use, LangChain, CrewAI) and Mini-App agents can pay per request without human signup. Three sub-phases (Base USDC → Solana + bulk credits → TON USDT-TON).

## Outputs delivered

- [x] Spec markdown — `docs/superpowers/specs/2026-05-08-phase16-x402-protocol-design.md`
- [x] Wireframes (6 files) — `C:\Users\боб\brain\Projects\AIAG\Wireframes\p16-x402\`:
  - `01-admin-x402-settings.html` — admin enable/disable + scope clarification banner
  - `02-admin-x402-transactions.html` — transactions list (read-only)
  - `03-admin-x402-pubkey-credits.html` — pre-pay balances per pubkey
  - `04-docs-x402-quickstart.html` — public agent quickstart
  - `05-agent-flow-diagram.html` — interactive 5-step request flow
  - `06-x402-pricing-table.html` — public per-model pricing
- [x] Schema additions proposed — `x402_payments`, `x402_pubkey_credits`, `usage_events.x402_payment_id` FK. See spec §5.

## Refinement note (2026-05-08)

User reviewed initial spec and clarified x402 scope. Applied:

- **Where x402 is exposed** (new spec § 0.1):
  - ✅ Mini-App agents (autonomous topup via TON, optional `x402_pay` tool)
  - ✅ External agents (Claude tool, GPT-tools, LangChain, CrewAI) hitting `api.ai-aggregator.ru` directly
  - ❌ Web (`ai-aggregator.ru/dashboard`) — `Authorization: Bearer aiag_*` only, no x402 in UI
  - 👁 Web admin (`/admin/x402-*`) — read-only observability for compliance audit
- **Mental model:** x402 — это протокол поверхности агентного слоя. Web human users не знают что он существует.
- Wireframes already use dark `#0a0a0b` + amber `#f59e0b` palette (no recolor needed). Added scope banner to `01-admin-x402-settings.html`.

## Open questions (move into discuss-phase)

- OQ-1 Refunds for failed LLM calls — auto-credit pubkey balance? Confirm in 16.1 kickoff.
- OQ-2 Mini-App embedded TON wallet — custodial via KMS or non-custodial via TON Connect proxy?
- OQ-3 KYC threshold for x402 wallets — 100k₽/mo equivalent before requiring self-declaration
- OQ-4 Self-host facilitator from day 1 (cost: ~$200/mo) or wait for sub-phase 16.3
