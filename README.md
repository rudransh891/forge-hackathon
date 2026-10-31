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

## Animation

`gsap` and `@gsap/react` are installed. Use the `useGSAP` hook with a `scope` ref so tweens
are cleaned up on unmount. Scroll-triggered work lives in `src/App.tsx` as a reference.

Two gotchas worth knowing:

- Inside `useGSAP({ scope })`, a ScrollTrigger `trigger: '.class'` string does **not** match the
  scope element itself. Pass `trigger: ref.current`.
- TypeScript 7 removed `baseUrl`. The `@/` alias is declared with `paths` only in
  `tsconfig.app.json`, and mirrored in `vite.config.ts`.
