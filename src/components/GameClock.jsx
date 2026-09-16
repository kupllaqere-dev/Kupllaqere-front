import { useEffect, useState } from "react";
import * as S from "./HUDStyles";

// Central European time. Europe/Paris follows the same rules as CET/CEST, so
// the clock reads CEST through summer and CET through winter automatically.
const TZ = "Europe/Paris";

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
});

// Intl's short zone name renders as "GMT+2" in most locales, so derive the
// CET/CEST label from the actual UTC offset instead.
function zoneLabel(date) {
  const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const local = new Date(date.toLocaleString("en-US", { timeZone: TZ }));
  return Math.round((local - utc) / 3600000) === 2 ? "CEST" : "CET";
}

function GameClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer;
    // Only minutes are shown, so re-arm on each minute boundary — it lands the
    // repaint on the turn of the minute instead of drifting after it.
    const tick = () => {
      timer = setTimeout(() => {
        setNow(new Date());
        tick();
      }, 60000 - (Date.now() % 60000));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  // The zone is no longer shown on the face; it still labels the tooltip.
  return (
    <S.ClockRow title={`${dateFmt.format(now)} — ${timeFmt.format(now)} ${zoneLabel(now)}`}>
      <S.ClockTime>{timeFmt.format(now)}</S.ClockTime>
    </S.ClockRow>
  );
}

export default GameClock;
