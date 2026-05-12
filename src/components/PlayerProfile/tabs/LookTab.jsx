import { useState } from "react";
import { LOOK_FEATURES } from "../constants";
import {
  HubPanelContainer, LookPanelInner, PanelHeaderRow, PanelTitle,
  LookScrollArea, LookGrid, LookFeatureCard, LookFeatureLabel,
  LookSlotsRow, LookSlotWrap, LookSlot, LookSlotPlus, LookSlotSubLabel,
  LookSliderRow, LookSliderLabel, LookSlider, LookSliderValue,
} from "../styles";

export default function LookTab() {
  const [avatarWidth, setAvatarWidth] = useState(50);
  const [avatarHeight, setAvatarHeight] = useState(50);

  return (
    <HubPanelContainer>
      <LookPanelInner>
        <PanelHeaderRow>
          <PanelTitle>✦ Look</PanelTitle>
        </PanelHeaderRow>

        <LookScrollArea>
          <LookGrid>
            <LookFeatureCard>
              <LookFeatureLabel>Skin Color</LookFeatureLabel>
              <LookSlotsRow>
                <LookSlotWrap>
                  <LookSlot><LookSlotPlus>+</LookSlotPlus></LookSlot>
                  <LookSlotSubLabel>Color</LookSlotSubLabel>
                </LookSlotWrap>
              </LookSlotsRow>
            </LookFeatureCard>

            {LOOK_FEATURES.map(({ key, label }) => (
              <LookFeatureCard key={key}>
                <LookFeatureLabel>{label}</LookFeatureLabel>
                <LookSlotsRow>
                  <LookSlotWrap>
                    <LookSlot><LookSlotPlus>+</LookSlotPlus></LookSlot>
                    <LookSlotSubLabel>Item</LookSlotSubLabel>
                  </LookSlotWrap>
                  <LookSlotWrap>
                    <LookSlot><LookSlotPlus>+</LookSlotPlus></LookSlot>
                    <LookSlotSubLabel>Color</LookSlotSubLabel>
                  </LookSlotWrap>
                </LookSlotsRow>
              </LookFeatureCard>
            ))}
          </LookGrid>

          <LookFeatureCard>
            <LookFeatureLabel>Body Size</LookFeatureLabel>
            <LookSliderRow>
              <LookSliderLabel>Width</LookSliderLabel>
              <LookSlider
                type="range"
                min={0} max={100}
                value={avatarWidth}
                onChange={e => setAvatarWidth(Number(e.target.value))}
              />
              <LookSliderValue>{avatarWidth}</LookSliderValue>
            </LookSliderRow>
            <LookSliderRow>
              <LookSliderLabel>Height</LookSliderLabel>
              <LookSlider
                type="range"
                min={0} max={100}
                value={avatarHeight}
                onChange={e => setAvatarHeight(Number(e.target.value))}
              />
              <LookSliderValue>{avatarHeight}</LookSliderValue>
            </LookSliderRow>
          </LookFeatureCard>
        </LookScrollArea>
      </LookPanelInner>
    </HubPanelContainer>
  );
}
