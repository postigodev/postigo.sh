import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { Bounds } from './types';

export function useDesktopWorkspace(onChange: (workspace: Bounds) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const [workspace, setWorkspace] = useState<Bounds>({ x: 0, y: 0, width: 1, height: 1 });
  const [compact, setCompact] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const media = matchMedia('(max-width: 768px)');
    const measure = () => {
      const rect = element.getBoundingClientRect();
      const next = { x: 0, y: 0, width: rect.width, height: rect.height };
      setWorkspace(next);
      setCompact(media.matches);
      onChange(next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    media.addEventListener('change', measure);
    measure();
    return () => {
      observer.disconnect();
      media.removeEventListener('change', measure);
    };
  }, [onChange]);

  return { ref, workspace, compact };
}
