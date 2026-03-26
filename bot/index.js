import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Telegraf, Markup } from "telegraf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadDotEnv() {
  const envPath = path.join(projectRoot, ".env");

  try {
    const rawEnv = readFileSync(envPath, "utf8");
    rawEnv.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf("=");
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['\"]|['\"]$/g, "");
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch {
    // .env is optional; process.env may already contain all values.
  }
}

async function resolveWebAppUrl() {
  if (process.env.WEB_APP_URL) {
    return process.env.WEB_APP_URL;
  }

  try {
    const response = await fetch("http://127.0.0.1:4040/api/tunnels");
    if (!response.ok) {
      return "";
    }

    const payload = await response.json();
    const httpsTunnel = payload?.tunnels?.find((tunnel) => tunnel.public_url?.startsWith("https://"));
    return httpsTunnel?.public_url || "";
  } catch {
    return "";
  }
}

function buildInlineKeyboard(webAppUrl) {
  return Markup.inlineKeyboard([
    [Markup.button.webApp("Грати", webAppUrl)],
  ]);
}

async function main() {
  loadDotEnv();

  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error("BOT_TOKEN is required to run the Telegram bot.");
    process.exit(1);
  }

  const webAppUrl = await resolveWebAppUrl();
  if (!webAppUrl) {
    console.error("WEB_APP_URL is missing and ngrok URL was not detected. Set WEB_APP_URL in .env or run ngrok.");
    process.exit(1);
  }

  const bot = new Telegraf(token);

  async function sendWelcomeMessage(ctx) {
    await ctx.reply(
      "Hero’s Journey готова. Натисни кнопку нижче, щоб відкрити гру.",
      buildInlineKeyboard(webAppUrl)
    );
  }

  bot.start(async (ctx) => {
    await sendWelcomeMessage(ctx);
  });

  bot.command("play", async (ctx) => {
    await sendWelcomeMessage(ctx);
  });

  await bot.launch();
  console.log(`Telegram bot is running with Mini App URL: ${webAppUrl}`);

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

void main();