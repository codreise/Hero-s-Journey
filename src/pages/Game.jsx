import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadServerSave, saveServerGame } from "../api/gameSaveClient";
import StartScreen from "../components/game/StartScreen";
import RPGGame from "../components/game/RPGGame";
import { applyRunResultsToProfile, createMetaProfile, sanitizeMetaProfile, upgradeMetaProfile } from "../components/game/useRPGState";
import { useTelegramMiniApp } from "../lib/telegram-mini-app";

const SAVE_KEY = "heros-journey-save";
const SAVE_BUNDLE_VERSION = 2;

function normalizeSaveBundle(rawValue) {
  if (!rawValue || typeof rawValue !== "object") {
    return {
      version: SAVE_BUNDLE_VERSION,
      profile: createMetaProfile(),
      runState: null,
    };
  }

  if ("profile" in rawValue || "runState" in rawValue || rawValue.version === SAVE_BUNDLE_VERSION) {
    return {
      version: SAVE_BUNDLE_VERSION,
      profile: sanitizeMetaProfile(rawValue.profile),
      runState: rawValue.runState && typeof rawValue.runState === "object" ? rawValue.runState : null,
    };
  }

  return {
    version: SAVE_BUNDLE_VERSION,
    profile: createMetaProfile(),
    runState: rawValue,
  };
}

function loadSavedGame() {
  try {
    const rawValue = window.localStorage.getItem(SAVE_KEY);
    return normalizeSaveBundle(rawValue ? JSON.parse(rawValue) : null);
  } catch {
    return normalizeSaveBundle(null);
  }
}

export default function Game() {
  const {
    hideBackButton,
    hideMainButton,
    initData,
    isTelegram,
    user,
  } = useTelegramMiniApp();
  const [saveBundle, setSaveBundle] = useState(() => loadSavedGame());
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [screen, setScreen] = useState("start"); // "start" | "game"
  const [gameKey, setGameKey] = useState(0);
  const [initialGameState, setInitialGameState] = useState(null);
  const saveBundleRef = useRef(saveBundle);

  useEffect(() => {
    saveBundleRef.current = saveBundle;
  }, [saveBundle]);

  const savedGame = saveBundle.runState;
  const profile = saveBundle.profile;

  const telegramUserId = useMemo(() => {
    const userId = user?.id;
    return userId ? String(userId) : "";
  }, [user?.id]);

  const useServerSave = Boolean(isTelegram && telegramUserId);
  const isTelegramGameScreen = isTelegram && screen === "game";

  useEffect(() => {
    let isCancelled = false;

    async function hydrateSave() {
      if (!useServerSave) {
        setSaveBundle(loadSavedGame());
        setSaveError("");
        setIsSaveLoading(false);
        return;
      }

      setIsSaveLoading(true);
      setSaveError("");

      try {
        const remoteSave = await loadServerSave(telegramUserId);
        if (!isCancelled) {
          setSaveBundle(normalizeSaveBundle(remoteSave));
        }
      } catch {
        if (!isCancelled) {
          setSaveError("Не вдалося завантажити серверне збереження. Використовується локальна копія.");
          setSaveBundle(loadSavedGame());
        }
      } finally {
        if (!isCancelled) {
          setIsSaveLoading(false);
        }
      }
    }

    hydrateSave();

    return () => {
      isCancelled = true;
    };
  }, [telegramUserId, useServerSave]);

  const persistBundle = useCallback((nextBundle) => {
    saveBundleRef.current = nextBundle;
    setSaveBundle(nextBundle);

    if (useServerSave) {
      setSaveError("");
      void saveServerGame(telegramUserId, nextBundle, user ? {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        initData,
      } : null).catch(() => {
        setSaveError("Не вдалося оновити серверне збереження. Локальна копія залишилась доступною.");
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(nextBundle));
      });
      return;
    }

    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(nextBundle));
    } catch {
      // Ignore localStorage failures and keep the game playable.
    }
  }, [initData, telegramUserId, useServerSave, user]);

  const saveGame = useCallback((snapshot) => {
    persistBundle({
      ...saveBundleRef.current,
      runState: snapshot,
    });
  }, [persistBundle]);

  const clearSave = useCallback(() => {
    setSaveError("");

    persistBundle({
      ...saveBundleRef.current,
      runState: null,
    });
  }, [persistBundle]);

  const handleRunComplete = useCallback((finalSnapshot) => {
    const currentBundle = saveBundleRef.current;
    persistBundle({
      ...currentBundle,
      runState: null,
      profile: applyRunResultsToProfile(currentBundle.profile, finalSnapshot),
    });
  }, [persistBundle]);

  const handleUpgradeMeta = useCallback((upgradeId) => {
    const currentBundle = saveBundleRef.current;
    const nextProfile = upgradeMetaProfile(currentBundle.profile, upgradeId);

    if (JSON.stringify(nextProfile) === JSON.stringify(currentBundle.profile)) {
      return;
    }

    persistBundle({
      ...currentBundle,
      profile: nextProfile,
    });
  }, [persistBundle]);

  const handleStart = useCallback(() => {
    clearSave();
    setInitialGameState(null);
    setGameKey((k) => k + 1);
    setScreen("game");
  }, [clearSave]);

  const handleContinue = useCallback(() => {
    if (!savedGame) {
      return;
    }
    setInitialGameState(savedGame);
    setGameKey((k) => k + 1);
    setScreen("game");
  }, [savedGame]);

  const handleRestart = useCallback(() => {
    clearSave();
    setInitialGameState(null);
    setGameKey((k) => k + 1);
    setScreen("game");
  }, [clearSave]);

  const handleHome = useCallback(() => {
    setScreen("start");
  }, []);

  useEffect(() => {
    if (!isTelegram) {
      return undefined;
    }

    hideBackButton();
    hideMainButton();
    return undefined;
  }, [hideBackButton, hideMainButton, isTelegram, screen]);

  useEffect(() => {
    document.documentElement.classList.toggle("telegram-game-active", isTelegramGameScreen);
    document.body.classList.toggle("telegram-game-active", isTelegramGameScreen);

    return () => {
      document.documentElement.classList.remove("telegram-game-active");
      document.body.classList.remove("telegram-game-active");
    };
  }, [isTelegramGameScreen]);

  return (
    <div
      className={`app-shell bg-background flex w-full justify-center px-1 sm:px-2 lg:px-3 ${
        screen === "game"
          ? "game-screen items-stretch py-0 sm:items-center sm:py-2"
          : "items-center py-4"
      } ${isTelegramGameScreen ? "telegram-game-shell" : ""}`}
    >
      {screen === "start" && (
        <StartScreen
          onStart={handleStart}
          onContinue={handleContinue}
          onUpgradeMeta={handleUpgradeMeta}
          hasSavedGame={Boolean(savedGame)}
          isSaveLoading={isSaveLoading}
          profile={profile}
          saveError={saveError}
          savedGame={savedGame}
          saveSource={useServerSave ? "server" : "local"}
        />
      )}
      {screen === "game" && (
        <RPGGame
          key={gameKey}
          initialState={initialGameState}
          onRunComplete={handleRunComplete}
          onSaveState={saveGame}
          onClearSave={clearSave}
          onRestart={handleRestart}
          onHome={handleHome}
          profile={profile}
        />
      )}
    </div>
  );
}