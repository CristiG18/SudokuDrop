import { useEffect, useState } from "react";

interface HelperTimerProps {
  seconds: number;
  onExpire: () => void;
  onCancel: () => void;
  label: string;
}

export function HelperTimer({ seconds, onExpire, onCancel, label }: HelperTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const start = Date.now();
    const id = setInterval(() => {
      const left = seconds - (Date.now() - start) / 1000;
      if (left <= 0) {
        clearInterval(id);
        onExpire();
      } else {
        setRemaining(left);
      }
    }, 100);
    return () => clearInterval(id);
  }, [seconds, onExpire]);

  const pct = Math.max(0, (remaining / seconds) * 100);

  return (
    <div className="fixed inset-x-0 top-0 z-40 pointer-events-none">
      <div className="mx-auto mt-2 max-w-sm pointer-events-auto soft-card p-3 flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span>{label} — tap a cell</span>
            <span>{remaining.toFixed(1)}s</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-[width] duration-100"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-xs px-3 py-2 rounded-xl bg-muted font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
