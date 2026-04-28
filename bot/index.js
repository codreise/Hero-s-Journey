import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Markup, Telegraf } from "telegraf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

let runningBot = null;

function loadDotEnv() {
  const envPath = path.join(projectRoot, ".env");

  try {
    const rawEnv = readFileSync(envPath, "utf8");
    rawEnv.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) return;

      const idx = trimmedLine.indexOf("=");
      if (idx === -1) return;

      const key = trimmedLine.slice(0, idx).trim();
      const value = trimmedLine.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");

      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch {
    console.warn(".env not found, using system env only");
  }
}

async function resolveWebAppUrl() {
  const configuredUrl = process.env.WEB_APP_URL?.trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  try {
    const res = await fetch("http://127.0.0.1:4040/api/tunnels");
    if (res.ok) {
      const data = await res.json();
      const url = data?.tunnels?.find((tunnel) => tunnel.public_url?.startsWith("https://"))?.public_url;
      if (url) return url;
    }
  } catch {}

  return "";
}

function isPlaceholderWebAppUrl(value) {
  if (!value) {
    return true;
  }

  return [
    "https://example.com",
    "https://your-frontend.example.com",
    "https://your-mini-app.example.com",
  ].includes(value);
}

function buildKeyboard(webAppUrl) {
  return Markup.inlineKeyboard([
    [Markup.button.webApp("Play", webAppUrl)],
  ]);
}

export async function startBot(options = {}) {
  const { strict = false } = options;

  if (runningBot) {
    return runningBot;
  }

  loadDotEnv();

  const token = process.env.BOT_TOKEN?.trim();
  if (!token) {
    if (strict) {
      throw new Error("BOT_TOKEN missing");
    }

    console.warn("BOT_TOKEN missing, Telegram bot startup skipped.");
    return null;
  }

  const webAppUrl = await resolveWebAppUrl();
  if (isPlaceholderWebAppUrl(webAppUrl)) {
    if (strict) {
      throw new Error("WEB_APP_URL is missing or still points to a placeholder value.");
    }

    console.warn("WEB_APP_URL missing or placeholder, Telegram bot startup skipped.");
    return null;
  }

  console.log("WebApp URL:", webAppUrl);

  const bot = new Telegraf(token);

  const sendMenu = async (ctx) => {
    await ctx.reply(
      "Hero's Journey is ready. Tap the button below to start playing:",
      buildKeyboard(webAppUrl),
    );
  };

  bot.start(async (ctx) => {
    await sendMenu(ctx);
  });

  bot.command("play", async (ctx) => {
    await sendMenu(ctx);
  });

  await bot.launch();
  runningBot = bot;

  console.log("Bot is running");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  return bot;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (invokedPath === __filename) {
  startBot({ strict: true }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
