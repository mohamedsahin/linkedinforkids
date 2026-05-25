"use client";

import { useEffect, useState } from "react";

type Piece = {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
  shape: "square" | "circle" | "triangle";
};

const COLORS = ["#3B82F6", "#FBBF24", "#10B981", "#A855F7", "#06B6D4", "#EF4444"];

export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const next: Piece[] = Array.from({ length: 36 }, (_, i) => ({
      id: trigger * 1000 + i,
      x: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.4 + Math.random() * 1.2,
      rotate: Math.random() * 360,
      color: COLORS[i % COLORS.length],
      shape: (["square", "circle", "triangle"] as const)[i % 3],
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPieces(next);
    const handle = setTimeout(() => setPieces([]), 3000);
    return () => clearTimeout(handle);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 80,
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-12px",
            width: 10,
            height: p.shape === "triangle" ? 0 : 10,
            background: p.shape === "triangle" ? "transparent" : p.color,
            borderRadius: p.shape === "circle" ? "50%" : 2,
            borderLeft: p.shape === "triangle" ? "6px solid transparent" : undefined,
            borderRight: p.shape === "triangle" ? "6px solid transparent" : undefined,
            borderBottom:
              p.shape === "triangle" ? `10px solid ${p.color}` : undefined,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
