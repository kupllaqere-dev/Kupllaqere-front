import { useState, useCallback } from "react";
import * as S from "./ChessStyles";
import ChessBoard from "./ChessBoard";
import PlayerThumbnail from "./PlayerThumbnail";

export default function ChessWindow({
  onClose,
  chessState,
  onSendInvite,
  onCancelInvite,
  onChessMove,
  onResign,
  onCloseResult,
  onGameOver,
  onlinePlayers,
  mySocketId,
  playerName,
  gender,
  outfit,
  skinColor = null,
  myRating,
}) {
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [currentTurn, setCurrentTurn] = useState("w");
  const [internalGameOver, setInternalGameOver] = useState(null);

  const handleGameOver = useCallback((result) => {
    setInternalGameOver(result);
    onGameOver?.(result);
  }, [onGameOver]);

  const { phase, myColor, opponent, pendingSentTo, opponentMove, externalResult } = chessState;

  const handleInvitePlayer = useCallback((socketId, name) => {
    onSendInvite(socketId, name);
    setShowPlayerList(false);
  }, [onSendInvite]);

  const invitablePlayers = (onlinePlayers || []).filter((p) => p.id !== mySocketId);
  const opponentColor = myColor === "w" ? "b" : "w";
  const isPlaying = phase === "playing" || phase === "game_over";
  const gameOver = !!(externalResult || internalGameOver);

  const myTurnActive  = isPlaying && !gameOver && currentTurn === myColor;
  const oppTurnActive = isPlaying && !gameOver && currentTurn === opponentColor;

  return (
    <S.ChessOverlay>

      {/* ══ Left side card (square) ══ */}
      <S.SideCard>
        <S.CloseBtn onClick={onClose}>✕</S.CloseBtn>

        {/* Opponent card — only when playing */}
        {isPlaying && (
          opponent ? (
            <S.PlayerCard $active={oppTurnActive}>
              <S.CardAvatar $active={oppTurnActive}>
                <PlayerThumbnail
                  playerName={opponent.name}
                  gender={opponent.gender || "female"}
                  outfit={opponent.outfit || {}}
                  skinColor={opponent.skinColor || null}
                  size={54}
                />
              </S.CardAvatar>
              <S.CardInfo>
                <S.CardName>{opponent.name}</S.CardName>
              </S.CardInfo>
            </S.PlayerCard>
          ) : (
            <S.GhostCard>
              <S.GhostAvatar>♟</S.GhostAvatar>
              <S.GhostLabel>No opponent</S.GhostLabel>
            </S.GhostCard>
          )
        )}

        {isPlaying && (
          <S.VsSep>
            <S.VsLine />
            <S.VsText>vs</S.VsText>
            <S.VsLine />
          </S.VsSep>
        )}

        {/* My card — always shown */}
        <S.PlayerCard $active={myTurnActive}>
          <S.CardAvatar $active={myTurnActive}>
            <PlayerThumbnail
              playerName={playerName}
              gender={gender}
              outfit={outfit}
              skinColor={skinColor}
              size={54}
            />
          </S.CardAvatar>
          <S.CardInfo>
            <S.CardName>{playerName || "You"}</S.CardName>
            {myRating != null && <S.CardRating>{myRating}</S.CardRating>}
          </S.CardInfo>
        </S.PlayerCard>

        {/* VS separator + invite card in idle; action controls when playing */}
        {phase === "idle" && (
          <S.VsSep>
            <S.VsLine />
            <S.VsText>vs</S.VsText>
            <S.VsLine />
          </S.VsSep>
        )}

        <S.ActionArea>
          {phase === "idle" && (
            <S.InviteCard onClick={() => setShowPlayerList(true)}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>♟</span>
              <span>Invite</span>
            </S.InviteCard>
          )}

          {phase === "pending_sent" && (
            <S.CancelBtn onClick={onCancelInvite} style={{ width: "100%" }}>
              Cancel
            </S.CancelBtn>
          )}

          {isPlaying && !gameOver && (
            <S.ResignBtn onClick={onResign}>Resign</S.ResignBtn>
          )}

          {gameOver && (
            <S.InviteBtn onClick={() => { setInternalGameOver(null); onCloseResult(); }}>
              Close
            </S.InviteBtn>
          )}
        </S.ActionArea>
      </S.SideCard>

      {/* ══ Main board panel (square) ══ */}
      <S.BoardPanel>
        {phase === "idle" && (
          <S.IntroWrap>
            <S.ChessEmoji>♟</S.ChessEmoji>
            <div>
              Invite someone from your room<br />to start a game of chess.
            </div>
          </S.IntroWrap>
        )}

        {phase === "pending_sent" && (
          <S.PendingWrap>
            <S.SpinnerRing />
            <S.PendingText>
              Invite sent to{" "}
              <strong style={{ color: "#5B21B6" }}>
                {pendingSentTo?.name}
              </strong>
              .<br />Waiting for response…
            </S.PendingText>
          </S.PendingWrap>
        )}

        {isPlaying && myColor && (
          <ChessBoard
            myColor={myColor}
            onMove={onChessMove}
            opponentMove={opponentMove}
            externalResult={externalResult}
            onGameOver={handleGameOver}
            onTurnChange={setCurrentTurn}
          />
        )}
      </S.BoardPanel>

      {/* ══ Player list modal ══ */}
      {showPlayerList && (
        <S.ListOverlay>
          <S.ListTitle>♟ Invite a Player</S.ListTitle>
          <S.ListScroll>
            {invitablePlayers.length === 0 ? (
              <S.EmptyNote>No other players in the room right now.</S.EmptyNote>
            ) : (
              invitablePlayers.map((p) => (
                <S.PlayerRow key={p.id} onClick={() => handleInvitePlayer(p.id, p.name)}>
                  <S.PlayerDot />
                  {p.name}
                </S.PlayerRow>
              ))
            )}
          </S.ListScroll>
          <S.ListActions>
            <S.CancelBtn onClick={() => setShowPlayerList(false)}>Cancel</S.CancelBtn>
          </S.ListActions>
        </S.ListOverlay>
      )}

    </S.ChessOverlay>
  );
}
