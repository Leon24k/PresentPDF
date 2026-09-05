export type PresenterSyncMessage =
  | { type: 'SLIDE_CHANGE'; slide: number; direction: 'next' | 'prev' }
  | { type: 'BLACKOUT_TOGGLE'; isBlackout: boolean }
  | { type: 'WHITEOUT_TOGGLE'; isWhiteout: boolean }
  | { type: 'TIMER_ACTION'; action: 'start' | 'stop' | 'reset' | 'sync'; elapsedSeconds?: number }
  | { type: 'REQUEST_SYNC' }
  | {
      type: 'SYNC_STATE';
      slide: number;
      elapsedSeconds: number;
      isTimerRunning: boolean;
      isBlackout: boolean;
      isWhiteout: boolean;
    };

export type MessageHandler = (msg: PresenterSyncMessage) => void;

export class PresenterSyncChannel {
  private channelName: string;
  private channel: BroadcastChannel | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private storageKey: string;
  private isDestroyed = false;

  constructor(presentationId: string) {
    this.channelName = `presentpdf_sync_${presentationId}`;
    this.storageKey = `presentpdf_sync_storage_${presentationId}`;

    // Initialize BroadcastChannel if available
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event: MessageEvent) => {
          if (this.isDestroyed) return;
          this.notifyHandlers(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization failed, falling back to localStorage sync', e);
      }
    }

    // Storage fallback for cross-window sync
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
    }
  }

  private handleStorageEvent = (e: StorageEvent) => {
    if (this.isDestroyed || e.key !== this.storageKey || !e.newValue) return;
    try {
      const data = JSON.parse(e.newValue);
      this.notifyHandlers(data);
    } catch {
      // ignore parse errors
    }
  };

  private notifyHandlers(msg: PresenterSyncMessage) {
    for (const handler of this.handlers) {
      try {
        handler(msg);
      } catch (err) {
        console.error('Error in PresenterSync handler:', err);
      }
    }
  }

  public subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public broadcast(msg: PresenterSyncMessage) {
    if (this.isDestroyed) return;

    // Send via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.warn('BroadcastChannel postMessage error:', e);
      }
    }

    // Mirror to localStorage fallback (with timestamp to trigger storage event in other windows)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(
          this.storageKey,
          JSON.stringify({ ...msg, _t: Date.now() + Math.random() })
        );
      } catch {
        // ignore quota / private mode storage error
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.handlers.clear();

    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // ignore
      }
      this.channel = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
  }
}

/**
 * Creates and returns a presenter synchronization channel for a presentation ID.
 */
export function createPresenterSync(presentationId: string): PresenterSyncChannel {
  return new PresenterSyncChannel(presentationId);
}
