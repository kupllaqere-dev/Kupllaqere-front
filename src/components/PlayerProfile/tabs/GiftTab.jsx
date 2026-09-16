import { useEffect, useState } from "react";
import { fetchGiftCatalogue, sendGift } from "../../../api/gifts";
import { HubPanelContainer } from "../styles";
import {
  GiftPanelInner, GiftHeaderRow, GiftHeading, GiftBalance,
  GiftGrid, GiftCard, GiftIcon, GiftName, GiftPrice,
  GiftDivider, MembershipRow, MembershipCard, MembershipIcon,
  MembershipInfo, MembershipName, MembershipBlurb, MembershipPrice,
  GiftFooter, GiftStatus, GiftSendBtn,
} from "./GiftTab.styles";

/**
 * Sending someone a gift. Only ever rendered on another player's profile —
 * the tab isn't in the rail on your own.
 *
 * Prices come down from the server (lib/giftCatalogue.js) rather than being
 * listed here, so what the grid shows is always what a send is charged.
 */
export default function GiftTab({ targetUserId, targetName, gems = 0, onSent }) {
  const [catalogue, setCatalogue] = useState({ gifts: [], memberships: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sentLabel, setSentLabel] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchGiftCatalogue()
      .then((data) => {
        if (cancelled) return;
        setCatalogue({ gifts: data.gifts || [], memberships: data.memberships || [] });
      })
      .catch(() => { if (!cancelled) setError("Could not load gifts."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const pick = (product) => {
    if (sending) return;
    setError(null);
    setSentLabel(null);
    setSelected((prev) => (prev?.id === product.id ? null : product));
  };

  // Affordability only ever gates the Send button and the status line — never
  // whether a card can be picked. A balance that failed to reach this tab would
  // otherwise grey the whole catalogue out with no way to tell why, and the
  // server is the real authority on whether a send can be paid for anyway.
  const affordable = (product) => gems >= product.price;

  const handleSend = async () => {
    if (!selected || sending || !targetUserId) return;
    setSending(true);
    setError(null);
    setSentLabel(null);
    try {
      const result = await sendGift(targetUserId, selected.id);
      setSentLabel(`${selected.name} sent to ${targetName || "them"}!`);
      setSelected(null);
      onSent?.(result);
    } catch (err) {
      setError(err.message || "Could not send the gift.");
    } finally {
      setSending(false);
    }
  };

  const shortfall = selected ? Math.max(0, selected.price - gems) : 0;
  const canSend = !!selected && !sending && shortfall === 0;

  return (
    <HubPanelContainer>
      <GiftPanelInner>
        <GiftHeaderRow>
          <GiftHeading>Send a gift to {targetName || "this player"}</GiftHeading>
          <GiftBalance>{gems.toLocaleString()} Lis</GiftBalance>
        </GiftHeaderRow>

        <GiftGrid>
          {loading
            ? Array.from({ length: 10 }, (_, i) => <GiftCard key={i} $dim as="div" />)
            : catalogue.gifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  type="button"
                  title={gift.name}
                  $selected={selected?.id === gift.id}
                  $dim={!affordable(gift)}
                  onClick={() => pick(gift)}
                >
                  <GiftIcon>{gift.icon}</GiftIcon>
                  <GiftName>{gift.name}</GiftName>
                  <GiftPrice>{gift.price} Lis</GiftPrice>
                </GiftCard>
              ))}
        </GiftGrid>

        <GiftDivider />

        <MembershipRow>
          {catalogue.memberships.map((m) => (
            <MembershipCard
              key={m.id}
              type="button"
              title={m.name}
              $selected={selected?.id === m.id}
              $dim={!affordable(m)}
              onClick={() => pick(m)}
            >
              <MembershipIcon>{m.icon}</MembershipIcon>
              <MembershipInfo>
                <MembershipName>{m.name}</MembershipName>
                <MembershipBlurb>{m.blurb}</MembershipBlurb>
                <MembershipPrice>{m.price} Lis</MembershipPrice>
              </MembershipInfo>
            </MembershipCard>
          ))}
        </MembershipRow>

        <GiftFooter>
          <GiftStatus $error={!!error || shortfall > 0}>
            {error
              || sentLabel
              || (shortfall > 0
                ? `${selected.name} costs ${selected.price} Lis — you're ${shortfall.toLocaleString()} short.`
                : selected
                  ? `${selected.name} · ${selected.price} Lis`
                  : "Pick a gift to send.")}
          </GiftStatus>
          <GiftSendBtn onClick={handleSend} disabled={!canSend}>
            {sending ? "Sending…" : "Send"}
          </GiftSendBtn>
        </GiftFooter>
      </GiftPanelInner>
    </HubPanelContainer>
  );
}
