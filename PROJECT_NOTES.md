# Spell Quest Project Notes

This file is the handoff entry point for continuing the project in a new folder, new Codex workspace, or cloned GitHub repository.

## Product Direction

Spell Quest is an English vocabulary spelling game for an 8-year-old learner. The goal is to make repeated word practice feel like a polished monster-battle adventure rather than a worksheet.

Core fantasy:

- The player is on a first-person expedition.
- Monsters ask vocabulary questions.
- Correct spelling fires attacks.
- Wrong answers trigger monster counterattacks and guided correction.
- Long-term motivation comes from regions, collection, evolution, and word mastery.

## Current Gameplay Loop

1. Choose or continue an expedition from the home screen.
2. Enter a region with a scene card transition.
3. Optionally review scout intel before battle.
4. Monster enters and asks a Chinese prompt.
5. Player listens to English pronunciation and taps shuffled letters.
6. Each correct letter gives light hit feedback.
7. Completing the word fires a stronger shot.
8. Wrong input triggers enemy attack, correct-answer dialogue, slow spelling, and pronunciation.
9. Defeating monsters advances the route and may capture/grow monsters.
10. Region bosses unlock future regions when learning targets are met.

## Current Technical Shape

- Static frontend, no npm app framework.
- Main files: `index.html`, `style.css`, `game.js`.
- Phaser/Canvas-style battle rendering has been folded into the plain JS prototype for smoother tablet battle animation.
- Vocabulary loads from local files in `assets/data/`.
- Local fallback vocabulary still exists in `game.js` for safety.
- Browser Web Speech API handles English pronunciation.
- WebAudio handles UI/game SFX and fallback synth music.
- MP3 BGM lives in `assets/audio/bgm/`.
- `build-android.mjs` embeds assets into `android.html` for Android file-based testing.

## Asset Direction

Art direction:

- Polished pixel-art fantasy/sci-fi.
- First-person cannon battle framing.
- Distinct region backgrounds rather than repeated desert variants.
- Monster designs should support three stages: baby, rookie, ultimate.
- Later stages should become visibly more mature and cool, not just cute.

Current monster asset standard:

- See `docs/monster-asset-standard-v1.md`.
- Monster packs contain action images for stages and battle states.
- Some older generated monsters may still have minor cleanup artifacts; acceptable for prototype, but final production should use the documented standard.

## Audio Direction

Current audio layers:

- MP3 BGM by screen/region/boss.
- WebAudio SFX for battle hits, UI ticks, enemy attacks, and monster dialogue.
- English pronunciation must stay clear and should win priority over decorative monster sounds.

Recent mix decisions:

- BGM volume is lower than SFX.
- Monster dialogue SFX is intentionally audible and closer to normal SFX volume.
- Region BGM starts after the region intro card transitions into battle.

## Git / PWA Plan

The repository should commit source and assets, but not generated `android.html`.

The current version intentionally removes the previous hard-coded Google Sheet link for privacy. Vocabulary is stored locally as `assets/data/vocabulary.csv` and bundled for direct browser use by `assets/data/vocabulary.js`.

Recommended first commit:

```text
Initial Spell Quest prototype
```

PWA preparation should happen after the first clean Git baseline. See `docs/PWA_PLAN.md`.

## Useful Commands

Syntax check:

```powershell
& 'C:\Users\tgos\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check game.js
```

Build Android single-file version:

```powershell
& 'C:\Users\tgos\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' build-android.mjs
```

## Handoff Reminder

If this project is moved or renamed, clone/open the new folder in Codex and start by reading:

1. `README.md`
2. `PROJECT_NOTES.md`
3. `docs/PWA_PLAN.md`
4. `docs/monster-asset-standard-v1.md`
