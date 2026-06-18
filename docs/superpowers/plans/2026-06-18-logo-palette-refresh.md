# Logo Palette Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hold It Down CIC website logo with the new tree-and-family mark and apply the selected balanced logo palette across the website.

**Architecture:** The site already centralizes brand colours in `src/data/sections.json`, which `src/app/layout.tsx` injects as CSS variables. This plan updates those tokens, aligns fallback CSS, replaces direct logo references, regenerates app icons, and updates obvious hard-coded public page colours without restructuring layouts.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4 CSS variables, local public image assets, macOS `sips` for image resizing.

---

### Task 1: Add Brand Logo Assets

**Files:**
- Create: `public/logos/holditdown-cic-tree-logo.jpg`
- Modify: `public/icon-192.png`
- Modify: `public/icon-512.png`
- Modify: `public/apple-icon.png`
- Modify: `src/app/favicon.ico`

- [ ] **Step 1: Generate website logo and app icons**

Run:

```bash
cp "/Users/srikarreddy/Downloads/WhatsApp Image 2026-06-18 at 13.28.53.jpeg" public/logos/holditdown-cic-tree-logo.jpg
sips -s format png -z 192 192 public/logos/holditdown-cic-tree-logo.jpg --out public/icon-192.png >/dev/null
sips -s format png -z 512 512 public/logos/holditdown-cic-tree-logo.jpg --out public/icon-512.png >/dev/null
sips -s format png -z 180 180 public/logos/holditdown-cic-tree-logo.jpg --out public/apple-icon.png >/dev/null
```

Expected: the new public logo exists and the icon PNG files are regenerated from it.

- [ ] **Step 2: Regenerate the Next.js favicon**

Run:

```bash
python3 - <<'PY'
from PIL import Image
src = 'public/logos/holditdown-cic-tree-logo.jpg'
img = Image.open(src).convert('RGBA')
img.save('src/app/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32)])
PY
```

Expected: `src/app/favicon.ico` is a Windows icon resource with 16px and 32px PNG entries.

- [ ] **Step 3: Inspect generated files**

Run:

```bash
file public/logos/holditdown-cic-tree-logo.jpg public/icon-192.png public/icon-512.png public/apple-icon.png src/app/favicon.ico
```

Expected: one JPEG logo, three PNG icons with 192, 512, and 180 pixel sizes, and a regenerated favicon.

### Task 2: Update Central Theme And Site Config

**Files:**
- Modify: `src/data/sections.json`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update theme tokens in `src/data/sections.json`**

Use these values for the `theme.light` object:

```json
{
  "accent": "#4f970f",
  "accent_light": "#7abf35",
  "accent_warm": "#d67808",
  "accent_glow": "rgba(79, 151, 15, 0.1)",
  "bg": "#fffaf1",
  "bg_elevated": "#fffdf8",
  "bg_card": "#ffffff",
  "bg_card_hover": "#f6f0e4",
  "bg_alt": "#f4ead8",
  "surface": "#eee2c9",
  "border": "rgba(33, 24, 13, 0.1)",
  "border_hover": "rgba(33, 24, 13, 0.18)",
  "text_primary": "#21180d",
  "text_secondary": "rgba(33, 24, 13, 0.66)",
  "text_tertiary": "rgba(33, 24, 13, 0.44)",
  "hero_glow_1": "rgba(79, 151, 15, 0.08)",
  "hero_glow_2": "rgba(214, 120, 8, 0.06)",
  "grid_line": "rgba(33, 24, 13, 0.04)",
  "cursor_glow": "rgba(79, 151, 15, 0.04)",
  "particle_opacity": 0.32,
  "scrollbar_thumb": "rgba(33, 24, 13, 0.16)",
  "scrollbar_thumb_hover": "rgba(33, 24, 13, 0.28)"
}
```

Use these values for the `theme.dark` object:

```json
{
  "accent": "#8bc34a",
  "accent_light": "#b9e66d",
  "accent_warm": "#f2a43a",
  "accent_glow": "rgba(139, 195, 74, 0.14)",
  "bg": "#100d08",
  "bg_elevated": "#17120b",
  "bg_card": "#1d160d",
  "bg_card_hover": "#261d11",
  "bg_alt": "#181309",
  "surface": "#2b2114",
  "border": "rgba(255, 250, 241, 0.1)",
  "border_hover": "rgba(255, 250, 241, 0.18)",
  "text_primary": "#fffaf1",
  "text_secondary": "rgba(255, 250, 241, 0.68)",
  "text_tertiary": "rgba(255, 250, 241, 0.46)",
  "hero_glow_1": "rgba(79, 151, 15, 0.18)",
  "hero_glow_2": "rgba(214, 120, 8, 0.12)",
  "grid_line": "rgba(255, 250, 241, 0.03)",
  "cursor_glow": "rgba(139, 195, 74, 0.07)",
  "particle_opacity": 0.55,
  "scrollbar_thumb": "rgba(255, 250, 241, 0.14)",
  "scrollbar_thumb_hover": "rgba(255, 250, 241, 0.24)"
}
```

- [ ] **Step 2: Update configured logo paths in `src/data/sections.json`**

Change both `nav.logo_src` and `footer.logo_src` to:

```json
"/logos/holditdown-cic-tree-logo.jpg"
```

Keep the alt text as:

```json
"Hold It Down CIC"
```

- [ ] **Step 3: Mirror theme defaults in `src/app/globals.css`**

Update the light and dark fallback CSS variables to match the JSON values in Step 1. This prevents old colours flashing if dynamic theme injection is delayed.

### Task 3: Update Logo Usage And Metadata

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/components/Preloader.tsx`
- Modify: `src/components/CommunityTreePreview.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `public/manifest.json`

- [ ] **Step 1: Update fallback logo constants and circular sizing**

Use `/logos/holditdown-cic-tree-logo.jpg` as the fallback path in `Navbar` and `Footer`.

In `Navbar`, change the logo container to square sizing:

```tsx
<div className="relative h-11 w-11 sm:h-12 sm:w-12">
```

Use:

```tsx
className="rounded-full object-cover"
```

In `Footer`, change the logo container to:

```tsx
<div className="relative h-28 w-28 sm:h-32 sm:w-32">
```

Use:

```tsx
className="rounded-full object-cover"
```

- [ ] **Step 2: Update direct logo references**

Replace direct `/logos/holdlogo.png` usages in `Preloader` and `CommunityTreePreview` with:

```tsx
"/logos/holditdown-cic-tree-logo.jpg"
```

Update the preloader drop shadow to use green:

```tsx
drop-shadow-[0_0_15px_rgba(79,151,15,0.3)]
```

- [ ] **Step 3: Update metadata**

In `src/app/layout.tsx`, set theme colours:

```ts
{ media: "(prefers-color-scheme: light)", color: "#fffaf1" },
{ media: "(prefers-color-scheme: dark)", color: "#100d08" },
```

Point OpenGraph/Twitter image references and JSON-LD `logo` to:

```ts
"/logos/holditdown-cic-tree-logo.jpg"
```

Use image dimensions:

```ts
width: 1254,
height: 1254
```

Update metadata icons to prefer the regenerated PNG icons:

```ts
icons: {
  icon: [
    { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  apple: "/apple-icon.png",
}
```

- [ ] **Step 4: Update manifest colours**

In `public/manifest.json`, set:

```json
"background_color": "#fffaf1",
"theme_color": "#4f970f"
```

### Task 4: Align Obvious Public Page Colour Conflicts

**Files:**
- Modify: `src/app/stitch-craft-n-knit/page.tsx`
- Modify: `src/app/roots-and-wings/RootsAndWingsClient.tsx`
- Modify: `src/app/events/EventsClient.tsx`
- Modify: `src/app/vote-share/page.tsx`
- Modify: `src/app/stall-booking/page.tsx`
- Modify: `src/app/about/page.tsx`

- [ ] **Step 1: Replace Stitch page hard-coded teal/purple**

Use central tokens for primary actions:

```tsx
className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
```

Use `border-accent/25 bg-accent-glow` for the hero pill and `hover:border-accent/40` for the secondary button.

Use this weekly sessions section class:

```tsx
className="bg-[#21180d] px-5 py-14 text-white sm:px-6 md:py-20"
```

- [ ] **Step 2: Replace Roots & Wings CTA blue/yellow block**

Use:

```tsx
className="mx-auto max-w-[1000px] overflow-hidden rounded-3xl border border-accent-warm/25 bg-gradient-to-br from-[#21180d] via-[#2f3a16] to-[#0f1c0a] p-8 text-center md:p-16"
```

Replace yellow badges/buttons with `bg-accent-warm text-[#21180d]` and secondary copy with `text-white/80`.

- [ ] **Step 3: Replace Events CTA blue/yellow block**

For the featured event card, use dark brown/green gradients and `accent-warm` badges/buttons:

```tsx
className="relative overflow-hidden rounded-2xl border border-accent-warm/30 bg-gradient-to-r from-[#21180d] via-[#2f3a16] to-[#0f1c0a]"
```

Use `bg-accent-warm text-[#21180d]` for the primary button and badge.

- [ ] **Step 4: Replace Vote Share and Stall Booking blue/yellow surfaces**

Use these page backgrounds:

```tsx
className="min-h-screen bg-gradient-to-b from-[#fffaf1] to-[#f4ead8] ..."
```

Use dark brand headers:

```tsx
className="bg-[#21180d] ..."
```

Use green/orange accent classes:

```tsx
"bg-accent-warm text-[#21180d]"
"border-accent-warm"
"bg-accent/10"
"text-accent"
```

- [ ] **Step 5: Replace About page voting explainer blue/yellow accents**

Use `bg-accent/10`, `border-accent`, `text-accent`, `bg-accent-warm`, and `text-[#21180d]` for the public About page highlight cards, numbered circles, call-to-action panel, and closing border.

### Task 5: Verify And Commit

**Files:**
- Test: build output
- Test: git diff

- [ ] **Step 1: Run build**

Run:

```bash
npm run build
```

Expected: Next.js production build completes without TypeScript or lint-blocking errors.

- [ ] **Step 2: Inspect all remaining old brand references**

Run:

```bash
rg -n "/logos/holdlogo|#7c3aed|#a78bfa|#d97706|#c8a2f8|#e8b84a|from-blue-900|to-blue-950|text-yellow-400|bg-yellow-400|text-blue-900|text-blue-950|bg-blue-900" src public
```

Expected: no remaining old logo path; any remaining old blue/yellow references are either admin-only or intentionally out of scope.

- [ ] **Step 3: Review git diff**

Run:

```bash
git diff -- src public docs/superpowers/plans/2026-06-18-logo-palette-refresh.md
```

Expected: only brand assets, theme/logo references, and planned colour alignment changed.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add docs/superpowers/plans/2026-06-18-logo-palette-refresh.md public src
git commit -m "Refresh logo and site palette"
```

Expected: commit succeeds without staging unrelated Tree of Hope dirty files or `supabase/.temp`.
