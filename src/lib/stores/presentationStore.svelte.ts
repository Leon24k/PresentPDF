import type { Presentation, TransitionStyle, DrawingStroke } from '../types';

export function createPresentationStore() {
  let presentation = $state<Presentation | null>(null);
  let pdfDoc = $state<any | null>(null);
  let currentSlide = $state<number>(1);
  let totalSlides = $derived(presentation ? presentation.totalPages : 1);
  let transitionStyle = $state<TransitionStyle>('cube');
  let transitionDirection = $state<'next' | 'prev'>('next');
  let isTransitioning = $state<boolean>(false);

  // Presenter tools
  let isLaserActive = $state<boolean>(false);
  let isPenActive = $state<boolean>(false);
  let isHighlighter = $state<boolean>(false);
  let penColor = $state<string>('#EF4444');
  let penSize = $state<number>(3);

  // Focus & HUD
  let isBlackout = $state<boolean>(false);
  let isWhiteout = $state<boolean>(false);
  let isGridOpen = $state<boolean>(false);
  let isFullscreen = $state<boolean>(false);
  let isShortcutsOpen = $state<boolean>(false);

  // Timer & Autoplay
  let isTimerRunning = $state<boolean>(false);
  let elapsedSeconds = $state<number>(0);
  let autoPlayInterval = $state<number>(0); // 0 = off, seconds
  let isAutoPlaying = $state<boolean>(false);

  // Drawing annotations
  let drawingStrokes = $state<DrawingStroke[]>([]);
  let isLoading = $state<boolean>(false);

  let timerHandle: ReturnType<typeof setInterval> | null = null;
  let autoPlayHandle: ReturnType<typeof setInterval> | null = null;

  function init(pres: Presentation, doc?: any) {
    presentation = pres;
    pdfDoc = doc || null;
    currentSlide = 1;
    transitionDirection = 'next';
    isBlackout = false;
    isWhiteout = false;
    isGridOpen = false;
    isLaserActive = false;
    isPenActive = false;
    drawingStrokes = [];
    elapsedSeconds = 0;
    startTimer();
  }

  function startTimer() {
    if (timerHandle) clearInterval(timerHandle);
    isTimerRunning = true;
    timerHandle = setInterval(() => {
      elapsedSeconds++;
    }, 1000);
  }

  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    isTimerRunning = false;
  }

  function resetTimer() {
    elapsedSeconds = 0;
  }

  function nextSlide() {
    if (!presentation) return;
    if (currentSlide < presentation.totalPages) {
      transitionDirection = 'next';
      triggerTransition(() => {
        currentSlide++;
      });
    }
  }

  function prevSlide() {
    if (!presentation) return;
    if (currentSlide > 1) {
      transitionDirection = 'prev';
      triggerTransition(() => {
        currentSlide--;
      });
    }
  }

  function goToSlide(target: number) {
    if (!presentation) return;
    const bounded = Math.max(1, Math.min(presentation.totalPages, target));
    if (bounded === currentSlide) return;

    transitionDirection = bounded > currentSlide ? 'next' : 'prev';
    triggerTransition(() => {
      currentSlide = bounded;
    });
    isGridOpen = false;
  }

  function triggerTransition(callback: () => void) {
    isTransitioning = true;
    callback();
    setTimeout(() => {
      isTransitioning = false;
    }, 600);
  }

  function setTransition(style: TransitionStyle) {
    transitionStyle = style;
  }

  function toggleLaser() {
    isLaserActive = !isLaserActive;
    if (isLaserActive) isPenActive = false;
  }

  function togglePen() {
    isPenActive = !isPenActive;
    if (isPenActive) isLaserActive = false;
  }

  function toggleHighlighter() {
    isHighlighter = !isHighlighter;
  }

  function setPenColor(color: string) {
    penColor = color;
  }

  function setPenSize(size: number) {
    penSize = size;
  }

  function addStroke(stroke: DrawingStroke) {
    drawingStrokes.push(stroke);
  }

  function undoStroke() {
    for (let i = drawingStrokes.length - 1; i >= 0; i--) {
      if (drawingStrokes[i].pageNumber === currentSlide) {
        drawingStrokes.splice(i, 1);
        break;
      }
    }
  }

  function clearCurrentSlideStrokes() {
    drawingStrokes = drawingStrokes.filter(s => s.pageNumber !== currentSlide);
  }

  function toggleBlackout() {
    isBlackout = !isBlackout;
    if (isBlackout) isWhiteout = false;
  }

  function toggleWhiteout() {
    isWhiteout = !isWhiteout;
    if (isWhiteout) isBlackout = false;
  }

  function toggleGrid() {
    isGridOpen = !isGridOpen;
  }

  function toggleShortcuts() {
    isShortcutsOpen = !isShortcutsOpen;
  }

  function toggleFullscreen() {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      isFullscreen = true;
    } else {
      document.exitFullscreen().catch(() => {});
      isFullscreen = false;
    }
  }

  function toggleAutoPlay(seconds: number = 5) {
    if (isAutoPlaying) {
      if (autoPlayHandle) clearInterval(autoPlayHandle);
      isAutoPlaying = false;
      autoPlayInterval = 0;
    } else {
      isAutoPlaying = true;
      autoPlayInterval = seconds;
      autoPlayHandle = setInterval(() => {
        if (presentation && currentSlide >= presentation.totalPages) {
          goToSlide(1);
        } else {
          nextSlide();
        }
      }, seconds * 1000);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    // Ignore if typing in input / textarea
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    const key = e.key.toLowerCase();

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
      case 'Enter':
      case 'n':
      case 'N':
        e.preventDefault();
        nextSlide();
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
      case 'Backspace':
      case 'p':
      case 'P':
        if (e.key === 'p' && (e.ctrlKey || e.metaKey)) return; // let print work
        e.preventDefault();
        prevSlide();
        break;

      case 'Home':
        e.preventDefault();
        goToSlide(1);
        break;

      case 'End':
        e.preventDefault();
        if (presentation) goToSlide(presentation.totalPages);
        break;

      case 'b':
      case 'B':
      case '.':
        e.preventDefault();
        toggleBlackout();
        break;

      case 'w':
      case 'W':
      case ',':
        e.preventDefault();
        toggleWhiteout();
        break;

      case 'g':
      case 'G':
        e.preventDefault();
        toggleGrid();
        break;

      case 'l':
      case 'L':
        e.preventDefault();
        toggleLaser();
        break;

      case 'a':
      case 'A':
        e.preventDefault();
        togglePen();
        break;

      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;

      case '?':
      case '/':
        e.preventDefault();
        toggleShortcuts();
        break;

      case 'Escape':
        if (isGridOpen) {
          isGridOpen = false;
        } else if (isShortcutsOpen) {
          isShortcutsOpen = false;
        } else if (isBlackout) {
          isBlackout = false;
        } else if (isWhiteout) {
          isWhiteout = false;
        }
        break;
    }
  }

  return {
    get presentation() { return presentation; },
    set presentation(v) { presentation = v; },
    get pdfDoc() { return pdfDoc; },
    set pdfDoc(v) { pdfDoc = v; },
    get currentSlide() { return currentSlide; },
    get totalSlides() { return totalSlides; },
    get transitionStyle() { return transitionStyle; },
    get transitionDirection() { return transitionDirection; },
    get isTransitioning() { return isTransitioning; },
    get isLaserActive() { return isLaserActive; },
    get isPenActive() { return isPenActive; },
    get isHighlighter() { return isHighlighter; },
    get penColor() { return penColor; },
    get penSize() { return penSize; },
    get isBlackout() { return isBlackout; },
    get isWhiteout() { return isWhiteout; },
    get isGridOpen() { return isGridOpen; },
    set isGridOpen(v) { isGridOpen = v; },
    get isFullscreen() { return isFullscreen; },
    get isShortcutsOpen() { return isShortcutsOpen; },
    get isTimerRunning() { return isTimerRunning; },
    get elapsedSeconds() { return elapsedSeconds; },
    get autoPlayInterval() { return autoPlayInterval; },
    get isAutoPlaying() { return isAutoPlaying; },
    get drawingStrokes() { return drawingStrokes; },
    get isLoading() { return isLoading; },
    set isLoading(v) { isLoading = v; },

    init,
    nextSlide,
    prevSlide,
    goToSlide,
    setTransition,
    toggleLaser,
    togglePen,
    toggleHighlighter,
    setPenColor,
    setPenSize,
    addStroke,
    undoStroke,
    clearCurrentSlideStrokes,
    toggleBlackout,
    toggleWhiteout,
    toggleGrid,
    toggleShortcuts,
    toggleFullscreen,
    startTimer,
    stopTimer,
    resetTimer,
    toggleAutoPlay,
    handleKeydown
  };
}

export const globalPresentationStore = createPresentationStore();
