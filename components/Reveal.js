"use client";

import { motion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1];

export default function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
  y = 20,
  duration = 0.6,
  whileHover,
  whileTap,
}) {
  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, delay, ease: EASE }}
      whileHover={whileHover}
      whileTap={whileTap}
    >
      {children}
    </MotionTag>
  );
}
