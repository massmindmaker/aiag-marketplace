# Email setup (Unisender Go)

Транзакционная отправка через Unisender Go. Пакет `@aiag/email` обёртывает
REST API (`POST https://go1.unisender.ru/ru/transactional/api/v1/email/send.json`)
и предоставляет 5 шаблонов: `verify-email`, `reset-password`, `welcome`,
`payment-receipt`, `subscription-renewal`.

## 1. Получить API-ключ

1. Зарегистрируйтесь на <https://godocs.unisender.ru/> (или войдите в
   существующий кабинет Unisender Go).
2. Подтвердите домен-отправитель `ai-aggregator.ru` (DKIM + SPF).
3. В разделе **Настройки → API** создайте новый ключ с правом
   *transactional / send*.

## 2. Прописать env

В `/srv/aiag/shared/.env` на VPS (или локально для dev):

```
UNISENDER_GO_API_KEY=<ваш ключ>
EMAIL_FROM=no-reply@ai-aggregator.ru
EMAIL_FROM_NAME=AI-Aggregator
EMAIL_REPLY_TO=support@ai-aggregator.ru
```

Если `UNISENDER_GO_API_KEY` пуст — пакет работает в режиме mock: пишет в
лог и возвращает `{ ok: true, id: 'console-mock' }`. Локальная разработка
без ключа не падает.

## 3. Использование в коде

```ts
import { sendEmail } from '@aiag/email';

await sendEmail({
  to: 'user@example.com',
  template: 'reset-password',
  data: { url: 'https://ai-aggregator.ru/reset-password?token=...' },
});
```

Или произвольный HTML:

```ts
await sendEmail({
  to: 'user@example.com',
  subject: 'Hi',
  html: '<b>Hello</b>',
});
```

## 4. Проверка после установки ключа

```bash
ssh aiag-vps 'pm2 restart aiag-web'
curl -X POST https://ai-aggregator.ru/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com"}'
# → должно прийти письмо
```
