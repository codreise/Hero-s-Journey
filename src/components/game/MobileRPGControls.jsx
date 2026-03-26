import React, { useEffect, useRef } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sword } from "lucide-react";
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

export default function MobileRPGControls({ disabled = false, hidden = false, healingItem = null, onMove, onAttack, onUseHeal }) {
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
    <div className="md:hidden mt-2 w-full shrink-0 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
      <div className="mx-auto flex max-w-[408px] items-end justify-between gap-2.5 rounded-[24px] border border-border/60 bg-card/76 px-2 py-2 shadow-2xl shadow-black/25 backdrop-blur">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <div />
        <Btn disabled={disabled} onPressEnd={clearTimers} onPressStart={() => startMove("up")} className="h-12 w-12 sm:h-14 sm:w-14">
          <ArrowUp className="h-5 w-5 text-foreground sm:h-6 sm:w-6" />
        </Btn>
        <div />
        <Btn disabled={disabled} onPressEnd={clearTimers} onPressStart={() => startMove("left")} className="h-12 w-12 sm:h-14 sm:w-14">
          <ArrowLeft className="h-5 w-5 text-foreground sm:h-6 sm:w-6" />
        </Btn>
        <div />
        <Btn disabled={disabled} onPressEnd={clearTimers} onPressStart={() => startMove("right")} className="h-12 w-12 sm:h-14 sm:w-14">
          <ArrowRight className="h-5 w-5 text-foreground sm:h-6 sm:w-6" />
        </Btn>
        <div />
        <Btn disabled={disabled} onPressEnd={clearTimers} onPressStart={() => startMove("down")} className="h-12 w-12 sm:h-14 sm:w-14">
          <ArrowDown className="h-5 w-5 text-foreground sm:h-6 sm:w-6" />
        </Btn>
        <div />
        </div>

        <div className="flex items-end gap-2">
          {healingItem && (
            <Btn
              disabled={disabled || healingItem.count <= 0}
              onPressEnd={clearTimers}
              onPressStart={triggerHeal}
              className="h-16 w-14 border-accent/50 bg-accent/15 sm:h-20 sm:w-16"
            >
              <div className="flex flex-col items-center gap-1">
                <PotionIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-pixel text-[8px] leading-none text-accent">+{healingItem.heal}</span>
                <span className="font-pixel text-[8px] leading-none text-accent">x{healingItem.count}</span>
              </div>
            </Btn>
          )}

          <Btn disabled={disabled} onPressEnd={clearTimers} onPressStart={triggerAttack} className="h-16 w-16 border-destructive/50 bg-destructive/15 sm:h-20 sm:w-20">
            <div className="flex flex-col items-center gap-1">
              <Sword className="h-6 w-6 text-destructive sm:h-7 sm:w-7" />
              <span className="font-pixel text-[9px] leading-none text-destructive">УДАР</span>
            </div>
          </Btn>
        </div>
      </div>
    </div>
  );
}