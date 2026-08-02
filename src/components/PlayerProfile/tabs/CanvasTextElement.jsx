import { useEffect, useRef, useState } from "react";
import useCanvasDrag from "./useCanvasDrag";
import {
  CanvasTextBox, CanvasDragHandle, CanvasElementToolbar,
  BBToolBtn, BBToolSep, BBColorPanel, BBColorSwatch,
} from "../styles";

const COLORS = [
  "#2e1065", "#7c3aed", "#e53e3e", "#dd6b20", "#38a169",
  "#3182ce", "#d53f8c", "#1a202c", "#718096", "#ffffff",
];

const FONT_SIZES = [12, 14, 16, 18, 22, 28, 36, 44, 54, 66];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export default function CanvasTextElement({
  element, editable, selected,
  onSelect, onChangeHtml, onChangeFontSize, onMove,
  containerRef,
}) {
  const boxRef = useRef(null);
  const [colorOpen, setColorOpen] = useState(false);

  // contentEditable is uncontrolled by design — never overwrite innerHTML
  // while the box has focus, or every keystroke (spacebar included) would
  // reset the caret to the start as React reconciles dangerouslySetInnerHTML.
  useEffect(() => {
    if (!boxRef.current) return;
    if (document.activeElement === boxRef.current) return;
    const next = element.html || "";
    if (boxRef.current.innerHTML !== next) boxRef.current.innerHTML = next;
  }, [element.html]);

  useEffect(() => {
    if (!selected || !boxRef.current || !editable) return;
    boxRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(boxRef.current);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { handleDragStart } = useCanvasDrag({ element, editable, containerRef, sizeRef: boxRef, onMove, onSelect });

  const syncHtml = () => onChangeHtml(element.id, boxRef.current?.innerHTML ?? "");

  const applyFormat = (cmd, value = null) => {
    boxRef.current?.focus();
    document.execCommand(cmd, false, value);
    syncHtml();
  };

  const md = (fn) => (e) => { e.preventDefault(); fn(); };

  const bumpFontSize = (delta) => {
    const idx = FONT_SIZES.indexOf(element.fontSize);
    const nextIdx = clamp((idx === -1 ? 2 : idx) + delta, 0, FONT_SIZES.length - 1);
    onChangeFontSize(element.id, FONT_SIZES[nextIdx]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertLineBreak");
      syncHtml();
    }
  };

  return (
    <div
      style={{
        position: "absolute", left: `${element.x}%`, top: `${element.y}%`,
        transform: "translate(-50%, -50%)",
        // width:auto here would let the browser's shrink-to-fit algorithm
        // treat "distance from left to the container's right edge" as the
        // available space — the box would visibly narrow and wrap as it
        // nears the right edge, even though translate() re-centers it with
        // room on both sides. max-content sizes to the text directly and
        // ignores position entirely.
        width: "max-content", maxWidth: "88%",
      }}
    >
      {editable && selected && (
        <>
          <CanvasDragHandle onMouseDown={handleDragStart} title="Drag to move">✥</CanvasDragHandle>
          <CanvasElementToolbar onMouseDown={(e) => e.preventDefault()}>
            <BBToolBtn title="Bold" onMouseDown={md(() => applyFormat("bold"))}><b>B</b></BBToolBtn>
            <BBToolBtn title="Italic" onMouseDown={md(() => applyFormat("italic"))}><i>I</i></BBToolBtn>
            <BBToolBtn title="Underline" onMouseDown={md(() => applyFormat("underline"))}><u>U</u></BBToolBtn>
            <BBToolSep />
            <BBToolBtn title="Bigger text" onMouseDown={md(() => bumpFontSize(1))}>A+</BBToolBtn>
            <BBToolBtn title="Smaller text" onMouseDown={md(() => bumpFontSize(-1))}>A−</BBToolBtn>
            <BBToolSep />
            <div style={{ position: "relative" }}>
              <BBToolBtn title="Color" $active={colorOpen} onMouseDown={md(() => setColorOpen(v => !v))}>🎨</BBToolBtn>
              {colorOpen && (
                <BBColorPanel onMouseDown={(e) => e.preventDefault()}>
                  {COLORS.map((c) => (
                    <BBColorSwatch
                      key={c}
                      style={{ background: c }}
                      title={c}
                      onClick={() => { applyFormat("foreColor", c); setColorOpen(false); }}
                    />
                  ))}
                </BBColorPanel>
              )}
            </div>
          </CanvasElementToolbar>
        </>
      )}
      <CanvasTextBox
        ref={boxRef}
        spellCheck={false}
        style={{ fontSize: element.fontSize }}
        $editable={editable}
        $selected={selected}
        contentEditable={editable}
        suppressContentEditableWarning
        onMouseDown={(e) => { if (editable) { e.stopPropagation(); onSelect(element.id); } }}
        onInput={syncHtml}
        onKeyDown={handleKeyDown}
        onBlur={() => setColorOpen(false)}
      />
    </div>
  );
}
