// ─────────────────────────────────────────────
// Scroll & Performance Optimization Utilities
// ─────────────────────────────────────────────

/**
 * Debounce — delays a function until after `wait` ms of inactivity.
 * Useful for scroll/resize handlers to prevent too-frequent re-renders.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, wait);
  };
}

/**
 * Throttle — ensures a function runs at most once every `limit` ms.
 * Useful for scroll handlers where you still want frequent updates
 * but want to cap the rate.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= limit) {
      last = now;
      fn(...args);
    }
  };
}

/**
 * Returns CSS properties that promote GPU-accelerated compositing,
 * which reduces paint and layout costs during scroll.
 */
export function gpuAcceleratedStyle(): React.CSSProperties {
  return {
    willChange: "transform",
    transform: "translateZ(0)",
  };
}
