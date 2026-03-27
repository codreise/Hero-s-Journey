import React from "react";
import { Play, Trophy } from "lucide-react";

export default function StartScreen({
  onStart,
  onContinue,
  hasSavedGame,
  isSaveLoading,
  profile,
  saveError,
  savedGame,
}) {
  const safeProfile = profile || { essence: 0, totalGold: 0, bestWave: 1, runsPlayed: 0, bossesDefeated: 0 };

  return (
    <div className="w-full max-w-xl rounded-[28px] border border-border/70 bg-card/85 px-5 py-6 shadow-2xl shadow-black/30 backdrop-blur sm:px-7 sm:py-7">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="font-pixel text-[10px] uppercase tracking-[0.35em] text-primary/80 sm:text-xs">Arcade RPG</p>
          <h1 className="font-pixel text-xl leading-relaxed text-foreground sm:text-2xl">Hero’s Journey</h1>
          <div className="space-y-1 pt-1">
            <p className="font-pixel text-[10px] text-muted-foreground sm:text-xs">Перемагай ворогів, збирай золото, проходь далі.</p>
            <p className="font-pixel text-[9px] text-muted-foreground/85 sm:text-[10px]">Рух: WASD або стрілки. Удар: пробіл. Пауза: P або Esc.</p>
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

        <div className="rounded-2xl border border-border bg-background/35 p-4 text-left">
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
            <div className="rounded-xl bg-background/50 px-3 py-3">
              <p className="font-pixel text-[9px] text-muted-foreground">Есенція</p>
              <p className="mt-1 font-pixel text-[11px] text-foreground">{safeProfile.essence}</p>
            </div>
            <div className="rounded-xl bg-background/50 px-3 py-3">
              <p className="font-pixel text-[9px] text-muted-foreground">Раунд</p>
              <p className="mt-1 font-pixel text-[11px] text-foreground">{safeProfile.bestWave}</p>
            </div>
            <div className="rounded-xl bg-background/50 px-3 py-3 col-span-2 sm:col-span-1">
              <p className="font-pixel text-[9px] text-muted-foreground">Золото</p>
              <p className="mt-1 font-pixel text-[11px] text-foreground">{safeProfile.totalGold}</p>
            </div>
          </div>

          {hasSavedGame && savedGame?.player && (
            <div className="mt-3 rounded-xl border border-primary/25 bg-primary/10 px-3 py-3">
              <p className="font-pixel text-[10px] text-primary sm:text-xs">Продовжити збереження</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 font-pixel text-[10px] text-muted-foreground sm:text-xs">
                <span>Рівень {savedGame.player.level}</span>
                <span>Раунд {savedGame.wave}</span>
                <span>{savedGame.player.coins} монет</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}