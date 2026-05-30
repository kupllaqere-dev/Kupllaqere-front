import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Phaser from "phaser";
import GuestbookScene from "./GuestbookScene";
import { STICKER_ASSETS } from "./StickerAssets";
import styled from "styled-components";

const Wrap = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  background: #fdf8f0;
  cursor: default;

  /* Force the Phaser canvas to fill this container */
  canvas {
    display: block !important;
    width: 100%  !important;
    height: 100% !important;
    touch-action: none; /* prevent browser scroll during drag */
  }
`;

/**
 * React wrapper that creates and destroys a Phaser.Game for the sticker canvas.
 *
 * Exposes an imperative handle so the parent can:
 *   - ref.current.startPlacement(assetId)
 *   - ref.current.cancelPlacement()
 *   - ref.current.confirmPlacement()  → returns placement payload | null
 *   - ref.current.adjustRotation(deg)
 *   - ref.current.adjustScale(delta)
 *   - ref.current.addStickerExternal(stickerRow)
 *   - ref.current.removeStickerExternal(stickerId)
 */
const GuestbookCanvas = forwardRef(function GuestbookCanvas(
  {
    stickers,
    currentUserId,
    profileOwnerId,
    onStickerClick,
    onPlacementDone,
    onConfirmPlacement,
  },
  ref
) {
  const containerRef = useRef(null);
  const gameRef      = useRef(null);
  const sceneRef     = useRef(null);

  // Keep callbacks current without recreating the Phaser game
  const onStickerClickRef     = useRef(onStickerClick);
  const onPlacementDoneRef    = useRef(onPlacementDone);
  const onConfirmPlacementRef = useRef(onConfirmPlacement);
  useEffect(() => { onStickerClickRef.current     = onStickerClick; },     [onStickerClick]);
  useEffect(() => { onPlacementDoneRef.current    = onPlacementDone; },    [onPlacementDone]);
  useEffect(() => { onConfirmPlacementRef.current = onConfirmPlacement; }, [onConfirmPlacement]);

  // ── Imperative API ────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    startPlacement:       (assetId) => sceneRef.current?.startPlacement(assetId),
    cancelPlacement:      ()        => sceneRef.current?.cancelPlacement(),
    confirmPlacement:     ()        => sceneRef.current?.confirmPlacement(),
    adjustRotation:       (d)       => sceneRef.current?.adjustRotation(d),
    adjustScale:          (d)       => sceneRef.current?.adjustScale(d),
    addStickerExternal:   (s)       => sceneRef.current?.addStickerExternal(s),
    removeStickerExternal:(id)      => sceneRef.current?.removeStickerExternal(id),
    zoomIn:               ()        => sceneRef.current?.zoomIn(),
    zoomOut:              ()        => sceneRef.current?.zoomOut(),
    zoomReset:            ()        => sceneRef.current?.zoomReset(),
  }));

  // ── Mount/Destroy Phaser game ─────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scene = new GuestbookScene();
    // Inject config before the game boots (accessed in preload/create)
    scene.initialStickers = stickers || [];
    scene.currentUserId   = currentUserId  || null;
    scene.profileOwnerId  = profileOwnerId || null;
    scene.stickerAssets   = STICKER_ASSETS;
    // Use refs so callbacks stay fresh without re-creating the game
    scene.onStickerClick     = (...args) => onStickerClickRef.current?.(...args);
    scene.onPlacementDone    = (...args) => onPlacementDoneRef.current?.(...args);
    scene.onConfirmPlacement = (...args) => onConfirmPlacementRef.current?.(...args);
    sceneRef.current = scene;

    const w = el.clientWidth  || 480;
    const h = el.clientHeight || 330;

    const game = new Phaser.Game({
      type:            Phaser.CANVAS,
      width:           w,
      height:          h,
      parent:          el,
      backgroundColor: 0xfdf8f0,
      transparent:     false,
      scene,
      scale: {
        mode:       Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width:      w,
        height:     h,
      },
      input: {
        activePointers: 3, // support two-finger gestures
      },
      render: {
        antialias:  true,
        pixelArt:   false,
        roundPixels: false,
      },
      // Disable the Phaser banner in the console
      banner: false,
    });
    gameRef.current = game;

    return () => {
      // Null out callbacks before destruction to avoid React "setState on unmounted" errors
      if (sceneRef.current) {
        sceneRef.current.onStickerClick  = null;
        sceneRef.current.onPlacementDone = null;
      }
      game.destroy(true);
      gameRef.current  = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only — external updates come via the imperative API

  return <Wrap ref={containerRef} />;
});

export default GuestbookCanvas;
