import type { ReactElement, SVGProps } from "react";
import type { IconName } from "@/data/home";

/**
 * The studio's icon set, drawn by hand. Colours come from the opening film:
 * the amber of lit windows (--glow), walnut from the hall ceiling (--wood),
 * and the pale stone of the facade (--stone-light).
 */

type Props = SVGProps<SVGSVGElement> & { title?: string };

const a11y = (title?: string) =>
  title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const };

/* ---------------------------------------------------------------- Logo --- */

export function CrystalMark({ title, ...props }: Props) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...a11y(title)} {...props}>
      <path d="M9 7h14l6 7H3z" fill="var(--glow)" />
      <path d="M3 14h26L16 28z" fill="var(--wood)" />
      <path d="M12.5 14 16 28l3.5-14z" fill="var(--glow)" opacity=".55" />
      <path
        d="M9 7h14l6 7-13 14L3 14zM3 14h26M9 7l3.5 7L16 7l3.5 7L23 7M12.5 14 16 28l3.5-14"
        stroke="currentColor"
        strokeWidth="1.3"
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

/* --------------------------------------------------- Illustrated icons --- */

const S = "var(--wood-deep)";

const ART: Record<string, ReactElement> = {
  materials: (
    <>
      {/* brass, walnut, marble — stacked like samples on the studio table */}
      <path d="M8 30l16 8v4L8 34z" fill="#B5843F" stroke={S} />
      <path d="M24 38l16-8v4l-16 8z" fill="#C99A52" stroke={S} />
      <path d="M24 22l16 8-16 8-16-8z" fill="var(--glow)" stroke={S} />
      <path d="M8 22l16 8v4L8 26z" fill="#6B4630" stroke={S} />
      <path d="M24 30l16-8v4l-16 8z" fill="#7F563B" stroke={S} />
      <path d="M24 14l16 8-16 8-16-8z" fill="#A87A52" stroke={S} />
      <path d="M8 14l16 8v4L8 18z" fill="#D8CEC0" stroke={S} />
      <path d="M24 22l16-8v4l-16 8z" fill="#E6DED2" stroke={S} />
      <path d="M24 6l16 8-16 8-16-8z" fill="#F6F1E9" stroke={S} />
      <path d="M15 11c4 1 6 4 11 3.5M22 17c3-1 5 .5 8-1" stroke="#B9AD9C" strokeWidth=".9" fill="none" />
    </>
  ),
  light: (
    <>
      <path d="M16 25 9 44h30l-7-19z" fill="var(--glow)" opacity=".32" />
      <path d="M19 25 15 44h18l-4-19z" fill="var(--glow)" opacity=".4" />
      <path d="M24 3v9" stroke={S} strokeWidth="1.4" />
      <rect x="21.5" y="11" width="5" height="3.5" rx="1" fill={S} />
      <path d="M12.5 25c0-6.6 5.1-11 11.5-11s11.5 4.4 11.5 11z" fill="var(--wood)" stroke={S} />
      <circle cx="24" cy="26.5" r="3.2" fill="#FFE6BC" stroke={S} strokeWidth=".9" />
    </>
  ),
  measure: (
    <>
      <path d="M26 28h17v7H26z" fill="#F6F1E9" stroke={S} />
      <path d="M30 28v3.2M33.5 28v2M37 28v3.2M40.5 28v2" stroke={S} />
      <path d="M43 26.5v10" stroke={S} strokeWidth="2" strokeLinecap="round" />
      <rect x="5" y="14" width="23" height="23" rx="6.5" fill="var(--glow)" stroke={S} />
      <circle cx="16.5" cy="25.5" r="5.5" fill="#F6F1E9" stroke={S} />
      <circle cx="16.5" cy="25.5" r="1.6" fill={S} />
    </>
  ),
  home: (
    <>
      <path d="M8 22 24 9l16 13v18H8z" fill="#F6F1E9" stroke={S} />
      <path d="M4.5 24 24 8l19.5 16" stroke={S} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="13" y="24" width="9" height="7.5" rx="1" fill="var(--glow)" stroke={S} />
      <path d="M17.5 24v7.5M13 27.8h9" stroke={S} strokeWidth=".8" />
      <path d="M27 40V28.5a1.5 1.5 0 0 1 1.5-1.5h5a1.5 1.5 0 0 1 1.5 1.5V40z" fill="var(--wood)" stroke={S} />
    </>
  ),
  chair: (
    <>
      <path d="M13 23v-7.5a4.5 4.5 0 0 1 4.5-4.5h13a4.5 4.5 0 0 1 4.5 4.5V23z" fill="var(--glow)" stroke={S} />
      <path d="M9.5 21.5a3.5 3.5 0 0 1 3.5 3.5v2h22v-2a3.5 3.5 0 1 1 7 0v10H6V25a3.5 3.5 0 0 1 3.5-3.5z" fill="var(--wood)" stroke={S} />
      <rect x="13" y="27" width="22" height="5" rx="2" fill="#F6F1E9" stroke={S} />
      <path d="M10 35.5v5M38 35.5v5" stroke={S} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  key: (
    <>
      <path d="M21.5 26.5 39 9" stroke={S} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M21.5 26.5 39 9" stroke="var(--glow)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M34 14l4.2 4.2M30 18l3.2 3.2" stroke={S} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="15" cy="32" r="9" fill="var(--glow)" stroke={S} />
      <circle cx="15" cy="32" r="3.4" fill="#F6F1E9" stroke={S} />
    </>
  ),
};

export function Illustration({ name, title, ...props }: Props & { name: IconName }) {
  return (
    <svg viewBox="0 0 48 48" strokeWidth="1.2" strokeLinejoin="round" {...a11y(title)} {...props}>
      {ART[name] ?? ART.home}
    </svg>
  );
}
