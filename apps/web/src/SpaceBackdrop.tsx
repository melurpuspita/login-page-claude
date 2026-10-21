import { useMemo, type ReactNode } from "react";

const DRIFT = ["🍩", "🍣", "🍕", "🐟", "🍓", "🍙", "🍔", "🍜"];

export function SpaceBackdrop({ children }: { children?: ReactNode }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() < 0.15 ? 3 : Math.random() < 0.5 ? 2 : 1,
        delay: Math.random() * 4,
      })),
    [],
  );
  const foods = useMemo(
    () =>
      DRIFT.map((emoji, i) => ({
        emoji,
        top: 8 + ((i * 11.5) % 84),
        duration: 18 + Math.random() * 14,
        delay: -Math.random() * 30,
        size: 1.4 + Math.random() * 1.2,
      })),
    [],
  );

  return (
    <div className="space">
      <div className="space-layer" aria-hidden="true">
        <div className="nebula nebula-a" />
        <div className="nebula nebula-b" />
        {stars.map((s) => (
          <span
            key={s.id}
            className="star"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
          />
        ))}
        {foods.map((f) => (
          <span
            key={f.emoji}
            className="drift-food"
            style={{ top: `${f.top}%`, fontSize: `${f.size}rem`, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }}
          >
            {f.emoji}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}
