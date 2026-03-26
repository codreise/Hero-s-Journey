import React from "react";
import { Play, Trophy } from "lucide-react";
import { META_UPGRADES, getMetaUpgradeCost } from "./useRPGState";
import { useTelegramMiniApp } from "../../lib/telegram-mini-app";

export default function StartScreen({
  onStart,
  onContinue,
  onUpgradeMeta,
  hasSavedGame,
  isSaveLoading,
  profile,
  saveError,
  savedGame,
  saveSource,
}) {
  const { isTelegram } = useTelegramMiniApp();
  const safeProfile = profile || { essence: 0, totalGold: 0, bestWave: 1, runsPlayed: 0, bossesDefeated: 0, upgrades: {} };
  const upgradeItems = Object.values(META_UPGRADES);

  return (
    <div className="w-full max-w-2xl rounded-[28px] border border-border/70 bg-card/85 px-4 py-5 shadow-2xl shadow-black/30 backdrop-blur sm:px-6 sm:py-6">
      <div className="space-y-5">
        <div className="space-y-3 text-center">
          <p className="font-pixel text-[10px] uppercase tracking-[0.35em] text-primary/80 sm:text-xs">Arcade RPG</p>
          <div className="space-y-2">
            <h1 className="font-pixel text-xl leading-relaxed text-foreground sm:text-2xl">Hero’s Journey</h1>
            <p className="mx-auto max-w-lg font-pixel text-[10px] leading-5 text-muted-foreground sm:text-xs">
              Короткі забіги, раунди ворогів, боси та постійний прогрес між спробами.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="rounded-full border border-border/80 bg-background/50 px-3 py-1 font-pixel text-[9px] text-muted-foreground sm:text-[10px]">
              {isTelegram ? "Telegram" : "Web"}
            </span>
            <span className="rounded-full border border-border/80 bg-background/50 px-3 py-1 font-pixel text-[9px] text-muted-foreground sm:text-[10px]">
              Збереження: {saveSource === "server" ? "серверне" : "локальне"}
            </span>
            {hasSavedGame && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-pixel text-[9px] text-primary sm:text-[10px]">
                Є активний забіг
              </span>
            )}
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-sm gap-3">
            <button
              onClick={onStart}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-pixel text-[11px] text-primary-foreground transition-all hover:opacity-90 active:scale-95 sm:text-sm"
            >
              <Play className="h-4 w-4" />
              НОВА ГРА
            </button>

            {hasSavedGame && (
              <button
                onClick={onContinue}
                className="flex items-center justify-center gap-2 rounded-xl border border-secondary/40 bg-secondary/15 px-5 py-4 font-pixel text-[11px] text-secondary transition-all hover:bg-secondary/20 active:scale-95 sm:text-sm"
              >
                <Trophy className="h-4 w-4" />
                ПРОДОВЖИТИ
              </button>
            )}

            {isSaveLoading && (
              <div className="rounded-xl border border-border bg-background/35 px-4 py-3 text-center font-pixel text-[10px] text-muted-foreground sm:text-xs">
                Завантаження збереження...
              </div>
            )}

            {saveError && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center font-pixel text-[10px] text-destructive sm:text-xs">
                {saveError}
              </div>
            )}
        </div>

        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-border bg-background/35 p-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <p className="font-pixel text-[10px] text-accent sm:text-xs">Прогрес</p>
              <p className="font-pixel text-[10px] text-foreground sm:text-xs">Есенція: {safeProfile.essence}</p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-background/50 px-2 py-3">
                <p className="font-pixel text-[9px] text-muted-foreground">Раунд</p>
                <p className="mt-1 font-pixel text-[11px] text-foreground">{safeProfile.bestWave}</p>
              </div>
              <div className="rounded-xl bg-background/50 px-2 py-3">
                <p className="font-pixel text-[9px] text-muted-foreground">Забіги</p>
                <p className="mt-1 font-pixel text-[11px] text-foreground">{safeProfile.runsPlayed}</p>
              </div>
              <div className="rounded-xl bg-background/50 px-2 py-3">
                <p className="font-pixel text-[9px] text-muted-foreground">Боси</p>
                <p className="mt-1 font-pixel text-[11px] text-foreground">{safeProfile.bossesDefeated}</p>
              </div>
            </div>

            {hasSavedGame && savedGame?.player && (
              <div className="mt-3 rounded-xl border border-primary/25 bg-primary/10 px-3 py-3">
                <p className="font-pixel text-[10px] text-primary sm:text-xs">Останній забіг</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 font-pixel text-[10px] text-muted-foreground sm:text-xs">
                  <span>Рівень {savedGame.player.level}</span>
                  <span>Раунд {savedGame.wave}</span>
                  <span>{savedGame.player.coins} монет</span>
                </div>
              </div>
            )}

            <p className="mt-3 font-pixel text-[10px] leading-5 text-muted-foreground sm:text-xs">
              Керування: WASD або стрілки для руху, пробіл для удару, P або Esc для паузи.
            </p>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-left">
            <div className="flex items-center justify-between gap-3">
              <p className="font-pixel text-[10px] text-accent sm:text-xs">Покращення табору</p>
              <p className="font-pixel text-[9px] text-muted-foreground sm:text-[10px]">Постійні бонуси</p>
            </div>

            <div className="mt-3 space-y-2">
              {upgradeItems.map((upgrade) => {
                const level = safeProfile.upgrades?.[upgrade.id] || 0;
                const cost = getMetaUpgradeCost(upgrade.id, level);
                const canUpgrade = level < upgrade.maxLevel && safeProfile.essence >= cost;

                return (
                  <button
                    key={upgrade.id}
                    onClick={() => onUpgradeMeta?.(upgrade.id)}
                    disabled={!canUpgrade}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/45 px-3 py-3 text-left transition-all hover:bg-background/65 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <div>
                      <p className="font-pixel text-[10px] text-foreground sm:text-xs">{upgrade.title}</p>
                      <p className="mt-1 font-pixel text-[9px] leading-4 text-muted-foreground sm:text-[10px]">
                        {level}/{upgrade.maxLevel} · {upgrade.description}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg border border-accent/30 bg-accent/10 px-2 py-1 font-pixel text-[9px] text-accent sm:text-[10px]">
                      {level >= upgrade.maxLevel ? "MAX" : `${cost} ес.`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}