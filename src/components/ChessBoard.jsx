import { useState, useEffect, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import * as S from "./ChessStyles";

const SYMBOLS = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

function toSq(row, col) {
  return String.fromCharCode(97 + col) + (8 - row);
}

export default function ChessBoard({ myColor = "w", onMove, opponentMove, externalResult, onGameOver, onTurnChange }) {
  const chessRef = useRef(null);
  if (!chessRef.current) chessRef.current = new Chess();
  const chess = chessRef.current;

  const [board, setBoard] = useState(() => chess.board());
  const [selected, setSelected] = useState(null);
  const [legalTargets, setLegalTargets] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [inCheck, setInCheck] = useState(false);
  const [promotionPending, setPromotionPending] = useState(null);
  const opponentMoveRef = useRef(null);

  const sync = useCallback(() => {
    const b = chess.board();
    setBoard(b);
    setInCheck(chess.isCheck());

    onTurnChange?.(chess.turn());

    if (chess.isCheckmate()) {
      const loser = chess.turn();
      const result = loser !== myColor ? "win" : "lose";
      setGameResult(result);
      onGameOver?.(result);
    } else if (chess.isStalemate() || chess.isDraw()) {
      setGameResult("draw");
      onGameOver?.("draw");
    }
  }, [chess, myColor, onGameOver, onTurnChange]);

  // Apply incoming opponent move
  useEffect(() => {
    if (!opponentMove) return;
    if (opponentMove === opponentMoveRef.current) return;
    opponentMoveRef.current = opponentMove;

    try {
      const moveObj = { from: opponentMove.from, to: opponentMove.to };
      if (opponentMove.promotion) moveObj.promotion = opponentMove.promotion;
      chess.move(moveObj);
      setLastMove({ from: opponentMove.from, to: opponentMove.to });
      setSelected(null);
      setLegalTargets([]);
      sync();
    } catch {
      // ignore bad moves
    }
  }, [opponentMove, chess, sync]);

  const handleSquareClick = useCallback((row, col) => {
    if (gameResult || externalResult) return;
    if (chess.turn() !== myColor) return;

    const sq = toSq(row, col);
    const piece = chess.get(sq);

    if (selected) {
      const fromSq = toSq(selected[0], selected[1]);

      if (legalTargets.includes(sq)) {
        // Check for pawn promotion
        const movingPiece = chess.get(fromSq);
        const isPromo =
          movingPiece?.type === "p" &&
          ((myColor === "w" && row === 0) || (myColor === "b" && row === 7));

        if (isPromo) {
          setPromotionPending({ from: fromSq, to: sq });
          return;
        }

        const result = chess.move({ from: fromSq, to: sq });
        if (result) {
          setLastMove({ from: fromSq, to: sq });
          setSelected(null);
          setLegalTargets([]);
          sync();
          onMove?.(fromSq, sq, null);
        }
        return;
      }

      // Click own piece → re-select
      if (piece?.color === myColor) {
        setSelected([row, col]);
        setLegalTargets(chess.moves({ square: sq, verbose: true }).map((m) => m.to));
        return;
      }

      // Deselect
      setSelected(null);
      setLegalTargets([]);
      return;
    }

    if (piece?.color === myColor) {
      setSelected([row, col]);
      setLegalTargets(chess.moves({ square: sq, verbose: true }).map((m) => m.to));
    }
  }, [selected, legalTargets, gameResult, externalResult, myColor, chess, sync, onMove]);

  const confirmPromotion = useCallback((piece) => {
    if (!promotionPending) return;
    const { from, to } = promotionPending;
    const result = chess.move({ from, to, promotion: piece });
    if (result) {
      setLastMove({ from, to });
      setSelected(null);
      setLegalTargets([]);
      sync();
      onMove?.(from, to, piece);
    }
    setPromotionPending(null);
  }, [promotionPending, chess, sync, onMove]);

  // Display board: if I'm black, flip rows and cols
  const flip = myColor === "b";
  const displayRows = flip ? [...board].reverse() : board;

  const resultLabel = () => {
    if (externalResult === "opponent_resigned") return "Opponent resigned — You Win! 🏆";
    if (externalResult === "resigned") return "You resigned";
    if (externalResult === "opponent_disconnected") return "Opponent disconnected — You Win!";
    if (gameResult === "win") return "Checkmate — You Win! 🏆";
    if (gameResult === "lose") return "Checkmate — You Lose";
    if (gameResult === "draw") return "Draw!";
    return null;
  };

  const showOverlay = externalResult || gameResult;

  return (
    <S.BoardWrap>
      <S.BoardGrid>
        {displayRows.map((rowData, dRow) => {
          const actualRow = flip ? 7 - dRow : dRow;
          const displayCols = flip ? [...rowData].reverse() : rowData;
          return displayCols.map((piece, dCol) => {
            const actualCol = flip ? 7 - dCol : dCol;
            const sq = toSq(actualRow, actualCol);
            const light = (actualRow + actualCol) % 2 === 0;
            const isSel = selected?.[0] === actualRow && selected?.[1] === actualCol;
            const isLast = lastMove?.from === sq || lastMove?.to === sq;
            const isLegal = legalTargets.includes(sq);

            return (
              <S.Square
                key={sq}
                $light={light}
                $selected={isSel}
                $lastMove={isLast && !isSel}
                $legalTarget={isLegal}
                onClick={() => handleSquareClick(actualRow, actualCol)}
              >
                {isLegal && <S.LegalDot $capture={!!piece} />}
                {piece && (
                  <S.PieceGlyph $white={piece.color === "w"}>
                    {SYMBOLS[piece.color + piece.type.toUpperCase()]}
                  </S.PieceGlyph>
                )}
                {dCol === 0 && (
                  <S.CoordRank $light={light}>{8 - actualRow}</S.CoordRank>
                )}
                {dRow === 7 && (
                  <S.CoordFile $light={light}>
                    {String.fromCharCode(97 + actualCol)}
                  </S.CoordFile>
                )}
              </S.Square>
            );
          });
        })}
      </S.BoardGrid>

      {promotionPending && !showOverlay && (
        <S.PromotionOverlay>
          <S.OverlaySub>Promote pawn to:</S.OverlaySub>
          <S.PromotionRow>
            {["q", "r", "b", "n"].map((p) => (
              <S.PromotionPiece key={p} onClick={() => confirmPromotion(p)}>
                {SYMBOLS[myColor + p.toUpperCase()]}
              </S.PromotionPiece>
            ))}
          </S.PromotionRow>
        </S.PromotionOverlay>
      )}

      {showOverlay && (
        <S.BoardOverlay>
          <S.OverlayTitle>{resultLabel()}</S.OverlayTitle>
        </S.BoardOverlay>
      )}
    </S.BoardWrap>
  );
}
