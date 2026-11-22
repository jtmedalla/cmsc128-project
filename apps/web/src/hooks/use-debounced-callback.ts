import { useEffect, useMemo, useRef } from 'react';

/**
 * `callback`, called only once `ms` pass without another call. `cancel` drops
 * a pending call; one is also dropped on unmount.
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  ms: number,
) {
  const latest = useRef(callback);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(() => () => clearTimeout(timer.current), []);

  return useMemo(() => {
    const debounced = (...args: A) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => latest.current(...args), ms);
    };
    debounced.cancel = () => clearTimeout(timer.current);
    return debounced;
  }, [ms]);
}
