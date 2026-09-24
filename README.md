# Crystal Interio

Website for a Bengaluru interior-design studio. A visit starts with the studio's
logo building itself, then a full-screen film that the visitor walks through by
scrolling: up the path to the front door, through it as warm light spills out,
down the hall and into the living room. After that it is a one-page site in the
logo's colours with one job: getting a consultation booked. Three moments are
real-time 3D: the studio's crystal, a moodboard of materials that assembles
itself on the studio table, and a living room that builds itself as you scroll.

Next.js 16 · React 19 · TypeScript · GSAP 3 (ScrollTrigger, SplitText) · Lenis ·
three.js with react-three-fiber · the film is made in code with
[Remotion](https://www.remotion.dev).

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm run start   # production (Turbopack)
npm run lint                     # ESLint 9 CLI (Next 16 removed `next lint`)
```

> Needs Node.js 20.9 or later. Stop the dev server before building.

---

## The page

The structure follows the "cinematic website" process from the reference video:
a scroll-scrubbed opening, then a short, rounded, image-led page that ends in an
enquiry. There are no prices or availability anywhere: visitors have to enquire.

| Section | What it does | File |
| --- | --- | --- |
| Logo intro | The logo builds itself (bars rise, the name sets, the double rule draws, INTERIO spells out) while the fonts and the film's first frame load, then a navy and a yellow curtain lift. Once per visit (sessionStorage), never with reduced motion or without JavaScript, and it lifts on its own after 9 s if anything fails. | `components/Preloader.tsx` |
| Opening film | Full screen and held in place while scrolling moves it from the first frame to the last. It holds when scrolling stops, reverses when scrolling back up, and hands over to the page after the final frame. No autoplay, no loop. The three shots are marked as chapters along the bottom. | `components/HeroFilm.tsx` |
| Intro | Navy sheet that rises over the film's last frame. The studio's crystal turns in 3D as a citrine, above the studio's promise, whose words light up as you read. | `components/Intro.tsx`, `components/three/Crystal.tsx` |
| Marquee | Two bands crossing like tape, yellow and black, carrying the rooms and homes the studio designs. They speed up with the scroll and turn round when you scroll back. | `components/Marquee.tsx` |
| What's included + booking | A numbered list of services on the left; on the right, a booking card (date, home type, home size, yellow button). | `components/Services.tsx`, `components/BookingCard.tsx` |
| The palette | Material samples float in 3D, then settle one by one into a moodboard on the studio table as you scroll, each named as it lands. | `components/Materials.tsx`, `components/three/Materials.tsx` |
| Collage | Five photos in a bento grid that drift inside their frames; opens a lightbox with rounded corners, arrows and keyboard support. | `components/Collage.tsx` |
| Approach | A 3D room that builds itself as you scroll, in five steps: sketch, measure, material, light, home. | `components/Approach.tsx`, `components/three/Room.tsx` |
| Reviews | Quotes on the left, an ambient looping film on the right that fades into the page. | `components/Reviews.tsx` |
| Closing | The logo artwork's own look: black on the brand yellow, framed by the logo's bars, which rise as it arrives. Then the footer, signed with the logo, large. | `components/Closing.tsx`, `components/Footer.tsx` |

Around the page: a hairline of yellow shows how far down you are
(`ScrollProgress.tsx`), a ring trails the mouse on desktop and reads "View" over
photos (`Cursor.tsx`, off for touch and reduced motion), and the header turns
navy once the intro sheet reaches the top, tucks away while you read down and
returns when you scroll up, with the current section marked. On phones its links
move into a full-screen menu (focus is kept inside it; Escape closes it).

---

## Brand

- **Logo.** `components/brand/logoPaths.ts` is the studio's `logo.pdf` artwork
  traced to vector: the bars and the double rule are exact rectangles measured
  from the artwork, and each letter is its own path, so the intro can build the
  logo piece by piece. `components/Logo.tsx` draws it in `currentColor`
  (yellow on navy, black on yellow). `public/brand/` holds the same logo as
  files: `logo-badge.png`/`.svg` (the artwork as supplied, black on yellow),
  `logo-black.svg`, `logo-yellow.svg`, and `og.jpg` for link previews.
  `app/icon.svg` and `app/apple-icon.png` are the logo's "C" on yellow.
- **Colour.** The logo's yellow `#FFCB04` and black, set on a deep navy
  `#14213D` for the dark sections (a classic partner for yellow, and the blue of
  the film's dusk sky), so that black materials and details stay visible in the
  3D scenes. Ivory `#F4EFE4` is for reading. Tokens are at the top of
  `app/globals.css`; sections pick them up through `.theme-dark`,
  `.theme-light` and `.theme-yellow`.
- **Type.** Bodoni Moda (display, with its italic for accent words), Josefin
  Sans (labels and navigation, spaced like the logo's INTERIO) and Manrope
  (reading text), all through `next/font`.
- **Details from the logo.** The triple bar (`DecoBars` in `Logo.tsx`) marks
  every section label and separates the marquee's words; the double rule is the
  rug's border in the 3D room.

---

## The opening film

**How it is made.** `film/` is a Remotion project. The `WalkIn` composition turns
three photographs (a villa at dusk, an entrance hall, a living room) into one
ten-second camera move: a push up the path, a bloom of warm light from the door,
a walk down the hall, inner doors swinging open in 3D, and arrival in the living
room. `Morning` is the ambient loop beside the reviews.

**How it plays.** `npm run export` renders `WalkIn` as frame sequences, 16:9
(1600×900, 150 frames) and 9:16 (720×1280, 100 frames). It converts them to
WebP in `public/film/walk-in/{desktop,mobile}` and writes the posters and
`manifest.json`. On the site, `HeroFilm` draws the frames on a canvas, driven by
a scrubbed ScrollTrigger timeline. Portrait screens get the 9:16 set.

- The scroll runway is laid out in CSS: the section is tall and the stage is
  `position: sticky`. Nothing shifts when JavaScript attaches, so CLS stays at 0.
- Frames load progressively: first and last, then every 16th, 8th, 4th and so on.
  Scrubbing works straight away and sharpens as frames arrive.

**Change or re-render it.**

```bash
cd film
npm install
npm run dev       # Remotion Studio, to preview and adjust
npm run export    # render everything into ../public/film
```

Shots, focal points and camera aims live in `film/src/shots.ts`, and the timing,
in seconds, lives in `film/src/WalkIn.tsx`. The hall shot uses a small clone-stamp
retouch (`retouch` in `shots.ts`) to keep the lettering on a wall plaque out of
the film.

**Use AI-generated footage instead** (Higgsfield or similar, as in the reference
video):

1. Export the clip as JPEG frames named `f000.jpeg`, `f001.jpeg` and so on.
2. Put the 16:9 frames in `film/out/walkin` and the 9:16 frames in
   `film/out/walkin-portrait`.
3. Run `npm run export -- --skip-render`.

Any frame count works, because the player reads it from the manifest. The
Higgsfield account connected during the build was on the free plan with 0
credits, which is why the film was rendered with Remotion. With credits, the
reference workflow is:

1. Generate a wide hero still of the property in warm evening light (for example
   `nano_banana_pro`).
2. Animate it into a roughly 10-second walk through the front door, using the still
   as the start frame (`seedance_2_0`, `kling3_0` or `wan2_7` accept one).

---

## The 3D

All three scenes use three.js through react-three-fiber. They are built entirely
in code: geometry, canvas-drawn textures (walnut, travertine, linen, two marbles,
terrazzo, rattan cane, the jaali lattice, the artwork) and lighting. Nothing is
downloaded.

**The room** (`components/three/Room.tsx`, driven by `components/Approach.tsx`).
Its state is a pure function of scroll progress (`room.p`, 0–1), so it plays
backwards as well as forwards:

| Progress | Step | What happens |
| --- | --- | --- |
| 0 – 0.20 | Sketch | The plan is drawn on a paper-white plinth, seen from above: walls first, then furniture outlines, then dimensions. |
| 0.20 – 0.42 | Measure | Walls rise. Oak slats are fitted one by one, the sideboard slides out of the wall and the rug unrolls. Furniture is lowered in, all in white clay. |
| 0.42 – 0.60 | Material | A line of the logo's yellow sweeps across the model and turns the clay into ebonised oak slats, a Nero Marquina table on a brass drum, a Calacatta-topped black sideboard, linen, and a saffron velvet armchair (`reveal.ts`, one shader patch on every material). |
| 0.60 – 0.80 | Light | Daylight falls through the window, then evening comes. The cove, the jaali niche, the pendant and the floor lamp come on in turn, and the section itself turns from ivory to navy. |
| 0.80 – 1.00 | Home | Art, the olive tree, cushions, books and a vase are placed. The camera settles low and close, and the call to action appears. |

To change the room:

- Positions and sizes are the constants at the top of `Room.tsx`.
- Colours and finishes are in `createKit()`.
- The camera path is `SHOTS`.
- When each thing happens is in `seg(p, from, to)` calls.
- Framing on the page comes from CSS: `--room-shift-x` and `--room-shift-y` on
  `.build__canvas`.

**The palette** (`components/three/Materials.tsx`, driven by
`components/Materials.tsx`) is also a pure function of scroll progress
(`board.p`), with a gentle float added while the samples are in the air (the
scene draws continuously only then, and only while it is on screen).

- The samples and their order are `materials.items` in `data/home.ts`; when each
  one lands is `landing(i)` in `components/three/store.ts`, which the list
  beside the board uses too.
- Where each sample floats and where it rests on the table is `LAYOUT`. Wide
  screens get a wide board; a phone held upright gets `tall`, the same samples
  in two columns so they stay large.
- The camera path and how much of the board it must hold are `FRAMING`. Page
  framing comes from CSS on `.mats__canvas`: `--board-shift-x`/`-y` move the
  board off-centre (x to the right, y up) and `--board-room` is the share of
  the screen's height left to it between the words above and below.

**The crystal** (`components/three/Crystal.tsx`, driven by `components/Intro.tsx`)
is a brilliant-cut citrine with a small custom shader. The shader refracts a
studio-lit environment through the stone, bounces it off the pavilion facets,
and splits the colours slightly, which gives the gem its fire. It turns as the
intro scrolls past and leans toward the pointer.

**Loading and fallbacks.**

- The 3D code (about 350 kB gzipped, mostly three.js) is fetched only after the
  page is idle, and the room mounts shortly before it is reached. It never
  delays the first paint.
- Both canvases render on demand, only when scrolling or the pointer changes
  something.
- With reduced motion, without JavaScript, or without WebGL, the room becomes a
  still of the finished room (`public/three/room.jpg`) and the five steps become
  a list; the palette becomes a still of the finished board
  (`public/three/materials.jpg`) beside the list; the crystal becomes a flat
  drawing of it.
- If you change the room or the board, recapture its still from the finished
  state (1600 × 1000, framing shifts set to 0, page text hidden), and its
  first-frame placeholders from progress 0 with the page's own framing
  (1440 × 900, and 390 × 844 at 2× for phones), page text hidden.

**Library notes.**

- `components/three/console.ts` silences one deprecation notice: three r183+
  deprecated `THREE.Clock`, which react-three-fiber 9 still uses internally.
  Delete that file once react-three-fiber moves to `THREE.Timer`, which is
  planned for v10.
- ESLint's `react-hooks/immutability` rule is off for `components/three/`
  only. Mutating three.js objects inside `useFrame` is react-three-fiber's
  intended pattern.

---

## Content and images

- All page copy and content is in `data/home.ts`: services, booking options,
  collage, approach and reviews.
- The studio's name, brand colours, contact details, social links and
  navigation are in `data/site.ts`. The name is set as the logo sets it,
  "Crystal Interio"; it feeds the title, metadata and footer.
- Page photos come from Unsplash, through `lib/images.ts`. `photo(id, w, h)` is a
  plain crop and `detail(...)` is a focal-point zoom. Swap in your own image IDs or
  URLs, or put local files in `public/`.
- Film photos are in `film/src/shots.ts`. Re-export after changing them.

**Before launch:**

- **Reviews are placeholders.** Replace them with real, attributable client words
  (`reviews` in `data/home.ts`). Never publish invented reviews.
- **Collage and film photos are stock placeholders**, but the copy presents them
  as the studio's own homes. Replace them with real project photography.
- The contact details, social links and `site.url` are placeholders. The domain
  is currently `thecrystalinteriors.example.com`, and it feeds the canonical URL,
  sitemap, Open Graph tags and JSON-LD.
- The booking card has no backend. It opens the visitor's email app with the
  request filled in (`mailto:`). Connect it to a form service or CRM if you need
  submissions stored.

---

## Accessibility and performance

- The page has a skip link past the film, one `h1`, labelled sections and visible
  focus. The lightbox is a native `<dialog>`, with Escape and arrow keys.
- **Reduced motion:** no logo intro; the film becomes its first frame, one
  screen tall. The room and the palette become stills, and the crystal becomes
  a flat drawing. The marquee stands still, there is no cursor ring and no
  smooth scrolling, and nothing is hidden or animated. Visitors without
  JavaScript get the same layout.
- **Phones and tablets:** every section is laid out for phones (checked at 360,
  390 and 820 px wide, upright and on their side). On phones the 3D scenes keep
  their words above and in a card below the model, the moodboard switches to its
  upright layout, and on short landscape screens only what fits is shown. Touch
  targets are at least 44 px.
- The logo intro covers the first moments of a visit (about 2.5 s, longer only
  while the fonts and the film's first frame are still loading), so the first
  paint a visitor sees is the finished hero. It plays once per visit.
- The 3D code is fetched as soon as the page settles, and each scene's surfaces
  are painted ahead of time, one per idle moment (`prepareTextures` in
  `three/textures.ts`). Each scene mounts about three screens before it is
  reached and uploads its textures and compiles its shaders offscreen, so it is
  already drawing on arrival. If a visitor gets there first (a jump from the
  menu straight after loading), the scene's first frame stands in as a still
  (`public/three/*-air*.jpg`, `room-plan*.jpg`) and the live scene fades in
  over it. Scenes render on demand, and the moodboard draws continuously only
  while its samples float on screen. Canvases are capped at 1.5× (room) and
  1.75× (moodboard) pixel density.
- The film frames are 9.5 MB (desktop) or 3.9 MB (mobile) of WebP. They load
  after the poster, which is preloaded.
- The earlier cream version measured LCP 0.56–0.74 s, CLS ≤ 0.001 and 60 fps
  through the film and the room (Edge, Intel UHD 630, 1440×900). Measure again
  for this version before quoting numbers.

---

## Project structure

```
app/          layout (fonts, metadata, JSON-LD, boot flags), page, globals.css,
              icon, apple-icon, sitemap, robots
components/   Preloader, Header, HeroFilm, Intro, Marquee, Services +
              BookingCard, Materials, Collage, Approach, Reviews, Closing,
              Footer, Logo (+ DecoBars), Icons (crystal mark, line icons),
              Cursor, ScrollProgress, ScrollAnimations (reveals, parallax),
              Providers (Lenis)
components/brand/
              logoPaths (the traced logo)
components/three/
              Room (the room build), Materials (the moodboard), Crystal (the
              gem), reveal (clay → material shader patch), textures
              (canvas-drawn surfaces), store (scroll state shared with the
              DOM), console
data/         site.ts (studio details, colours), home.ts (all page content)
lib/          gsap (plugin registration), scroll (Lenis-aware scrolling, scroll
              lock), intro (hand-over from the logo intro to the hero),
              webgl (support check, idle scheduling), images, clsx
film/         Remotion project: src/WalkIn.tsx, src/Morning.tsx,
              src/shots.ts, scripts/export.mjs
public/brand/ the logo as files, and the link-preview image
public/film/  rendered film output used by the site
public/three/ the room and moodboard stills (reduced motion, no JS, no WebGL)
```

---

## Licences

- **Remotion** is free for individuals, non-profits and companies of up to three
  people. Larger companies need a company licence
  ([remotion.dev/license](https://www.remotion.dev/license)). It is only used to
  render the film; the site ships the rendered frames.
- **three.js** and **react-three-fiber:** MIT.
- **Photographs:** Unsplash License.
- **Fonts:** Bodoni Moda, Josefin Sans and Manrope (SIL Open Font License), via
  `next/font`.

## Previous version

The earlier room-by-room walkthrough is archived in
`.backup/walkthrough-v2-2026-09-23.zip`, which is git-ignored.
