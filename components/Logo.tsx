import { site } from "@/data/site";
import { clsx } from "@/lib/clsx";
import { LOGO_BARS, LOGO_BOX, LOGO_RULES, LOGO_SUB, LOGO_WORD } from "./brand/logoPaths";

type Props = { className?: string; title?: string; decorative?: boolean };

// left to right, so a stagger "from edges" builds the bars outside-in
const BARS = [...LOGO_BARS.left, ...LOGO_BARS.right].sort((a, b) => a[0] - b[0]);

/**
 * The studio's logo, traced from its artwork: Art Deco bars either side of
 * "Crystal", a double rule, and "INTERIO". Drawn in currentColor. Every part
 * carries a data-logo attribute, so the intro can build it piece by piece.
 */
export function Logo({ className, title = site.name, decorative = false }: Props) {
  const [topY, topH] = LOGO_BARS.top;
  const [lowY, lowH] = LOGO_BARS.low;
  return (
    <svg
      className={clsx("logo", className)}
      viewBox={`0 0 ${LOGO_BOX.width} ${LOGO_BOX.height}`}
      fill="currentColor"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": title })}
    >
      {BARS.map(([x, w]) => (
        <g key={x}>
          <rect data-logo="bar" x={x} y={topY} width={w} height={topH} />
          <rect data-logo="bar" x={x} y={lowY} width={w} height={lowH} />
        </g>
      ))}
      {LOGO_WORD.map((d, i) => (
        <path key={i} data-logo="letter" d={d} fillRule="evenodd" />
      ))}
      {LOGO_RULES.map(([x, y, w, h]) => (
        <rect key={y} data-logo="rule" x={x} y={y} width={w} height={h} />
      ))}
      {LOGO_SUB.map((d, i) => (
        <path key={i} data-logo="sub" d={d} fillRule="evenodd" />
      ))}
    </svg>
  );
}

/** The logo's triple bar, used as a small brand mark beside labels and between marquee words. */
export function DecoBars({ className }: { className?: string }) {
  return (
    <svg className={clsx("deco-bars", className)} viewBox="0 0 124 100" fill="currentColor" aria-hidden>
      <rect x="0" width="36.5" height="100" />
      <rect x="62.75" width="24.5" height="100" />
      <rect x="112.75" width="10.75" height="100" />
    </svg>
  );
}
