# Hero’s Journey: Deployment

## Що зараз деплоїться окремо

- фронтенд Mini App
- save-сервер
- Telegram-бот

## Мінімальна production-схема

1. Задеплоїти фронтенд на статичний хостинг.
2. Задеплоїти Node save-сервер окремим процесом.
3. Задеплоїти Telegram-бот окремим процесом.
4. Вказати production URL гри в `WEB_APP_URL`.
5. Обмежити `CORS_ALLOWED_ORIGINS` тільки своїми доменами.

## Рекомендовані середовища

- фронтенд: Vercel, Netlify, Cloudflare Pages
- save-сервер: Render, Railway, Fly.io, VPS
- бот: Render worker, Railway, Fly.io, VPS

## Обов'язкові env-змінні

### Для бота

```env
BOT_TOKEN=your_telegram_bot_token
WEB_APP_URL=https://your-mini-app.example.com
```

### Для save-сервера

```env
PORT=3001
SAVE_DATA_DIR=./server/data
CORS_ALLOWED_ORIGINS=https://your-mini-app.example.com
```

### Для локальної розробки з тунелем

```env
SAVE_SERVER_URL=http://127.0.0.1:3001
DEV_ALLOWED_HOSTS=your-ngrok-domain.ngrok-free.dev
```

## Production checklist

1. Заповнити `.env` на сервері або в панелі хостингу.
2. Для фронтенда задати стабільний production URL.
3. Для бота прописати той самий URL у `WEB_APP_URL`.
4. Для save-сервера виставити `CORS_ALLOWED_ORIGINS` без `*`.
5. Перевірити health endpoint: `/game-api/health`.
6. Прогнати `npm run build` і `npm run lint` перед релізом.

## Що змінилося в конфігурації

- `vite.config.js` тепер бере `DEV_ALLOWED_HOSTS` з env, а не з зашитого ngrok-домену
- proxy до save-сервера тепер читає `SAVE_SERVER_URL`
- `server/index.js` тепер підтримує `CORS_ALLOWED_ORIGINS` і `SAVE_DATA_DIR`

## Поточне обмеження

Save-сервер все ще файловий і підходить для невеликого навантаження або MVP. Для реального production-навантаження краще перейти на БД.