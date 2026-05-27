import * as S from "./ChessStyles";

export default function ChessInviteNotification({ invite, declineMsg, onAccept, onDecline, onDismissDecline }) {
  if (!invite && !declineMsg) return null;

  return (
    <S.NotifStack>
      {invite && (
        <S.NotifCard>
          <S.NotifTitle>♟ Chess Invitation</S.NotifTitle>
          <S.NotifBody>
            <strong>{invite.inviter.name}</strong> invited you to a game of chess!
          </S.NotifBody>
          <S.NotifActions>
            <S.AcceptBtn onClick={() => onAccept(invite.inviterSocketId, invite.inviter)}>
              Accept
            </S.AcceptBtn>
            <S.DeclineBtn onClick={() => onDecline(invite.inviterSocketId)}>
              Decline
            </S.DeclineBtn>
          </S.NotifActions>
        </S.NotifCard>
      )}

      {declineMsg && (
        <S.DeclineCard>
          <S.DeclineText>{declineMsg}</S.DeclineText>
          <S.DismissBtn onClick={onDismissDecline}>✕</S.DismissBtn>
        </S.DeclineCard>
      )}
    </S.NotifStack>
  );
}
