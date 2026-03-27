import React from "react";
import { Heart, Home, Pause, Play, RotateCcw, Sword, Zap } from "lucide-react";
import GoldIcon from "./GoldIcon";
import PotionIcon from "./PotionIcon";

export default function GameUI({
  hp, maxHp, xp, level, coins, inventory, wave, xpNeeded,
  stats, essenceReward,
  gameOver, isPaused, phase,
  onAttack, onTogglePause, onUseItem, onRestart, onHome,
}) {
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const hpColor = hpPct > 50 ? "bg-accent" : hpPct > 25 ? "bg-primary" : "bg-destructive";
  const healingItem = inventory.find((item) => item.id === "potion");
  const utilityItems = inventory.filter((item) => item.id !== "potion");
  const actionDisabled = gameOver || isPaused || phase !== "playing";

  return (
    <div className="w-full space-y-1 sm:space-y-2">
      <div className="rounded-xl border border-border/90 bg-card/80 px-2.5 py-1.5 shadow-lg shadow-black/15 backdrop-blur-sm sm:px-3 sm:py-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Heart className="h-3 w-3 shrink-0 fill-destructive text-destructive drop-shadow-[0_0_6px_rgba(255,84,84,0.35)]" />
          <div className="h-2 flex-1 overflow-hidden rounded-full border border-black/20 bg-muted sm:h-2.5">
            <div
              className={`h-full rounded-full transition-all ${hpColor} shadow-inner`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className="min-w-[44px] text-right font-pixel text-[9px] text-foreground sm:min-w-[52px] sm:text-xs">{hp}/{maxHp}</span>
          <button
            onClick={onTogglePause}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/80 bg-muted/85 text-foreground transition-all hover:opacity-80 active:scale-95 sm:h-8 sm:w-8"
            aria-label={isPaused ? "Продовжити" : "Пауза"}
          >
            {isPaused ? <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
          </button>
          <button
            onClick={onHome}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card/90 text-muted-foreground shadow-sm shadow-black/10 transition-all hover:bg-muted active:scale-95 sm:h-8 sm:w-8"
            aria-label="Меню"
          >
            <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1 pb-0.5 sm:mt-2 sm:gap-1.5">
          <div className="flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-1.5 py-1 shadow-sm shadow-primary/10 sm:px-2">
            <GoldIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="font-pixel text-[9px] text-primary sm:text-xs">{coins}</span>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-secondary/20 bg-secondary/10 px-1.5 py-1 shadow-sm shadow-secondary/10 sm:px-2">
            <Zap className="h-3 w-3 text-secondary drop-shadow-[0_0_6px_rgba(54,214,255,0.28)]" />
            <span className="font-pixel text-[9px] text-secondary sm:text-xs">R{wave}</span>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-background/45 px-1.5 py-1 shadow-sm shadow-black/10 sm:px-2">
            <span className="font-pixel text-[9px] text-muted-foreground sm:text-xs">Lv{level}</span>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-background/45 px-1.5 py-1 shadow-sm shadow-black/10 sm:px-2">
            <span className="font-pixel text-[9px] text-muted-foreground sm:text-xs">XP {xp}/{xpNeeded}</span>
          </div>

          {healingItem && (
            <div className="flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-1.5 py-1 shadow-sm shadow-accent/10 sm:px-2">
              <PotionIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="font-pixel text-[9px] text-accent sm:text-xs">x{healingItem.count}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:flex-wrap md:overflow-visible sm:gap-2">
        <button
          onClick={onAttack}
          disabled={actionDisabled}
          className="hidden md:flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 font-pixel text-[10px] text-destructive-foreground transition-all hover:opacity-80 active:scale-95"
        >
          <Sword className="h-4 w-4" /> УДАР
        </button>

        {healingItem && (
          <button
            onClick={() => onUseItem(healingItem.id)}
            disabled={healingItem.count <= 0 || actionDisabled}
            className="hidden md:flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5 font-pixel text-[10px] text-accent shadow-sm shadow-accent/10 transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PotionIcon className="h-4 w-4 shrink-0" />
            <span>+{healingItem.heal}</span>
            <span>x{healingItem.count}</span>
          </button>
        )}

        {utilityItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onUseItem(item.id)}
            disabled={item.count <= 0 || actionDisabled}
            className="hidden min-h-8 shrink-0 items-center gap-1 rounded-xl border border-border bg-card/90 px-2 py-1.5 font-pixel text-[9px] shadow-sm shadow-black/10 transition-all hover:bg-muted active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 md:flex sm:min-h-10 sm:py-2 sm:text-[10px]"
          >
            <span>{item.emoji}</span>
            <span className="text-accent">{item.count}</span>
          </button>
        ))}
      </div>

      {gameOver && (
        <div className="space-y-4 rounded-[24px] border border-destructive/30 bg-[linear-gradient(180deg,rgba(56,20,20,0.96),rgba(24,20,42,0.98))] px-4 py-6 text-center shadow-2xl shadow-black/35">
          <p className="font-pixel text-sm text-destructive drop-shadow-[0_0_10px_rgba(255,84,84,0.2)]">ГРУ ЗАВЕРШЕНО</p>
          <p className="font-pixel text-xs text-muted-foreground">Раунд {wave} · Рівень {level} · +{essenceReward} есенції</p>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-background/25 p-3">
            <div className="rounded-xl bg-background/45 px-2 py-3">
              <p className="font-pixel text-[9px] text-muted-foreground">Золото</p>
              <p className="mt-1 font-pixel text-[11px] text-foreground">{coins}</p>
            </div>
            <div className="rounded-xl bg-background/45 px-2 py-3">
              <p className="font-pixel text-[9px] text-muted-foreground">Вороги</p>
              <p className="mt-1 font-pixel text-[11px] text-foreground">{stats?.enemiesDefeated || 0}</p>
            </div>
            <div className="rounded-xl bg-background/45 px-2 py-3">
              <p className="font-pixel text-[9px] text-muted-foreground">Боси</p>
              <p className="mt-1 font-pixel text-[11px] text-foreground">{stats?.bossesDefeated || 0}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-pixel text-xs text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:opacity-80 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" /> Знову
            </button>
            <button
              onClick={onHome}
              className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/85 px-4 py-3 font-pixel text-xs text-muted-foreground shadow-lg shadow-black/15 transition-all hover:opacity-80 active:scale-95"
            >
              <Home className="h-4 w-4" /> Меню
            </button>
          </div>
        </div>
      )}
    </div>
  );
}