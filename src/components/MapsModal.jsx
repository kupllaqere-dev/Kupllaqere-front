import { useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { MAP_LIST } from "../game/MapManager";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(40, 15, 90, 0.52);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  position: relative;
  width: min(96%, 1400px);
  max-width: 98%;
  height: 92%;
  max-height: 92%;
  border-radius: 22px;
  overflow: hidden;
  animation: ${fadeIn} 0.22s ease;
  transition: box-shadow 0.4s ease;

  ${({ $side }) =>
    $side === "day"
      ? css`box-shadow: -80px 0 100px rgba(255, 190, 35, 0.55), 0 32px 80px rgba(80, 30, 180, 0.18);`
      : $side === "night"
      ? css`box-shadow: 80px 0 100px rgba(185, 40, 255, 0.65), 0 32px 80px rgba(80, 30, 180, 0.18);`
      : css`box-shadow: 0 32px 80px rgba(80, 30, 180, 0.18), 0 4px 16px rgba(80, 30, 180, 0.1);`}
`;

const BgImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  user-select: none;
  transition: transform 0.4s ease;
`;

const ZonesColumn = styled.div`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 10;

  ${({ $side }) =>
    $side === "day"
      ? css`left: 32px; align-items: flex-start;`
      : css`right: 32px; align-items: flex-end;`}
`;

const Zone = styled.button`
  width: 200px;
  padding: 15px 20px;
  border-radius: 9px;
  cursor: pointer;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.6px;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.8);
  transition: all 0.22s ease;

  &:disabled {
    cursor: default;
    transform: none;
  }

  ${({ $side }) =>
    $side === "day"
      ? css`
          background: rgba(255, 240, 155, 0.09);
          border: 1.5px solid rgba(255, 205, 40, 0.38);
          color: rgba(255, 248, 210, 0.82);
          &:hover {
            background: rgba(255, 240, 155, 0.2);
            border-color: rgba(255, 210, 50, 0.9);
            color: #fff8d8;
            transform: scale(1.04);
            box-shadow:
              0 0 28px 8px rgba(255, 190, 35, 0.5),
              inset 0 0 18px rgba(255, 215, 60, 0.14);
          }
        `
      : css`
          background: rgba(140, 50, 230, 0.12);
          border: 1.5px solid rgba(180, 70, 255, 0.38);
          color: rgba(210, 175, 255, 0.82);
          &:hover {
            background: rgba(155, 55, 240, 0.24);
            border-color: rgba(190, 75, 255, 0.9);
            color: #e8d5ff;
            transform: scale(1.04);
            box-shadow:
              0 0 28px 8px rgba(185, 40, 255, 0.55),
              inset 0 0 18px rgba(160, 60, 255, 0.18);
          }
        `}

  ${({ $current, $side }) =>
    $current &&
    ($side === "day"
      ? css`
          background: rgba(255, 240, 155, 0.24);
          border-color: rgba(255, 210, 50, 0.95);
          color: #fff8d8;
          box-shadow:
            0 0 28px 8px rgba(255, 190, 35, 0.45),
            inset 0 0 18px rgba(255, 215, 60, 0.16);
        `
      : css`
          background: rgba(155, 55, 240, 0.28);
          border-color: rgba(190, 75, 255, 0.95);
          color: #e8d5ff;
          box-shadow:
            0 0 28px 8px rgba(185, 40, 255, 0.5),
            inset 0 0 18px rgba(160, 60, 255, 0.2);
        `)}
`;

const Here = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  opacity: 0.7;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 20;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.45);
  color: rgba(255, 255, 255, 0.85);
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(0, 0, 0, 0.7); }
`;

const DAY_MAPS   = MAP_LIST.filter((m) => m.side === "day");
const NIGHT_MAPS = MAP_LIST.filter((m) => m.side === "night");

export default function MapsModal({ onClose, currentMap, onSelectMap }) {
  const [activeSide, setActiveSide] = useState(null);

  const trackSide = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveSide(e.clientX - rect.left < rect.width / 2 ? "day" : "night");
  };

  const travel = (mapId) => {
    if (mapId === currentMap) return;
    onSelectMap?.(mapId);
    onClose();
  };

  const renderZones = (maps, side) =>
    maps.map((m) => {
      const isCurrent = m.id === currentMap;
      return (
        <Zone
          key={m.id}
          $side={side}
          $current={isCurrent}
          disabled={isCurrent}
          onClick={() => travel(m.id)}
        >
          {m.label}
          {isCurrent && <Here>You are here</Here>}
        </Zone>
      );
    });

  return (
    <Overlay onClick={onClose}>
      <Modal
        $side={activeSide}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={trackSide}
        onMouseLeave={() => setActiveSide(null)}
      >
        {/* Night layer underneath, day layer on top — curved split is baked into the images */}
        <BgImg
          src="/assets/menus/night.webp"
          alt=""
          style={{
            zIndex: 0,
            transformOrigin: "right center",
            transform: activeSide === "night" ? "scale(1.04)" : "scale(1)",
          }}
        />
        <BgImg
          src="/assets/menus/day.webp"
          alt=""
          style={{
            zIndex: 1,
            transformOrigin: "left center",
            transform: activeSide === "day" ? "scale(1.04)" : "scale(1)",
          }}
        />

        <ZonesColumn $side="day">{renderZones(DAY_MAPS, "day")}</ZonesColumn>

        <ZonesColumn $side="night">{renderZones(NIGHT_MAPS, "night")}</ZonesColumn>

        <CloseBtn onClick={onClose}>&times;</CloseBtn>
      </Modal>
    </Overlay>
  );
}
