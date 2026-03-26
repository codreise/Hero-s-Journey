# Hero’s Journey: Технічний гайд

## Стек

- React 18
- Vite 6
- Tailwind CSS
- Canvas для рендеру ігрового поля
- Node.js HTTP server для локальних збережень

## Вимоги

- Node.js 18+
- npm

## Локальний запуск

1. Встановити залежності:

```powershell
npm install
```

2. Запустити фронтенд:

```powershell
npm run dev
```

3. За потреби запустити save-сервер:

```powershell
npm run server
```

4. За потреби запустити Telegram-бота з кнопкою в чаті:

```powershell
$env:BOT_TOKEN="your_bot_token"
$env:WEB_APP_URL="https://your-mini-app-url"
npm run bot
```

Фронтенд за замовчуванням працює на `http://localhost:5173`.

Save-сервер за замовчуванням працює на `http://localhost:3001`.

Перевірка сервера:

```text
http://localhost:3001/game-api/health
```

## Telegram Mini App локально

1. Запусти фронтенд з зовнішнім хостом:

```powershell
npm run dev -- --host 0.0.0.0
```

2. Запусти save-сервер:

```powershell
npm run server
```

3. Пробрось фронтенд через ngrok:

```powershell
ngrok http 5173
```

4. Вкажи публічний URL у BotFather.

Якщо використовується інший ngrok-домен, його треба дозволити в [vite.config.js](../vite.config.js).

## Скрипти

```powershell
npm run dev
npm run server
npm run bot
npm run build
npm run preview
npm run lint
npm run lint:fix
npm run typecheck
```

## Змінні середовища

Базова локальна розробка працює без додаткових env-змінних. Для Base44-функцій можна створити `.env.local`:

```env
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
VITE_BASE44_FUNCTIONS_VERSION=your_functions_version
```

Ці значення читаються у [src/lib/app-params.js](../src/lib/app-params.js).

## Структура коду

- [src/pages/Game.jsx](../src/pages/Game.jsx) — головний екран гри, перехід між start/game, збереження
- [src/components/game/StartScreen.jsx](../src/components/game/StartScreen.jsx) — стартовий екран
- [src/components/game/RPGGame.jsx](../src/components/game/RPGGame.jsx) — рендер, цикл бою, canvas, боси, снаряди
- [src/components/game/useRPGState.jsx](../src/components/game/useRPGState.jsx) — стейт, вороги, боси, нагороди, мета-прогрес
- [server/index.js](../server/index.js) — локальний save-сервер
- [bot/index.js](../bot/index.js) — мінімальний Telegram-бот, який надсилає стартове повідомлення з inline-кнопкою Грати

## Поточні правила збереження

- Поза Telegram використовується localStorage.
- У Telegram використовується backend по `/game-api`.
- Основний bundle містить `version`, `profile` і `runState`.

## Поточні зони розвитку

- нові патерни босів
- глибший мета-прогрес
- візуальні ефекти бою
- звук
- production backend

## Рекомендована перевірка після змін

1. Запустити `npm run build`.
2. Перевірити гру в браузері на desktop.
3. Перевірити адаптив на вузькому мобільному viewport.
4. Якщо чіпав Telegram або збереження, прогнати локально frontend + server + ngrok.