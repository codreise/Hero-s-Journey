import React, { useEffect, useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Sword } from "lucide-react";
import PotionIcon from "./PotionIcon";

const REPEAT_DELAY = 260;
const REPEAT_INTERVAL = 95;

const Btn = ({ ariaLabel, children, className = "", disabled, onPressEnd, onPressStart }) => (
  <button
    aria-label={ariaLabel}
    disabled={disabled}
    className={`flex items-center justify-center rounded-2xl border border-border/80 bg-card/80 shadow-lg shadow-black/15 transition-all touch-none select-none active:bg-primary/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    onContextMenu={(e) => e.preventDefault()}
    onLostPointerCapture={onPressEnd}
    onPointerCancel={onPressEnd}
    onPointerDown={(e) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      onPressStart();
    }}
    onPointerLeave={(e) => {
      if (e.pointerType === "mouse") onPressEnd();
    }}
    onPointerUp={(e) => {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      onPressEnd();
    }}
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
    if (repeatTimeoutRef.current) clearTimeout(repeatTimeoutRef.current);
    if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);
  };

  useEffect(() => () => clearTimers(), []);

  const startMove = (dir) => {
    if (disabled) return;

    clearTimers();
    onMove(dir);

    repeatTimeoutRef.current = setTimeout(() => {
      repeatIntervalRef.current = setInterval(() => {
        onMove(dir);
      }, REPEAT_INTERVAL);
    }, REPEAT_DELAY);
  };

  if (hidden) return null;

  return (
    <div className="mobile-controls md:hidden w-full shrink-0 mt-auto pb-[calc(env(safe-area-inset-bottom,0px)+6px)]">
      
      <div
        className="
        mx-auto grid w-full max-w-[640px]
        grid-cols-[minmax(150px,1fr)_minmax(80px,120px)]
        gap-x-2 gap-y-1.5
        rounded-2xl border border-border/60
        bg-card/70 px-2 py-2
        shadow-2xl backdrop-blur

        sm:grid-cols-[minmax(200px,1fr)_minmax(100px,140px)]
        sm:gap-x-4 sm:px-4 sm:py-3
      "
      >
        {/* ATTACK */}
        <div className="col-start-2 row-start-1 flex justify-end">
          <Btn
            ariaLabel="Удар"
            disabled={disabled}
            onPressEnd={clearTimers}
            onPressStart={onAttack}
            className="h-[clamp(60px,12vh,100px)] w-[clamp(60px,12vh,100px)] border-destructive/50 bg-destructive/15"
          >
            <div className="flex flex-col items-center gap-1">
              <Sword className="h-6 w-6 text-destructive" />
              <span className="font-pixel text-[9px] text-destructive">УДАР</span>
            </div>
          </Btn>
        </div>

        {/* DPAD */}
        <div className="col-start-1 row-span-2 flex items-start">
          <div
            className="
            grid grid-cols-3 grid-rows-3 gap-1.5
            rounded-[32px] border border-border/70
            bg-[linear-gradient(180deg,rgba(30,26,50,0.95),rgba(18,15,35,0.98))]
            p-2 shadow-inner

            h-[clamp(120px,20vh,180px)]
            w-[clamp(120px,20vh,180px)]
          "
          >
            <div />
            <Btn onPressStart={() => startMove("up")} onPressEnd={clearTimers} className="bg-primary/10">
              <ArrowUp />
            </Btn>
            <div />

            <Btn onPressStart={() => startMove("left")} onPressEnd={clearTimers} className="bg-primary/10">
              <ArrowLeft />
            </Btn>

            <div className="flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-primary/30" />
            </div>

            <Btn onPressStart={() => startMove("right")} onPressEnd={clearTimers} className="bg-primary/10">
              <ArrowRight />
            </Btn>

            <div />
            <Btn onPressStart={() => startMove("down")} onPressEnd={clearTimers} className="bg-primary/10">
              <ArrowDown />
            </Btn>
            <div />
          </div>
        </div>

        {/* HEAL */}
        <div className="col-start-2 row-start-2 flex flex-col items-end gap-1">
          {healingItem && (
            <Btn
              ariaLabel="Зілля"
              disabled={disabled || healingItem.count <= 0}
              onPressEnd={clearTimers}
              onPressStart={onUseHeal}
              className="h-[clamp(50px,10vh,80px)] w-[clamp(50px,10vh,80px)] border-accent/50 bg-accent/15"
            >
              <div className="flex flex-col items-center text-[8px]">
                <PotionIcon className="h-5 w-5" />
                <span>+{healingItem.heal}</span>
                <span>x{healingItem.count}</span>
              </div>
            </Btn>
          )}

          {/* ITEMS */}
          {utilityItems.length > 0 && (
            <div className="flex w-full justify-end overflow-x-auto max-h-[36px]">
              <div className="flex gap-1">
                {utilityItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onUseItem?.(item.id)}
                    className="h-7 px-2 text-[8px] rounded-lg bg-card/90"
                  >
                    {item.emoji} x{item.count}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HEIGHT ADAPTATION */}
      <style jsx>{`
        @media (max-height: 700px) {
          .mobile-controls {
            transform: scale(0.9);
          }
        }

        @media (max-height: 600px) {
          .mobile-controls {
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}