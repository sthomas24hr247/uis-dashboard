# Reference Materials

This directory contains reference components and specifications that are NOT
wired into the production app, but are preserved for future implementation.

These files are intentionally outside `src/` so the source tree only contains
production code.

## Files

- **`ClaimsCartography.tsx`** — Interactive architecture map showing data
  flows through the claims lifecycle. Provided by Neal as part of the
  Claims Recovery v2 architecture spec (April 29, 2026). Reference for
  the future five-layer L01-L05 build-out, post-Demo Day.

- **`ClaimsExplainer.tsx`** — Standalone Claims Recovery explainer
  component. Provided by Neal in the same spec bundle. May inform
  future onboarding or sales material UI.

These components were never imported into the production app. To activate
them, copy back into `src/components/claims/` and import where needed.
