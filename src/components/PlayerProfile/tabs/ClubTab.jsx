import { HubPanelContainer } from "../styles";
import {
  ClubPanelInner,
  ClubSection, ClubCard, ClubAvatar, ClubInfo, ClubName, ClubRole, ClubViewBtn,
} from "./ClubTab.styles";

export default function ClubTab() {
  return (
    <HubPanelContainer>
      <ClubPanelInner>
        <ClubSection>
          <ClubCard>
            <ClubAvatar>🏛️</ClubAvatar>
            <ClubInfo>
              <ClubName>Neclis's</ClubName>
              <ClubRole>Member</ClubRole>
            </ClubInfo>
          </ClubCard>
          <ClubViewBtn>View Club</ClubViewBtn>
        </ClubSection>
      </ClubPanelInner>
    </HubPanelContainer>
  );
}
