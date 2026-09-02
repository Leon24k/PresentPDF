import type { TransitionStyle } from '../types';

export function getTransitionClass(
  style: TransitionStyle,
  direction: 'next' | 'prev',
  phase: 'in' | 'out'
): string {
  const map: Record<TransitionStyle, string> = {
    cube: 'slide-cube',
    zoom: 'slide-zoom',
    slide: 'slide-smooth',
    flip: 'slide-flip',
    convex: 'slide-convex',
    fade: 'slide-fade',
  };

  const prefix = map[style] || 'slide-cube';
  return `${prefix}-${direction}-${phase}`;
}
