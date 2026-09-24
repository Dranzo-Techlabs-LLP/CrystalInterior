export const site = {
  /** The name as the logo sets it ("Crystal" over "INTERIO"). */
  name: "Crystal Interio",
  tagline: "Spaces that feel like home.",
  description:
    "Crystal Interio is a Bengaluru interior design studio creating complete, crafted homes where architecture, materials and everyday living come together.",
  url: "https://thecrystalinteriors.example.com",
  locale: "en_IN",
  /** Brand colours: the logo's yellow and black, and the navy the dark sections are set on. */
  colors: { yellow: "#FFCB04", black: "#0B0B0C", navy: "#14213D" },
  contact: {
    email: "studio@thecrystalinteriors.com",
    phone: "+91 98765 43210",
    address: "Indiranagar, Bengaluru",
    hours: "Monday to Saturday, 10:00–19:00",
  },
  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Pinterest", href: "https://pinterest.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
  ],
  nav: [
    { label: "Homes", target: "homes" },
    { label: "Services", target: "services" },
    { label: "Materials", target: "materials" },
    { label: "Approach", target: "approach" },
    { label: "Reviews", target: "reviews" },
  ],
  cta: { label: "Book a consultation", target: "book" },
} as const;
