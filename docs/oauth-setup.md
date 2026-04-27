# OAuth setup — ai-aggregator.ru

Инструкции для регистрации OAuth-приложений у каждого провайдера и настройки ENV на VPS.

Все callback URL имеют единый формат:
`https://ai-aggregator.ru/api/auth/callback/{provider}`

После регистрации приложений значения ENV кладём в `/srv/aiag/shared/.env` и перезапускаем PM2:
```bash
ssh aiag-vps 'sudo -u aiag pm2 restart aiag-web --update-env'
```

---

## Yandex

1. Открыть https://oauth.yandex.ru/client/new
2. Название: `ai-aggregator.ru`
3. Платформа: Веб-сервисы
4. Redirect URI: `https://ai-aggregator.ru/api/auth/callback/yandex`
5. Доступы (scopes):
   - `login:email`
   - `login:info`
   - `login:avatar`
6. После создания скопировать `ClientID` и `Client secret`

ENV:
```
YANDEX_CLIENT_ID=...
YANDEX_CLIENT_SECRET=...
```

---

## VK (ВКонтакте)

1. Открыть https://dev.vk.com/admin
2. Создать приложение → тип `Web`
3. Базовый домен: `ai-aggregator.ru`
4. Доверенный redirect URI: `https://ai-aggregator.ru/api/auth/callback/vk`
5. Scopes: `email`
6. В настройках приложения скопировать `ID приложения` (clientId) и `Защищённый ключ` (secret)

ENV:
```
VK_CLIENT_ID=...
VK_CLIENT_SECRET=...
```

---

## Google

1. Открыть https://console.cloud.google.com/apis/credentials
2. Создать проект (если нет) → OAuth consent screen → External
3. Create credentials → OAuth client ID → Web application
4. Authorized redirect URI: `https://ai-aggregator.ru/api/auth/callback/google`
5. Скопировать Client ID и Client secret

ENV:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## GitHub

1. Открыть https://github.com/settings/developers
2. New OAuth App
3. Homepage URL: `https://ai-aggregator.ru`
4. Authorization callback URL: `https://ai-aggregator.ru/api/auth/callback/github`
5. Создать → сгенерировать Client secret

ENV:
```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

---

## Полный шаблон ENV

```bash
# OAuth providers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
VK_CLIENT_ID=
VK_CLIENT_SECRET=
```

После заполнения значений — `pm2 restart aiag-web --update-env`. Кнопки на `/login` начнут работать.
