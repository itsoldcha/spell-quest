# Monster Asset Production Standard v1

This standard defines the production package for the 30 monster families.

## Runtime Package

Each monster uses:

- ID: `monster-00` through `monster-29`
- stages: `baby`, `rookie`, `ultimate`
- actions: `idle-1`, `idle-2`, `entrance`, `hit`, `defeat`, `capture`, `evolution`
- runtime path: `assets/monster-packs/monster-XX/`

Each runtime frame is a transparent 256 x 256 PNG. The monster must remain inside the safe canvas margin, use a consistent ground line, and contain no chroma-key residue or fragments from adjacent cells.

## Art Direction

- Baby forms may be friendly and compact.
- Rookie forms should show clearer structure, stronger posture, and a more mature face.
- Ultimate forms should feel powerful and heroic rather than simply enlarged.
- Eyes, facial proportions, armor, silhouette, and stance should mature together.
- Preserve the established colorful pixel-art science-fantasy style.

## Source Files

Editable sources belong outside the runtime package:

- evolution sheets: `art-source/evolutions/`
- action sheets: `art-source/monster-packs/monster-XX/`
- batch references: `art-source/monster-packs/references/`

These PNG files use Git LFS. Runtime code must not load them directly.

## Generated QA Output

Tools write reproducible QA files to `local-output/`:

- pack previews: `local-output/previews/monster-packs/`
- safety diagnostics: `local-output/diagnostics/monster-packs/`
- automatic backups: `local-output/backups/monster-packs/`

These files are intentionally excluded from Git.

## Validation Checklist

- All 21 runtime frames exist for each monster.
- Every `manifest.json` parses correctly.
- The sprite remains within the safe margins.
- No body part is clipped.
- No neighboring sprite fragment remains.
- Transparent edges do not contain magenta or green residue.
- Idle, entrance, hit, defeat, capture, and evolution states read clearly in game.
- Rookie and ultimate faces visibly mature with their bodies.

## Production Flow

1. Create or update the source sheet in `art-source/`.
2. Extract the three evolution stages to `assets/evolutions/`.
3. Extract or build action frames in `assets/monster-packs/`.
4. Run the safety normalization tool.
5. Review previews and diagnostics in `local-output/`.
6. Test the monster in the battle test screen.
7. Rebuild and test `android.html`.

`assets/monster-packs/production-plan.json` remains the status record for all monster families.
