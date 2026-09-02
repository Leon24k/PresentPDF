import { describe, it, expect } from 'vitest';
import { formatTimeRemaining } from '../src/lib/components/timeHelper';

describe('Presenter Tools and Expiration Formatter', () => {
  it('formats remaining countdown correctly', () => {
    const target = Date.now() + (1 * 3600 + 2 * 60 + 45) * 1000;
    const formatted = formatTimeRemaining(target);
    expect(formatted).toMatch(/01h 02m/);
  });

  it('handles expired time gracefully', () => {
    const expiredTarget = Date.now() - 1000;
    const formatted = formatTimeRemaining(expiredTarget);
    expect(formatted).toBe('Expired');
  });
});
