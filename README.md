# Spell Quest

Spell Quest is a browser-based English spelling adventure game for kids. The player listens to English pronunciation, reads the Chinese prompt, and taps shuffled letters in the correct order to attack and collect monsters.

The current prototype is a static frontend project. It can run by opening `index.html` directly in a browser, and it can generate a single-file Android-friendly build with `build-android.mjs`.

## Current Features

- First-person pixel-art battle screen.
- Local CSV vocabulary loading with fallback data.
- Chinese prompt plus repeatable English pronunciation.
- Letter-tap spelling for words, phrases, and patterns.
- Multi-region adventure flow with bosses and unlock conditions.
- Monster collection, evolution, and mastery tracking.
- Battle dialogue, hit feedback, counterattacks, and WebAudio SFX.
- Region BGM and boss BGM from local MP3 files.
- Android single-file build output via `android.html`.

## Main Files

- `index.html` - main browser entry.
- `style.css` - UI, layout, overlays, and responsive styling.
- `game.js` - game logic, battle flow, progression, audio, and rendering.
- `build-android.mjs` - generates `android.html` with assets embedded.
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

## Notes For Git

`android.html` is intentionally ignored because it is a generated file and is currently around 90 MB. Keep committing source files, assets, scripts, and docs; regenerate `android.html` when needed.

Large editable PNG files under `art-source/` use Git LFS. After cloning on a new machine, install Git LFS and run:

```powershell
git lfs install
git lfs pull
```

Runtime assets under `assets/` remain regular Git files so the checked-out project can run and build without an additional asset conversion step. Generated previews, diagnostics, and safety backups belong in `local-output/` and are not committed.

The game currently uses a local vocabulary file instead of a cloud spreadsheet. If cloud sync is needed later, design it as an explicit import/sync feature rather than hard-coding a private sheet URL into the game.
