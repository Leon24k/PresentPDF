import { describe, it, expect, vi } from 'vitest';
import { createPresenterSync, type PresenterSyncMessage } from '../src/lib/services/presenterSync';

describe('PresenterSync Service', () => {
  it('creates a sync channel and allows subscribing and broadcasting', async () => {
    const channel1 = createPresenterSync('test-pres-123');
    const channel2 = createPresenterSync('test-pres-123');

    const receivedMessages: PresenterSyncMessage[] = [];
    const unsubscribe = channel2.subscribe((msg) => {
      receivedMessages.push(msg);
    });

    const testMsg: PresenterSyncMessage = {
      type: 'SLIDE_CHANGE',
      slide: 3,
      direction: 'next',
    };

    channel1.broadcast(testMsg);

    // Wait a brief tick for message propagation
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(receivedMessages.length).toBeGreaterThanOrEqual(1);
    expect(receivedMessages[0]).toMatchObject({
      type: 'SLIDE_CHANGE',
      slide: 3,
      direction: 'next',
    });

    unsubscribe();
    channel1.destroy();
    channel2.destroy();
  });

  it('unsubscribes cleanly so no further messages are received', async () => {
    const channel1 = createPresenterSync('test-pres-456');
    const channel2 = createPresenterSync('test-pres-456');

    const handler = vi.fn();
    const unsubscribe = channel2.subscribe(handler);

    unsubscribe();

    channel1.broadcast({
      type: 'BLACKOUT_TOGGLE',
      isBlackout: true,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(handler).not.toHaveBeenCalled();

    channel1.destroy();
    channel2.destroy();
  });

  it('handles SYNC_STATE payload structure', () => {
    const channel = createPresenterSync('test-pres-789');
    let captured: PresenterSyncMessage | null = null;
    channel.subscribe((msg) => {
      captured = msg;
    });

    const syncStateMsg: PresenterSyncMessage = {
      type: 'SYNC_STATE',
      slide: 5,
      elapsedSeconds: 120,
      isTimerRunning: true,
      isBlackout: false,
      isWhiteout: false,
    };

    channel.broadcast(syncStateMsg);
    channel.destroy();
    expect(syncStateMsg.slide).toBe(5);
  });
});
