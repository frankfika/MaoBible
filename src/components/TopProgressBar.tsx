import { useEffect, useState, type RefObject } from 'react';

/**
 * Top progress bar — thin line that fills based on container scroll.
 * Position: fixed at top of viewport, behind the header.
 */
export function TopProgressBar({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      const frac = max > 0 ? el.scrollTop / max : 0;
      setPct(Math.max(0, Math.min(1, frac)));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, [containerRef]);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2px] z-30 pointer-events-none"
      aria-hidden
    >
      <div
        className="h-full bg-cinnabar transition-[width] duration-75"
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}
