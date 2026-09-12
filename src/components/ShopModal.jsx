import { useState, useEffect, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { fetchInventorySlots, purchaseInventorySlots, fetchShopCatalogue } from "../api/store";
import { fetchConsumables, purchaseConsumable } from "../api/consumables";

/* The premium shop: account upgrades and, later, whatever else is bought with
   Lis. Clothing still lives in StoreModal — this one sells capacity, not items.

   Sized to match PlayerProfile (see PlayerProfile/styles.js ProfileOuter) so
   the two big modals read as the same surface. */

const TABS = [
  { key: "account",    label: "Account",    icon: "/icons/avatar.png" },
  { key: "lis",        label: "Lis",        icon: "/icons/Lis.png" },
  { key: "membership", label: "Membership", icon: "/icons/gem.png" },
];

/* Real-money prices arrive as integer cents plus an ISO currency code, so the
   formatting is the only place a decimal point exists. */
function formatPrice(cents, currency) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "EUR",
  }).format(cents / 100);
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px) scale(0.99); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
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
  width: min(96%, 1600px);
  max-width: 98%;
  height: 92%;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: 40px;
  background: #33363c;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  box-shadow:
    0 24px 70px rgba(40, 15, 90, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 0 50px rgba(124, 58, 237, 0.08);
  animation: ${fadeIn} 0.22s ease;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 22px;
  right: 22px;
  z-index: 30;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 20px;
  line-height: 1;
  color: #e8d5ff;
  background: rgba(140, 50, 230, 0.18);
  border: 1.5px solid rgba(180, 70, 255, 0.4);
  transition: all 0.18s ease;

  &:hover {
    background: rgba(155, 55, 240, 0.34);
    border-color: rgba(220, 170, 255, 0.9);
    color: #fff;
  }
`;

/* ── Tab rail ── */

const Rail = styled.div`
  flex-shrink: 0;
  width: 230px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 26px 18px;
  background: linear-gradient(165deg, rgba(59, 20, 120, 0.65), rgba(30, 12, 60, 0.5));
  border-right: 1px solid rgba(255, 255, 255, 0.1);
`;

const RailTitle = styled.h2`
  margin: 0 0 14px 6px;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 1.6px;
  color: #fff;
  text-shadow: 0 2px 10px rgba(185, 40, 255, 0.6);
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.7px;
  transition: all 0.2s ease;
  background: rgba(140, 50, 230, 0.1);
  border: 1.5px solid rgba(180, 70, 255, 0.28);
  color: rgba(210, 175, 255, 0.82);

  img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    opacity: 0.85;
  }

  &:hover {
    background: rgba(155, 55, 240, 0.24);
    border-color: rgba(190, 75, 255, 0.9);
    color: #e8d5ff;
  }

  ${({ $active }) =>
    $active &&
    css`
      background: rgba(155, 55, 240, 0.3);
      border-color: rgba(200, 120, 255, 0.95);
      color: #f3e8ff;
      box-shadow:
        0 0 22px rgba(185, 40, 255, 0.35),
        inset 0 0 16px rgba(160, 60, 255, 0.2);
      img { opacity: 1; }
    `}
`;

const RailSpacer = styled.div`flex: 1;`;

const Balance = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.24);
  border: 1.5px solid rgba(180, 120, 255, 0.28);
  font-size: 14px;
  font-weight: 800;
  color: #f0e2ff;

  img { width: 22px; height: 22px; object-fit: contain; }
  span:last-child { margin-left: auto; }
`;

const BalanceLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: rgba(210, 175, 255, 0.7);
`;

/* ── Tab body ── */

const Body = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 26px 30px 30px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(180, 120, 255, 0.3); border-radius: 4px; }
`;

/* The line the Account tab opens with: what the player actually has left. */
const SlotsBanner = styled.div`
  flex-shrink: 0;
  padding: 18px 22px;
  border-radius: 18px;
  background: linear-gradient(150deg, rgba(59, 20, 120, 0.7), rgba(30, 12, 60, 0.45));
  border: 1.5px solid rgba(180, 120, 255, 0.3);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
`;

const SlotsHeadline = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
`;

const SlotsBig = styled.span`
  font-size: 30px;
  font-weight: 900;
  line-height: 1;
  color: #fff;
  text-shadow: 0 2px 12px rgba(185, 40, 255, 0.55);
`;

const SlotsCaption = styled.span`
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: rgba(210, 175, 255, 0.9);
`;

const SlotsSub = styled.div`
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: rgba(200, 170, 245, 0.62);
`;

const Meter = styled.div`
  margin-top: 13px;
  height: 9px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.34);
  border: 1px solid rgba(180, 120, 255, 0.22);
`;

/* Fills with what is *used*, so a nearly-full wardrobe reads as nearly-full. */
const MeterFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  border-radius: 6px;
  background: linear-gradient(90deg, #9b37f0, #d9a2ff);
  box-shadow: 0 0 12px rgba(185, 40, 255, 0.7);
  transition: width 0.35s ease;
`;

const SectionLabel = styled.h3`
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: rgba(200, 170, 245, 0.6);
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  align-content: start;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 18px;
  background: linear-gradient(165deg, rgba(76, 30, 150, 0.5), rgba(28, 12, 56, 0.45));
  border: 1.5px solid rgba(180, 120, 255, 0.3);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: rgba(200, 120, 255, 0.6);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.14),
      0 0 26px rgba(185, 40, 255, 0.28);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CardIcon = styled.div`
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.26);
  border: 1.5px solid rgba(180, 120, 255, 0.32);

  img { width: 28px; height: 28px; object-fit: contain; }
`;

const CardEmoji = styled.span`
  font-size: 26px;
  line-height: 1;
`;

const CardTitle = styled.div`
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.4px;
  color: #f3e8ff;
`;

const CardGain = styled.div`
  margin-top: 3px;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.4px;
  color: #b6f5c9;
  text-shadow: 0 1px 6px rgba(40, 200, 110, 0.4);
`;

const CardNote = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: rgba(205, 180, 245, 0.7);
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding-top: 4px;
`;

const Price = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 900;
  color: ${({ $afford }) => ($afford ? "#fff" : "#ff9d9d")};

  img { width: 20px; height: 20px; object-fit: contain; }
`;

const BuyBtn = styled.button`
  margin-left: auto;
  padding: 10px 22px;
  border-radius: 11px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.9px;
  color: #fff;
  background: linear-gradient(180deg, #9b37f0, #6d21c0);
  border: 1.5px solid rgba(220, 170, 255, 0.55);
  box-shadow: 0 6px 18px rgba(120, 40, 220, 0.4);
  transition: all 0.18s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #ad4fff, #7c2ada);
    box-shadow: 0 8px 24px rgba(160, 60, 255, 0.55);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) { transform: translateY(0); }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
    box-shadow: none;
    transform: none;
  }
`;

/* ── Lis packs and membership ── */

/* Nothing here can be bought yet, and a shop that looks live but silently
   fails is worse than one that says so up front. */
const TabNote = styled.p`
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  color: rgba(200, 170, 245, 0.55);
`;

const PackGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 16px;
  align-content: start;
`;

const PackCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 22px 18px 18px;
  border-radius: 18px;
  text-align: center;
  background: linear-gradient(165deg, rgba(76, 30, 150, 0.5), rgba(28, 12, 56, 0.45));
  border: 1.5px solid rgba(180, 120, 255, 0.3);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(200, 120, 255, 0.6);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.14),
      0 0 26px rgba(185, 40, 255, 0.28);
  }
`;

/* The pile of Lis grows with the pack, so the biggest one reads as the biggest
   without needing five separate pieces of art. */
const PackIcon = styled.img`
  width: ${({ $scale }) => 46 + $scale * 26}px;
  height: ${({ $scale }) => 46 + $scale * 26}px;
  object-fit: contain;
  filter: drop-shadow(0 4px 14px rgba(185, 40, 255, 0.5));
`;

const PackAmount = styled.div`
  font-size: 24px;
  font-weight: 900;
  line-height: 1;
  color: #fff;
  text-shadow: 0 2px 12px rgba(185, 40, 255, 0.55);
`;

const PackUnit = styled.div`
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: rgba(210, 175, 255, 0.7);
`;

const PriceBtn = styled.button`
  width: 100%;
  margin-top: auto;
  padding: 11px 10px;
  border-radius: 11px;
  cursor: pointer;
  font-family: inherit;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.5px;
  color: #fff;
  background: linear-gradient(180deg, #9b37f0, #6d21c0);
  border: 1.5px solid rgba(220, 170, 255, 0.55);
  box-shadow: 0 6px 18px rgba(120, 40, 220, 0.4);
  transition: all 0.18s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #ad4fff, #7c2ada);
    box-shadow: 0 8px 24px rgba(160, 60, 255, 0.55);
  }

  &:disabled { cursor: not-allowed; opacity: 0.5; box-shadow: none; }
`;

/* The membership sits alone, so it gets a full-width banner rather than a card
   marooned in a grid. */
const MemberBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 30px;
  border-radius: 22px;
  background:
    radial-gradient(120% 160% at 0% 0%, rgba(255, 205, 60, 0.16), transparent 60%),
    linear-gradient(150deg, rgba(88, 34, 170, 0.62), rgba(28, 12, 56, 0.5));
  border: 1.5px solid rgba(255, 205, 60, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 0 40px rgba(255, 190, 35, 0.14);

  @media (max-width: 900px) {
    flex-direction: column;
    text-align: center;
  }
`;

const MemberCrest = styled.div`
  flex-shrink: 0;
  width: 92px;
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: rgba(0, 0, 0, 0.26);
  border: 1.5px solid rgba(255, 205, 60, 0.4);

  img {
    width: 52px;
    height: 52px;
    object-fit: contain;
    filter: drop-shadow(0 4px 14px rgba(255, 190, 35, 0.55));
  }
`;

const MemberBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const MemberName = styled.div`
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.6px;
  color: #fff;
  text-shadow: 0 2px 12px rgba(255, 190, 35, 0.4);
`;

const MemberBuy = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
`;

const MemberPrice = styled.div`
  font-size: 27px;
  font-weight: 900;
  line-height: 1;
  color: #ffd76b;
  text-shadow: 0 2px 12px rgba(255, 190, 35, 0.45);
`;

const MemberBtn = styled(PriceBtn)`
  min-width: 170px;
  margin-top: 0;
  background: linear-gradient(180deg, #f5bf3c, #c78a10);
  border-color: rgba(255, 225, 150, 0.6);
  box-shadow: 0 6px 18px rgba(200, 140, 20, 0.4);

  &:hover:not(:disabled) {
    background: linear-gradient(180deg, #ffcc4d, #d99a15);
    box-shadow: 0 8px 24px rgba(255, 190, 35, 0.5);
  }
`;

const Message = styled.div`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: ${({ $error }) => ($error ? "#ff9d9d" : "#b6f5c9")};
`;

const Muted = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: rgba(200, 170, 245, 0.55);
`;

function ShopModal({ onClose, gems = 0, onPurchaseComplete, onConsumablesChange }) {
  const [tab, setTab] = useState("account");
  const [slots, setSlots] = useState(null); // { slots, used, available, max, expansion }
  const [loadError, setLoadError] = useState(null);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState(null); // { source, text, error }
  const [catalogue, setCatalogue] = useState(null); // { currency, lisPacks, membership }
  const [consumables, setConsumables] = useState(null); // { catalogue, owned }
  const [buyingId, setBuyingId] = useState(null); // consumable mid-purchase

  useEffect(() => {
    let cancelled = false;
    fetchInventorySlots()
      .then((data) => { if (!cancelled) setSlots(data); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); });
    fetchShopCatalogue()
      .then((data) => { if (!cancelled) setCatalogue(data); })
      .catch(() => { /* the tab renders its own empty state */ });
    fetchConsumables()
      .then((data) => { if (!cancelled) setConsumables(data); })
      .catch(() => { /* ditto */ });
    return () => { cancelled = true; };
  }, []);

  const handleBuySlots = useCallback(async () => {
    setBuying(true);
    setMessage(null);
    try {
      const data = await purchaseInventorySlots();
      setSlots({
        slots: data.slots,
        used: data.used,
        available: data.available,
        max: data.max,
        expansion: data.expansion,
      });
      // App owns the balance the HUD renders, and the slot total it caches.
      onPurchaseComplete?.({ gems: data.gems, inventorySlots: data.slots });
      setMessage({ source: "slots", text: `+${data.expansion.amount} slots added.`, error: false });
    } catch (err) {
      setMessage({ source: "slots", text: err.message, error: true });
    } finally {
      setBuying(false);
    }
  }, [onPurchaseComplete]);

  const handleBuyConsumable = useCallback(async (item) => {
    setBuyingId(item.id);
    setMessage(null);
    try {
      const data = await purchaseConsumable(item.id);
      setConsumables((prev) => (prev ? { ...prev, owned: data.owned } : prev));
      onPurchaseComplete?.({ gems: data.gems });
      // The bag is rendered elsewhere (Collectibles), so it has to be told.
      onConsumablesChange?.(data.owned);
      setMessage({ source: item.id, text: `${item.name} added to your Collectibles.`, error: false });
    } catch (err) {
      setMessage({ source: item.id, text: err.message, error: true });
    } finally {
      setBuyingId(null);
    }
  }, [onPurchaseComplete, onConsumablesChange]);

  const pack = slots?.expansion;
  const atMax = slots ? slots.slots >= slots.max : false;
  const canAfford = pack ? gems >= pack.cost : false;
  const usedPct = slots && slots.slots > 0
    ? Math.min(100, (slots.used / slots.slots) * 100)
    : 0;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose} aria-label="Close shop">&times;</CloseBtn>

        <Rail>
          <RailTitle>SHOP</RailTitle>
          {TABS.map((t) => (
            <TabButton
              key={t.key}
              $active={tab === t.key}
              onClick={() => { setTab(t.key); setMessage(null); }}
            >
              <img src={t.icon} alt="" />
              {t.label}
            </TabButton>
          ))}
          <RailSpacer />
          <Balance>
            <img src="/icons/Lis.png" alt="Lis" />
            <BalanceLabel>LIS</BalanceLabel>
            <span>{gems.toLocaleString()}</span>
          </Balance>
        </Rail>

        <Body>
          {tab === "account" && (
            <>
              <SlotsBanner>
                {loadError ? (
                  <Message $error>{loadError}</Message>
                ) : !slots ? (
                  <Muted>Checking your inventory…</Muted>
                ) : (
                  <>
                    <SlotsHeadline>
                      <SlotsBig>{slots.available.toLocaleString()}</SlotsBig>
                      <SlotsCaption>
                        clothing slots available to your character
                      </SlotsCaption>
                    </SlotsHeadline>
                    <SlotsSub>
                      {slots.used.toLocaleString()} of {slots.slots.toLocaleString()} slots
                      in use · maximum {slots.max.toLocaleString()}
                    </SlotsSub>
                    <Meter>
                      <MeterFill $pct={usedPct} />
                    </Meter>
                  </>
                )}
              </SlotsBanner>

              <SectionLabel>Upgrades</SectionLabel>
              <CardGrid>
                <Card>
                  <CardTop>
                    <CardIcon>
                      <img src="/icons/inventory.png" alt="" />
                    </CardIcon>
                    <div>
                      <CardTitle>Inventory Expansion</CardTitle>
                      <CardGain>+{pack?.amount ?? 100} slots</CardGain>
                    </div>
                  </CardTop>
                  <CardNote>
                    Room for more clothing in your wardrobe. Seeds and crops keep
                    their own bag and never take these slots.
                  </CardNote>
                  <CardFooter>
                    <Price $afford={canAfford || atMax}>
                      <img src="/icons/Lis.png" alt="Lis" />
                      {pack?.cost ?? 50}
                    </Price>
                    <BuyBtn
                      onClick={handleBuySlots}
                      disabled={!slots || buying || atMax || !canAfford}
                      title={
                        atMax
                          ? `Maximum of ${slots?.max} slots reached`
                          : !canAfford
                            ? "Not enough Lis"
                            : "Buy an expansion"
                      }
                    >
                      {atMax ? "MAXED" : buying ? "BUYING…" : "BUY"}
                    </BuyBtn>
                  </CardFooter>
                  {message?.source === "slots" && (
                    <Message $error={message.error}>{message.text}</Message>
                  )}
                </Card>

                {(consumables?.catalogue || []).map((item) => {
                  const owned = consumables.owned?.[item.id] ?? 0;
                  const affordable = gems >= item.cost;
                  return (
                    <Card key={item.id}>
                      <CardTop>
                        <CardIcon>
                          <CardEmoji>{item.icon}</CardEmoji>
                        </CardIcon>
                        <div>
                          <CardTitle>{item.name}</CardTitle>
                          <CardGain>
                            {owned > 0 ? `${owned} in your bag` : "One use"}
                          </CardGain>
                        </div>
                      </CardTop>
                      <CardNote>{item.description}</CardNote>
                      <CardFooter>
                        <Price $afford={affordable}>
                          <img src="/icons/Lis.png" alt="Lis" />
                          {item.cost}
                        </Price>
                        <BuyBtn
                          onClick={() => handleBuyConsumable(item)}
                          disabled={!!buyingId || !affordable}
                          title={affordable ? `Buy a ${item.name}` : "Not enough Lis"}
                        >
                          {buyingId === item.id ? "BUYING…" : "BUY"}
                        </BuyBtn>
                      </CardFooter>
                      {message?.source === item.id && (
                        <Message $error={message.error}>{message.text}</Message>
                      )}
                    </Card>
                  );
                })}
              </CardGrid>
            </>
          )}

          {tab === "lis" && (
            <>
              <SectionLabel>Buy Lis</SectionLabel>
              <TabNote>
                Lis is the currency the shop and the store are priced in.
                Checkout is not connected yet, so nothing here can be bought.
              </TabNote>
              {!catalogue ? (
                <Muted>Loading packs…</Muted>
              ) : (
                <PackGrid>
                  {catalogue.lisPacks.map((p, i) => (
                    <PackCard key={p.id}>
                      <PackIcon
                        src="/icons/Lis.png"
                        alt=""
                        $scale={i / (catalogue.lisPacks.length - 1 || 1)}
                      />
                      <div>
                        <PackAmount>{p.lis.toLocaleString()}</PackAmount>
                        <PackUnit>Lis</PackUnit>
                      </div>
                      <PriceBtn disabled title="Checkout is not connected yet">
                        {formatPrice(p.priceCents, catalogue.currency)}
                      </PriceBtn>
                    </PackCard>
                  ))}
                </PackGrid>
              )}
            </>
          )}

          {tab === "membership" && (
            <>
              <SectionLabel>Membership</SectionLabel>
              <TabNote>
                Checkout is not connected yet, so this cannot be bought.
              </TabNote>
              {!catalogue ? (
                <Muted>Loading membership…</Muted>
              ) : (
                <MemberBanner>
                  <MemberCrest>
                    <img src="/icons/gem.png" alt="" />
                  </MemberCrest>
                  <MemberBody>
                    <MemberName>{catalogue.membership.name}</MemberName>
                    <CardNote>
                      What membership includes has not been decided yet.
                    </CardNote>
                  </MemberBody>
                  <MemberBuy>
                    <MemberPrice>
                      {formatPrice(catalogue.membership.priceCents, catalogue.currency)}
                    </MemberPrice>
                    <MemberBtn disabled title="Checkout is not connected yet">
                      BUY
                    </MemberBtn>
                  </MemberBuy>
                </MemberBanner>
              )}
            </>
          )}
        </Body>
      </Modal>
    </Overlay>
  );
}

export default ShopModal;
