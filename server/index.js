import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startBot } from "../bot/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3001);
const DATA_DIR = process.env.SAVE_DATA_DIR
  ? path.resolve(process.cwd(), process.env.SAVE_DATA_DIR)
  : path.join(__dirname, "data");
const SAVE_FILE = path.join(DATA_DIR, "saves.json");

// Optional: serve built frontend from ../dist when present. API routes are unaffected.
const DIST_DIR = path.join(__dirname, "..", "dist");

function contentTypeFromExt(ext) {
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    case ".ico":
      return "image/x-icon";
    case ".wasm":
      return "application/wasm";
    default:
      return "application/octet-stream";
  }
}

async function tryServeStatic(request, response) {
  if (request.method !== "GET") return false;
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
  if (requestUrl.pathname.startsWith("/game-api/") || requestUrl.pathname.startsWith("/api/")) return false;
  let requestedPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = path.normalize(path.join(DIST_DIR, requestedPath));
  if (!safePath.startsWith(DIST_DIR)) return false;
  try {
    const data = await readFile(safePath);
    const ext = path.extname(safePath).toLowerCase();
    response.writeHead(200, { "Content-Type": contentTypeFromExt(ext) });
    response.end(data);
    return true;
  } catch {
    return false;
  }
}

function parseAllowedOrigins() {
  return String(process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins();

function getCorsOrigin(requestOrigin) {
  if (allowedOrigins.length === 0) {
    return requestOrigin || "*";
  }

  if (allowedOrigins.includes("*")) {
    return "*";
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return null;
}

function sendJson(response, statusCode, payload) {
  const corsOrigin = getCorsOrigin(response.req?.headers?.origin);
  if (response.req?.method !== "OPTIONS" && response.req?.headers?.origin && corsOrigin === null) {
    response.writeHead(403, {
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify({ error: "Origin is not allowed" }));
    return;
  }

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...(corsOrigin ? { "Access-Control-Allow-Origin": corsOrigin } : {}),
    "Access-Control-Allow-Methods": "GET,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  });
  response.end(JSON.stringify(payload));
}

async function ensureStorage() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(SAVE_FILE, "utf8");
  } catch {
    await writeFile(SAVE_FILE, JSON.stringify({ saves: {} }, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStorage();
  try {
    const rawValue = await readFile(SAVE_FILE, "utf8");
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" && parsed.saves ? parsed : { saves: {} };
  } catch {
    return { saves: {} };
  }
}

async function writeStore(store) {
  await ensureStorage();
  await writeFile(SAVE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function isValidUserId(userId) {
  return typeof userId === "string" && /^[0-9]{1,20}$/.test(userId);
}

function normalizeSavePayload(payload) {
  if (!payload || typeof payload !== "object" || !payload.save || typeof payload.save !== "object") {
    return null;
  }

  return {
    save: payload.save,
    telegramUser: payload.telegramUser && typeof payload.telegramUser === "object" ? {
      id: payload.telegramUser.id ?? null,
      username: payload.telegramUser.username ?? null,
      first_name: payload.telegramUser.first_name ?? null,
      last_name: payload.telegramUser.last_name ?? null,
    } : null,
    savedAt: new Date().toISOString(),
  };
}

async function parseRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return null;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(rawBody);
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  // Try to serve frontend static files from ../dist (if present)
  if (request.method === "GET") {
    const served = await tryServeStatic(request, response);
    if (served) return;
  }

  if (requestUrl.pathname === "/game-api/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true });
    return;
  }

  const saveMatch = requestUrl.pathname.match(/^\/game-api\/saves\/([0-9]{1,20})$/);
  if (!saveMatch) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const userId = saveMatch[1];
  if (!isValidUserId(userId)) {
    sendJson(response, 400, { error: "Invalid user id" });
    return;
  }

  try {
    const store = await readStore();

    if (request.method === "GET") {
      sendJson(response, 200, { save: store.saves[userId] ?? null });
      return;
    }

    if (request.method === "PUT") {
      const requestBody = await parseRequestBody(request);
      const normalizedPayload = normalizeSavePayload(requestBody);
      if (!normalizedPayload) {
        sendJson(response, 400, { error: "Invalid save payload" });
        return;
      }

      store.saves[userId] = normalizedPayload;
      await writeStore(store);
      sendJson(response, 200, { ok: true, save: normalizedPayload });
      return;
    }

    if (request.method === "DELETE") {
      delete store.saves[userId];
      await writeStore(store);
      sendJson(response, 200, { ok: true });
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, 500, {
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Save server listening on http://localhost:${PORT}`);
});

startBot().catch((error) => {
  console.error("Telegram bot failed to start:", error instanceof Error ? error.message : error);
});
