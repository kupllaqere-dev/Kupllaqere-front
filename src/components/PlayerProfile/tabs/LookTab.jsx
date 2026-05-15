import { useState } from "react";
import { LOOK_FEATURES, LOOK_FEATURE_CATEGORY, LOOK_FEATURE_SUBCATEGORY } from "../constants";
import {
  HubPanelContainer, LookPanelInner, PanelHeaderRow, PanelTitle,
  LookScrollArea, LookGrid, LookFeatureCard, LookFeatureLabel,
  LookSlotsRow, LookSlotWrap, LookSlot, LookSlotPlus, LookSlotSubLabel,
  LookSlotImg, LookPickerRow, LookPickerXBtn, LookPickerThumb, LookPickerEmpty,
  LookSliderRow, LookSliderLabel, LookSlider, LookSliderValue,
} from "../styles";

export default function LookTab({ invItems = [], invLoading, lookSelectedEntries = {}, onSelectItem }) {
  const [avatarWidth, setAvatarWidth] = useState(50);
  const [avatarHeight, setAvatarHeight] = useState(50);
  const [openKey, setOpenKey] = useState(null);

  const getItemsForFeature = (featureKey) => {
    const cat = LOOK_FEATURE_CATEGORY[featureKey];
    const sub = LOOK_FEATURE_SUBCATEGORY[featureKey];
    return invItems.filter(item => {
      if (item.category !== cat) return false;
      if (sub && item.subcategory !== sub) return false;
      return true;
    });
  };

  const handleSlotClick = (featureKey) => {
    setOpenKey(prev => (prev === featureKey ? null : featureKey));
  };

  const handleSelectItem = (featureKey, item) => {
    onSelectItem(featureKey, item);
    setOpenKey(null);
  };

  const handleClear = (featureKey) => {
    onSelectItem(featureKey, null);
    setOpenKey(null);
  };

  const getSlotContent = (featureKey) => {
    const entry = lookSelectedEntries[featureKey];
    if (entry) {
      return (
        <LookSlotImg
          src={entry.thumbnailUrl || entry.imageUrl}
          alt={entry.name}
          crossOrigin="anonymous"
        />
      );
    }
    return <LookSlotPlus>+</LookSlotPlus>;
  };

  const isSelected = (featureKey, item) =>
    lookSelectedEntries[featureKey]?._id?.toString() === item._id?.toString();

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

            {LOOK_FEATURES.map(({ key, label }) => {
              const items = getItemsForFeature(key);
              const expanded = openKey === key;
              return (
                <LookFeatureCard key={key}>
                  <LookFeatureLabel>{label}</LookFeatureLabel>
                  <LookSlotsRow>
                    <LookSlotWrap>
                      <LookSlot
                        onClick={() => handleSlotClick(key)}
                        style={expanded ? { borderStyle: "solid", borderColor: "var(--pp-accent)" } : undefined}
                      >
                        {getSlotContent(key)}
                      </LookSlot>
                      <LookSlotSubLabel>Item</LookSlotSubLabel>
                    </LookSlotWrap>
                    <LookSlotWrap>
                      <LookSlot><LookSlotPlus>+</LookSlotPlus></LookSlot>
                      <LookSlotSubLabel>Color</LookSlotSubLabel>
                    </LookSlotWrap>
                  </LookSlotsRow>

                  {expanded && (
                    <LookPickerRow>
                      <LookPickerXBtn onClick={() => handleClear(key)} title="Remove">×</LookPickerXBtn>
                      {invLoading && <LookPickerEmpty>Loading…</LookPickerEmpty>}
                      {!invLoading && items.length === 0 && <LookPickerEmpty>No items owned</LookPickerEmpty>}
                      {items.map(item => (
                        <LookPickerThumb
                          key={item._id}
                          src={item.thumbnailUrl || item.imageUrl}
                          alt={item.name}
                          crossOrigin="anonymous"
                          title={item.name}
                          $selected={isSelected(key, item)}
                          onClick={() => handleSelectItem(key, item)}
                        />
                      ))}
                    </LookPickerRow>
                  )}
                </LookFeatureCard>
              );
            })}
          </LookGrid>

          <LookFeatureCard>
            <LookFeatureLabel>Body Size</LookFeatureLabel>
            <LookSliderRow>
              <LookSliderLabel>Width</LookSliderLabel>
              <LookSlider
                type="range" min={0} max={100}
                value={avatarWidth}
                onChange={e => setAvatarWidth(Number(e.target.value))}
              />
              <LookSliderValue>{avatarWidth}</LookSliderValue>
            </LookSliderRow>
            <LookSliderRow>
              <LookSliderLabel>Height</LookSliderLabel>
              <LookSlider
                type="range" min={0} max={100}
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
