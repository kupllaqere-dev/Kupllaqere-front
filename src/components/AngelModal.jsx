import { useState } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes, css } from "styled-components";

/* ── Animations ── */
const fadeIn = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const glassShine = keyframes`
  0%   { transform: translateX(-100%) skewX(-18deg); }
  100% { transform: translateX(420%) skewX(-18deg); }
`;
const floatGlow = keyframes`
  0%,100% { box-shadow: 0 0 18px rgba(200,160,255,0.22), 0 8px 32px rgba(180,130,255,0.12); }
  50%      { box-shadow: 0 0 32px rgba(220,170,255,0.38), 0 12px 48px rgba(190,140,255,0.22); }
`;
const bannerShimmer = keyframes`
  0%,100% { opacity: 0.65; transform: translateY(0); }
  50%      { opacity: 1;    transform: translateY(-4px); }
`;

/* ── Colors ── */
const C = {
  border:  "rgba(180,130,255,0.18)",
  border2: "rgba(160,100,255,0.34)",
  accent:  "#9b5de5",
  accentLt:"#c084fc",
  txt:     "#3b1a6e",
  txt2:    "#6b3fa8",
  txt3:    "#b89dd8",
};

/* ── Layout ── */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(30,10,70,0.48);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalOuter = styled.div`
  position: relative;
  width: min(96%, 1400px);
  max-width: 98%;
  height: 92%;
  display: flex;
  flex-direction: column;
`;

const ModalWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: 22px;
  background: linear-gradient(160deg, #fdfaff 0%, #f9f2ff 100%);
  box-shadow: 0 32px 80px rgba(120,60,220,0.18), 0 4px 16px rgba(120,60,220,0.1),
              inset 0 1px 0 rgba(255,255,255,0.95);
  animation: ${fadeIn} 0.22s ease;
`;

/* Close button placed on ModalOuter so it sits outside ModalWrapper */
const CloseBtn = styled.button`
  all: unset;
  box-sizing: border-box;
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 30;
  background: rgba(245,235,255,0.9);
  border: 1px solid ${C.border};
  border-radius: 10px;
  width: 30px; height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${C.txt3};
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: #ffe4f4; border-color: rgba(220,38,38,0.35); color: #dc2626; }
`;

/* ── Left nav ── */
const NavCol = styled.nav`
  width: 170px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 14px 20px;
  gap: 12px;
  background: linear-gradient(160deg, #f0e8ff 0%, #f8f0ff 100%);
  border-right: 1px solid ${C.border};
  border-radius: 22px 0 0 22px;
`;

const NavHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid ${C.border};
`;

const NavHeaderIcon = styled.span`
  font-size: 24px;
  filter: drop-shadow(0 2px 8px rgba(180,130,255,0.5));
`;

const NavHeaderTitle = styled.div`
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${C.txt3};
`;

/* Square tabs: aspect-ratio 1 makes them as tall as they are wide */
const TabBtn = styled.button`
  all: unset;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 14px;
  border: 1px solid ${p => p.$active ? "rgba(155,93,229,0.4)" : C.border};
  background: ${p => p.$active
    ? "linear-gradient(145deg, rgba(155,93,229,0.14), rgba(192,132,252,0.08))"
    : "linear-gradient(145deg, rgba(255,255,255,0.72), rgba(240,220,255,0.45))"};
  color: ${p => p.$active ? C.txt : C.txt2};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  box-shadow: ${p => p.$active
    ? "0 4px 18px rgba(155,93,229,0.16), inset 0 1px 0 rgba(255,255,255,0.8)"
    : "0 2px 8px rgba(155,93,229,0.07), inset 0 1px 0 rgba(255,255,255,0.65)"};
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s, background 0.18s;

  &::before {
    content: '';
    position: absolute;
    top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.52), transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }

  &:hover {
    border-color: rgba(155,93,229,0.38);
    background: linear-gradient(145deg, rgba(155,93,229,0.1), rgba(192,132,252,0.06));
    box-shadow: 0 6px 20px rgba(155,93,229,0.14), inset 0 1px 0 rgba(255,255,255,0.8);
    transform: translateY(-2px);
  }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }

  ${p => p.$active && css`
    &::after {
      content: '';
      position: absolute;
      right: 0; top: 20%; bottom: 20%;
      width: 3px;
      background: ${C.accent};
      border-radius: 0 2px 2px 0;
    }
  `}
`;

const TabIcon = styled.div`font-size: 26px; line-height: 1; display: flex; align-items: center; justify-content: center;`;
const TabLabel = styled.span`font-size: 11px; font-weight: 700; letter-spacing: 0.3px;`;

/* ── Content area — no scroll ── */
const ContentCol = styled.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
  padding: 28px 32px 24px;
  display: flex;
  flex-direction: column;
`;

const GridCentering = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* ── Tab header ── */
const TabHeader = styled.div`
  margin-bottom: 20px;
  flex-shrink: 0;
`;

const TabTitle = styled.h2`
  margin: 0 0 3px;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.3px;
  background: linear-gradient(120deg, ${C.accent}, ${C.accentLt}, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TabSubtitle = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${C.txt3};
  letter-spacing: 0.3px;
`;

/* ── Lis tab ── */
const LisGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 140px;
  gap: 14px;
  width: 100%;
`;

const LisItem = styled.button`
  all: unset;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 18px;
  border: 1px solid ${C.border};
  background: linear-gradient(160deg, #ffffff 0%, #f9f2ff 100%);
  box-shadow: 0 4px 18px rgba(155,93,229,0.08), inset 0 1px 0 rgba(255,255,255,0.9);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  animation: ${floatGlow} 3.5s ease-in-out infinite;
  animation-delay: ${p => p.$delay || "0s"};

  /* row 2 items each span 2 columns */
  &:nth-child(5) { grid-column: span 2; }
  &:nth-child(6) { grid-column: span 2; }

  &::before {
    content: '';
    position: absolute;
    top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.62), transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px) scale(1.02);
    border-color: rgba(155,93,229,0.38);
    box-shadow: 0 10px 32px rgba(155,93,229,0.18), inset 0 1px 0 rgba(255,255,255,0.95);
    animation: none;
  }
  &:hover::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

const LisItemImg = styled.img`
  width: 44px;
  height: 44px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(180,130,255,0.4));
`;

const LisItemValue = styled.div`
  font-size: 18px;
  font-weight: 900;
  color: ${C.txt};
  letter-spacing: -0.3px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LisValueCurrency = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${C.txt3};
`;

const LisItemPrice = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${C.txt3};
  background: rgba(155,93,229,0.08);
  border: 1px solid ${C.border};
  border-radius: 8px;
  padding: 2px 9px;
`;

/* ── Memberships tab ── */
const MembershipRow = styled.div`
  display: flex;
  gap: 18px;
  flex: 1;
`;

const MemberBanner = styled.button`
  all: unset;
  box-sizing: border-box;
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 22px 18px;
  border-radius: 20px;
  border: 1px solid ${p => p.$border || C.border};
  background: ${p => p.$bg};
  cursor: pointer;
  transition: transform 0.22s, box-shadow 0.22s;
  box-shadow: ${p => p.$shadow || "0 6px 28px rgba(155,93,229,0.1)"};

  &:hover {
    transform: translateY(-4px) scale(1.015);
    box-shadow: ${p => p.$hoverShadow || "0 14px 44px rgba(155,93,229,0.22)"};
  }
`;

const BannerBg = styled.div`
  position: absolute;
  inset: 0;
  background: ${p => p.$gradient};
  opacity: 0.15;
`;

const BannerOrb = styled.div`
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: ${p => p.$color};
  filter: blur(50px);
  opacity: 0.3;
  animation: ${bannerShimmer} 3s ease-in-out infinite;
  animation-delay: ${p => p.$delay || "0s"};
`;

const BannerIcon = styled.div`
  position: relative;
  z-index: 2;
  font-size: 48px;
  line-height: 1;
  filter: drop-shadow(0 4px 12px ${p => p.$glow || "rgba(180,130,255,0.5)"});
  animation: ${bannerShimmer} 2.8s ease-in-out infinite;
  animation-delay: ${p => p.$delay || "0s"};
  margin-bottom: 12px;
`;

const BannerContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
`;

const BannerTitle = styled.div`
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${p => p.$color || C.txt};
  text-shadow: 0 2px 10px ${p => p.$glow || "rgba(155,93,229,0.35)"};
`;

const BannerTier = styled.div`
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: ${p => p.$color || C.txt3};
  opacity: 0.75;
  margin-bottom: 2px;
`;

const BannerPerks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
`;

const BannerPerk = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${p => p.$color || C.txt2};
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0.82;

  &::before {
    content: '✦';
    font-size: 7px;
    color: ${p => p.$bullet || C.accentLt};
    flex-shrink: 0;
  }
`;

const BannerCta = styled.div`
  margin-top: 12px;
  padding: 9px 26px;
  border-radius: 11px;
  border: 1px solid ${p => p.$border || "rgba(155,93,229,0.35)"};
  background: ${p => p.$bg || "rgba(155,93,229,0.1)"};
  color: ${p => p.$color || C.accent};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -20%; left: -60%;
    width: 32%; height: 140%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.52), transparent);
    transform: skewX(-18deg) translateX(-100%);
    pointer-events: none;
  }

  ${MemberBanner}:hover &::before { animation: ${glassShine} 0.52s ease-out forwards; }
`;

/* ── Data ── */
const LIS_AMOUNTS = [
  { value: 50,   price: "$0.99"  },
  { value: 100,  price: "$1.99"  },
  { value: 200,  price: "$3.99"  },
  { value: 500,  price: "$7.99"  },
  { value: 1000, price: "$14.99" },
  { value: 2000, price: "$24.99" },
];

const MEMBERSHIPS = [
  {
    key: "angel",
    name: "Angel",
    tier: "Tier I",
    icon: "🌸",
    bg: "linear-gradient(160deg, #fefaff 0%, #f5eeff 60%, #ecdeff 100%)",
    gradient: "linear-gradient(135deg, #c084fc, #e879f9)",
    orbColor: "rgba(192,132,252,0.6)",
    glow: "rgba(192,132,252,0.5)",
    titleColor: "#7c3aed",
    tierColor: "#a78bfa",
    perkColor: "#6b3fa8",
    bulletColor: "#c084fc",
    border: "rgba(192,132,252,0.3)",
    shadow: "0 6px 28px rgba(192,132,252,0.14)",
    hoverShadow: "0 14px 48px rgba(192,132,252,0.28)",
    ctaBg: "rgba(192,132,252,0.12)",
    ctaBorder: "rgba(192,132,252,0.35)",
    ctaColor: "#7c3aed",
    perks: ["Exclusive Angel badge", "Custom name glow", "5% shop discount"],
  },
  {
    key: "celestial",
    name: "Celestial",
    tier: "Tier II",
    icon: "⭐",
    bg: "linear-gradient(160deg, #fffff5 0%, #fdfce8 60%, #fef9c3 100%)",
    gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    orbColor: "rgba(251,191,36,0.6)",
    glow: "rgba(251,191,36,0.5)",
    titleColor: "#92400e",
    tierColor: "#d97706",
    perkColor: "#78350f",
    bulletColor: "#f59e0b",
    border: "rgba(251,191,36,0.3)",
    shadow: "0 6px 28px rgba(251,191,36,0.12)",
    hoverShadow: "0 14px 48px rgba(251,191,36,0.26)",
    ctaBg: "rgba(251,191,36,0.12)",
    ctaBorder: "rgba(251,191,36,0.38)",
    ctaColor: "#92400e",
    perks: ["All Angel perks", "Gold name effect", "10% shop discount", "Priority support"],
  },
  {
    key: "eternal",
    name: "Eternal",
    tier: "Tier III",
    icon: "💎",
    bg: "linear-gradient(160deg, #fafeff 0%, #ecfeff 60%, #cffafe 100%)",
    gradient: "linear-gradient(135deg, #22d3ee, #0ea5e9)",
    orbColor: "rgba(34,211,238,0.6)",
    glow: "rgba(34,211,238,0.5)",
    titleColor: "#0e7490",
    tierColor: "#06b6d4",
    perkColor: "#164e63",
    bulletColor: "#22d3ee",
    border: "rgba(34,211,238,0.3)",
    shadow: "0 6px 28px rgba(34,211,238,0.1)",
    hoverShadow: "0 14px 48px rgba(34,211,238,0.24)",
    ctaBg: "rgba(34,211,238,0.1)",
    ctaBorder: "rgba(34,211,238,0.35)",
    ctaColor: "#0e7490",
    perks: ["All Celestial perks", "Animated aura effect", "20% shop discount", "Exclusive Eternal items", "Custom title"],
  },
];

/* ── Component ── */
export default function AngelModal({ onClose }) {
  const [activeTab, setActiveTab] = useState("lis");

  return createPortal(
    <Overlay onClick={onClose}>
      <ModalOuter>
        {/* Close button outside ModalWrapper so position:absolute resolves to ModalOuter */}
        <CloseBtn onClick={onClose}>&times;</CloseBtn>

        <ModalWrapper onClick={e => e.stopPropagation()}>
          {/* Left nav */}
          <NavCol>
            <NavHeader>
              <NavHeaderIcon>✦</NavHeaderIcon>
              <NavHeaderTitle>Shop</NavHeaderTitle>
            </NavHeader>

            <TabBtn $active={activeTab === "lis"} onClick={() => setActiveTab("lis")}>
              <TabIcon>
                <img src="/icons/Lis.png" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(180,130,255,0.5))" }} />
              </TabIcon>
              <TabLabel>Lis</TabLabel>
            </TabBtn>

            <TabBtn $active={activeTab === "memberships"} onClick={() => setActiveTab("memberships")}>
              <TabIcon>🪽</TabIcon>
              <TabLabel>Memberships</TabLabel>
            </TabBtn>
          </NavCol>

          {/* Content — no scroll */}
          <ContentCol>
            <ContentArea>
              {activeTab === "lis" && (
                <>
                  <TabHeader>
                    <TabTitle>Buy Lis</TabTitle>
                    <TabSubtitle>Purchase Lis to unlock exclusive items and experiences</TabSubtitle>
                  </TabHeader>

                  <GridCentering>
                    <LisGrid>
                      {LIS_AMOUNTS.map(({ value, price }, i) => (
                        <LisItem key={value} $delay={`${i * 0.18}s`}>
                          <LisItemImg src="/icons/Lis.png" alt="Lis" />
                          <LisItemValue>
                            {value.toLocaleString()}
                            <LisValueCurrency>Lis</LisValueCurrency>
                          </LisItemValue>
                          <LisItemPrice>{price}</LisItemPrice>
                        </LisItem>
                      ))}
                    </LisGrid>
                  </GridCentering>
                </>
              )}

              {activeTab === "memberships" && (
                <>
                  <TabHeader>
                    <TabTitle>Memberships</TabTitle>
                    <TabSubtitle>Unlock divine privileges and ethereal rewards</TabSubtitle>
                  </TabHeader>

                  <MembershipRow>
                    {MEMBERSHIPS.map((m, i) => (
                      <MemberBanner
                        key={m.key}
                        $bg={m.bg}
                        $border={m.border}
                        $shadow={m.shadow}
                        $hoverShadow={m.hoverShadow}
                      >
                        <BannerBg $gradient={m.gradient} />
                        <BannerOrb $color={m.orbColor} $delay={`${i * 0.4}s`} />

                        <BannerIcon $glow={m.glow} $delay={`${i * 0.3}s`}>
                          {m.icon}
                        </BannerIcon>

                        <BannerContent>
                          <div>
                            <BannerTier $color={m.tierColor}>{m.tier}</BannerTier>
                            <BannerTitle $color={m.titleColor} $glow={m.glow}>{m.name}</BannerTitle>
                          </div>

                          <BannerPerks>
                            {m.perks.map(perk => (
                              <BannerPerk key={perk} $color={m.perkColor} $bullet={m.bulletColor}>
                                {perk}
                              </BannerPerk>
                            ))}
                          </BannerPerks>

                          <BannerCta $bg={m.ctaBg} $border={m.ctaBorder} $color={m.ctaColor}>
                            Subscribe
                          </BannerCta>
                        </BannerContent>
                      </MemberBanner>
                    ))}
                  </MembershipRow>
                </>
              )}
            </ContentArea>
          </ContentCol>
        </ModalWrapper>
      </ModalOuter>
    </Overlay>,
    document.body
  );
}
