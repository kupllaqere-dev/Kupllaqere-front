import { useRef, useEffect } from "react";
import { STICKER_ASSETS } from "./StickerAssets";
import {
  PickerBar, PickerScroll, PickerBtn,
  PlacementToolbar, PlacementHint,
  ToolGroup, ToolBtn, ConfirmBtn, CancelBtn,
} from "./styles";

/**
 * Horizontal sticker tray + floating placement toolbar.
 *
 * Props:
 *   canPlace        – bool   (false while viewing own profile, or canvas full)
 *   placingAssetId  – string | null
 *   onSelect        – (assetId) => void
 *   onConfirm       – () => void
 *   onCancel        – () => void
 *   onRotateLeft    – () => void
 *   onRotateRight   – () => void
 *   onScaleUp       – () => void
 *   onScaleDown     – () => void
 *   stickerCount    – number
 *   maxStickers     – number
 */
export default function StickerPicker({
  canPlace,
  placingAssetId,
  onSelect,
  onConfirm,
  onCancel,
  onRotateLeft,
  onRotateRight,
  onScaleUp,
  onScaleDown,
  stickerCount = 0,
  maxStickers  = 100,
}) {
  const scrollRef = useRef(null);

  // Scroll the selected sticker into view when placement mode activates
  useEffect(() => {
    if (!placingAssetId || !scrollRef.current) return;
    const btn = scrollRef.current.querySelector(`[data-id="${placingAssetId}"]`);
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [placingAssetId]);

  const full = stickerCount >= maxStickers;

  return (
    <>
      {/* ── Sticker tray ── */}
      <PickerBar>
        {canPlace && !full && (
          <PickerScroll ref={scrollRef}>
            {STICKER_ASSETS.map(({ id, emoji, label }) => (
              <PickerBtn
                key={id}
                data-id={id}
                $active={placingAssetId === id}
                title={label}
                onClick={() => onSelect(id)}
                aria-label={label}
              >
                {emoji}
              </PickerBtn>
            ))}
          </PickerScroll>
        )}
        {!canPlace && (
          <PlacementHint>View-only — stickers are locked in place.</PlacementHint>
        )}
        {canPlace && full && (
          <PlacementHint>Guestbook full ({maxStickers} stickers max).</PlacementHint>
        )}
      </PickerBar>

      {/* ── Placement toolbar (visible only in placement mode) ── */}
      {placingAssetId && (
        <PlacementToolbar>
          <ToolGroup>
            <ToolBtn onClick={onRotateLeft}  title="Rotate left (or scroll wheel)">↺</ToolBtn>
            <ToolBtn onClick={onRotateRight} title="Rotate right">↻</ToolBtn>
          </ToolGroup>

          <ToolGroup>
            <ToolBtn onClick={onScaleDown} title="Shrink (Shift + scroll)">−</ToolBtn>
            <ToolBtn onClick={onScaleUp}   title="Grow">+</ToolBtn>
          </ToolGroup>

          <ToolGroup $gap={6}>
            <CancelBtn  onClick={onCancel}>Cancel</CancelBtn>
            <ConfirmBtn onClick={onConfirm}>Place ✓</ConfirmBtn>
          </ToolGroup>
        </PlacementToolbar>
      )}
    </>
  );
}
