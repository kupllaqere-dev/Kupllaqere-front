import { useEffect, useState } from "react";
import { getStats } from "../api/admin";
import styled from "styled-components";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Msg>Loading…</Msg>;
  if (error)   return <Msg $err>{error}</Msg>;

  const cards = [
    { label: "Total Players",  value: stats.totalUsers,  color: "#7b2ff7" },
    { label: "Online Now",     value: stats.onlineUsers, color: "#55cc88" },
    { label: "New Today",      value: stats.newToday,    color: "#ffaa44" },
    { label: "New This Week",  value: stats.newThisWeek, color: "#4db8ff" },
    { label: "Total Items",    value: stats.totalItems,  color: "#c4a1ff" },
    { label: "Total Mail",     value: stats.totalMail,   color: "#ff7eb3" },
  ];

  return (
    <Page>
      <PageTitle>Dashboard</PageTitle>

      <StatGrid>
        {cards.map((c) => (
          <StatCard key={c.label} $color={c.color}>
            <StatValue>{c.value.toLocaleString()}</StatValue>
            <StatLabel>{c.label}</StatLabel>
          </StatCard>
        ))}
      </StatGrid>

      <ChartCard>
        <ChartTitle>Registrations — last 30 days</ChartTitle>
        {stats.registrationsByDay.length === 0 ? (
          <Msg>No data yet.</Msg>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.registrationsByDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7b2ff7" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7b2ff7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#666", fontSize: 11 }}
                tickFormatter={(d) => d.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fill: "#666", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1c1c22", border: "1px solid #ffffff18", borderRadius: 8 }}
                labelStyle={{ color: "#aaa" }}
                itemStyle={{ color: "#c4a1ff" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="New players"
                stroke="#7b2ff7"
                strokeWidth={2}
                fill="url(#grad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </Page>
  );
}

const Page = styled.div``;

const PageTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 24px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 28px;
`;

const StatCard = styled.div`
  background: #1c1c22;
  border: 1px solid #ffffff10;
  border-top: 3px solid ${(p) => p.$color};
  border-radius: 12px;
  padding: 20px 18px;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: #fff;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const ChartCard = styled.div`
  background: #1c1c22;
  border: 1px solid #ffffff10;
  border-radius: 12px;
  padding: 24px;
`;

const ChartTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #aaa;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const Msg = styled.div`
  color: ${(p) => (p.$err ? "#ff7777" : "#666")};
  padding: 40px 0;
  text-align: center;
`;
