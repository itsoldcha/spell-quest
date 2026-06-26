# Spell Quest

Spell Quest is a browser-based English spelling adventure game for kids. The player listens to English pronunciation, reads the Chinese prompt, and taps shuffled letters in the correct order to attack and collect monsters.

The current prototype is a static frontend project. It can run by opening `index.html` directly in a browser, and it can generate a single-file Android-friendly build with `build-android.mjs`.

## Current Features

- First-person pixel-art battle screen.
- Local CSV vocabulary loading with fallback data.
- Chinese prompt plus repeatable English pronunciation.
- Letter-tap spelling for words, phrases, and patterns.
- Multi-region adventure flow with bosses and unlock conditions.
- Ten-floor mastery tower, with each floor covering five vocabulary lessons.
- Standard, dynamic shuffle, odd-letter defense, timed, and mixed answer modes.
- Full first-time mode tutorials, including the basic letter-removal rule, appear in the main adventure; tower runs use brief cues with optional rule help.
- The first guided mistake is protected and does not reduce player HP.
- Standard spelling now converts each correct letter into battlefield energy before firing, with a stronger final-word charge cue.
- Dynamic shuffle mode now fires immediately on a correct lock, dissolves the old choices, and scans a new letter set into the command tray.
- Odd-letter defense mode places a visible shield over the monster, shatters it on a correct weak-point pick, and reflects mistakes back at the player.
- Odd-letter defense uses a clear semi-transparent hex field that cracks, fragments, and reflects attacks without persistent electrical clutter.
- Timed spelling mode surrounds the answer lock with a shrinking energy ring, escalates battlefield warnings, and grades the finishing burst by time remaining.
- Per-word mastery tracking for each answer mode.
- Monster collection, evolution, and mastery tracking.
- Battle dialogue, hit feedback, counterattacks, and WebAudio SFX.
- Region BGM and boss BGM from local MP3 files.
- Android single-file build output via `android.html`.

## Main Files

- `index.html` - main browser entry.
- `style.css` - UI, layout, overlays, and responsive styling.
- `game.js` - game logic, battle flow, progression, audio, and rendering.
- `build-android.mjs` - generates `android.html` with assets embedded.
- `build-pwa.mjs` - creates the deployable PWA in `dist/`.
- `manifest.webmanifest` and `service-worker.js` - app installation and offline cache.
- `assets/` - runtime-ready game art and audio assets.
- `art-source/` - editable art sources tracked with Git LFS.
- `local-output/` - ignored previews, diagnostics, backups, and generated builds.
- `assets/data/vocabulary.csv` - local vocabulary source.
- `assets/data/vocabulary.js` - browser-friendly local vocabulary bundle.
- `docs/` - project notes and production standards.
- `tools/` - local asset pipeline scripts.

## Local Play

Open `index.html` in a desktop browser.

For Android tablet testing, run:

```powershell
node build-android.mjs
```

Then copy/open `android.html` on the tablet.

## PWA Build

Create the deployable PWA:

```powershell
node build-pwa.mjs
```

The generated `dist/` folder is intentionally ignored by Git. GitHub Actions deploys the same build to GitHub Pages after changes are pushed to `main`.

The installed PWA launches fullscreen. Landscape lock is requested after the player starts an adventure or tower challenge, and the home screen also offers a manual fullscreen button.

## Notes For Git

`android.html` is intentionally ignored because it is a generated file and is currently around 90 MB. Keep committing source files, assets, scripts, and docs; regenerate `android.html` when needed.

Large editable PNG files under `art-source/` use Git LFS. After cloning on a new machine, install Git LFS and run:

```powershell
git lfs install
git lfs pull
```

Runtime assets under `assets/` remain regular Git files so the checked-out project can run and build without an additional asset conversion step. Generated previews, diagnostics, and safety backups belong in `local-output/` and are not committed.

The game currently uses a local vocabulary file instead of a cloud spreadsheet. If cloud sync is needed later, design it as an explicit import/sync feature rather than hard-coding a private sheet URL into the game.
