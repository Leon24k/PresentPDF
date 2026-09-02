# HostPDF — System Architecture & Design Specification

> **Project:** HostPDF (High-Performance PDF Presentation Platform)  
> **Date:** 2026-09-02  
> **Status:** Proposed  
> **Author:** Antigravity Engineering  
> **Target Hosting:** Vercel / Netlify (100% Free Tier, Zero-Maintenance, Ephemeral Storage)

---

## 1. Executive Summary & Problem Statement

Designers, speakers, educators, and creators frequently export high-quality presentation slides as **PDF** from tools like Canva, Gamma AI, Tome, Figma, Google Slides, and PowerPoint. However, standard browser and desktop PDF viewers (Chrome PDF viewer, Adobe Acrobat, Preview) lack presentation capabilities:
* No presentation slide transitions (fade, 3D cube, smooth slide, zoom).
* Clunky scrolling instead of crisp slide-by-slide navigation.
* No presenter tools (laser pointer, annotation pen, thumbnail grid overview, screen blackout, presenter timer).
* Existing presentation hosting platforms require subscriptions, permanently store files, or lack rapid ephemeral sharing.

**HostPDF** solves this by providing an ultra-fast, memory-efficient web application powered by **Svelte 5** and **PDF.js** with hardware-accelerated 3D transitions, professional presenter tools, and an automated **24-hour expiration & cleanup lifecycle** for 100% free zero-maintenance deployment.

---

## 2. Technical Stack & Architecture

### 2.1 Core Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework & Build** | **Svelte 5 + Vite** | Zero Virtual-DOM overhead, ultra-lean JS bundle (~15KB), instant reactivity via Svelte 5 Runes (`$state`, `$derived`, `$effect`), 60–120 FPS rendering. |
| **PDF Rendering Engine** | **Mozilla PDF.js** | Client-side vector & raster PDF rendering with Web Worker support, high-DPI (Retina 2x/3x) canvas scaling. |
| **Styling & Design System** | **Tailwind CSS + Custom CSS 3D** | Dark-first glassmorphism, hardware-accelerated 3D CSS transforms (`perspective`, `rotate3d`, `scale`). |
| **Icons & UI Micro-components** | **Lucide-Svelte** | Lightweight, modern icon set. |
| **Local Storage (Mode 1)** | **IndexedDB (`idb` wrapper)** | Instant presentation with zero server upload, unlimited local file size, client-side 24h auto-pruning. |
| **Cloud Storage (Mode 2)** | **Supabase Free Tier / Cloudflare R2** | 1GB+ free cloud storage, Postgres metadata, 24h TTL lifecycle auto-cleanup. |
| **Deployment Target** | **Vercel / Netlify** | Edge-accelerated global CDN, instant static hosting, zero server maintenance costs. |

---

## 3. System Architecture & Dual-Mode Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     HOSTPDF SYSTEM FLOW                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

                                ┌───────────────────────────┐
                                │   User Drops PDF File     │
                                │ (Canva / Gamma / AI / PPT) │
                                └─────────────┬─────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
      ┌───────────────────────────────┐               ┌───────────────────────────────┐
      │     Mode A: Local Instant     │               │     Mode B: Cloud Share Link  │
      │   (Zero-Upload, 100% Private) │               │   (24-Hour Ephemeral Link)    │
      └───────────────┬───────────────┘               └───────────────┬───────────────┘
                      │                                               │
                      ▼                                               ▼
         Saves to Browser IndexedDB                      Uploads to Supabase / Storage
         TTL: `Date.now() + 24 Hours`                    Generates Short ID: `/p/:shortId`
                      │                                  Expires At: `NOW() + 24 Hours`
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              │
                                              ▼
                             ┌─────────────────────────────────┐
                             │    Svelte 5 Presenter Engine    │
                             │   - Dual-buffer PDF.js Worker   │
                             │   - Hardware-Accelerated 3D     │
                             │   - 6 Slide Transition Styles   │
                             │   - Laser Pointer & Pen Canvas  │
                             │   - HUD, Timer, Grid View (G)   │
                             └────────────────┬────────────────┘
                                              │
                                              ▼
                             ┌─────────────────────────────────┐
                             │       24-Hour Auto-Purge        │
                             │   - Local: IndexedDB prune job  │
                             │   - Cloud: Storage/DB lifecycle │
                             └─────────────────────────────────┘
```

---

## 4. Key Functional Features

### 4.1 Importer & Session Manager
* **Drag-and-Drop Dropzone:** Fast drag-and-drop or file selector with instant PDF MIME validation.
* **Metadata Extraction:** Automatically extracts total slide count, detects aspect ratio (16:9 widescreen, 4:3 standard, A4 portrait/landscape), and generates high-res thumbnail of the first slide.
* **24-Hour Expiration Badge:** Real-time countdown timer showing remaining valid time (`Expires in 23h 54m 12s`).

### 4.2 Presentation & 3D Transition Engine
Six selectable hardware-accelerated slide transitions:
1. **3D Cube (`cube`):** 90-degree 3D rotational perspective cube flip with dynamic ambient shadow.
2. **Keynote Zoom (`zoom`):** Smooth scale-down/scale-up with cross-dissolve opacity.
3. **Smooth Slide (`slide`):** 60fps horizontal or vertical inertia push.
4. **Card Flip (`flip`):** 180-degree 3D card turnover.
5. **Convex Carousel (`convex`):** Cylindrical 3D panoramic rotation.
6. **Minimalist Fade (`fade`):** Subtle professional alpha dissolve.

### 4.3 Interactive Presenter Toolkit
* **🔴 Virtual Laser Pointer:** Red/Neon dot with glowing aura and smooth trailing particle effect tracking the cursor.
* **✏️ Live Annotation Pen & Highlighter:** Canvas overlay allowing freehand drawing, highlighting points on slides, with color palette, stroke width, and `Clear / Undo` controls (Shortcut: `P`).
* **🗂️ Thumbnail Grid Overview (`G`):** Fullscreen slide drawer displaying all pages in a responsive grid for quick jumping.
* **⏱️ Presenter HUD:** Elapsed presentation timer, current time clock, slide index (`Slide 4 / 32`), and progress indicator.
* **⬛ Screen Focus Control:** Blackout screen (`B`) or Whiteout screen (`W`) to redirect audience attention.
* **📺 Fullscreen Presentation Mode (`F`):** Native HTML5 Fullscreen API with auto-hiding controls on mouse idle.
* **⌨️ Rich Keyboard Navigation:**
  * Next slide: `ArrowRight`, `ArrowDown`, `Space`, `PageDown`, `Enter`, `N`, Mouse Click / Swipe.
  * Previous slide: `ArrowLeft`, `ArrowUp`, `PageUp`, `Backspace`, `P`.
  * First / Last slide: `Home` / `End`.
  * Grid View: `G`.
  * Laser Pointer: `L`.
  * Pen Annotator: `A` / `P`.
  * Blackout / Whiteout: `B` / `W`.
  * Fullscreen: `F`.

---

## 5. 24-Hour Ephemeral Cleanup Strategy

### 5.1 Local Storage (IndexedDB)
* Object store: `presentations` with schema `{ id, name, size, totalPages, data: ArrayBuffer, createdAt, expiresAt }`.
* Cleanup mechanism: Routine runs on application mount and periodically via `requestIdleCallback` to delete records where `Date.now() > item.expiresAt`.

### 5.2 Cloud Storage (Supabase / Cloudflare R2)
* PostgreSQL Table:
  ```sql
  create table presentations (
    id uuid primary key default gen_random_uuid(),
    short_code varchar(12) unique not null,
    title text not null,
    file_path text not null,
    file_size integer not null,
    total_pages integer not null,
    aspect_ratio varchar(10) default '16:9',
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default now()
  );
  ```
* Cleanup Policy:
  * Database: Supabase `pg_cron` runs every hour: `DELETE FROM presentations WHERE expires_at < NOW();`
  * Edge Check: When a user visits `/p/:shortCode`, if `expires_at < NOW()`, the API returns HTTP `410 Gone (Presentation Expired)` and immediately triggers deletion.

---

## 6. Project Structure

```
HostPDF/
├── docs/
│   ├── specs/2026-09-02-hostpdf-design.md
│   └── plans/
├── public/
│   ├── favicon.svg
│   └── pdf.worker.min.mjs
├── src/
│   ├── assets/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Dropzone.svelte
│   │   │   ├── PresentationViewer.svelte
│   │   │   ├── SlideTransitionWrapper.svelte
│   │   │   ├── LaserPointer.svelte
│   │   │   ├── PenAnnotator.svelte
│   │   │   ├── PresenterHUD.svelte
│   │   │   ├── ThumbnailGrid.svelte
│   │   │   └── ExpirationBadge.svelte
│   │   ├── services/
│   │   │   ├── pdfEngine.ts       // PDF.js worker & dual-buffer canvas renderer
│   │   │   ├── localDb.ts         // IndexedDB manager with 24h auto-pruning
│   │   │   └── cloudStorage.ts    // Supabase / shareable link provider
│   │   ├── stores/
│   │   │   └── presentationStore.svelte.ts // Svelte 5 state runes
│   │   └── types/
│   │       └── index.ts
│   ├── App.svelte
│   ├── app.css
│   └── main.ts
├── index.html
├── package.json
├── tailwind.config.cjs
├── svelte.config.js
└── vite.config.ts
```

---

## 7. Spec Self-Review Checklist

1. **Placeholders:** No TBD or TODO items. All component roles, storage strategies, and transition styles are concretely defined.
2. **Consistency:** Svelte 5 runes architecture is aligned across UI, canvas engine, and storage.
3. **Scope:** Perfectly scoped for a high-impact MVP deployable to Netlify/Vercel.
4. **Ambiguity:** Dual storage mode (Instant Local vs Cloud Share) is explicitly documented with 24-hour cleanup logic for both.
