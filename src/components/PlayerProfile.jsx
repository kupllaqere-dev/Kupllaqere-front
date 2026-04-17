import { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";

const FRAME_W = 510;
const FRAME_H = 900;

// Clockwise rotation order through idle poses
const POSE_ORDER = [0, 4, 5, 3, 2, 1]; // FRONT, FRONT_RIGHT, RIGHT, BACK, LEFT, FRONT_LEFT
const POSE_LABELS = ["Front", "Front Right", "Right", "Back", "Left", "Front Left"];

const LAYER_ORDER = ["bottoms", "feet", "tops", "hands", "coats", "accessories", "hair", "head"];

function extractFrame(img, frameIndex, cols) {
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);
  return { sx: col * FRAME_W, sy: row * FRAME_H };
}

export default function PlayerProfile({ onClose, playerName, outfit }) {
  const canvasRef = useRef(null);
  const [poseIndex, setPoseIndex] = useState(0);
  const [baseImg, setBaseImg] = useState(null);
  const [layerImages, setLayerImages] = useState([]);

  // Load base sprite
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/assets/character-bases/sprite2.png";
    img.onload = () => setBaseImg(img);
  }, []);

  // Load equipped layer images
  useEffect(() => {
    if (!outfit) {
      setLayerImages([]);
      return;
    }

    const entries = LAYER_ORDER
      .filter((cat) => outfit[cat]?.imageUrl)
      .map((cat) => ({ category: cat, url: outfit[cat].imageUrl }));

    let cancelled = false;
    Promise.all(
      entries.map(
        ({ category, url }) =>
          new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            img.onload = () => resolve({ category, img });
            img.onerror = () => resolve(null);
          }),
      ),
    ).then((results) => {
      if (!cancelled) setLayerImages(results.filter(Boolean));
    });

    return () => { cancelled = true; };
  }, [outfit]);

  // Draw to canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.floor(baseImg.width / FRAME_W);
    const frameIndex = POSE_ORDER[poseIndex];
    const { sx, sy } = extractFrame(baseImg, frameIndex, cols);

    // Draw base
    ctx.drawImage(baseImg, sx, sy, FRAME_W, FRAME_H, 0, 0, canvas.width, canvas.height);

    // Draw layers in order
    for (const { img } of layerImages) {
      const layerCols = Math.floor(img.width / FRAME_W);
      const { sx: lx, sy: ly } = extractFrame(img, frameIndex, layerCols);
      ctx.drawImage(img, lx, ly, FRAME_W, FRAME_H, 0, 0, canvas.width, canvas.height);
    }
  }, [baseImg, layerImages, poseIndex]);

  useEffect(() => { draw(); }, [draw]);

  const turnLeft = () => setPoseIndex((i) => (i - 1 + POSE_ORDER.length) % POSE_ORDER.length);
  const turnRight = () => setPoseIndex((i) => (i + 1) % POSE_ORDER.length);

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}>&times;</CloseBtn>

        <Content>
          <AvatarSide>
            <AvatarCanvas ref={canvasRef} width={170} height={300} />
            <Controls>
              <ArrowBtn onClick={turnLeft}>&larr;</ArrowBtn>
              <PoseLabel>{POSE_LABELS[poseIndex]}</PoseLabel>
              <ArrowBtn onClick={turnRight}>&rarr;</ArrowBtn>
            </Controls>
          </AvatarSide>

          <InfoSide>
            <PlayerName>{playerName || "Player"}</PlayerName>
            <Divider />
            <DescLabel>About</DescLabel>
            <Description>
              Hello. This is me.
            </Description>

            <Divider />
            <DescLabel>Outfit</DescLabel>
            <OutfitList>
              {LAYER_ORDER.map((cat) => {
                const item = outfit?.[cat];
                if (!item) return null;
                return (
                  <OutfitTag key={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </OutfitTag>
                );
              })}
              {(!outfit || Object.keys(outfit).length === 0) && (
                <EmptyOutfit>No items equipped</EmptyOutfit>
              )}
            </OutfitList>
          </InfoSide>
        </Content>
      </Modal>
    </Overlay>
  );
}

/* ── Styles ── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  position: relative;
  background: #1a1a2e;
  border: 1px solid #ffffff22;
  border-radius: 14px;
  padding: 32px;
  width: 540px;
  max-width: 94vw;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  color: #fff;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  &:hover { color: #fff; }
`;

const Content = styled.div`
  display: flex;
  gap: 28px;
  align-items: flex-start;
`;

const AvatarSide = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
`;

const AvatarCanvas = styled.canvas`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #ffffff15;
  border-radius: 12px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
`;

const ArrowBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #ffffff22;
  background: rgba(255, 255, 255, 0.05);
  color: #ccc;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    background: rgba(124, 58, 237, 0.3);
    border-color: #7b2ff7;
    color: #fff;
  }
`;

const PoseLabel = styled.span`
  font-size: 11px;
  color: #888;
  min-width: 80px;
  text-align: center;
`;

const InfoSide = styled.div`
  flex: 1;
  min-width: 0;
`;

const PlayerName = styled.h2`
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
`;

const Divider = styled.div`
  height: 1px;
  background: #ffffff15;
  margin: 14px 0;
`;

const DescLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const Description = styled.p`
  margin: 0;
  font-size: 13px;
  color: #bbb;
  line-height: 1.5;
`;

const OutfitList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const OutfitTag = styled.span`
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.3);
  color: #c4a1ff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
`;

const EmptyOutfit = styled.span`
  font-size: 12px;
  color: #666;
`;
