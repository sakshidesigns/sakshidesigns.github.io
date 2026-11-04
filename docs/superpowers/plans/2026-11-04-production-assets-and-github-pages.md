# Production Assets and GitHub Pages Deploy Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Shrink `public/` from ~164 MB to a size that is reasonable to host and load, and deploy the Vite site to the user site `https://sakshidesigns.github.io` via GitHub Actions.

**Architecture:** Optimize assets in place with a one-off script that lives outside the repo (ffmpeg for video, sharp for images). PNG/JPEG become WebP and every reference in `src/` is updated. Videos stay `.mp4` (H.264, no audio, faststart). A user site is served from `/`, so Vite `base` stays default. A GitHub Actions workflow builds and publishes `dist/`.

**Tech Stack:** Vite 6, React 19, ffmpeg (winget `Gyan.FFmpeg`), sharp (temp install outside repo), GitHub Actions Pages.

## Global Constraints

- Remote: `https://github.com/sakshidesigns/sakshidesigns.github.io.git` (empty), deploy branch `main`.
- Site root is `/`; keep absolute asset paths such as `/kora.png`.
- Videos are muted autoplay loops: strip audio, H.264, `yuv420p`, `+faststart`.
- Transparent cutouts must keep alpha (`kora-card-nobg`, `dataassist-cutout`, `*-cutout`).
- `public/frames/*.webp` (64 hero frames, ~47 KB each) are already optimized; do not touch.
- Pushing is outward-facing: do not push without the user's go-ahead.

## Review Focus

- A reference to an old `.png` name left in `src/` shows a broken image: grep must return zero stale refs.
- Alpha lost in a cutout: compare channels before/after.
- Video visually degraded or wrong aspect/size: dimensions must match originals except for capped width.
- Autoplaying videos all download on first paint: videos must not preload off-screen.
- Pages shows nothing because source is not set to "GitHub Actions": needs a user step.

---

### Task 1: Tooling and audit

- [ ] Install ffmpeg: `winget install Gyan.FFmpeg`; verify `ffprobe -version`.
- [ ] Install sharp in a scratch dir (not the repo): `npm i sharp` in the scratchpad.
- [ ] Probe every video (`ffprobe` width/height/duration/fps) and list which `public/` files are referenced from `src/`; unreferenced ones are deleted in Task 2.

### Task 2: Optimize assets

- [ ] Delete unreferenced files (e.g. `schooliat-mobile-login.mp4`, superseded by `-clean`).
- [ ] Images: `sharp` -> WebP q85 (alpha preserved), cap width 2400 px; delete the originals; `.jpeg` too.
- [ ] Videos: `ffmpeg -an -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart`, cap width 1600 px.
- [ ] Rewrite references in `src/` (`.png|.jpeg` -> `.webp`) incl. `CaseStudyKit.test.tsx`; grep for stale names returns nothing.
- [ ] Verify: `public/` total size, alpha check on cutouts, `npm test` passes.
- [ ] Commit.

### Task 3: Loading behavior

- [ ] `MediaPlaceholder` in `src/sections/caseStudy/CaseStudyKit.jsx`: `<img loading="lazy" decoding="async">`; `<video preload="none">` started/paused by an IntersectionObserver so off-screen clips are not fetched.
- [ ] `index.html`: add `description`, `theme-color`, SVG favicon (`public/favicon.svg`).
- [ ] `npm test` and `npm run build` pass; commit.

### Task 4: GitHub Pages

- [ ] Add `.github/workflows/deploy.yml`: on push to `main` + manual; `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact`, `actions/deploy-pages`; permissions `pages: write`, `id-token: write`.
- [ ] `npm run build && npm run preview`: load in browser, check console and network for 404s and that videos play.
- [ ] Commit.

### Task 5: Publish (needs user go-ahead)

- [ ] `git push origin worktree-cursor-tracking-hero:main` (history is ~174 MB because of earlier un-optimized assets; offer a squashed orphan branch as the alternative).
- [ ] User sets repo Settings -> Pages -> Source = "GitHub Actions"; confirm the run is green and `https://sakshidesigns.github.io` loads.
