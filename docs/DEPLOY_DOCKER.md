# Docker and local testing (Variant B)

Ця інструкція допоможе швидко запускати фронтенд, save-сервер і бота локально через Docker Compose, а також дасть підказки для деплою на Render/Vercel.

Локально з Docker Compose

1. Побудуйте образи та запустіть сервіси:

```bash
docker compose up --build
```

2. Після успішного запуску:
- Фронтенд (статичні файли) буде доступний: http://localhost:8080
- Save-server API: http://localhost:3001 (health: /game-api/health)
- Bot зчитує `BOT_TOKEN` з env, але у docker-compose приклад використовує змінну середовища `BOT_TOKEN`.

Примітки щодо збережень
- `server/index.js` пише в директорію, яка за замовчуванням у контейнері — `/data`. У `docker-compose.yml` вона змонтувана в `./server/data` для збереження між перезапусками.

Деплой на Render (рекомендовано для backend)

1. В панелі Render створіть два сервіси в одному репозиторії:
   - Web Service — `save-server` (порт 3001), Build CMD: Docker (Render буде використовувати `Dockerfile`, Target — `backend`), Start Command: `node server/index.js`.
   - Background Worker — `bot`, Build CMD: Docker (той самий Dockerfile, Target — `backend`), Start Command: `node bot/index.js`.

2. Установіть environment variables у Render для кожного сервісу:
   - `BOT_TOKEN` (для bot)
   - `WEB_APP_URL` (production фронтенд URL — HTTPS)
   - `PORT`, `SAVE_DATA_DIR`, `CORS_ALLOWED_ORIGINS` (для save-server)

3. Для персистентного збереження встановіть Persistent Disk у Render і вкажіть `SAVE_DATA_DIR` як шлях до нього.

Деплой фронтенду

- Рекомендація: Vercel / Netlify / Cloudflare Pages. Налаштуйте автоматичний деплой з Git. Build Command: `npm run build`, Output directory: `dist`.
- Після публікації вкажіть цей URL в `WEB_APP_URL` для `bot` і в `CORS_ALLOWED_ORIGINS` для save-server.

CI/CD

- Render і Vercel підтримують автодеплой при пуші в репозиторій. Якщо хочете — я можу додати приклад GitHub Actions для побудови і публікації образів в реєстр.
