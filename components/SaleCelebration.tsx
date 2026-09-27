"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

const DURATION_MS = 4000;
const COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4", "#ec4899"];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function firework() {
  confetti({
    particleCount: randomBetween(60, 100),
    startVelocity: randomBetween(35, 55),
    spread: 360,
    ticks: 80,
    gravity: 0.9,
    scalar: randomBetween(0.8, 1.2),
    origin: {
      x: randomBetween(0.15, 0.85),
      y: randomBetween(0.15, 0.6),
    },
    colors: COLORS,
  });
}

export default function SaleCelebration() {
  useEffect(() => {
    const end = Date.now() + DURATION_MS;

    firework();
    const burstInterval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(burstInterval);
        return;
      }
      firework();
    }, 400);

    return () => clearInterval(burstInterval);
  }, []);

  return null;
}
