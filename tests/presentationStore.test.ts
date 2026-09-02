import { describe, it, expect, beforeEach } from 'vitest';
import { createPresentationStore } from '../src/lib/stores/presentationStore.svelte';

describe('Presentation Store (Svelte 5 Runes)', () => {
  let store: ReturnType<typeof createPresentationStore>;

  beforeEach(() => {
    store = createPresentationStore();
    store.init({
      id: 'test-doc',
      title: 'Sample Presentation',
      fileSize: 2048,
      totalPages: 10,
      aspectRatio: '16:9',
      data: new ArrayBuffer(0),
      thumbnailUrl: '',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000
    });
  });

  it('navigates next and previous slides within bounds', () => {
    expect(store.currentSlide).toBe(1);
    store.nextSlide();
    expect(store.currentSlide).toBe(2);
    expect(store.transitionDirection).toBe('next');
    
    store.prevSlide();
    expect(store.currentSlide).toBe(1);
    expect(store.transitionDirection).toBe('prev');

    store.prevSlide();
    expect(store.currentSlide).toBe(1); // Cannot go below 1
  });

  it('jumps to a specific slide', () => {
    store.goToSlide(5);
    expect(store.currentSlide).toBe(5);
    store.goToSlide(99); // Exceeds total
    expect(store.currentSlide).toBe(10);
    store.goToSlide(-2); // Below 1
    expect(store.currentSlide).toBe(1);
  });

  it('toggles tools and blackout screens', () => {
    expect(store.isBlackout).toBe(false);
    store.toggleBlackout();
    expect(store.isBlackout).toBe(true);
    store.toggleBlackout();
    expect(store.isBlackout).toBe(false);

    expect(store.isLaserActive).toBe(false);
    store.toggleLaser();
    expect(store.isLaserActive).toBe(true);
  });

  it('handles keyboard shortcuts accurately', () => {
    // Arrow Right
    store.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(store.currentSlide).toBe(2);

    // 'B' for Blackout
    store.handleKeydown(new KeyboardEvent('keydown', { key: 'b' }));
    expect(store.isBlackout).toBe(true);

    // 'G' for Grid view
    store.handleKeydown(new KeyboardEvent('keydown', { key: 'g' }));
    expect(store.isGridOpen).toBe(true);
  });
});
