import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const TelegramMiniAppContext = createContext({
  isTelegram: false,
  webApp: null,
  user: null,
  initData: "",
  initDataUnsafe: null,
  colorScheme: "dark",
  platform: "web",
  version: "",
  viewportHeight: 0,
  viewportStableHeight: 0,
  isExpanded: false,
  hapticImpact: () => {},
  hapticNotification: () => {},
  hapticSelection: () => {},
  setMainButton: () => {},
  hideMainButton: () => {},
  setBackButton: () => {},
  hideBackButton: () => {},
  openLink: () => {},
  close: () => {},
});

function getTelegramWebApp() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
}

function isTelegramVersionAtLeast(webApp, targetVersion) {
  if (!webApp || !targetVersion) {
    return false;
  }

  if (typeof webApp.isVersionAtLeast === "function") {
    return webApp.isVersionAtLeast(targetVersion);
  }

  const currentParts = String(webApp.version || "0")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const targetParts = String(targetVersion)
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const maxLength = Math.max(currentParts.length, targetParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const currentValue = currentParts[index] || 0;
    const targetValue = targetParts[index] || 0;

    if (currentValue > targetValue) {
      return true;
    }

    if (currentValue < targetValue) {
      return false;
    }
  }

  return true;
}

function buildTelegramState(webApp) {
  if (!webApp) {
    return {
      isTelegram: false,
      webApp: null,
      user: null,
      initData: "",
      initDataUnsafe: null,
      colorScheme: "dark",
      platform: "web",
      version: "",
      viewportHeight: 0,
      viewportStableHeight: 0,
      isExpanded: false,
    };
  }

  return {
    isTelegram: true,
    webApp,
    user: webApp.initDataUnsafe?.user ?? null,
    initData: webApp.initData ?? "",
    initDataUnsafe: webApp.initDataUnsafe ?? null,
    colorScheme: webApp.colorScheme ?? "dark",
    platform: webApp.platform ?? "telegram",
    version: webApp.version ?? "",
    viewportHeight: webApp.viewportHeight ?? window.innerHeight,
    viewportStableHeight: webApp.viewportStableHeight ?? webApp.viewportHeight ?? window.innerHeight,
    isExpanded: Boolean(webApp.isExpanded),
  };
}

export function TelegramMiniAppProvider({ children }) {
  const [telegramState, setTelegramState] = useState(() => buildTelegramState(getTelegramWebApp()));
  const mainButtonHandlerRef = useRef(null);
  const backButtonHandlerRef = useRef(null);

  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (!webApp) {
      return undefined;
    }

    const applyState = () => {
      const nextState = buildTelegramState(webApp);
      setTelegramState(nextState);
      document.documentElement.dataset.tgColorScheme = nextState.colorScheme;
      document.documentElement.style.setProperty("--tg-viewport-height", `${nextState.viewportHeight}px`);
      document.documentElement.style.setProperty("--tg-stable-viewport-height", `${nextState.viewportStableHeight}px`);
    };

    webApp.ready();
    webApp.expand?.();
    if (isTelegramVersionAtLeast(webApp, "7.7")) {
      webApp.disableVerticalSwipes?.();
    }
    applyState();

    const handleThemeChanged = () => applyState();
    const handleViewportChanged = () => applyState();

    webApp.onEvent?.("themeChanged", handleThemeChanged);
    webApp.onEvent?.("viewportChanged", handleViewportChanged);

    return () => {
      webApp.offEvent?.("themeChanged", handleThemeChanged);
      webApp.offEvent?.("viewportChanged", handleViewportChanged);
    };
  }, []);

  const setMainButton = useCallback((options = {}) => {
    const webApp = getTelegramWebApp();
    if (!webApp?.MainButton) {
      return;
    }

    const { MainButton } = webApp;
    const {
      backgroundColor,
      isEnabled = true,
      isLoaderVisible = false,
      isVisible = true,
      onClick,
      text = "",
      textColor,
    } = options;

    if (mainButtonHandlerRef.current) {
      MainButton.offClick(mainButtonHandlerRef.current);
      mainButtonHandlerRef.current = null;
    }

    if (text) {
      MainButton.setText(text);
    }
    if (backgroundColor) {
      MainButton.color = backgroundColor;
    }
    if (textColor) {
      MainButton.textColor = textColor;
    }

    if (isEnabled) {
      MainButton.enable();
    } else {
      MainButton.disable();
    }

    if (isLoaderVisible) {
      MainButton.showProgress();
    } else {
      MainButton.hideProgress();
    }

    if (typeof onClick === "function") {
      mainButtonHandlerRef.current = onClick;
      MainButton.onClick(onClick);
    }

    if (isVisible) {
      MainButton.show();
    } else {
      MainButton.hide();
    }
  }, []);

  const hideMainButton = useCallback(() => {
    const webApp = getTelegramWebApp();
    if (!webApp?.MainButton) {
      return;
    }

    if (mainButtonHandlerRef.current) {
      webApp.MainButton.offClick(mainButtonHandlerRef.current);
      mainButtonHandlerRef.current = null;
    }
    webApp.MainButton.hideProgress();
    webApp.MainButton.hide();
  }, []);

  const setBackButton = useCallback((options = {}) => {
    const webApp = getTelegramWebApp();
    if (!webApp?.BackButton || !isTelegramVersionAtLeast(webApp, "6.1")) {
      return;
    }

    const { isVisible = true, onClick } = options;

    if (backButtonHandlerRef.current) {
      webApp.BackButton.offClick(backButtonHandlerRef.current);
      backButtonHandlerRef.current = null;
    }

    if (typeof onClick === "function") {
      backButtonHandlerRef.current = onClick;
      webApp.BackButton.onClick(onClick);
    }

    if (isVisible) {
      webApp.BackButton.show();
    } else {
      webApp.BackButton.hide();
    }
  }, []);

  const hideBackButton = useCallback(() => {
    const webApp = getTelegramWebApp();
    if (!webApp?.BackButton || !isTelegramVersionAtLeast(webApp, "6.1")) {
      return;
    }

    if (backButtonHandlerRef.current) {
      webApp.BackButton.offClick(backButtonHandlerRef.current);
      backButtonHandlerRef.current = null;
    }
    webApp.BackButton.hide();
  }, []);

  useEffect(() => () => {
    hideMainButton();
    hideBackButton();
  }, [hideBackButton, hideMainButton]);

  const contextValue = {
    ...telegramState,
    hapticImpact: (style = "light") => {
      telegramState.webApp?.HapticFeedback?.impactOccurred?.(style);
    },
    hapticNotification: (type = "success") => {
      telegramState.webApp?.HapticFeedback?.notificationOccurred?.(type);
    },
    hapticSelection: () => {
      telegramState.webApp?.HapticFeedback?.selectionChanged?.();
    },
    setMainButton,
    hideMainButton,
    setBackButton,
    hideBackButton,
    openLink: (url) => {
      if (telegramState.webApp?.openLink) {
        telegramState.webApp.openLink(url);
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    },
    close: () => {
      telegramState.webApp?.close?.();
    },
  };

  return (
    <TelegramMiniAppContext.Provider value={contextValue}>
      {children}
    </TelegramMiniAppContext.Provider>
  );
}

export function useTelegramMiniApp() {
  return useContext(TelegramMiniAppContext);
}