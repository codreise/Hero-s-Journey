import React from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

export default function MobileControls({ onDirection }) {
  const handleTouch = (dir) => (e) => {
    e.preventDefault();
    onDirection(dir);
  };

  const btnClass =
    "w-14 h-14 rounded-xl bg-muted/60 backdrop-blur-sm border border-border/50 flex items-center justify-center active:bg-primary/30 active:scale-95 transition-all touch-none select-none";

  return (
    <div className="md:hidden flex flex-col items-center gap-1 mt-4">
      <button className={btnClass} onTouchStart={handleTouch("up")} onClick={() => onDirection("up")}>
        <ArrowUp className="w-6 h-6 text-foreground" />
      </button>
      <div className="flex gap-1">
        <button className={btnClass} onTouchStart={handleTouch("left")} onClick={() => onDirection("left")}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <button className={btnClass} onTouchStart={handleTouch("down")} onClick={() => onDirection("down")}>
          <ArrowDown className="w-6 h-6 text-foreground" />
        </button>
        <button className={btnClass} onTouchStart={handleTouch("right")} onClick={() => onDirection("right")}>
          <ArrowRight className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </div>
  );
}