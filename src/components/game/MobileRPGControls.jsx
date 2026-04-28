import React, { useEffect, useRef } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Sword } from "lucide-react";
import PotionIcon from "./PotionIcon";

/* ================= BUTTON ================= */

const Btn = ({ ariaLabel, children, className = "", disabled, onPressEnd, onPressStart }) => (
  <button
    aria-label={ariaLabel}
    disabled={disabled}
    className={`flex items-center justify-center rounded-2xl border border-border/80 bg-card/80 shadow-lg transition-all touch-none select-none active:scale-95 disabled:opacity-40 ${className}`}
    onContextMenu={(e) => e.preventDefault()}
    onPointerDown={(e) => {
      e.preventDefault();
      onPressStart();
    }}
    onPointerUp={onPressEnd}
    onPointerCancel={onPressEnd}
  >
    {children}
  </button>
);

/* ================= CONTROLS ================= */

export function MobileRPGControls({
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
    clearTimeout(repeatTimeoutRef.current);
    clearInterval(repeatIntervalRef.current);
  };

  useEffect(() => () => clearTimers(), []);

  const startMove = (dir) => {
    if (disabled) return;

    clearTimers();
    onMove(dir);

    repeatTimeoutRef.current = setTimeout(() => {
      repeatIntervalRef.current = setInterval(() => {
        onMove(dir);
      }, 95);
    }, 260);
  };

  if (hidden) return null;

  return (
    <div className="mobile-controls md:hidden w-full mt-auto pb-[calc(env(safe-area-inset-bottom,0px)+6px)]">
      <div className="mx-auto grid w-full max-w-[640px] grid-cols-2 gap-2 rounded-2xl border bg-card/70 p-2 shadow-2xl">

        {/* ATTACK */}
        <div className="flex justify-end">
          <Btn onPressStart={onAttack} onPressEnd={clearTimers} disabled={disabled}
            className="h-[clamp(60px,12vh,100px)] w-[clamp(60px,12vh,100px)] bg-destructive/20">
            <div className="flex flex-col items-center gap-1">
              <Sword />
              <span className="text-[9px]">УДАР</span>
            </div>
          </Btn>
        </div>

        {/* DPAD */}
        <div className="grid grid-cols-3 gap-1.5">
          <div />
          <Btn onPressStart={() => startMove("up")} onPressEnd={clearTimers}><ArrowUp /></Btn>
          <div />

          <Btn onPressStart={() => startMove("left")} onPressEnd={clearTimers}><ArrowLeft /></Btn>
          <div />
          <Btn onPressStart={() => startMove("right")} onPressEnd={clearTimers}><ArrowRight /></Btn>

          <div />
          <Btn onPressStart={() => startMove("down")} onPressEnd={clearTimers}><ArrowDown /></Btn>
          <div />
        </div>

        {/* HEAL */}
        {healingItem && (
          <Btn onPressStart={onUseHeal} onPressEnd={clearTimers}>
            <PotionIcon />
            <span>x{healingItem.count}</span>
          </Btn>
        )}

        {/* ITEMS */}
        {utilityItems.length > 0 && (
          <div className="flex gap-1 overflow-x-auto">
            {utilityItems.map((item) => (
              <button key={item.id} onClick={() => onUseItem?.(item.id)}>
                {item.emoji} x{item.count}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* HEIGHT ADAPTATION */}
      <style jsx>{`
        @media (max-height: 700px) {
          .mobile-controls { transform: scale(0.9); }
        }
        @media (max-height: 600px) {
          .mobile-controls { transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

/* ================= MAIN GAME ================= */

export default function RPGGame(props) {
  const {
    uiState,
    togglePause,
    handleHome,
    gameOver,
    isPaused,
    effectivePhase,
    onRestart,
    claimReward,
    chooseReward,
    rewardSelectedId,
    startBossBattle,
    canvasRef,
    canvasViewportRef,
    canvasSize,
    canvasDisplaySize,
    movePlayerWithAutoAttack,
    attack,
    handleUseItem,
  } = props;

  return (
    <div className="game-screen">
      <div className="game-layout">

        {/* HUD */}
        <div className="hud">
          <GameUI
            {...uiState}
            onPause={togglePause}
            onHome={handleHome}
            gameOver={gameOver}
            isPaused={isPaused}
            phase={effectivePhase}
            onRestart={onRestart}
            onClaimReward={claimReward}
            onChooseReward={chooseReward}
            rewardSelectedId={rewardSelectedId}
            onStartBoss={startBossBattle}
          />
        </div>

        {/* CANVAS */}
        <div ref={canvasViewportRef} className="canvas-container">
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{
              width: canvasDisplaySize.w,
              height: canvasDisplaySize.h,
            }}
          />
        </div>

        {/* CONTROLS */}
        <MobileRPGControls
          disabled={gameOver || isPaused || effectivePhase !== "playing"}
          onMove={movePlayerWithAutoAttack}
          onAttack={attack}
          onUseHeal={() => handleUseItem("potion")}
          onUseItem={handleUseItem}
          healingItem={uiState?.inventory?.find(i => i.id === "potion")}
          utilityItems={uiState?.inventory?.filter(i => i.id !== "potion") || []}
        />

      </div>
    </div>
  );
}