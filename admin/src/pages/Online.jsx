import { useEffect, useState, useCallback } from "react";
import { getOnline } from "../api/admin";
import styled from "styled-components";

const POLL_MS = 8000;

export default function Online() {
  const [data, setData]       = useState({ players: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getOnline();
      setData(res);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Group players by map
  const byMap = {};
  for (const p of data.players) {
    if (!byMap[p.map]) byMap[p.map] = [];
    byMap[p.map].push(p);
  }

  return (
    <Page>
      <Header>
        <PageTitle>
          Online Now <OnlineCount>{data.total}</OnlineCount>
        </PageTitle>
        <Meta>
          Auto-refreshes every {POLL_MS / 1000}s
          {lastRefresh && ` · Last: ${lastRefresh.toLocaleTimeString()}`}
        </Meta>
        <RefreshBtn onClick={load}>Refresh now</RefreshBtn>
      </Header>

      {error && <ErrMsg>{error}</ErrMsg>}

      {loading && <Msg>Loading…</Msg>}

      {!loading && data.total === 0 && <Msg>No players online right now.</Msg>}

      {Object.entries(byMap).map(([map, players]) => (
        <MapSection key={map}>
          <MapName>{map} <MapCount>({players.length})</MapCount></MapName>
          <PlayerGrid>
            {players.map((p) => (
              <PlayerCard key={p.socketId}>
                <PName>{p.name}</PName>
                <PMeta>
                  {p.userId ? `ID: ${p.userId.slice(-6)}` : "guest"}
                </PMeta>
                <PMeta>x:{p.x} y:{p.y}</PMeta>
              </PlayerCard>
            ))}
          </PlayerGrid>
        </MapSection>
      ))}
    </Page>
  );
}

const Page = styled.div``;
const Header = styled.div`display:flex;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap;`;
const PageTitle = styled.h2`font-size:22px;font-weight:700;color:#fff;margin:0;display:flex;align-items:center;gap:12px;`;
const OnlineCount = styled.span`
  font-size:14px;font-weight:700;padding:4px 12px;border-radius:20px;
  background:rgba(85,204,136,0.15);color:#55cc88;border:1px solid rgba(85,204,136,0.3);
`;
const Meta = styled.span`font-size:12px;color:#555;margin-left:auto;`;
const RefreshBtn = styled.button`
  padding:7px 14px;border-radius:8px;border:1px solid #ffffff18;
  background:transparent;color:#ccc;font-size:13px;cursor:pointer;
  &:hover{background:rgba(255,255,255,0.06);}
`;
const ErrMsg = styled.div`color:#ff7777;margin-bottom:12px;font-size:13px;`;
const Msg = styled.div`color:#555;padding:40px 0;text-align:center;`;
const MapSection = styled.div`margin-bottom:28px;`;
const MapName = styled.h3`
  font-size:13px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.5px;
  margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid #ffffff10;
`;
const MapCount = styled.span`color:#555;font-weight:400;`;
const PlayerGrid = styled.div`
  display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;
`;
const PlayerCard = styled.div`
  background:#1c1c22;border:1px solid #ffffff0e;border-radius:10px;padding:14px;
`;
const PName = styled.div`font-size:14px;font-weight:600;color:#fff;margin-bottom:4px;`;
const PMeta = styled.div`font-size:11px;color:#555;`;
