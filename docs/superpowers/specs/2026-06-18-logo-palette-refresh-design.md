# Hold It Down CIC Logo And Palette Refresh Design

## Decision

Use the new circular tree-and-family logo as the primary Hold It Down CIC brand mark across the website. Apply the selected "Balanced Logo Palette" as the site-wide colour direction.

## Palette

The refreshed palette should use the logo colours without letting the site become one-note.

- Primary accent: leaf green, used for brand emphasis, active states, pills, selected states, and some headings.
- Warm action accent: orange, used for donate buttons, key calls to action, and warm highlights.
- Secondary accent: purple, used sparingly for small highlights and continuity with the existing brand feel.
- Text: deep brown/near-black, used for strong readability.
- Surfaces: warm cream and soft off-white, used for light backgrounds, cards, and elevated sections.
- Dark mode: keep a dark, readable base but shift accents to logo-derived green/orange/purple instead of the current purple-first palette.

## Scope

Update the logo everywhere it appears:

- Header navigation.
- Footer.
- Preloader.
- Tree of Hope preview/brand treatment.
- SEO structured data logo URL.
- Favicon, app icons, and manifest icons where practical from the supplied square logo.

Update central theme tokens in `src/data/sections.json` so existing components inherit the new palette through CSS variables.

Review page-specific hard-coded colours and align obvious conflicts, especially places that still use the old purple/orange or unrelated blue styling for major surfaces and calls to action. The first pass should stay focused and avoid redesigning every page layout.

## Asset Handling

Store the supplied image as the source brand asset in `public/logos/`. Generate web-friendly resized variants for favicon/app icon use. Keep the original aspect ratio and circular mark intact; do not crop into the tree or text.

Because the source is a JPEG with a white background, use it directly for now. If a transparent vector or PNG version becomes available later, it can replace the asset without changing the theme work.

## Accessibility

Maintain readable contrast for headings, body text, buttons, and nav links in light and dark themes. Do not use yellow/orange text for important headings on pale backgrounds. Buttons must retain clear text contrast.

## Verification

After implementation:

- Run `npm run build`.
- Check the home page, Stitch Craft N Knit page, Tree of Hope section/page, footer, and mobile navigation.
- Confirm the new logo appears in header/footer/preloader and metadata references.
- Confirm light/dark mode both remain readable.

## Out Of Scope

This change does not redesign layout structure, replace programme photos, rewrite copy, or rebuild the Tree of Hope 3D model. Those can be separate follow-up changes.
