import { useState, useEffect } from "react";

const BASE_W = 1920;
const BASE_H = 1080;

export function useScaling() {
  const [scale, setScale] = useState(() =>
    Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H)
  );

  useEffect(() => {
    function update() {
      setScale(Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H));
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}
