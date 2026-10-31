# Civic Pulse: Design Guidelines

A retro-broadcast, "old money" visual system for a citizen-facing civic app.
The radio is the metaphor: you *tune in* to what is happening in your community.

---

## 0. Assumptions (edit these first)

| # | Decision | Value used here |
|---|----------|-----------------|
| 1 | Audience | Citizens (general public, all ages) |
| 2 | Tone | Formal, establishment feel, warm rather than stiff |
| 3 | Metaphor depth | Visual style plus light radio vocabulary in copy ("Tune in", "Signal", "On the air") |
| 4 | Palette | Original cream, brown, teal, coral, plus **deep green** for gravitas |
| 5 | Illustration | Flat, editable vector, built from palette tokens only |
| 6 | Typography | Elegant serif for headlines, plain readable sans for everything else |
| 7 | Screens | Defined by your own wireframes; this file covers only components |
| 8 | Motion | Almost none; subtle fades only, respects reduced motion |
| 9 | Accessibility | WCAG 2.2 AA minimum |
| 10 | Dark mode | Not included at launch; the brown "panel" surface already provides a dark section style |
| 11 | Photos | Real user photos; framed consistently, never filtered |
| 12 | Output | CSS custom properties (tokens), easily mapped to Tailwind or Figma variables |

> **Easy editing rule:** never hard-code a color, font or radius in a component.
> Every value comes from a token in Section 8. Change the token, and the whole app updates.

---

## 1. Design principles

1. **Trustworthy first, charming second.** Retro details are seasoning, not the meal.
2. **Color carries meaning.** Teal = information, green = official/confirmed, coral = urgent. Never use coral decoratively.
3. **Calm density.** Generous spacing, hairline dividers, restrained ornament.
4. **Readable by everyone.** Big tap targets, strong contrast, plain language.
5. **Flat and editable.** Illustrations and icons are simple shapes, built from tokens.

---

## 2. Color

### 2.1 Core palette

| Token | Hex | Role |
|-------|-----|------|
| `--color-cream-50` | `#FDF8EA` | Page highlight, input fill, cards |
| `--color-cream-100` | `#FAF0D7` | **Main background** |
| `--color-cream-300` | `#E9D9B0` | Soft borders, step-card edges |
| `--color-sand-100` | `#EBDDC8` | Illustration beds (all three card arts) |
| `--color-sand-300` | `#D9C3A8` | Row dividers, disabled fills, muted text on brown |
| `--color-brown-950` | `#2B1810` | Footer, deeper than the standard panel |
| `--color-brown-900` | `#3E2419` | **Primary text, dark panels** |
| `--color-brown-700` | `#5A3A2C` | Panel dividers, bar tracks, illustration linework |
| `--color-brown-600` | `#6B4A3A` | Secondary text on cream |
| `--color-green-700` | `#1F4A3C` | Action color, **cream sections only** |
| `--color-green-100` | `#DCE8DF` | Success / confirmed background |
| `--color-teal-400` | `#6BC4BF` | Stats strip, selected row, focus ring |
| `--color-teal-100` | `#DDF1EF` | Info background, Open badge |
| `--color-coral-100` | `#FBE3DB` | Reserved, pale coral wash |
| `--color-coral-300` | `#F2A58F` | Brand coral **on brown**, 3:1 pairs |
| `--color-coral-500` | `#D9482F` | Brand coral on cream: accents 24px+, the frame, illustration accents |
| `--color-coral-700` | `#B8361F` | Urgent pill, small coral text on cream |
| `--color-amber-500` | `#C98A1B` | Warning fills (pair with brown-900 text) |

**Coral has two jobs and they never mix.** BRAND coral is accent words in headlines (24px+),
section numbers, dots, icons, underlines and illustration fills — never a pill, never a
warning icon, never a card edge. STATUS coral is urgent only: coral-700 pill + warning icon
+ 4px left edge on the card.

**Green-700 is an action colour on cream sections only.** Anything sitting on a brown panel
takes coral-300 for actions, or sand-300 / cream-100 for secondary buttons.

### 2.2 Semantic tokens (use these in components)

| Token | Maps to | Meaning |
|-------|---------|---------|
| `--bg-page` | cream-100 | Default background |
| `--bg-panel` | brown-900 | Dark feature sections |
| `--bg-card` | cream-50 | Cards on the page |
| `--text-primary` | brown-900 | Body and headings on cream |
| `--text-secondary` | brown-600 | Captions, metadata |
| `--text-on-panel` | cream-100 | Text on dark panels |
| `--text-on-panel-muted` | `#D9C9A8` | Secondary text on dark panels |
| `--action-primary` | green-700 | Main buttons, links |
| `--status-info` | teal-400 | Neutral info, selection |
| `--status-success` | green-700 | Confirmed, submitted, resolved |
| `--status-warning` | amber-500 | Needs attention soon |
| `--status-urgent` | coral-700 | Deadlines, alerts, errors |
| `--border-subtle` | cream-300 | Hairlines |

### 2.3 Verified contrast pairings (approximate ratios)

| Text on background | Ratio | Use |
|--------------------|-------|-----|
| brown-900 on cream-100 | ~12.6:1 | All body text |
| brown-600 on cream-100 | ~7:1 | Secondary text |
| green-700 on cream-100 | ~8.8:1 | Links, buttons |
| coral-700 on cream-100 | ~5.2:1 | Urgent text |
| brown-900 on teal-400 | ~7:1 | Selected rows, ticker |
| cream-100 on brown-900 | ~12.6:1 | Text on dark panels |

### 2.4 Color rules

- **Never** place teal or coral-500 text on cream; they fail AA. Use teal as a *fill* with brown text, and coral-700 for coral *text*.
- Coral-500 is allowed for fills, large shapes and the frame only.
- Do not use color alone to show status; always add an icon or label ("Urgent", "Open", "Closed").
- The thin coral page frame from the reference is kept, but at 4px, not a heavy border.

---

## 3. Typography

### 3.1 Font families

| Role | Font | Fallback | Notes |
|------|------|----------|-------|
| Hero display | **Quicksand** (variable 300–700) | `"Fraunces", Georgia, serif` | Loaded from Google Fonts; used for the one big hero headline only |
| Display / headlines | **Fraunces** (Light and Regular, plus Italic) | `Georgia, serif` | Warm old-style serif, close to the reference mood |
| UI and body | **Public Sans** | `system-ui, sans-serif` | Highly legible, civic-friendly |
| Data / numbers (optional) | **IBM Plex Mono** | `ui-monospace, monospace` | Vote counts, dates, reference IDs |

All four are free on Google Fonts. To swap a font, change only the `--font-*` tokens.
Quicksand has no italic cut, so italics in the hero are synthesised — accept that, or drop
the italic rather than faking a slant elsewhere.

### 3.2 Type scale (mobile first)

| Style | Font | Size / line height | Weight | Usage |
|-------|------|--------------------|--------|-------|
| Display | Quicksand | 40 / 44 px | 300 | Hero headline only |
| H1 | Fraunces | 32 / 38 px | 400 | Screen titles |
| H2 | Fraunces | 24 / 30 px | 400 | Section titles |
| H3 | Public Sans | 18 / 26 px | 600 | Card titles |
| Body | Public Sans | 16 / 24 px | 400 | Default text |
| Small | Public Sans | 14 / 20 px | 400 | Metadata (never go below 14) |
| Label | Public Sans | 12 / 16 px | 600, uppercase, +6% tracking | Tags, badges |
| Italic accent | Fraunces Italic | 18 / 26 px | 400 | Taglines, pull quotes |

Desktop: scale Display to 72/76 and H1 to 44/50; everything else stays the same.
In the shipped build the hero display is set at 64/68 on desktop so the two-line break holds.

### 3.3 Typography rules

- The thin lowercase display style from the reference is for **hero and section headlines only**. Use sentence case for anything that must be read quickly (issue titles, forms, alerts).
- Body text is never set in Fraunces.
- Maximum line length: 65 characters.
- Minimum body size: 16 px. Minimum anything: 12 px (labels only).

---

## 4. Spacing, shape and elevation

| Token | Value |
|-------|-------|
| `--space-1` to `--space-8` | 4, 8, 12, 16, 24, 32, 48, 64 px |
| `--radius-sm` | 0 px (inputs, tags) |
| `--radius-md` | 0 px (cards, buttons) |
| `--radius-pill` | 0 px (chips, ticker items) |
| `--border-hairline` | 1px solid `--border-subtle` |
| `--shadow-card` | `0 1px 2px rgba(62, 36, 25, 0.12)` (the only shadow; keep it flat) |

- **Every corner is square.** Radii are 0 across the system: this is letterpress and
  newsprint, not a rounded web app. Chips, badges and ticker items that would normally be
  pills are cut as rectangles.
- **Circles stay circles.** The only round things in the product are shapes that are round
  by nature: the wordmark dot, radio controls, avatars, and icons. Never a rounded border.
- Prefer **hairline borders over shadows** for an editorial, old-money feel.
- Page padding: 20 px mobile, 64 px desktop. Max content width: 1120 px.

---

## 5. Components

### 5.1 Buttons

| Variant | Background | Text | Use |
|---------|------------|------|-----|
| Primary | green-700 | cream-50 | One per screen ("Submit report", "Cast vote") |
| Secondary | transparent, 1px green-700 border | green-700 | Alternate actions |
| Urgent | coral-700 | cream-50 | Destructive or time-critical only |
| Ghost | transparent | brown-900, underlined | Low-emphasis links |

- Height 48 px (minimum tap target 44 px), square corners, label in Public Sans 600.
- Focus: 3px outline in teal-400 with a 2px offset, always visible.
- Disabled: 40% opacity plus a `not-allowed` cursor, with text still readable.

### 5.2 Cards

**Issue card**
- Background card, hairline border, square corners, padding 16.
- Top row: status badge (left), locality tag (right).
- Title: H3. Metadata: Small, secondary text.
- Footer: supporter count (mono), "Follow" ghost button.
- Urgent issues get a 4px coral-700 left edge plus an "Urgent" badge with an icon.

**Poll / vote card**
- Question in H2 (Fraunces).
- Options as a vertical list, rows 56 px high, hairline dividers.
- Selected option: teal-400 fill with brown-900 text and a check icon (as in the reference "featured collection" list).
- Results: horizontal bars in green-700 on cream-300, with the percentage in mono.

**Panel (feature block)**
- Brown-900 background, cream text, large Fraunces headline, optional flat illustration on the side. Use at most one panel per screen.

### 5.3 Badges and chips

| Badge | Fill | Text |
|-------|------|------|
| Open | teal-100 | brown-900 |
| Resolved | green-100 | green-700 |
| Closing soon | amber-500 | brown-900 |
| Urgent | coral-700 | cream-50 |

Labels style, square tag (radius 0), always include an icon or text, never color only.

### 5.4 Live ticker (reuse of the marquee strip)

- Teal-400 strip, brown-900 text, 40 px tall, items separated by a small dot.
- Content: deadlines, meetings, results ("Ward meeting tonight 7 PM").
- Motion: slow horizontal scroll (about 30 px/s). **Pauses on hover/focus and is replaced by a static, swipeable list when "reduce motion" is on.** Provide a visible pause button.

### 5.5 Tuning-dial filter

- A segmented control styled like a radio dial: a thin horizontal scale with tick marks and a circular knob.
- Options: Locality, Topic, Urgency (choose one at a time).
- Must be keyboard operable (arrow keys), with a plain dropdown fallback for assistive tech.
- The knob snaps to positions with no spring animation.

### 5.6 Forms (report an issue, profile)

- Labels above fields, 14 px semibold. Never use placeholder-only labels.
- Inputs: 48 px high, cream-50 fill, 1px brown-600 border, square corners.
- Focus: 2px green-700 border plus the teal focus ring.
- Error: coral-700 border, an icon, and a message in coral-700 below the field ("Please add a location").
- Helper text in secondary color. Required fields marked "(required)" in text.

### 5.7 Navigation

- Mobile: bottom bar with 4 to 5 items, icon + label, 56 px tall. Active item: green-700 icon with a 2px underline.
- Desktop: top bar with the wordmark in Fraunces, and links in Public Sans 500.
- Hairline bottom border; no heavy shadow.

### 5.8 Empty, loading and error states

- Empty: small flat illustration plus one line of copy plus one action.
- Loading: static skeleton blocks in cream-300. No spinners that spin endlessly; use a subtle opacity pulse or none.
- Error: coral-700 icon, plain-language explanation, a retry button.

---

## 6. Illustration and iconography

### 6.1 Illustration style (flat, editable)

- Built only from basic shapes (rectangles, circles, squares, simple paths). No rounded rectangles.
- **Palette limited to the tokens in Section 2**; use no gradients, no outlines thicker than 2 px, and no shadows.
- Recommended file format: SVG, with colors set through `fill="currentColor"` or CSS variables (`fill: var(--color-teal-400)`), so recoloring never means editing the artwork.
- Layer naming convention: `bg`, `body`, `accent`, `detail` (makes editing predictable).
- Core illustration set:
  - **Radio** (the mascot; used on hero and panels)
  - Ballot box, megaphone, town hall building, map pin, clipboard (report), speech bubble (feedback)
- Keep the same proportions across the set: simple, front-facing, square corners, 2 to 3 colors per illustration plus cream.

### 6.2 Icons

- 24 px grid, 1.75 px stroke, rounded caps, one consistent set (e.g. Lucide).
- Icons inherit `currentColor`; never ship multi-colored icons.

---

## 7. Photography and user content

**Core rule:** photos are content; illustrations and UI are the frame. The retro style lives *around* a photo, never inside it.

### 7.1 Principles

1. **Separate the layers.** Flat illustrations appear only where there is no user content (hero, empty states, onboarding, section headers). Never overlay illustration on a post photo.
2. **Consistent frame.** Every photo uses the same ratio and hairline border so varied uploads look like one family.
3. **Text stays off photos** where possible. Titles and metadata sit below the image on the cream card.
4. **Don't recolor citizen photos.** No sepia, duotone or filters on uploads; they can serve as evidence (potholes, flooding, notices). A light warm tone is allowed only on editorial images the team controls (hero, news banners).
5. **Status lives outside the image.** Badges, the coral urgent edge and the follow button sit on the card, not on the photo.
6. **Plan for bad uploads.** Expect dark, blurry or sideways images, and design placeholders and errors.
7. **Privacy by design.** Leave room for face and plate blurring and a "Report this image" action.

### 7.2 Image specs

| Use | Ratio | Notes |
|-----|-------|-------|
| Issue / post card | 4:3 | `object-fit: cover`, focal point centered |
| Featured story / hero | 16:9 | Editorial images only |
| Post detail (gallery) | Original, max height 70vh | Tap to expand, pinch to zoom |
| Avatar | 1:1 | Circle, 40 px (list) or 72 px (profile) |
| Thumbnail strip | 1:1 | 64 px, square corners |

- Upload limits: accept JPEG, PNG, WebP; resize to 1600 px on the long edge; serve responsive sizes and lazy-load below the fold.
- Always store and show the original orientation correctly (apply EXIF rotation).

### 7.3 Frame, overlay and placeholder rules

- **Frame:** square corners (no radius), `--border-hairline` around the image.
- **Multiple photos:** 1 = full width, 2 = side by side, 3+ = one large plus a "+N" tile in brown-900 with cream text.
- **Text over photo (only if unavoidable):** place on a solid brown-900 band at 90% opacity, or a bottom gradient scrim from `rgba(62, 36, 25, 0.85)` to transparent, with cream text. Never place text directly on an uncontrolled photo.
- **Loading:** cream-300 block at the correct ratio (prevents layout shift), with no shimmer.
- **No image:** flat illustration placeholder (map pin or clipboard) on cream-300.
- **Failed to load:** same placeholder plus the label "Photo unavailable" and a "Retry" ghost button.
- **Alt text:** user-provided caption or description is used as alt; if absent, use "Photo attached to [post title]". Decorative illustrations use `alt=""`.

### 7.4 Tokens

```css
:root {
  --photo-ratio-card: 4 / 3;
  --photo-ratio-hero: 16 / 9;
  --photo-radius: var(--radius-md);
  --photo-border: 1px solid var(--border-subtle);
  --photo-placeholder-bg: var(--color-cream-300);
  --photo-scrim: linear-gradient(to top, rgba(62, 36, 25, 0.85), rgba(62, 36, 25, 0));
}

.photo {
  aspect-ratio: var(--photo-ratio-card);
  width: 100%;
  object-fit: cover;
  border-radius: var(--photo-radius);
  border: var(--photo-border);
  background: var(--photo-placeholder-bg);
}
```

### 7.5 Do and don't

| Do | Don't |
|----|-------|
| Frame every photo the same way | Mix flat illustration into a user photo |
| Put titles and badges on the card | Set text directly on uploaded images |
| Keep citizen photos unfiltered | Apply sepia or duotone to uploads |
| Reserve space to avoid layout jumps | Let images resize the card on load |
| Offer blur and report tools | Ignore privacy of faces and plates |

---

## 8. Design tokens (copy-paste CSS)

```css
:root {
  /* Fonts */
  --font-display: "Fraunces", Georgia, serif;
  --font-ui: "Public Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* Core palette */
  --color-cream-50:  #FDF8EA;
  --color-cream-100: #FAF0D7;
  --color-cream-300: #E9D9B0;
  --color-sand-100:  #EBDDC8;
  --color-sand-300:  #D9C3A8;
  --color-brown-950: #2B1810;
  --color-brown-900: #3E2419;
  --color-brown-700: #5A3A2C;
  --color-brown-600: #6B4A3A;
  --color-green-700: #1F4A3C;
  --color-green-100: #DCE8DF;
  --color-teal-400:  #6BC4BF;
  --color-teal-100:  #DDF1EF;
  --color-coral-100: #FBE3DB;
  --color-coral-300: #F2A58F;
  --color-coral-500: #D9482F;
  --color-coral-700: #B8361F;
  --color-amber-500: #C98A1B;

  /* Semantic tokens (components use ONLY these) */
  --bg-page: var(--color-cream-100);
  --bg-card: var(--color-cream-50);
  --bg-panel: var(--color-brown-900);
  --text-primary: var(--color-brown-900);
  --text-secondary: var(--color-brown-600);
  --text-on-panel: var(--color-cream-100);
  --text-on-panel-muted: #D9C9A8;
  --action-primary: var(--color-green-700);
  --status-info: var(--color-teal-400);
  --status-success: var(--color-green-700);
  --status-warning: var(--color-amber-500);
  --status-urgent: var(--color-coral-700);
  --border-subtle: var(--color-cream-300);
  --focus-ring: var(--color-teal-400);

  /* Shape and spacing — square corners everywhere */
  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-pill: 0px;
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;
  --shadow-card: 0 1px 2px rgba(62, 36, 25, 0.12);

  /* Motion */
  --motion-fast: 120ms;
  --motion-base: 200ms;
  --ease: ease-out;
}

@media (prefers-reduced-motion: reduce) {
  :root { --motion-fast: 0ms; --motion-base: 0ms; }
}
```

**Tailwind mapping tip:** map each semantic token in `theme.extend.colors` (for example `page: "var(--bg-page)"`), so that both CSS and Tailwind read from the same source.

---

## 9. Motion

- Default: **none or a simple fade** (120 to 200 ms, `ease-out`).
- Allowed: fade-in of cards, color change on hover/focus, ticker scroll (pausable).
- Not allowed: bouncing, parallax, auto-playing carousels, spinning loaders, dial spin effects.
- Always honor `prefers-reduced-motion`.

---

## 10. Voice and copy

- Formal but warm, in plain language. Prefer "You can vote until Friday" over "Voting window closes".
- Light radio vocabulary, used sparingly and only where it clarifies:
  - "Tune in" (follow an issue), "On the air" (live/open now), "Signal" (updates), "Off the air" (closed).
- Never use radio wording for critical actions or errors; clarity wins.
- Dates in full ("Friday, 7 November"), with times in 12-hour format and local timezone.

---

## 11. Accessibility checklist (WCAG 2.2 AA)

- [ ] Text contrast of at least 4.5:1 (3:1 for 24 px+ text and UI shapes)
- [ ] Tap targets of at least 44 × 44 px
- [ ] Visible focus on every interactive element
- [ ] Status never conveyed by color alone
- [ ] Ticker and any moving content can be paused
- [ ] Forms have visible labels and clear error messages
- [ ] User photos have alt text (caption or fallback)
- [ ] Illustrations are decorative (`alt=""`) unless they carry meaning
- [ ] Layout works at 200% zoom and in portrait or landscape
- [ ] Content is readable if the display fonts fail to load

---

## 12. Quick do and don't

| Do | Don't |
|----|-------|
| Use green-700 for the main action | Use coral for decoration |
| Pair teal fills with brown text | Put teal or coral-500 text on cream |
| Keep one panel and one primary button per screen | Stack several dark panels |
| Use hairlines for structure | Use heavy shadows or gradients |
| Recolor illustrations through tokens | Hard-code hex values in artwork |
