"use client";

import { useEffect, useState } from "react";

const words = ["live", "work", "retire", "escape", "reset"];

export function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, []);

  return <span className="rotating-word">{words[index]}</span>;
}
