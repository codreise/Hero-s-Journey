# Deploy frontend to Vercel

Кроки для швидкого деплою фронтенду на Vercel та правильного підключення бекенду (save-server).

1) Підключіть репозиторій до Vercel (GitHub/GitLab/Bitbucket).

2) У налаштуваннях проекту (Project Settings → General → Build & Output Settings):

- **Build Command:** `npm ci && npm run build`
- **Output Directory:** `dist`

3) Додайте необхідні Environment Variables (Project → Settings → Environment Variables):

- `VITE_BASE44_APP_ID` — ваш Base44 app id (за потреби)
- `VITE_BASE44_APP_BASE_URL` — URL бекенду (used by Base44 SDK defaults)
- `VITE_BASE44_FUNCTIONS_VERSION` — (як у `.env.example`)
- `VITE_SAVE_SERVER_URL` — повний URL save-server (напр.: `https://hero-s-journey.onrender.com`)

Пояснення: `VITE_` префікс потрібен, щоб змінні були доступні у клієнтському коді після збірки. Ми змінили клієнтський код, щоб в разі коли `VITE_SAVE_SERVER_URL` встановлено, фронтенд викликав `${VITE_SAVE_SERVER_URL}/game-api/...`, інакше — використовував відносний `/game-api` (щоб залишити роботу dev proxy).

4) Домен і HTTPS: Vercel автоматично надає HTTPS. Після деплою вкажіть цей URL як `WEB_APP_URL` для бота (Render) і додайте домен у `CORS_ALLOWED_ORIGINS` на save-server.

5) Тестування після деплою:

```bash
# перевірити що сайт доступний
curl -I https://your-vercel-domain.vercel.app

# перевірити health бекенду (Render)
curl -s https://your-save-server.onrender.com/game-api/health
```

6) Якщо ви хочете, щоб `https://your-vercel-domain/game-api/*` проксувалося на save-server (без використання `VITE_SAVE_SERVER_URL`), можна додати rewrite в `vercel.json` або налаштувати Vercel Proxy (але рекомендую використовувати `VITE_SAVE_SERVER_URL`).
