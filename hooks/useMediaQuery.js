"use client";

import { useEffect, useState } from "react";

/** Evalúa una media query; en SSR devuelve `defaultValue` hasta hidratar. */
export function useMediaQuery(query, defaultValue = false) {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);

    function onChange(event) {
      setMatches(event.matches);
    }

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
