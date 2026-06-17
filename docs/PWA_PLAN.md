# PWA Plan

This document outlines the recommended path for turning Spell Quest into an installable web app while keeping the current static prototype stable.

## Goal

Make the game feel app-like on Android tablets:

- Launch from home screen.
- Hide browser chrome when installed.
- Cache core game files and assets.
- Keep local vocabulary available without exposing private spreadsheet links.
- Preserve local progress.

## Recommended Deployment Path

Use a hosted HTTPS site for the PWA version. Good options:

- GitHub Pages
- Cloudflare Pages
- Netlify

PWA installability requires HTTPS, except for localhost during development. A local `file://` page cannot become a real installable PWA.

## Phase 1 - Git Baseline

- Add `.gitignore`.
- Commit source, assets, docs, and tools.
- Exclude generated `android.html`.
- Keep `build-android.mjs` for offline-ish tablet testing.

## Phase 2 - Basic PWA Files

Add:

- `manifest.webmanifest`
- `service-worker.js`
- app icons in `assets/icons/`
- `<link rel="manifest">` in `index.html`
- theme color and mobile viewport metadata

Suggested app metadata:

- Name: `Spell Quest`
- Short name: `Spell Quest`
- Display: `fullscreen` or `standalone`
- Orientation: `landscape`
- Theme color: dark navy / gold UI tone

## Phase 3 - Cache Strategy

Use a conservative service worker:

- Cache shell files on install:
  - `index.html`
  - `style.css`
  - `game.js`
  - core UI images
  - monster assets
  - region backgrounds
  - BGM files
- Cache the local vocabulary bundle.
- If cloud vocabulary sync is added later, make it an explicit import/sync setting rather than a hard-coded private URL.
- Do not cache-bust aggressively during active development.

Important: if the local vocabulary bundle cannot be read, the game should continue with built-in fallback vocabulary.

## Phase 4 - Progress Safety

Before relying on PWA installs, add:

- Export progress to JSON.
- Import progress from JSON.
- Clear progress confirmation.

This protects monster collection, mastery, and region progress if browser storage changes between `file://`, hosted URL, Android Chrome, or installed PWA.

## Phase 5 - Tablet QA

Check:

- Installed PWA opens without browser address bar.
- Landscape layout avoids camera notch and system gesture bars.
- BGM starts only after user interaction.
- English pronunciation works on Android Chrome.
- Local vocabulary loads on the hosted HTTPS version.
- Offline launch shows a friendly fallback state.

## Suggested Order

1. First Git commit.
2. Progress export/import.
3. PWA manifest and icons.
4. Service worker with minimal cache.
5. Hosted test deployment.
6. Tablet install test.
