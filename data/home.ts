/**
 * Every word and image on the home page: cinematic opening → studio intro →
 * rooms marquee → what's included + booking → the material palette (3D) →
 * photo collage → approach (3D room) → reviews beside a moving image → closing.
 *
 * Business: interior design studio in Bengaluru.
 * Audience: homeowners with a new apartment or villa who want a fully designed
 * home without managing a renovation themselves.
 * Goal: book a consultation (no prices or availability on the page).
 */
import { detail, photo } from "@/lib/images";

const IMG = {
  exterior: "1706164971309-fb4785fe6ceb",
  living: "1745301558339-44eb3217d5da",
  kitchen: "1772567732989-1ddce59230e4",
  bedroom: "1789132782848-74945d8699a8",
};

export type IconName = "plan" | "chair" | "pendant" | "vase" | "key" | "home";

export const hero = {
  eyebrow: "Interior design studio · Bengaluru",
  title: ["Spaces that feel", "like home."],
  lead: "Full homes designed around the way you live, from the first sketch to the day you move in.",
  cta: { label: "Plan your home", target: "book" },
  cue: "Scroll to step inside",
  explore: { label: "Explore our homes", target: "homes" },
  /** Scroll-scrubbed film frames rendered by /film (Remotion). */
  film: { base: "/film/walk-in" },
  /** Where each shot of the film begins (film progress, 0–1), shown as chapters under the film. */
  chapters: [
    { at: 0, label: "The approach" },
    { at: 0.4, label: "The hall" },
    { at: 0.72, label: "The living room" },
  ],
};

export const intro = {
  eyebrow: "Your home, considered",
  title: "Crystal Interio",
  lead: "An interior design studio in Bengaluru, shaping calm, crafted homes for families who would rather live in them than manage a renovation.",
  highlights: [
    { icon: "home" as IconName, label: "Full-home interiors" },
    { icon: "chair" as IconName, label: "Furniture made to measure" },
    { icon: "key" as IconName, label: "One team, sketch to keys" },
  ],
};

/** The two crossing bands under the intro: the rooms we design, and the homes they are in. */
export const marquee = {
  label: "Rooms and homes we design",
  rows: [
    ["Living rooms", "Kitchens", "Bedrooms", "Wardrobes", "Dining rooms", "Studies"],
    ["Villas", "Apartments", "Penthouses", "Independent houses", "Turnkey interiors"],
  ],
};

export const services = {
  eyebrow: "What's included",
  title: ["Everything for", "the way you live."],
  items: [
    {
      icon: "plan" as IconName,
      title: "Interior architecture",
      body: "Layouts, ceilings and joinery planned around how you move through a day.",
    },
    {
      icon: "chair" as IconName,
      title: "Bespoke furniture",
      body: "Sofas, beds and storage drawn for your rooms and built by our makers.",
    },
    {
      icon: "pendant" as IconName,
      title: "Lighting design",
      body: "Layered light for bright mornings and slow evenings.",
    },
    {
      icon: "vase" as IconName,
      title: "Styling and art",
      body: "Textiles, objects and art: the last layer that makes a house yours.",
    },
    {
      icon: "key" as IconName,
      title: "Turnkey execution",
      body: "Site, suppliers and craftsmen managed until the day you move in.",
    },
  ],
};

export const booking = {
  title: ["Make yourself", "at home."],
  lead: "Tell us a little about your home and we will arrange a first meeting.",
  homeTypes: ["Apartment", "Villa", "Independent house", "Penthouse"],
  size: { min: 1, max: 6, initial: 3 },
  button: "Request consultation",
  note: "This opens your email app with the details filled in, ready to send.",
};

/**
 * The palette: material samples that assemble into a moodboard in 3D as the
 * section scrolls (components/three/Materials.tsx). The order here is the
 * order they land on the table; `tone` is the swatch colour in the list.
 */
export const materials = {
  eyebrow: "The palette",
  title: ["Materials,", "hand-picked."],
  lead: "Every home starts on the studio table: stone, wood, metal and cloth, sampled in your light before anything is built.",
  items: [
    { key: "marquina", name: "Nero Marquina", kind: "Marble", tone: "#16161a" },
    { key: "calacatta", name: "Calacatta arch", kind: "Marble", tone: "#ece8e0" },
    { key: "walnut", name: "Fluted walnut", kind: "Joinery", tone: "#6b4431" },
    { key: "terrazzo", name: "Terrazzo", kind: "Flooring", tone: "#d8cfbf" },
    { key: "linen", name: "Washed linen", kind: "Drapery", tone: "#e6ddcc" },
    { key: "velvet", name: "Saffron velvet", kind: "Upholstery", tone: "#ffcb04" },
    { key: "travertine", name: "Travertine", kind: "Stone", tone: "#dccbb0" },
    { key: "brass", name: "Brushed brass", kind: "Hardware", tone: "#c9a55b" },
    { key: "cane", name: "Rattan cane", kind: "Weave", tone: "#c49a62" },
  ],
  cta: { label: "Start with a palette", target: "book" },
  /** The scene's first frame (wide and upright), shown until the live 3D is drawing. */
  placeholder: { wide: "/three/materials-air.jpg", tall: "/three/materials-air-m.jpg" },
  /** The finished moodboard, shown in place of the live 3D scene when motion is reduced. */
  still: {
    src: "/three/materials.jpg",
    width: 1600,
    height: 1000,
    alt: "Material samples laid out on a dark table: black and white marble, fluted walnut, terrazzo, linen, saffron velvet, travertine with a brass disc, and rattan cane",
  },
};

export type CollageItem = {
  id: string;
  src: string;
  full: string;
  caption: string;
  alt: string;
};

export const collage = {
  eyebrow: "Inside our homes",
  title: ["A little more", "Crystal."],
  note: "Rooms and details from homes we have designed across Bengaluru. Open any photo to see it up close.",
  items: [
    {
      id: "approach",
      src: photo(IMG.exterior, 1400, 1000),
      full: photo(IMG.exterior, 2400, 1600, 82),
      caption: "The approach at dusk",
      alt: "A white stone villa at dusk with a marble walkway leading to the front door",
    },
    {
      id: "living",
      src: photo(IMG.living, 1200, 800),
      full: photo(IMG.living, 2400, 1600, 82),
      caption: "Living room, marble and jaali",
      alt: "A living room with a book-matched marble wall, a curved sofa and a carved jaali screen",
    },
    {
      id: "jaali",
      src: detail(IMG.living, 800, 800, 0.14, 0.45, 2.2),
      full: detail(IMG.living, 1600, 1600, 0.14, 0.45, 2.2),
      caption: "The jaali, up close",
      alt: "Close-up of a hand-cut jaali screen framing a prayer niche",
    },
    {
      id: "kitchen",
      src: photo(IMG.kitchen, 900, 800),
      full: photo(IMG.kitchen, 2400, 1600, 82),
      caption: "Walnut and marble kitchen",
      alt: "A kitchen with walnut cabinetry, a marble island and warm under-cabinet light",
    },
    {
      id: "bedroom",
      src: photo(IMG.bedroom, 900, 800),
      full: photo(IMG.bedroom, 2400, 1600, 82),
      caption: "Bedroom in walnut panelling",
      alt: "A calm bedroom with a grey upholstered bed against walnut panelling",
    },
  ] satisfies CollageItem[],
};

export const approach = {
  eyebrow: "Our approach",
  title: ["The luxury of", "getting it right."],
  /** Five steps, each shown while the 3D room is at that stage of being built. */
  steps: [
    {
      key: "sketch",
      kicker: "Sketch",
      title: "It starts with a sketch.",
      body: "Every home begins as lines on paper: how you move through it, where the light falls, what you need close at hand.",
    },
    {
      key: "measure",
      kicker: "Measure",
      title: "Made to measure.",
      body: "Walls, joinery and furniture drawn to the millimetre, and built by makers we know by name.",
    },
    {
      key: "material",
      kicker: "Material",
      title: "Honest materials.",
      body: "Oak, marble, linen and brass, chosen to age beautifully, not to impress for a season.",
    },
    {
      key: "light",
      kicker: "Light",
      title: "Light, in layers.",
      body: "Daylight first, then warm pools of light for the evenings you will actually have.",
    },
    {
      key: "home",
      kicker: "Home",
      title: "The day you move in.",
      body: "Styled, lit and finished, down to the cushions. All that is left is to move in.",
    },
  ],
  cta: { label: "Book a consultation", target: "book" },
  /** The model's first frame (wide and upright), shown until the live 3D is drawing. */
  placeholder: { wide: "/three/room-plan.jpg", tall: "/three/room-plan-m.jpg" },
  /** The finished room, shown in place of the live 3D model when motion is reduced. */
  still: {
    src: "/three/room.jpg",
    width: 1600,
    height: 1000,
    alt: "A model of a living room at dusk: an ebonised oak slatted wall behind a linen sofa, a saffron velvet armchair, a black marble table on brass, a glowing jaali screen and warm lamps",
  },
};

export const reviews = {
  eyebrow: "Kind words",
  title: ["Our clients", "feel at home."],
  /** PLACEHOLDER reviews — replace with real, attributable client words before launch. */
  items: [
    {
      quote:
        "They listened to how we actually live, and the house finally fits us. Evenings in the living room are the best part of our day.",
      name: "Ananya and Rohit",
      home: "Villa, Whitefield",
    },
    {
      quote:
        "Calm from start to finish. One team, one timeline, and not a single day spent chasing a contractor.",
      name: "Meera S.",
      home: "Apartment, Koramangala",
    },
    {
      quote:
        "Walnut, marble and still easy to cook in. Every detail of the kitchen was thought through.",
      name: "Karthik and Divya",
      home: "Apartment, Indiranagar",
    },
  ],
  film: { src: "/film/morning.mp4", poster: "/film/morning.jpg" },
};

export const closing = {
  eyebrow: "Start your project",
  title: ["Ready to create", "your home?"],
  lead: "Tell us about your home and the way you would like to live in it. We will take it from there.",
  primary: { label: "Book a consultation", target: "book" },
  secondary: { label: "Explore our homes", target: "homes" },
};
