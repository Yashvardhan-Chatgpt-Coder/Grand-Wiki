import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

export function CountUp({
  value,
  duration = 1.8,
  format = (current) => String(current),
  className,
}: CountUpProps) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplay(Math.round(latest));
  });

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      motionValue.set(value);
      setDisplay(value);
      return;
    }

    motionValue.set(0);
    setDisplay(0);

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });

    return () => controls.stop();
  }, [motionValue, value, duration]);

  return <span className={className}>{format(display)}</span>;
}
