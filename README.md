# FORGE HACKATHON

Vite 8 + React 19 + TypeScript 7 SPA with Tailwind CSS v4, ShadCN UI and GSAP.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | `tsc -b` typecheck, then production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | oxlint |

## Adding UI components

```bash
npx shadcn@latest add dialog dropdown-menu
```

Components land in `src/components/ui/`. They are plain source you own — edit them freely.
Re-adding an edited component overwrites it unless you pass `--no-reinstall`.

The CLI is v4: it takes `-b radix|base|aria` and `-p nova|vega|maia|...`, not the old
`--style` / `--base-color` flags.

## The landing page

`src/App.tsx` composes the Civic Pulse landing page from `src/components/site/`:

| Section | File |
| --- | --- |
| Header / nav | `site-header.tsx` |
| Hero + location lookup + radio mascot | `hero.tsx` |
| Live pulse stats strip | `pulse-strip.tsx` |
| Trending issues | `trending-issues.tsx` |
| How it works | `how-it-works.tsx` |
| Featured poll with live results | `featured-poll.tsx` |
| Closing CTA + footer | `closing-cta.tsx`, `site-footer.tsx` |

Colour, type and radius tokens live in `src/index.css` (see `design-guidelines.md`).
Components use the semantic utilities (`bg-page`, `text-ink`, `border-hairline`,
`font-display`) rather than raw hex values, so a palette change is one file.

## Animation

`gsap` and `@gsap/react` are installed. Use the `useGSAP` hook with a `scope` ref so tweens
are cleaned up on unmount. The hero fade in `src/components/site/hero.tsx` is the reference
implementation, and it opts out when `prefers-reduced-motion` is set.

Two gotchas worth knowing:

- Inside `useGSAP({ scope })`, a ScrollTrigger `trigger: '.class'` string does **not** match the
  scope element itself. Pass `trigger: ref.current`.
- TypeScript 7 removed `baseUrl`. The `@/` alias is declared with `paths` only in
  `tsconfig.app.json`, and mirrored in `vite.config.ts`.
