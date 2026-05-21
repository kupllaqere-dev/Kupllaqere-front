function nameToColor(name) {
  if (!name) return "#7c3aed";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#7c3aed","#0ea5e9","#10b981","#f59e0b","#ef4444","#ec4899","#8b5cf6","#06b6d4"];
  return colors[Math.abs(hash) % colors.length];
}

export default function PlayerThumbnail({ playerName, size = 36 }) {
  const initial = playerName ? playerName[0].toUpperCase() : "?";
  const bg = nameToColor(playerName);
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "50%",
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      color: "#fff",
      fontWeight: 700,
      fontSize: Math.round(size * 0.42),
      fontFamily: "inherit",
      userSelect: "none",
    }}>
      {initial}
    </div>
  );
}
