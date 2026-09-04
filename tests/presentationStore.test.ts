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
    // Close grid with Escape
    store.handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(store.isGridOpen).toBe(false);

    // 'S' for Spotlight mode
    expect(store.isSpotlightActive).toBe(false);
    store.handleKeydown(new KeyboardEvent('keydown', { key: 's' }));
    expect(store.isSpotlightActive).toBe(true);

    // Escape clears spotlight
    store.handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(store.isSpotlightActive).toBe(false);
  });

  it('adjusts spotlight radius within clamped boundaries', () => {
    expect(store.spotlightRadius).toBe(140);
    store.setSpotlightRadius(200);
    expect(store.spotlightRadius).toBe(200);
    store.setSpotlightRadius(500); // Clamped to 350
    expect(store.spotlightRadius).toBe(350);
    store.setSpotlightRadius(20); // Clamped to 60
    expect(store.spotlightRadius).toBe(60);
  });
});
