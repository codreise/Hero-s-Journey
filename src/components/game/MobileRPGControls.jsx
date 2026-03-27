import React, { useEffect, useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Sword } from "lucide-react";
import PotionIcon from "./PotionIcon";

const REPEAT_DELAY = 260;
const REPEAT_INTERVAL = 95;

const Btn = ({ children, className = "", disabled, onPressEnd, onPressStart }) => (
  <button
    disabled={disabled}
    className={`flex items-center justify-center rounded-2xl border border-border/80 bg-card/80 shadow-lg shadow-black/15 transition-all touch-none select-none active:bg-primary/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    onPointerCancel={onPressEnd}
    onPointerDown={(e) => {
      e.preventDefault();
      onPressStart();
    }}
    onPointerLeave={onPressEnd}
    onPointerUp={onPressEnd}
  >
    {children}
  </button>
);

export default function MobileRPGControls({
  disabled = false,
  hidden = false,
  healingItem = null,
  utilityItems = [],
  onMove,
  onAttack,
  onUseHeal,
  onUseItem,
}) {
  const repeatTimeoutRef = useRef(null);
  const repeatIntervalRef = useRef(null);

  const clearTimers = () => {
    if (repeatTimeoutRef.current) {
      window.clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }

    if (repeatIntervalRef.current) {
      window.clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  };

  useEffect(() => () => clearTimers(), []);

  const startMove = (direction) => {
    if (disabled) {
      clearTimers();
      return;
    }

    clearTimers();
    onMove(direction);
    repeatTimeoutRef.current = window.setTimeout(() => {
      repeatIntervalRef.current = window.setInterval(() => {
        onMove(direction);
      }, REPEAT_INTERVAL);
    }, REPEAT_DELAY);
  };

  const triggerAttack = () => {
    if (!disabled) {
      onAttack();
    }
  };

  const triggerHeal = () => {
    if (!disabled && healingItem?.count > 0) {
      onUseHeal?.();
    }
  };

  if (hidden) {
    return null;
  }

  return (
    <div className="md:hidden mt-0.5 w-full shrink-0 pb-[calc(env(safe-area-inset-bottom,0px)+4px)]">
      <div className="mx-auto grid w-full max-w-[560px] grid-cols-[1fr_minmax(148px,248px)] gap-x-4 gap-y-1 rounded-[26px] border border-border/60 bg-card/76 px-4 py-2 shadow-2xl shadow-black/25 backdrop-blur sm:px-5 sm:py-3">
        <div className="col-start-2 row-start-1 flex justify-end">
          <Btn disabled={disabled} onPressEnd={clearTimers} onPressStart={triggerAttack} className="h-[84px] w-[84px] border-destructive/50 bg-destructive/15 sm:h-[92px] sm:w-[92px]">
            <div className="flex flex-col items-center gap-1.5">
              <Sword className="h-7 w-7 text-destructive sm:h-8 sm:w-8" />
              <span className="font-pixel text-[10px] text-destructive sm:text-[11px]">УДАР</span>
            </div>
          </Btn>
        </div>

        <div className="col-start-1 row-span-2 row-start-1 flex items-start justify-start pt-1">
          <div className="grid h-[156px] w-[156px] shrink-0 grid-cols-3 grid-rows-3 gap-1 rounded-[40px] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),rgba(255,255,255,0)_60%),linear-gradient(180deg,rgba(30,26,50,0.94),rgba(18,15,35,0.96))] p-3 shadow-inner shadow-black/25 sm:h-[168px] sm:w-[168px] sm:gap-1.5">
            <div />
            <Btn disabled={disabled} onPressEnd={clearTimers} onPressStart={() => startMove("up")} className="h-full w-full rounded-2xl border-primary/20 bg-primary/10">
              <ArrowUp className="h-6 w-6 text-foreground sm:h-7 sm:w-7" />
            </Btn>
            <div />
            <Btn disabled={disabled} onPressEnd={clearTimers} onPressStart={() => startMove("left")} className="h-full w-full rounded-2xl border-primary/20 bg-primary/10">
              <ArrowLeft className="h-6 w-6 text-foreground sm:h-7 sm:w-7" />
            </Btn>
            <div className="flex items-center justify-center rounded-2xl border border-primary/10 bg-primary/5">
              <div className="h-5 w-5 rounded-full bg-primary/30 sm:h-6 sm:w-6" />
            </div>
            <Btn disabled={disabled} onPressEnd={clearTimers} onPressStart={() => startMove("right")} className="h-full w-full rounded-2xl border-primary/20 bg-primary/10">
              <ArrowRight className="h-6 w-6 text-foreground sm:h-7 sm:w-7" />
            </Btn>
            <div />
            <Btn disabled={disabled} onPressEnd={clearTimers} onPressStart={() => startMove("down")} className="h-full w-full rounded-2xl border-primary/20 bg-primary/10">
              <ArrowDown className="h-6 w-6 text-foreground sm:h-7 sm:w-7" />
            </Btn>
            <div />
          </div>
        </div>

        <div className="col-start-2 row-start-2 flex min-w-0 flex-col items-end gap-1.5">
          {healingItem && (
            <Btn
              disabled={disabled || healingItem.count <= 0}
              onPressEnd={clearTimers}
              onPressStart={triggerHeal}
              className="h-[84px] w-[84px] border-accent/50 bg-accent/15 sm:h-[92px] sm:w-[92px]"
            >
              <div className="flex flex-col items-center gap-1">
                <PotionIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                <span className="font-pixel text-[9px] leading-none text-accent">+{healingItem.heal}</span>
                <span className="font-pixel text-[9px] leading-none text-accent">x{healingItem.count}</span>
              </div>
            </Btn>
          )}

          <div className="w-full" />

            {utilityItems.length > 0 && (
              <div className="flex w-full justify-end overflow-x-auto pb-0.5">
                <div className="flex gap-1.5 pl-2 pr-1">
                  {utilityItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onUseItem?.(item.id)}
                      disabled={disabled || item.count <= 0}
                      className="flex h-8 shrink-0 items-center gap-1 rounded-xl border border-border/80 bg-card/90 px-2 font-pixel text-[9px] text-foreground shadow-sm shadow-black/10 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span>{item.emoji}</span>
                      <span className="text-accent">x{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}