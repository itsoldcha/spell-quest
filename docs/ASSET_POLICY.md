# Asset Repository Policy

Spell Quest separates shipping assets, editable source art, and disposable production output.

## Runtime Assets

`assets/` contains only files required to run the game or build `android.html`.

- Keep paths stable because `game.js` and `build-android.mjs` load these files.
- Commit these files with regular Git.
- Optimize them for browser and tablet use.

## Editable Art Sources

`art-source/` contains source sheets, high-resolution art, references, and retired candidates that may be edited later.

- PNG files are tracked with Git LFS through `.gitattributes`.
- Keep source art out of runtime manifests.
- Add a small README or manifest when a new production pipeline is introduced.

## Local Production Output

`local-output/` contains reproducible or temporary files:

- previews and contact sheets;
- safety diagnostics and reports;
- automatic backups;
- screenshots and playtest recordings;
- generated `android.html`.

This directory is ignored by Git. Important decisions discovered during QA should be recorded in `docs/`, not preserved only as screenshots.

## Clone Setup

```powershell
git lfs install
git lfs pull
```

After LFS objects are available, `index.html` can be opened directly and `build-android.mjs` can rebuild the Android single-file version.

## Adding New Assets

1. Put editable source art in `art-source/`.
2. Export the runtime-ready version to `assets/`.
3. Put previews and diagnostics in `local-output/`.
4. Update the relevant manifest.
5. Verify desktop play and rebuild `android.html`.
