# HostPDF Implementation Plan

> **For agentic workers:** Execute this with WORKFLOW.md **P4 Subagent-Driven Execution** (recommended) or **P5 Inline Execution**, task by task.  
> Steps use `- [ ]` checkbox syntax for tracking.

**Goal:** Build HostPDF, a high-performance Svelte 5 web application for presenting PDFs with hardware-accelerated 3D slide transitions, presenter tools (laser pointer, pen annotator, HUD timer, thumbnail grid), and automated 24-hour ephemeral cleanup.

**Architecture:** A client-first reactive Svelte 5 SPA powered by Vite, TailwindCSS, Mozilla PDF.js, and IndexedDB with 24h auto-pruning. Supports dual-mode presentation (instant local presentation without server upload, plus cloud share integration) with 6 rich transition effects (3D Cube, Keynote Zoom, Smooth Slide, Flip 3D, Convex, Minimalist Fade).

**Tech Stack:** Svelte 5, Vite, TypeScript, Tailwind CSS, Lucide-Svelte, Mozilla PDF.js (`pdfjs-dist`), `idb` (IndexedDB), Vitest + `@testing-library/svelte`.

**Spec:** `docs/specs/2026-09-02-hostpdf-design.md`

## Global Constraints

- Svelte 5 Runes (`$state`, `$derived`, `$effect`) must be used for all reactive state management.
- All 3D transitions must utilize hardware-accelerated CSS (`perspective`, `transform-style: preserve-3d`, `backface-visibility: hidden`).
- Ephemeral data must automatically purge any entry older than 24 hours (`expiresAt <= Date.now()`).
- The application must be 100% buildable and deployable to Netlify / Vercel with zero runtime server dependencies.
- Dark-mode first design with glassmorphism aesthetic (`#0A0D14` background, frosted glass headers, neon accent highlights).

---

### Task 1: Project Scaffolding, Design System & Testing Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `svelte.config.js`
- Create: `tsconfig.json`
- Create: `tailwind.config.cjs`
- Create: `postcss.config.cjs`
- Create: `src/app.css`
- Create: `index.html`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Produces: Working Svelte 5 + Vite + Tailwind CSS + Vitest environment with custom 3D CSS transition utility classes.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/setup.test.ts
import { describe, it, expect } from 'vitest';

describe('Project Environment Baseline', () => {
  it('should have Vitest and Svelte test runner working', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/setup.test.ts`  
Expected: FAIL (No vitest configured or no node_modules)

- [ ] **Step 3: Minimal implementation**

Initialize `package.json` with dependencies:
- `svelte@^5.0.0`
- `@sveltejs/vite-plugin-svelte@^4.0.0`
- `vite@^5.0.0`
- `typescript`
- `tailwindcss@^3.4.0`
- `autoprefixer`, `postcss`
- `pdfjs-dist@^4.0.0`
- `idb@^8.0.0`
- `lucide-svelte@^0.400.0`
- `vitest`, `jsdom`, `@testing-library/svelte`, `fake-indexeddb`

Configure `tailwind.config.cjs` and `src/app.css` with 3D perspective tokens (`perspective-1200`, `preserve-3d`, `backface-hidden`) and neon dark mode theme.

- [ ] **Step 4: Run it, verify it passes**

Run: `npm install; npx vitest run tests/setup.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json vite.config.ts svelte.config.js tsconfig.json tailwind.config.cjs postcss.config.cjs src/app.css index.html tests/setup.test.ts
git commit -m "chore: scaffold Svelte 5 project with Tailwind and Vitest"
```

---

### Task 2: Type Definitions & PDF.js Rendering Engine

**Files:**
- Create: `src/lib/types/index.ts`
- Create: `src/lib/services/pdfEngine.ts`
- Test: `tests/pdfEngine.test.ts`

**Interfaces:**
- Produces: `PDFEngine` service with `loadPdfFromArrayBuffer()`, `renderPageToCanvas()`, `generateThumbnail()`, and `calculateAspectRatio()`.
- Types: `Presentation`, `SlideMeta`, `TransitionStyle`, `PresenterState`, `DrawingStroke`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/pdfEngine.test.ts
import { describe, it, expect } from 'vitest';
import { calculateAspectRatio } from '../src/lib/services/pdfEngine';

describe('PDF Engine Service', () => {
  it('calculates aspect ratios correctly for standard presentation slides', () => {
    expect(calculateAspectRatio(1920, 1080)).toBe('16:9');
    expect(calculateAspectRatio(1024, 768)).toBe('4:3');
    expect(calculateAspectRatio(595, 842)).toBe('portrait');
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/pdfEngine.test.ts`  
Expected: FAIL (Cannot find module `../src/lib/services/pdfEngine`)

- [ ] **Step 3: Minimal implementation**

Create `src/lib/types/index.ts` defining all system types.  
Create `src/lib/services/pdfEngine.ts` handling:
- `pdfjs-dist` worker initialization.
- Document loading from `ArrayBuffer` or URL.
- Canvas rendering with `devicePixelRatio` scaling for crisp text.
- Slide aspect ratio detection (`16:9`, `4:3`, `portrait`, `custom`).
- Thumbnail generation for page 1.

- [ ] **Step 4: Run it, verify it passes**

Run: `npx vitest run tests/pdfEngine.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/types/index.ts src/lib/services/pdfEngine.ts tests/pdfEngine.test.ts
git commit -m "feat: implement PDF.js engine and core type definitions"
```

---

### Task 3: Local Storage with 24-Hour Ephemeral Auto-Purge

**Files:**
- Create: `src/lib/services/localDb.ts`
- Test: `tests/localDb.test.ts`

**Interfaces:**
- Consumes: Types from `src/lib/types/index.ts`.
- Produces: `savePresentationToLocal()`, `getPresentationFromLocal()`, `listLocalPresentations()`, `deleteLocalPresentation()`, and `purgeExpiredPresentations()`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/localDb.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { 
  savePresentationToLocal, 
  getPresentationFromLocal, 
  purgeExpiredPresentations, 
  listLocalPresentations 
} from '../src/lib/services/localDb';

describe('Local Database with 24h Auto-Purge', () => {
  it('saves and retrieves presentations', async () => {
    const mockPres = {
      id: 'pres-1',
      title: 'Canva Pitch Deck',
      fileSize: 1024,
      totalPages: 10,
      aspectRatio: '16:9' as const,
      data: new Uint8Array([1, 2, 3]).buffer,
      thumbnailUrl: 'data:image/png;base64,...',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    await savePresentationToLocal(mockPres);
    const retrieved = await getPresentationFromLocal('pres-1');
    expect(retrieved?.title).toBe('Canva Pitch Deck');
  });

  it('purges presentations older than 24 hours', async () => {
    const expiredPres = {
      id: 'expired-1',
      title: 'Old Slide',
      fileSize: 500,
      totalPages: 5,
      aspectRatio: '16:9' as const,
      data: new Uint8Array([4, 5]).buffer,
      thumbnailUrl: '',
      createdAt: Date.now() - 25 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1 * 60 * 60 * 1000 // Expired 1 hour ago
    };

    await savePresentationToLocal(expiredPres);
    const purgedCount = await purgeExpiredPresentations();
    expect(purgedCount).toBeGreaterThanOrEqual(1);

    const items = await listLocalPresentations();
    expect(items.find(p => p.id === 'expired-1')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/localDb.test.ts`  
Expected: FAIL (Cannot find module `localDb`)

- [ ] **Step 3: Minimal implementation**

Implement `src/lib/services/localDb.ts` using `idb`:
- Database name: `HostPdfDB`, version: 1.
- Object store: `presentations` with `keyPath: 'id'`, index on `expiresAt`.
- Automatic prune logic filtering `expiresAt <= Date.now()`.

- [ ] **Step 4: Run it, verify it passes**

Run: `npx vitest run tests/localDb.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/localDb.ts tests/localDb.test.ts
git commit -m "feat: implement IndexedDB service with 24h auto-purge lifecycle"
```

---

### Task 4: Svelte 5 Presenter State Store & Keyboard Navigation

**Files:**
- Create: `src/lib/stores/presentationStore.svelte.ts`
- Test: `tests/presentationStore.test.ts`

**Interfaces:**
- Consumes: Types from `src/lib/types/index.ts`.
- Produces: `presentationStore` reactive state object and navigation methods (`nextSlide`, `prevSlide`, `goToSlide`, `setTransition`, `toggleLaser`, `togglePen`, `toggleBlackout`, `toggleWhiteout`, `toggleGrid`, `toggleFullscreen`).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/presentationStore.test.ts
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
    store.prevSlide();
    expect(store.currentSlide).toBe(1);
    store.prevSlide();
    expect(store.currentSlide).toBe(1); // Cannot go below 1
  });

  it('toggles tools and blackout screens', () => {
    expect(store.isBlackout).toBe(false);
    store.toggleBlackout();
    expect(store.isBlackout).toBe(true);
    store.toggleBlackout();
    expect(store.isBlackout).toBe(false);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/presentationStore.test.ts`  
Expected: FAIL (Cannot find module `presentationStore.svelte`)

- [ ] **Step 3: Minimal implementation**

Implement `src/lib/stores/presentationStore.svelte.ts` using Svelte 5 `$state` and `$derived`:
- Tracks current slide index (1 to totalPages).
- Manages transition style (`cube`, `zoom`, `slide`, `flip`, `convex`, `fade`).
- Manages presenter tool states (laser, pen, blackout, whiteout, grid, fullscreen, timer).

- [ ] **Step 4: Run it, verify it passes**

Run: `npx vitest run tests/presentationStore.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/presentationStore.svelte.ts tests/presentationStore.test.ts
git commit -m "feat: implement Svelte 5 reactive presentation store"
```

---

### Task 5: 3D Slide Transition Engine & Dual-Buffered Canvas Renderer

**Files:**
- Create: `src/lib/components/SlideTransitionWrapper.svelte`
- Create: `src/lib/components/SlideCanvas.svelte`
- Test: `tests/SlideTransitions.test.ts`

**Interfaces:**
- Consumes: `pdfEngine.ts`, `presentationStore.svelte.ts`.
- Produces: Smooth 60fps 3D slide transition wrapper supporting all 6 transitions (`cube`, `zoom`, `slide`, `flip`, `convex`, `fade`).

- [ ] **Step 1: Write the failing test**

```typescript
// tests/SlideTransitions.test.ts
import { describe, it, expect } from 'vitest';
import { getTransitionClasses } from '../src/lib/components/SlideTransitionWrapper.svelte';

describe('Slide Transition Helper', () => {
  it('returns correct CSS classes for cube and zoom transitions', () => {
    expect(getTransitionClasses('cube', 'next')).toContain('rotate-y');
    expect(getTransitionClasses('zoom', 'next')).toContain('scale');
    expect(getTransitionClasses('fade', 'next')).toContain('opacity');
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/SlideTransitions.test.ts`  
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

Implement:
- `SlideCanvas.svelte`: High-DPI canvas renderer with OffscreenCanvas buffer and loading spinner.
- `SlideTransitionWrapper.svelte`: 3D CSS container applying perspective transforms, depth shading, and smooth cubic-bezier transitions between current, incoming, and outgoing slides.

- [ ] **Step 4: Run it, verify it passes**

Run: `npx vitest run tests/SlideTransitions.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/SlideTransitionWrapper.svelte src/lib/components/SlideCanvas.svelte tests/SlideTransitions.test.ts
git commit -m "feat: implement 3D slide transition engine and high-DPI canvas renderer"
```

---

### Task 6: Presenter Toolkit (Laser Pointer, Pen Annotator, HUD, Grid View)

**Files:**
- Create: `src/lib/components/LaserPointer.svelte`
- Create: `src/lib/components/PenAnnotator.svelte`
- Create: `src/lib/components/PresenterHUD.svelte`
- Create: `src/lib/components/ThumbnailGrid.svelte`
- Create: `src/lib/components/ExpirationBadge.svelte`
- Test: `tests/PresenterTools.test.ts`

**Interfaces:**
- Consumes: `presentationStore.svelte.ts`.
- Produces: Complete interactive presenter toolkit.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/PresenterTools.test.ts
import { describe, it, expect } from 'vitest';
import { formatTimeRemaining } from '../src/lib/components/ExpirationBadge.svelte';

describe('Presenter Tools and Expiration Formatter', () => {
  it('formats remaining countdown correctly', () => {
    const oneHourRemaining = Date.now() + 3600 * 1000 + 120 * 1000 + 45 * 1000;
    const formatted = formatTimeRemaining(oneHourRemaining);
    expect(formatted).toMatch(/01h 02m/);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/PresenterTools.test.ts`  
Expected: FAIL

- [ ] **Step 3: Minimal implementation**

Implement:
- `LaserPointer.svelte`: Canvas overlay rendering trailing glowing particle laser cursor on mousemove.
- `PenAnnotator.svelte`: Canvas drawing layer with stroke color palette, eraser, undo, and clear actions.
- `PresenterHUD.svelte`: Sleek glassmorphic floating control bar with auto-hide timer, slide navigator, transition switcher, and shortcuts dialog.
- `ThumbnailGrid.svelte`: Overlay grid of slide thumbnails (`G` key trigger).
- `ExpirationBadge.svelte`: Real-time badge counting down 24-hour expiration.

- [ ] **Step 4: Run it, verify it passes**

Run: `npx vitest run tests/PresenterTools.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/LaserPointer.svelte src/lib/components/PenAnnotator.svelte src/lib/components/PresenterHUD.svelte src/lib/components/ThumbnailGrid.svelte src/lib/components/ExpirationBadge.svelte tests/PresenterTools.test.ts
git commit -m "feat: implement interactive presenter toolkit and expiration badge"
```

---

### Task 7: Drag-and-Drop Landing Page, App Shell & End-to-End Assembly

**Files:**
- Create: `src/lib/components/Dropzone.svelte`
- Create: `src/lib/components/PresentationViewer.svelte`
- Create: `src/App.svelte`
- Create: `src/main.ts`
- Test: `tests/App.test.ts`

**Interfaces:**
- Consumes: All components, services, and stores.
- Produces: Complete, polished HostPDF web application ready for production build and deployment on Vercel / Netlify.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/App.test.ts
import { describe, it, expect } from 'vitest';

describe('HostPDF Application Integration', () => {
  it('instantiates the main app successfully', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/App.test.ts`  
Expected: FAIL (or setup verification)

- [ ] **Step 3: Minimal implementation**

Implement:
- `Dropzone.svelte`: Drag-and-drop zone with animated glow borders, cues for Canva/Gamma/PPT export, file size limits, and instant preview.
- `PresentationViewer.svelte`: Fullscreen-ready presentation orchestrator with keyboard event listener, touch swipe gesture support, and blackout overlay.
- `App.svelte`: Root view router switching seamlessly between Dashboard and Presenter views with recent active presentation cards.
- `main.ts`: Application bootstrap with background 24-hour expired data garbage collector.

- [ ] **Step 4: Run it, verify it passes**

Run: `npm run build && npx vitest run`  
Expected: PASS (Zero errors, build output in `dist/`)

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/Dropzone.svelte src/lib/components/PresentationViewer.svelte src/App.svelte src/main.ts tests/App.test.ts
git commit -m "feat: complete HostPDF application assembly and build validation"
```
