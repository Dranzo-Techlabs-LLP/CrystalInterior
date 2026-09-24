import type { ReactElement, SVGProps } from "react";
import type { IconName } from "@/data/home";

/**
 * The studio's icon set, drawn by hand on a 24px grid with a 1.5px line, so
 * every icon shares one weight. Colour comes from currentColor.
 */

type Props = SVGProps<SVGSVGElement> & { title?: string };

const a11y = (title?: string) =>
  title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const };

/* ------------------------------------------------------- Crystal mark --- */

/**
 * The crystal as a flat drawing, in the logo's yellow and black: shown in
 * place of the live 3D gem (reduced motion, no WebGL) and while it loads.
 */
export function CrystalMark({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...a11y(title)} {...props}>
      <path d="M9 7h14l6 7H3z" fill="#FFE27A" />
      <path d="M3 14h26L16 28z" fill="#FFCB04" />
      <path d="M12.5 14 16 28l3.5-14z" fill="#E6B400" />
      <path
        d="M9 7h14l6 7-13 14L3 14zM3 14h26M9 7l3.5 7L16 7l3.5 7L23 7M12.5 14 16 28l3.5-14"
        stroke="#0B0B0C"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------------------------------------------------- Line icons --- */

const LINE: Record<string, ReactElement> = {
  plan: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
      <path d="M3.5 12.5H10M14.5 12.5h6M10 12.5V8" />
      <path d="M10 8a4.5 4.5 0 0 1 4.5 4.5" strokeDasharray="1.6 1.8" />
    </>
  ),
  chair: (
    <>
      <path d="M7 11V7.5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2V11" />
      <path d="M5 11h14a1.5 1.5 0 0 1 1.5 1.5V17h-17v-4.5A1.5 1.5 0 0 1 5 11zM7 14h10M5.5 17v2M18.5 17v2" />
    </>
  ),
  pendant: (
    <>
      <path d="M12 3v5" />
      <path d="M5.5 15a6.5 6.5 0 0 1 13 0z" />
      <path d="M10.5 15a1.5 1.5 0 0 0 3 0M8 19l-1 1.6M16 19l1 1.6M12 19.5V21" />
    </>
  ),
  vase: (
    <>
      <path d="M9.2 21h5.6c1-2.4 1.7-4.1 1.7-6 0-2.6-2-3.6-2-6V8H9.5v1c0 2.4-2 3.4-2 6 0 1.9.7 3.6 1.7 6z" />
      <path d="M12 8V4.5M12 5.8c1-1.2 2.4-1.9 3.9-1.9M12 7.1c-.9-1-2.2-1.6-3.5-1.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15.5" r="4" />
      <path d="M11 12.5 19.5 4M16.2 7.3l2.4 2.4M13.9 9.6l1.9 1.9" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  arrowUpRight: <path d="M7 17 17 7M8.5 7H17v8.5" />,
  arrowDown: <path d="M12 5v14M6.5 13.5 12 19l5.5-5.5" />,
  arrowLeft: <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" />,
  arrowRight: <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />,
  expand: <path d="M14 4h6v6M10 20H4v-6M20 4l-6.5 6.5M4 20l6.5-6.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  phone: <path d="M6.6 3.5h2.3l1.4 4.1-1.8 1.3a11 11 0 0 0 6.6 6.6l1.3-1.8 4.1 1.4v2.3a2 2 0 0 1-2.1 2A16.2 16.2 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1z" />,
  pin: (
    <>
      <path d="M12 21s6.5-5.6 6.5-11a6.5 6.5 0 0 0-13 0c0 5.4 6.5 11 6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
};

export type LineIconName = keyof typeof LINE;

export function Icon({ name, title, ...props }: Props & { name: LineIconName | IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y(title)}
      {...props}
    >
      {LINE[name] ?? LINE.plan}
    </svg>
  );
}

export function Star(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden {...props}>
      <path
        d="m10 1.8 2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z"
        fill="currentColor"
      />
    </svg>
  );
}
