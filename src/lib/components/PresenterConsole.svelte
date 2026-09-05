<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Presentation } from '../types';
  import SlideCanvas from './SlideCanvas.svelte';
  import { createPresenterSync, type PresenterSyncMessage, type PresenterSyncChannel } from '../services/presenterSync';
  import { getSpeakerNote, saveSpeakerNote } from '../services/speakerNotes';
  import { formatElapsedSeconds } from './timeHelper';
  import {
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    RotateCcw,
    Moon,
    Sun,
    ExternalLink,
    Check,
    Clock,
    Layers,
    MonitorPlay,
    Sparkles,
    Eye,
    EyeOff,
  } from 'lucide-svelte';

  interface Props {
    presentation: Presentation;
    pdfDoc: any;
    onExit?: () => void;
  }

  let { presentation, pdfDoc, onExit }: Props = $props();

  let currentSlide = $state<number>(1);
  const totalSlides = $derived(presentation?.totalPages || 1);

  // Time tracking
  let currentTimeString = $state<string>('');
  let clockInterval: ReturnType<typeof setInterval> | null = null;
  let elapsedSeconds = $state<number>(0);
  let isTimerRunning = $state<boolean>(true);
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  // Presentation flags
  let isBlackout = $state<boolean>(false);
  let isWhiteout = $state<boolean>(false);
  let isConnected = $state<boolean>(true);

  // Speaker notes
  let currentNote = $state<string>('');
  let isNoteSaved = $state<boolean>(true);
  let noteSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  let noteTextarea: HTMLTextAreaElement | null = null;

  let syncChannel: PresenterSyncChannel | null = null;

  function updateClock() {
    const now = new Date();
    currentTimeString = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isTimerRunning = true;
    timerInterval = setInterval(() => {
      elapsedSeconds++;
    }, 1000);

    syncChannel?.broadcast({
      type: 'TIMER_ACTION',
      action: 'start',
      elapsedSeconds,
    });
  }

  function pauseTimer() {
    if (timerInterval) clearInterval(timerInterval);
    isTimerRunning = false;

    syncChannel?.broadcast({
      type: 'TIMER_ACTION',
      action: 'stop',
      elapsedSeconds,
    });
  }

  function resetTimer() {
    elapsedSeconds = 0;
    syncChannel?.broadcast({
      type: 'TIMER_ACTION',
      action: 'reset',
      elapsedSeconds: 0,
    });
  }

  function loadNoteForCurrentSlide() {
    currentNote = getSpeakerNote(presentation.id, currentSlide);
    isNoteSaved = true;
  }

  function handleNoteInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    currentNote = target.value;
    isNoteSaved = false;

    if (noteSaveTimeout) clearTimeout(noteSaveTimeout);
    noteSaveTimeout = setTimeout(() => {
      saveSpeakerNote(presentation.id, currentSlide, currentNote);
      isNoteSaved = true;
    }, 400);
  }

  function goToSlide(page: number, broadcast = true) {
    const target = Math.max(1, Math.min(totalSlides, page));
    if (target === currentSlide) return;

    // Save current note before moving
    if (!isNoteSaved) {
      saveSpeakerNote(presentation.id, currentSlide, currentNote);
      isNoteSaved = true;
    }

    const direction = target > currentSlide ? 'next' : 'prev';
    currentSlide = target;
    loadNoteForCurrentSlide();

    if (broadcast && syncChannel) {
      syncChannel.broadcast({
        type: 'SLIDE_CHANGE',
        slide: currentSlide,
        direction,
      });
    }
  }

  function nextSlide() {
    if (currentSlide < totalSlides) {
      goToSlide(currentSlide + 1);
    }
  }

  function prevSlide() {
    if (currentSlide > 1) {
      goToSlide(currentSlide - 1);
    }
  }

  function toggleBlackout() {
    isBlackout = !isBlackout;
    if (isBlackout) isWhiteout = false;

    syncChannel?.broadcast({
      type: 'BLACKOUT_TOGGLE',
      isBlackout,
    });
  }

  function toggleWhiteout() {
    isWhiteout = !isWhiteout;
    if (isWhiteout) isBlackout = false;

    syncChannel?.broadcast({
      type: 'WHITEOUT_TOGGLE',
      isWhiteout,
    });
  }

  function handleSyncMessage(msg: PresenterSyncMessage) {
    isConnected = true;
    switch (msg.type) {
      case 'SLIDE_CHANGE':
        if (msg.slide !== currentSlide) {
          goToSlide(msg.slide, false);
        }
        break;
      case 'SYNC_STATE':
        currentSlide = msg.slide;
        elapsedSeconds = msg.elapsedSeconds;
        isTimerRunning = msg.isTimerRunning;
        isBlackout = msg.isBlackout;
        isWhiteout = msg.isWhiteout;
        loadNoteForCurrentSlide();
        if (isTimerRunning && !timerInterval) {
          startTimer();
        }
        break;
      case 'REQUEST_SYNC':
        syncChannel?.broadcast({
          type: 'SYNC_STATE',
          slide: currentSlide,
          elapsedSeconds,
          isTimerRunning,
          isBlackout,
          isWhiteout,
        });
        break;
      case 'BLACKOUT_TOGGLE':
        isBlackout = msg.isBlackout;
        if (isBlackout) isWhiteout = false;
        break;
      case 'WHITEOUT_TOGGLE':
        isWhiteout = msg.isWhiteout;
        if (isWhiteout) isBlackout = false;
        break;
      case 'TIMER_ACTION':
        if (msg.elapsedSeconds !== undefined) {
          elapsedSeconds = msg.elapsedSeconds;
        }
        if (msg.action === 'start') {
          if (!timerInterval) startTimer();
        } else if (msg.action === 'stop') {
          pauseTimer();
        } else if (msg.action === 'reset') {
          elapsedSeconds = 0;
        }
        break;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const isTextareaFocused = target && target.tagName === 'TEXTAREA';

    // If typing inside note textarea, allow Escape to blur textarea
    if (isTextareaFocused) {
      if (e.key === 'Escape') {
        target.blur();
      }
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      toggleBlackout();
    } else if (e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      toggleWhiteout();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToSlide(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToSlide(totalSlides);
    }
  }

  onMount(() => {
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
    startTimer();

    // Initialize speaker notes for initial slide
    loadNoteForCurrentSlide();

    // Initialize PresenterSync BroadcastChannel
    syncChannel = createPresenterSync(presentation.id);
    const unsubscribe = syncChannel.subscribe(handleSyncMessage);

    // Send request for sync state from Audience View
    syncChannel.broadcast({ type: 'REQUEST_SYNC' });

    window.addEventListener('keydown', handleKeydown);

    return () => {
      unsubscribe();
      syncChannel?.destroy();
      window.removeEventListener('keydown', handleKeydown);
      if (clockInterval) clearInterval(clockInterval);
      if (timerInterval) clearInterval(timerInterval);
      if (noteSaveTimeout) clearTimeout(noteSaveTimeout);
    };
  });
</script>

<!-- Outer Presenter Console Container -->
<div class="fixed inset-0 w-screen h-screen bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden font-sans">
  <!-- Top Navigation & Intel Bar -->
  <header class="h-16 px-5 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20">
    <!-- Left: Title & Mode Badge -->
    <div class="flex items-center gap-3 min-w-0">
      <div class="flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
        <MonitorPlay class="w-3.5 h-3.5" />
        <span>Presenter Console</span>
      </div>

      <div class="h-4 w-px bg-slate-800"></div>

      <h1 class="text-sm font-medium text-slate-200 truncate max-w-xs md:max-w-md" title={presentation.title}>
        {presentation.title}
      </h1>

      <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
        Slide {currentSlide} / {totalSlides}
      </span>
    </div>

    <!-- Center: Live Clock & Presentation Stopwatch -->
    <div class="flex items-center gap-6">
      <!-- Real-world Clock -->
      <div class="hidden sm:flex items-center gap-2 text-slate-400 font-mono text-sm">
        <Clock class="w-4 h-4 text-slate-500" />
        <span>{currentTimeString}</span>
      </div>

      <div class="hidden sm:block h-4 w-px bg-slate-800"></div>

      <!-- Presentation Stopwatch -->
      <div class="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg">
        <span class="text-xs text-slate-500 uppercase tracking-wider font-semibold">Elapsed</span>
        <span class="font-mono text-base font-bold text-amber-400 min-w-[50px] text-center">
          {formatElapsedSeconds(elapsedSeconds)}
        </span>

        <div class="flex items-center gap-1 border-l border-slate-800 pl-2">
          {#if isTimerRunning}
            <button
              onclick={pauseTimer}
              class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Pause Timer"
            >
              <Pause class="w-3.5 h-3.5" />
            </button>
          {:else}
            <button
              onclick={startTimer}
              class="p-1 rounded text-emerald-400 hover:bg-slate-800 transition-colors"
              title="Resume Timer"
            >
              <Play class="w-3.5 h-3.5" />
            </button>
          {/if}
          <button
            onclick={resetTimer}
            class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Right: Sync Status & Quick Controls -->
    <div class="flex items-center gap-3">
      <!-- Sync Status Indicator -->
      <div
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border {isConnected
          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
          : 'bg-slate-900 border-slate-700 text-slate-400'}"
        title="Real-time 0ms sync with Audience Presentation Window"
      >
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span class="hidden md:inline">Synced with Audience</span>
      </div>

      <!-- Blackout Button -->
      <button
        onclick={toggleBlackout}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border {isBlackout
          ? 'bg-red-500/20 border-red-500/50 text-red-300'
          : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700'}"
        title="Toggle Blackout Screen (B)"
      >
        <Moon class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">{isBlackout ? 'Blackout ON' : 'Blackout (B)'}</span>
      </button>

      <!-- Whiteout Button -->
      <button
        onclick={toggleWhiteout}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border {isWhiteout
          ? 'bg-white/20 border-white/50 text-white'
          : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700'}"
        title="Toggle Whiteout Screen (W)"
      >
        <Sun class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">{isWhiteout ? 'Whiteout ON' : 'Whiteout (W)'}</span>
      </button>

      {#if onExit}
        <button
          onclick={onExit}
          class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          title="Close Presenter Console"
        >
          Exit
        </button>
      {/if}
    </div>
  </header>

  <!-- Main Workstation: Split Current Slide vs Next Slide & Speaker Notes -->
  <main class="flex-1 min-h-0 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
    <!-- Left Panel: Current Slide (Audience is viewing this) -->
    <div class="flex-[3] min-w-0 flex flex-col bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 relative overflow-hidden shadow-xl">
      <!-- Section Header -->
      <div class="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/60">
        <div class="flex items-center gap-2">
          <span class="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
          <span class="text-xs font-bold text-slate-200 uppercase tracking-wider">Current Slide</span>
          <span class="text-xs text-slate-500 font-medium">(Live on Audience Screen)</span>
        </div>

        {#if isBlackout}
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold border border-red-500/30 animate-pulse">
            Audience Screen is Blacked Out
          </span>
        {:else if isWhiteout}
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-semibold border border-white/30 animate-pulse">
            Audience Screen is Whiteout
          </span>
        {/if}
      </div>

      <!-- Slide Render Area -->
      <div class="flex-1 min-h-0 flex items-center justify-center relative p-2">
        <div class="max-w-full max-h-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-slate-800/60 flex items-center justify-center">
          <SlideCanvas
            doc={pdfDoc}
            pageNumber={currentSlide}
            aspectRatio={presentation.aspectRatio}
            maxWidth={840}
          />
        </div>
      </div>

      <!-- Slide Navigation Dock -->
      <div class="pt-3 mt-2 border-t border-slate-800/60 flex items-center justify-between">
        <button
          onclick={prevSlide}
          disabled={currentSlide <= 1}
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-all active:scale-95 border border-slate-700"
        >
          <ChevronLeft class="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div class="text-xs text-slate-400 font-medium">
          Slide <strong class="text-white font-bold text-sm">{currentSlide}</strong> of {totalSlides}
        </div>

        <button
          onclick={nextSlide}
          disabled={currentSlide >= totalSlides}
          class="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 disabled:opacity-30 disabled:pointer-events-none text-white transition-all active:scale-95 shadow-lg shadow-brand-500/20"
        >
          <span>Next Slide</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Right Panel: Next Slide Preview & Speaker Notes -->
    <div class="flex-[2] min-w-0 flex flex-col gap-4">
      <!-- Next Slide Preview -->
      <div class="flex-1 min-h-[220px] bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col relative overflow-hidden shadow-xl">
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
          <div class="flex items-center gap-2">
            <Layers class="w-3.5 h-3.5 text-indigo-400" />
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Next Slide Preview</span>
          </div>

          {#if currentSlide < totalSlides}
            <span class="text-xs text-slate-500 font-mono">Slide {currentSlide + 1}</span>
          {/if}
        </div>

        <!-- Next Slide Canvas -->
        <div class="flex-1 min-h-0 flex items-center justify-center relative p-1">
          {#if currentSlide < totalSlides}
            <div class="max-w-full max-h-full aspect-video rounded-lg overflow-hidden shadow-lg bg-black/80 border border-slate-800 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
              <SlideCanvas
                doc={pdfDoc}
                pageNumber={currentSlide + 1}
                aspectRatio={presentation.aspectRatio}
                maxWidth={420}
              />
            </div>
          {:else}
            <div class="flex flex-col items-center justify-center gap-2 text-center p-6 text-slate-400">
              <div class="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles class="w-6 h-6" />
              </div>
              <p class="text-sm font-medium text-slate-300">You are on the final slide!</p>
              <p class="text-xs text-slate-500">No further slides to preview.</p>
            </div>
          {/if}
        </div>
      </div>

      <!-- Speaker Notes Editor -->
      <div class="flex-1 min-h-[240px] bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col relative overflow-hidden shadow-xl">
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Speaker Notes</span>
            <span class="text-xs text-indigo-400 font-mono">(Slide {currentSlide})</span>
          </div>

          <div class="flex items-center gap-1.5 text-xs">
            {#if isNoteSaved}
              <span class="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                <Check class="w-3 h-3" /> Auto-saved
              </span>
            {:else}
              <span class="text-amber-400 text-[11px] font-medium animate-pulse">
                Saving...
              </span>
            {/if}
          </div>
        </div>

        <textarea
          bind:this={noteTextarea}
          value={currentNote}
          oninput={handleNoteInput}
          placeholder="Add talking points, cues, or speaker reminders for Slide {currentSlide} here... (Auto-saves as you type)"
          class="flex-1 w-full bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 resize-none font-sans leading-relaxed selection:bg-indigo-500/30"
        ></textarea>
      </div>
    </div>
  </main>

  <!-- Bottom Horizontal Filmstrip for Quick Slide Jumping -->
  <footer class="h-24 px-4 bg-slate-900/95 border-t border-slate-800/80 flex items-center gap-3 overflow-x-auto flex-shrink-0 z-20">
    <div class="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 flex-shrink-0">
      All Slides
    </div>

    <div class="flex items-center gap-2.5 h-full py-2">
      {#each Array.from({ length: totalSlides }, (_, i) => i + 1) as slideNum}
        <button
          onclick={() => goToSlide(slideNum)}
          class="h-full aspect-video rounded-lg border transition-all duration-150 flex-shrink-0 relative overflow-hidden group focus:outline-none {currentSlide ===
          slideNum
            ? 'border-indigo-500 ring-2 ring-indigo-500/40'
            : 'border-slate-800 hover:border-slate-600'}"
          title="Jump to Slide {slideNum}"
        >
          <div class="w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <SlideCanvas
              doc={pdfDoc}
              pageNumber={slideNum}
              aspectRatio={presentation.aspectRatio}
              maxWidth={120}
            />
          </div>

          <!-- Slide Number Badge -->
          <div
            class="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold {currentSlide ===
            slideNum
              ? 'bg-indigo-600 text-white'
              : 'bg-black/70 text-slate-300'}"
          >
            {slideNum}
          </div>
        </button>
      {/each}
    </div>
  </footer>
</div>
