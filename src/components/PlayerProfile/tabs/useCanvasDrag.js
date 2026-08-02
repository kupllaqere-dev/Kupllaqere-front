import { useRef, useState, useCallback } from "react";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

// Shared drag behavior for canvas elements (text, Spotify, …): drag is only
// initiated from an explicit handle, positions are stored as percentages of
// the canvas so they scale with it, and the clamp accounts for the element's
// own rendered size (via sizeRef) so its edges stay inside the canvas walls
// instead of just its center point.
export default function useCanvasDrag({ element, editable, containerRef, sizeRef, onMove, onSelect }) {
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e) => {
    if (!editable || !containerRef.current || !sizeRef.current) return;
    e.preventDefault();
    onSelect?.(element.id);
    const rect = containerRef.current.getBoundingClientRect();
    const boxRect = sizeRef.current.getBoundingClientRect();
    const origin = { x: element.x, y: element.y };

    const halfWPct = (boxRect.width / 2 / rect.width) * 100;
    const halfHPct = (boxRect.height / 2 / rect.height) * 100;
    const bounds = {
      minX: Math.min(halfWPct, 50), maxX: Math.max(100 - halfWPct, 50),
      minY: Math.min(halfHPct, 50), maxY: Math.max(100 - halfHPct, 50),
    };
    dragRef.current = { startX: e.clientX, startY: e.clientY, rectW: rect.width, rectH: rect.height };
    setIsDragging(true);

    const onMouseMove = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = ((ev.clientX - d.startX) / d.rectW) * 100;
      const dy = ((ev.clientY - d.startY) / d.rectH) * 100;
      onMove(
        element.id,
        clamp(origin.x + dx, bounds.minX, bounds.maxX),
        clamp(origin.y + dy, bounds.minY, bounds.maxY),
      );
    };
    const onMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [editable, containerRef, sizeRef, element.id, element.x, element.y, onMove, onSelect]);

  return { handleDragStart, isDragging };
}
