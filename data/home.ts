/**
 * Every word and image on the home page. Structure follows the reference
 * build: cinematic opening → studio intro → what's included + booking →
 * photo collage → approach → reviews beside a moving image → closing.
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

export type IconName =
  | "plan"
  | "chair"
  | "pendant"
  | "vase"
  | "key"
  | "home"
  | "materials"
  | "light"
  | "measure";

export const hero = {
  eyebrow: "Bespoke interior design, Bengaluru",
  title: ["Spaces that feel", "like home."],
  lead: "Full homes designed around the way you live, from the first sketch to the day you move in.",
  cta: { label: "Plan your home", target: "book" },
  cue: "Scroll to step inside",
  explore: { label: "Explore our homes", target: "homes" },
  /** Scroll-scrubbed film frames rendered by /film (Remotion). */
  film: { base: "/film/walk-in" },
};

export const intro = {
  eyebrow: "Your home, considered",
  title: "The Crystal Interiors",
  lead: "An interior design studio in Bengaluru, shaping calm, crafted homes for families who would rather live in them than manage a renovation.",
  highlights: [
    { icon: "home" as IconName, label: "Full-home interiors" },
    { icon: "chair" as IconName, label: "Furniture made to measure" },
    { icon: "key" as IconName, label: "One team, sketch to keys" },
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
      body: "Walnut, travertine, linen and brass, chosen to age beautifully, not to impress for a season.",
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
  /** The finished room, shown in place of the live 3D model when motion is reduced. */
  still: {
    src: "/three/room.jpg",
    width: 1600,
    height: 1000,
    alt: "A model of a living room at dusk: a walnut slatted wall behind a linen sofa, a travertine floor, a glowing jaali screen and warm lamps",
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
