"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

function parseNumeric(value) {
  const match = String(value).match(/^(-?[\d.,]+)(.*)$/);
  if (!match) return null;
  const numeric = parseFloat(match[1].replace(/,/g, ""));
  if (Number.isNaN(numeric)) return null;
  const decimalPart = match[1].split(".")[1];
  return { numeric, suffix: match[2], decimals: decimalPart ? decimalPart.length : 0 };
}

export default function AnimatedNumber({ value, duration = 0.7 }) {
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(parsed ? 0 : null);
  const prevNumericRef = useRef(0);

  useEffect(() => {
    if (!parsed) return;

    const controls = animate(prevNumericRef.current, parsed.numeric, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        setDisplay(parsed.decimals ? latest.toFixed(parsed.decimals) : Math.round(latest));
      },
    });
    prevNumericRef.current = parsed.numeric;

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  if (!parsed) return value;
  return (
    <>
      {display}
      {parsed.suffix}
    </>
  );
}
