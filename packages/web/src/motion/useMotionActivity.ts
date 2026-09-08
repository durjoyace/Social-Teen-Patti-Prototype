import { useContext, useEffect, useState, type RefObject } from "react";
import {
  MotionConfigContext,
  useInView,
  useReducedMotion,
} from "framer-motion";

/** MotionConfig overrides are also honored by JavaScript-driven effects. */
export function useMotionPreference() {
  const systemReduced = useReducedMotion();
  const { reducedMotion } = useContext(MotionConfigContext);
  return (
    reducedMotion === "always" || (reducedMotion !== "never" && !!systemReduced)
  );
}

/** Stop decorative work offscreen and in background tabs; never pause game state. */
export function useMotionActivity(ref: RefObject<HTMLElement | null>) {
  const reduced = useMotionPreference();
  const inView = useInView(ref, { amount: 0.01 });
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return !reduced && inView && visible;
}
