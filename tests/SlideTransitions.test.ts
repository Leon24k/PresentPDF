import { describe, it, expect } from 'vitest';
import { getTransitionClass } from '../src/lib/components/transitionHelper';

describe('Slide Transition Helper Functions', () => {
  it('returns appropriate CSS transition classes for 3D Cube', () => {
    expect(getTransitionClass('cube', 'next', 'out')).toBe('slide-cube-next-out');
    expect(getTransitionClass('cube', 'next', 'in')).toBe('slide-cube-next-in');
    expect(getTransitionClass('cube', 'prev', 'out')).toBe('slide-cube-prev-out');
    expect(getTransitionClass('cube', 'prev', 'in')).toBe('slide-cube-prev-in');
  });

  it('returns appropriate CSS transition classes for Keynote Zoom', () => {
    expect(getTransitionClass('zoom', 'next', 'out')).toBe('slide-zoom-next-out');
    expect(getTransitionClass('zoom', 'next', 'in')).toBe('slide-zoom-next-in');
    expect(getTransitionClass('zoom', 'prev', 'out')).toBe('slide-zoom-prev-out');
    expect(getTransitionClass('zoom', 'prev', 'in')).toBe('slide-zoom-prev-in');
  });

  it('returns appropriate CSS transition classes for Smooth Slide', () => {
    expect(getTransitionClass('slide', 'next', 'out')).toBe('slide-smooth-next-out');
    expect(getTransitionClass('slide', 'next', 'in')).toBe('slide-smooth-next-in');
  });

  it('returns appropriate CSS transition classes for Flip and Convex', () => {
    expect(getTransitionClass('flip', 'next', 'in')).toBe('slide-flip-next-in');
    expect(getTransitionClass('convex', 'next', 'out')).toBe('slide-convex-next-out');
    expect(getTransitionClass('fade', 'next', 'in')).toBe('slide-fade-next-in');
  });
});
