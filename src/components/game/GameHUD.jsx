import React from "react";
import { Trophy, Heart, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GameHUD({ score, lives, highScore, gameOver, onRestart }) {
  return (
    <div className="w-full max-w-lg mx-auto px-2">
      <div className="flex items-center justify-between mb-3">
        {/* Score */}
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
          <Star className="w-4 h-4 text-primary" />
          <span className="font-pixel text-xs text-primary">{score}</span>
        </div>

        {/* Lives */}
        <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 transition-all ${
                i < lives ? "text-destructive fill-destructive" : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* High Score */}
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
          <Trophy className="w-4 h-4 text-accent" />
          <span className="font-pixel text-xs text-accent">{highScore}</span>
        </div>
      </div>

      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/70 backdrop-blur-sm rounded-xl">
          <div className="text-center space-y-4">
            <h2 className="font-pixel text-lg text-destructive">Гру завершено!</h2>
            <p className="font-pixel text-xs text-primary">Рахунок: {score}</p>
            {score >= highScore && score > 0 && (
              <p className="font-pixel text-xs text-accent animate-float">🎉 Новий рекорд!</p>
            )}
            <Button
              onClick={onRestart}
              className="bg-primary text-primary-foreground font-pixel text-xs px-6 py-3 hover:bg-primary/80"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Грати знову
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}