# Telegram alerts setup

Алерты от Alertmanager и uptime-крона приходят в Telegram-чат через бот.
Пакет `@aiag/telegram-alerts` обёртывает Bot API `sendMessage`.

## 1. Создать бота

1. Открыть <https://t.me/BotFather>, команда `/newbot`.
2. Имя: `AIAG Alerts`. Username: `aiag_alerts_bot` (или любой свободный).
3. Сохранить выданный токен в виде `123456:ABC-DEF...`.

## 2. Узнать chat_id

Личка:

1. Написать боту `/start` (любое сообщение).
2. Открыть в браузере `https://api.telegram.org/bot<TOKEN>/getUpdates`.
3. Найти `"chat":{"id": 12345678, ...}` — это ваш chat_id.

Группа:

1. Добавить бота в группу.
2. Любое сообщение в группе.
3. `getUpdates` → `chat.id` будет отрицательным (например, `-1001234567890`).

Альтернатива: переслать сообщение от бота в <https://t.me/userinfobot>.

## 3. Прописать env

`/srv/aiag/shared/.env`:

```
TELEGRAM_ALERT_BOT_TOKEN=123456:ABC...
TELEGRAM_ALERT_CHAT_ID=12345678
```

Также для uptime-крона на VPS (`/etc/aiag-uptime.env`):

```
URL=https://ai-aggregator.ru/api/health
TELEGRAM_ALERT_BOT_TOKEN=123456:ABC...
TELEGRAM_ALERT_CHAT_ID=12345678
```

## 4. Использование

```ts
import { sendAlert } from '@aiag/telegram-alerts';

await sendAlert('DB connection lost', 'critical');
await sendAlert('CPU > 80%', 'warning');
```

Без переменных окружения вызов попадает в `console.log` и не падает.

## 5. Webhook от Alertmanager

Прометей-алерты идут на `POST /api/alerts/webhook` (формат описан в
`alertmanager.yml` → `webhook_config`). Endpoint без auth — ограничен на
уровне nginx (только локальный Alertmanager).
