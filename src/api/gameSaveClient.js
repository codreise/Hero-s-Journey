const SAVE_API_BASE = "/game-api";

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function loadServerSave(userId) {
  const payload = await requestJson(`${SAVE_API_BASE}/saves/${userId}`);
  return payload.save?.save ?? null;
}

export async function saveServerGame(userId, save, telegramUser = null) {
  const payload = await requestJson(`${SAVE_API_BASE}/saves/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ save, telegramUser }),
  });

  return payload.save?.save ?? save;
}

export async function clearServerSave(userId) {
  await requestJson(`${SAVE_API_BASE}/saves/${userId}`, {
    method: "DELETE",
  });
}

export async function checkSaveServerHealth() {
  return requestJson(`${SAVE_API_BASE}/health`);
}