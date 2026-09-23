import { getConsoleFunction, setConsoleFunction } from "three";

/**
 * react-three-fiber 9 still creates a THREE.Clock, which three r183+ marks as
 * deprecated. That notice is about the library, not this site, so exactly that
 * message is dropped and everything else passes through untouched.
 * Remove this file once react-three-fiber moves to THREE.Timer (v10).
 */
const CLOCK_NOTICE = "THREE.Clock: This module has been deprecated";

if (!getConsoleFunction()) {
  setConsoleFunction((type: "log" | "warn" | "error", message: string, ...params: unknown[]) => {
    if (type === "warn" && message.startsWith(CLOCK_NOTICE)) return;
    console[type](message, ...params);
  });
}
