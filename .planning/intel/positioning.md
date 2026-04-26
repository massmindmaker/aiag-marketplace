# Positioning

**Source:** `C:\Users\боб\brain\Projects\AIAG\Knowledge\01-positioning.md`
**Locked:** 2026-04-18

## Formula

**Маркетплейс AI-моделей с API-доступом. Новые модели приходят через открытые ML-конкурсы.**

## Two product layers

### Primary (Variant B — Russian Replicate)

**What:** Каталог AI-моделей (Stable Diffusion, Whisper, YOLO, кастомные NLP/CV, GPT/Claude через проксирование) через единый OpenAI-совместимый API.

**For whom:** Российский продуктовый разработчик / CTO небольшого SaaS 28–40 лет, которому нужна конкретная модель под свою задачу, нет GPU для self-hosting и нет возможности платить Replicate/HuggingFace из РФ.

**Monetization:** Pay-per-request / pay-per-token в рублях. Топап через T-Bank / ЮKassa / СБП.

**Reference:** Replicate.com, Fal.ai.

### Sovereign AI combo bundle (unique RU-niche)

**Мы — единственные, кто собирает под одним API-ключом:**

- YandexGPT (5 Lite / Pro / Pro 5.1) — direct, RU-residency
- GigaChat (Lite / Pro / Max) — direct, RU-residency
- Open-source LLMs (Llama, Qwen, DeepSeek, gpt-oss) — хостим в РФ (Timeweb / Selectel GPU), 152-ФЗ
- Closed frontier LLMs (Claude, GPT, Gemini) — через OpenRouter
- Media-модели (Flux, Veo, Runway, Suno, Kling, Seedream) — через Fal.ai и Kie.ai
- Custom community models — собственный cog-compatible хостинг

**Why unique in RU:** Polza не хостит opensource в РФ; Yandex Model Gallery не даёт Claude/GPT/GigaChat; Сбер GigaChat изолирован от внешних моделей. Комбинация «все модели + RU-residency для критичных + ₽-биллинг + 152-ФЗ» — только мы.

**Marker:** Shield-RF badge на каждой модели с RU data residency.

### Secondary (Variant A — Russian Kaggle для supply)

**What:** Открытые ML-конкурсы с призовым фондом + leaderboard + public/private score. Модели победителей деплоятся в маркетплейс и получают 70% (tiered до 85%) от API-подписок.

**For whom:**
- ML-инженер/senior разработчик — участвует, побеждает, получает доход с подписок
- B2B-заказчик (tertiary) — спонсирует конкурс под свою задачу

**Monetization:** Revshare 70/30 + комиссия с призового фонда + B2B sales на enterprise-конкурсы.

**Reference:** Kaggle, DrivenData, Zindi.

## Why this combination

1. **Уникальная ниша в РФ.** Russian Replicate нет, Russian Kaggle нет, их комбинации — тем более.
2. **Конкурсы решают chicken-and-egg маркетплейса.**
3. **Конкурсы — SEO и PR-контент.** Каждый = отдельный лендинг + новости в комьюнити.
4. **Revenue-sharing > разовых призов.** Привлекает сильных ML-инженеров на долгосрочную работу.
5. **Заявки на разработку** работают как fallback для задач без готового решения.

## Differentiation per competitor

| Competitor | Their model | Our diff |
|---|---|---|
| **Replicate** | Хостинг моделей для разработчиков | Оплата в ₽, supply из конкурсов, РФ-инфра |
| **Hugging Face** | Community + модели + inference | Монетизация для авторов через revshare, российская оплата |
| **Polza.ai** | API-прокси к LLM | Не только LLM, любые модели + supply-side |
| **OpenRouter** | Unified API для LLM | Не только LLM, open models, свой хостинг, revshare |
| **Kaggle** | Конкурсы + community | Монетизация моделей через API после конкурса |
| **DrivenData/Zindi** | Конкурсы с призами | + маркетплейс для продолжения жизни моделей |
| **Kie.ai** | Медиа-API (Veo/Runway/Suno) | + community supply, + российские рельсы |
| **Study AI / GPTunneL / BotHub** | B2C-чаты с LLM | Мы B2B-API |

## Anti-positioning (что НЕ делаем)

- **Не** делаем ещё один B2C-чат «все нейросети в одном окне» (красный океан в РФ)
- **Не** позиционируемся «дешевле чем X»
- **Не** фокусируемся на enterprise-конкурсах на старте
- **Не** хостим всё сами с первого дня

## Hero one-liner

> **«Any AI model. One API. Payment in ₽.»**

Alternates for tests:
- «Маркетплейс AI-моделей с оплатой в рублях»
- «Нужна любая AI-модель? Подключи через API за 2 минуты»
- «Не ещё одна обёртка над ChatGPT. Сотни моделей для вашего продукта»
