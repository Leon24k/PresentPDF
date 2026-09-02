# PresentPDF 🚀

<div align="center">

![PresentPDF Banner](https://img.shields.io/badge/PresentPDF-Next--Gen%20PDF%20Presentation%20Platform-6366F1?style=for-the-badge&logo=pdf&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Svelte 5](https://img.shields.io/badge/Svelte-5.0-FF3E00?style=flat-square&logo=svelte&logoColor=white)](https://svelte.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Deployed on Vercel/Netlify](https://img.shields.io/badge/Deploy-Vercel%20%7C%20Netlify-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

**Present your PDF slides exported from Canva, Gamma AI, Tome, Figma, or PowerPoint with buttery-smooth 3D transitions and interactive presenter tools.**

[Features](#-key-features) • [Slide Transitions](#-6-cinematic-slide-transitions) • [Keyboard Shortcuts](#-keyboard-shortcuts) • [24h Auto-Purge](#-24-hour-ephemeral-auto-cleanup) • [Quickstart](#-quickstart--local-development) • [Deployment](#-1-click-deployment-to-vercel--netlify)

</div>

---

## 💡 The Problem & Solution

When you export presentations from **Canva**, **Gamma AI**, **Tome**, or **Google Slides** as PDF, default PDF viewers (Chrome PDF Viewer, Adobe Acrobat, Preview) feel stiff:
* ❌ No smooth slide-by-slide transition animations (fade, 3D flip, cube, zoom).
* ❌ Awkward continuous vertical scrolling.
* ❌ Missing presenter tools (virtual laser pointer, live pen annotation, slide grid overview, timer, blackout screen).
* ❌ Heavy platforms require accounts and permanently store your presentations.

**PresentPDF** solves this with an ultra-fast, zero-overhead **Svelte 5** web application that runs 100% in your browser with hardware-accelerated 3D transitions, professional speaker tools, and an automatic **24-Hour Ephemeral Auto-Cleanup** cycle.

---

## ✨ Key Features

* 🎲 **6 Hardware-Accelerated 3D Transitions:** 3D Cube Rotation, Keynote Zoom, Smooth Slide, 3D Card Flip, Convex Carousel, and Minimalist Fade running at silky 60–120 FPS.
* 🔴 **Virtual Glowing Laser Pointer:** Neon red laser dot with dynamic trailing glow particles following your cursor.
* ✏️ **Live Pen & Highlighter Annotator:** Freehand sketch and highlight directly on your slides during live presentations.
* ⏱️ **Presenter Stopwatch & HUD:** Auto-hiding glassmorphic dock with elapsed timer, current/total slide counter, and transition switcher.
* 🗂️ **Thumbnail Grid Overview (`G`):** Instant full-screen thumbnail drawer to jump to any slide in 1 click.
* ⬛ **Blackout (`B`) / Whiteout (`W`) Screen:** Focus your audience's attention instantly onto the speaker.
* 📱 **Mobile & Touch Responsive:** Swipe gestures for presentation control on iPad and mobile devices.
* 🧹 **24-Hour Ephemeral Lifecycle:** Uploaded presentations are stored locally in IndexedDB and automatically pruned after 24 hours to prevent storage bloat.

---

## 🎭 6 Cinematic Slide Transitions

| Transition Style | Description | Ideal Use Case |
| :--- | :--- | :--- |
| **🎲 3D Cube** | 90-degree 3D rotational cube flip with realistic depth shading. | Creative pitches, product showcases. |
| **🔍 Keynote Zoom** | Apple Keynote-style cinematic scale-down and cross-dissolve. | Sleek startup pitch decks & keynotes. |
| **↔️ Smooth Slide** | 60 FPS inertia push with responsive cubic-bezier easing. | Clean modern business presentations. |
| **🃏 3D Card Flip** | 180-degree 3D card turnover effect. | Creative portfolios & agency decks. |
| **🌐 Convex 3D** | Panoramic cylindrical 3D rotation. | Data reports and visual dashboards. |
| **✨ Minimalist Fade** | Subtle alpha opacity dissolve for crisp transitions. | Formal academic & corporate presentations. |

---

## ⌨️ Keyboard Shortcuts

| Shortcut Key | Action |
| :--- | :--- |
| `→` / `↓` / `Space` / `PageDown` / `N` | **Next Slide** |
| `←` / `↑` / `Backspace` / `PageUp` / `P` | **Previous Slide** |
| `G` | **Toggle Slide Grid Overview** |
| `L` | **Toggle Virtual Laser Pointer** |
| `A` / `P` | **Toggle Pen & Highlighter Annotator** |
| `B` / `.` | **Toggle Blackout Screen** (Focus audience) |
| `W` / `,` | **Toggle Whiteout Screen** |
| `F` | **Toggle Fullscreen Mode** |
| `Home` / `End` | **Jump to First / Last Slide** |
| `?` / `/` | **Open Shortcuts Cheatsheet Modal** |
| `ESC` | **Close active overlay / drawer** |

---

## ⏳ 24-Hour Ephemeral Auto-Cleanup

To keep hosting **100% Free** and prevent server disk overflow:
1. **Local Mode (Default):** PDF presentations are parsed and stored in browser `IndexedDB` with an `expiresAt` timestamp set to `Date.now() + 24 Hours`.
2. **Automated Purge:** An automated cleanup routine runs on application startup and periodically to purge expired presentations from storage.
3. **Zero Server Maintenance:** No servers to maintain, no subscription fees, 100% private.

---

## 🛠️ Tech Stack

* **Framework:** [Svelte 5](https://svelte.dev) (Runes `$state`, `$derived`, `$effect`)
* **Build Tool:** [Vite](https://vitejs.dev)
* **Styling:** [Tailwind CSS](https://tailwindcss.com) + Custom 3D CSS Transforms
* **PDF Rendering:** [Mozilla PDF.js](https://mozilla.github.io/pdf.js/)
* **Icons:** [Lucide Svelte](https://lucide.dev)
* **Local Database:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via `idb`
* **Test Suite:** [Vitest](https://vitest.dev) + `@testing-library/svelte`

---

## 🚀 Quickstart / Local Development

### 1. Clone the repository
```bash
git clone https://github.com/Leon24k/PresentPDF.git
cd PresentPDF
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Run tests & build
```bash
npm run test     # Run all Vitest unit and integration tests
npm run build    # Build optimized production bundle
```

---

## 🌐 1-Click Deployment to Vercel / Netlify

### Deploy to Vercel:
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLeon24k%2FPresentPDF)

1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com) -> **New Project** -> Import `PresentPDF`.
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Click **Deploy**!

### Deploy to Netlify:
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Leon24k/PresentPDF)

1. Connect your GitHub repository in Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Click **Deploy Site**!

---

## 📄 License

This project is licensed under the **MIT License**.
