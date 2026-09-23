# The Crystal Interiors

Website for a Bengaluru interior-design studio. It opens with a full-screen film
that the visitor walks through by scrolling: up the path to the front door,
through it as warm light spills out, down the hall and into the living room.
After that it is a calm one-page site with one job: getting a consultation booked.
Two moments are real-time 3D: the studio's crystal, and a living room that
builds itself as you scroll.

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
| Opening film | Full screen and held in place while scrolling moves it from the first frame to the last. It holds when scrolling stops, reverses when scrolling back up, and hands over to the page after the final frame. No autoplay, no loop. | `components/HeroFilm.tsx` |
| Intro | Cream sheet that rises over the film's last frame. The logo's crystal comes alive as a 3D gem, and there are three illustrated highlights. | `components/Intro.tsx`, `components/three/Crystal.tsx` |
| What's included + booking | Services on the left; on the right, a booking card in the Airbnb style (date, home type, home size, red button). | `components/Services.tsx`, `components/BookingCard.tsx` |
| Collage | Five photos in a bento grid; opens a lightbox with rounded corners, arrows and keyboard support. | `components/Collage.tsx` |
| Approach | A 3D room that builds itself as you scroll, in five steps: sketch, measure, material, light, home. | `components/Approach.tsx`, `components/three/Room.tsx` |
| Reviews | Quotes on the left, an ambient looping film on the right that fades into the page. | `components/Reviews.tsx` |
| Closing | Final call to action, then the footer with the matching logo. | `components/Closing.tsx`, `components/Footer.tsx` |

The palette comes from the film's own photography: dusk blue, warm window light,
walnut and cream, with a red for the actions that matter.

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

Both scenes use three.js through react-three-fiber. They are built entirely in
code: geometry, canvas-drawn textures (walnut, travertine, linen, the jaali
lattice, the artwork) and lighting. Nothing is downloaded.

**The room** (`components/three/Room.tsx`, driven by `components/Approach.tsx`).
Its state is a pure function of scroll progress (`room.p`, 0–1), so it plays
backwards as well as forwards:

| Progress | Step | What happens |
| --- | --- | --- |
| 0 – 0.20 | Sketch | The plan is drawn on a paper-white plinth, seen from above: walls first, then furniture outlines, then dimensions. |
| 0.20 – 0.42 | Measure | Walls rise. Walnut slats are fitted one by one, the sideboard slides out of the wall and the rug unrolls. Furniture is lowered in, all in white clay. |
| 0.42 – 0.60 | Material | A line of warm light sweeps across the model and turns the clay into walnut, travertine, linen and brass (`reveal.ts`, one shader patch on every material). |
| 0.60 – 0.80 | Light | Daylight falls through the window, then evening comes. The cove, the jaali niche, the pendant and the floor lamp come on in turn, and the section itself turns dusk blue. |
| 0.80 – 1.00 | Home | Art, the olive tree, cushions, books and a vase are placed. The camera settles low and close, and the call to action appears. |

To change the room:

- Positions and sizes are the constants at the top of `Room.tsx`.
- Colours and finishes are in `createKit()`.
- The camera path is `SHOTS`.
- When each thing happens is in `seg(p, from, to)` calls.
- Framing on the page comes from CSS: `--room-shift-x` and `--room-shift-y` on
  `.build__canvas`.

**The crystal** (`components/three/Crystal.tsx`, driven by `components/Intro.tsx`)
is a brilliant-cut gem with a small custom shader. The shader refracts a
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
  a list. The crystal becomes the flat logo mark.
- If you change the room, recapture the still from the finished evening state.

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
- The studio's name, contact details, social links and navigation are in
  `data/site.ts`.
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
- **Reduced motion:** the film becomes its first frame, one screen tall. The room
  becomes a still, and the crystal becomes the logo mark. There is no smooth
  scrolling, and nothing is hidden or animated. Visitors without JavaScript get
  the same layout.
- Measured on the production build (Edge, Intel UHD 630, 1440×900):
  - LCP 0.56–0.74 s across runs
  - CLS 0.001 or less
  - 60 fps while scrubbing the film (p95 frame 17 ms, 0.1% long frames)
  - Scrolling through the 3D room: 60 fps at 1× pixel density (p95 16.9 ms); 57 fps
    on a 2× display, where the canvas is capped at 1.5×.
  - The film frames are 9.5 MB (desktop) or 3.9 MB (mobile) of WebP. They load
    after the poster, which is preloaded.

---

## Project structure

```
app/          layout (fonts, metadata, JSON-LD, js flag), page, globals.css,
              icon, sitemap, robots
components/   HeroFilm, Header, Intro, Services + BookingCard, Collage,
              Approach, Reviews, Closing, Footer, Logo,
              Icons (logo mark, line icons, illustrations),
              ScrollAnimations (text reveals), Providers (Lenis)
components/three/
              Room (the room build), Crystal (the gem), reveal (clay →
              material shader patch), textures (canvas-drawn surfaces),
              store (scroll state shared with the DOM), console
data/         site.ts (studio details), home.ts (all page content)
lib/          gsap (plugin registration), scroll (Lenis-aware scrolling),
              webgl (support check, idle scheduling), images, clsx
film/         Remotion project: src/WalkIn.tsx, src/Morning.tsx,
              src/shots.ts, scripts/export.mjs
public/film/  rendered film output used by the site
public/three/ the room still (reduced motion, no JS, no WebGL)
```

---

## Licences

- **Remotion** is free for individuals, non-profits and companies of up to three
  people. Larger companies need a company licence
  ([remotion.dev/license](https://www.remotion.dev/license)). It is only used to
  render the film; the site ships the rendered frames.
- **three.js** and **react-three-fiber:** MIT.
- **Photographs:** Unsplash License.
- **Fonts:** Newsreader and Manrope (SIL Open Font License), via `next/font`.

## Previous version

The earlier room-by-room walkthrough is archived in
`.backup/walkthrough-v2-2026-09-23.zip`, which is git-ignored.
