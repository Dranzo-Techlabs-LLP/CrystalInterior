import { CrystalMark } from "./Icons";
import { clsx } from "@/lib/clsx";

/** The crystal mark + spaced wordmark; used in the header and the footer. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("logo", className)}>
      <CrystalMark className="logo__mark" />
      <span className="logo__word">The Crystal Interiors</span>
    </span>
  );
}
