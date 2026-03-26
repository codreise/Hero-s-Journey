import React from "react";
import { Heart, Home, Pause, Play, RotateCcw, Star, Sword, Zap } from "lucide-react";
import GoldIcon from "./GoldIcon";
import PotionIcon from "./PotionIcon";

export default function GameUI({
  hp, maxHp, xp, level, coins, inventory, wave, xpNeeded,
  countdownValue,
  gameOver, isPaused, levelUp, phase,
  onAttack, onTogglePause, onUseItem, onRestart, onHome,
}) {
  const hpPct = Math.max(0, (hp / maxHp) * 100);
  const xpPct = Math.max(0, (xp / xpNeeded) * 100);
  const hpColor = hpPct > 50 ? "bg-accent" : hpPct > 25 ? "bg-primary" : "bg-destructive";
  const healingItem = inventory.find((item) => item.id === "potion");
  const utilityItems = inventory.filter((item) => item.id !== "potion");

  return (
    <div className="w-full space-y-2">
      <div className="rounded-xl border border-border/90 bg-card/90 px-3 py-2 shadow-lg shadow-black/15 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3 shrink-0 text-destructive fill-destructive drop-shadow-[0_0_6px_rgba(255,84,84,0.35)]" />
          <div className="flex-1 h-3 overflow-hidden rounded-full border border-black/20 bg-muted">
            <div
              className={`h-full rounded-full transition-all ${hpColor} shadow-inner`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className="font-pixel text-xs text-foreground ml-1">{hp}/{maxHp}</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 shadow-sm shadow-primary/10">
            <GoldIcon className="h-4 w-4 shrink-0" />
            <span className="font-pixel text-[10px] text-primary sm:text-xs">{coins}</span>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-secondary/20 bg-secondary/10 px-2 py-1 shadow-sm shadow-secondary/10">
            <Zap className="w-3 h-3 text-secondary drop-shadow-[0_0_6px_rgba(54,214,255,0.28)]" />
            <span className="font-pixel text-[10px] text-secondary sm:text-xs">W{wave}</span>
          </div>

          <button
            onClick={onTogglePause}
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/85 px-2 py-1 font-pixel text-[10px] text-foreground transition-all hover:opacity-80 active:scale-95"
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            <span className="hidden sm:inline">{isPaused ? "ПУСК" : "ПАУЗА"}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border/90 bg-card/90 px-3 py-2 shadow-lg shadow-black/15 backdrop-blur-sm">
        <Star className="w-3 h-3 shrink-0 fill-primary/35 text-primary drop-shadow-[0_0_8px_rgba(255,210,92,0.24)]" />
        <span className="font-pixel text-[10px] text-primary mr-1 sm:text-xs">Lv{level}</span>
        <div className="flex-1 h-2 overflow-hidden rounded-full border border-black/20 bg-muted">
          <div
            className="h-full rounded-full bg-secondary transition-all shadow-inner"
            style={{ width: `${xpPct}%` }}
          />
        </div>
        <span className="font-pixel text-[10px] text-muted-foreground ml-1 sm:text-xs">{xp}/{xpNeeded}</span>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={onAttack}
          disabled={gameOver || isPaused || phase !== "playing"}
          className="hidden md:flex bg-destructive text-destructive-foreground font-pixel text-xs px-4 py-3 rounded-xl hover:opacity-80 active:scale-95 transition-all items-center gap-2 shrink-0"
        >
          <Sword className="w-4 h-4" /> УДАР
        </button>

        {healingItem && (
          <button
            onClick={() => onUseItem(healingItem.id)}
            disabled={healingItem.count <= 0 || gameOver || isPaused || phase !== "playing"}
            className="hidden md:flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-3 font-pixel text-xs text-accent shadow-sm shadow-accent/10 transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
            disabled={item.count <= 0 || gameOver || isPaused || phase !== "playing"}
            className="flex items-center gap-1 rounded-xl border border-border bg-card/90 px-2 py-2 font-pixel text-[10px] shadow-sm shadow-black/10 transition-all hover:bg-muted active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-3 sm:text-xs"
          >
            <span>{item.emoji}</span>
            <span className="text-accent">{item.count}</span>
          </button>
        ))}

        <button
          onClick={onHome}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 font-pixel text-[10px] text-muted-foreground shadow-sm shadow-black/10 transition-all hover:bg-muted active:scale-95 sm:py-3 sm:text-xs"
        >
          <Home className="h-4 w-4" /> МЕНЮ
        </button>
      </div>

      {/* Level up banner */}
      {levelUp && (
        <div className="animate-float rounded-xl border border-primary bg-primary/20 px-4 py-2 text-center shadow-lg shadow-primary/10">
          <span className="font-pixel text-xs text-primary">⭐ РІВЕНЬ {level}! ⭐</span>
        </div>
      )}

      {isPaused && !gameOver && (
        <div className="rounded-xl border border-secondary/40 bg-[linear-gradient(180deg,rgba(30,62,70,0.88),rgba(22,34,52,0.92))] px-4 py-3 text-center shadow-lg shadow-secondary/10 backdrop-blur-sm">
          <span className="font-pixel text-[10px] text-secondary sm:text-xs">ГРУ ПРИЗУПИНЕНО · ESC або кнопка ПАУЗА</span>
        </div>
      )}

      {phase === "reward" && !gameOver && (
        <div className="rounded-xl border border-primary/40 bg-[linear-gradient(180deg,rgba(69,54,22,0.88),rgba(35,27,51,0.94))] px-4 py-3 text-center shadow-lg shadow-primary/10 backdrop-blur-sm">
          <span className="font-pixel text-[10px] text-primary sm:text-xs">ХВИЛЮ ОЧИЩЕНО · ОБЕРІТЬ НАГОРОДУ</span>
        </div>
      )}

      {phase === "bossIntro" && !gameOver && (
        <div className="rounded-xl border border-destructive/40 bg-[linear-gradient(180deg,rgba(73,25,25,0.9),rgba(35,23,46,0.94))] px-4 py-3 text-center shadow-lg shadow-destructive/10 backdrop-blur-sm">
          <span className="font-pixel text-[10px] text-destructive sm:text-xs">УВАГА · ПОЧИНАЄТЬСЯ БІЙ З БОСОМ</span>
        </div>
      )}

      {phase === "countdown" && !gameOver && (
        <div className="rounded-xl border border-accent/40 bg-[linear-gradient(180deg,rgba(20,70,58,0.88),rgba(24,33,50,0.94))] px-4 py-3 text-center shadow-lg shadow-accent/10 backdrop-blur-sm">
          <span className="font-pixel text-[10px] text-accent sm:text-xs">ПІДГОТОВКА ДО БОЮ · {countdownValue || 0} СЕКУНДИ</span>
        </div>
      )}

      {/* Game over overlay */}
      {gameOver && (
        <div className="space-y-4 rounded-[24px] border border-destructive/30 bg-[linear-gradient(180deg,rgba(56,20,20,0.96),rgba(24,20,42,0.98))] px-4 py-6 text-center shadow-2xl shadow-black/35">
          <p className="font-pixel text-sm text-destructive drop-shadow-[0_0_10px_rgba(255,84,84,0.2)]">ГРУ ЗАВЕРШЕНО</p>
          <p className="font-pixel text-xs text-muted-foreground">Рівень {level} · {coins} золота</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-pixel text-xs text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:opacity-80 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Знову
            </button>
            <button
              onClick={onHome}
              className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/85 px-4 py-3 font-pixel text-xs text-muted-foreground shadow-lg shadow-black/15 transition-all hover:opacity-80 active:scale-95"
            >
              <Home className="w-4 h-4" /> Меню
            </button>
          </div>
        </div>
      )}
    </div>
  );
}