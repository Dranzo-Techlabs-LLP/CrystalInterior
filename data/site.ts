export const site = {
  name: "The Crystal Interiors",
  tagline: "Spaces that feel like home.",
  description:
    "The Crystal Interiors creates thoughtfully designed homes where architecture, materials and everyday living come together.",
  url: "https://thecrystalinteriors.example.com",
  locale: "en_IN",
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
    { label: "Approach", target: "approach" },
    { label: "Reviews", target: "reviews" },
  ],
  cta: { label: "Book a consultation", target: "book" },
} as const;
