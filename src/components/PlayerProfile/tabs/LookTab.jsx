import { Fragment, useState, useMemo } from "react";
import {
  LOOK_FEATURES, LOOK_FEATURE_CATEGORY, LOOK_FEATURE_SUBCATEGORY,
  LOOK_SKIN_COLORS, LOOK_FEATURE_COLORS,
} from "../constants";
import { HubPanelContainer } from "../styles";
import {
  LookPanelInner, LookSidebar, LookNavItem, LookNavIcon, LookNavDivider, LookContent,
  LookScrollArea, LookGrid, LookItemCard, LookItemThumb, LookItemImg, LookItemName,
  LookColorSection, LookColorGrid, LookColorSwatch, LookEmptyMsg, LookPlaceholderThumb, LookPageNav, LookPageArrow, LookPageLabel,
  LookSliderRow, LookSliderLabel, LookSlider, LookSliderValue,
} from "./LookTab.styles";

const NAV_ITEMS = [
  { key: "skin", label: "Skin" },
  ...LOOK_FEATURES,
  { key: "size", label: "Size" },
];

const ITEM_PAGE_SIZE = 10;
const ITEM_PAGE_COUNT = 2;

export default function LookTab({ invItems = [], invLoading, lookSelectedEntries = {}, onSelectItem }) {
  const [activeKey, setActiveKey] = useState("skin");
  const [itemPage, setItemPage] = useState(0);
  const [avatarWidth, setAvatarWidth] = useState(50);
  const [avatarHeight, setAvatarHeight] = useState(50);
  const [skinColor, setSkinColor] = useState(LOOK_SKIN_COLORS[0]);
  const [featureColors, setFeatureColors] = useState({});

  const handleSelectCategory = (key) => {
    setActiveKey(key);
    setItemPage(0);
  };

  const itemsByFeature = useMemo(() => {
    const map = {};
    for (const { key } of LOOK_FEATURES) {
      const cat = LOOK_FEATURE_CATEGORY[key];
      const sub = LOOK_FEATURE_SUBCATEGORY[key];
      map[key] = invItems.filter(item => {
        if (item.category !== cat) return false;
        if (sub && item.subcategory !== sub) return false;
        return true;
      });
    }
    return map;
  }, [invItems]);

  const isSelected = (featureKey, item) =>
    lookSelectedEntries[featureKey]?._id?.toString() === item._id?.toString();

  const handleSelectItem = (featureKey, item) => {
    onSelectItem(featureKey, isSelected(featureKey, item) ? null : item);
  };

  const handleSelectFeatureColor = (featureKey, color) => {
    setFeatureColors(prev => ({ ...prev, [featureKey]: color }));
  };

  const activeFeature = LOOK_FEATURES.find(f => f.key === activeKey);
  const activeItems = itemsByFeature[activeKey] ?? [];
  const pageStart = itemPage * ITEM_PAGE_SIZE;
  const pageSlots = Array.from({ length: ITEM_PAGE_SIZE }, (_, i) => activeItems[pageStart + i] ?? null);

  return (
    <HubPanelContainer>
      <LookPanelInner>
        <LookSidebar>
          {NAV_ITEMS.map(({ key, label }, i) => (
            <Fragment key={key}>
              {i > 0 && <LookNavDivider />}
              <LookNavItem $active={activeKey === key} onClick={() => handleSelectCategory(key)}>
                <LookNavIcon $src={`/assets/look-icons/${key}.png`} />
                {label}
              </LookNavItem>
            </Fragment>
          ))}
        </LookSidebar>

        <LookContent>
          <LookScrollArea>
            {activeKey === "skin" && (
              <LookColorSection>
                <LookColorGrid>
                  {LOOK_SKIN_COLORS.map(color => (
                    <LookColorSwatch
                      key={color}
                      role="button"
                      tabIndex={0}
                      $color={color}
                      $selected={skinColor === color}
                      onClick={() => setSkinColor(color)}
                      title={color}
                    />
                  ))}
                </LookColorGrid>
              </LookColorSection>
            )}

            {activeKey === "size" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
              </div>
            )}

            {activeFeature && (
              <>
                <div>
                  <LookGrid>
                    {invLoading && <LookEmptyMsg>Loading…</LookEmptyMsg>}
                    {!invLoading && pageSlots.map((item, i) => {
                      if (!item) {
                        return (
                          <LookItemCard key={`placeholder-${i}`}>
                            <LookPlaceholderThumb />
                            <LookItemName>&nbsp;</LookItemName>
                          </LookItemCard>
                        );
                      }
                      const selected = isSelected(activeKey, item);
                      return (
                        <LookItemCard key={item._id} onClick={() => handleSelectItem(activeKey, item)}>
                          <LookItemThumb $selected={selected}>
                            <LookItemImg
                              src={item.thumbnailUrl || item.imageUrl}
                              alt={item.name}
                              crossOrigin="anonymous"
                            />
                          </LookItemThumb>
                          <LookItemName $selected={selected}>{item.name}</LookItemName>
                        </LookItemCard>
                      );
                    })}
                  </LookGrid>
                  <LookPageNav>
                    <LookPageArrow
                      disabled={itemPage === 0}
                      onClick={() => setItemPage(p => Math.max(0, p - 1))}
                    >
                      ‹
                    </LookPageArrow>
                    <LookPageLabel>{itemPage + 1} / {ITEM_PAGE_COUNT}</LookPageLabel>
                    <LookPageArrow
                      disabled={itemPage === ITEM_PAGE_COUNT - 1}
                      onClick={() => setItemPage(p => Math.min(ITEM_PAGE_COUNT - 1, p + 1))}
                    >
                      ›
                    </LookPageArrow>
                  </LookPageNav>
                </div>

                <LookColorSection>
                  <LookColorGrid>
                    {LOOK_FEATURE_COLORS.map(color => (
                      <LookColorSwatch
                        key={color}
                        role="button"
                        tabIndex={0}
                        $color={color}
                        $selected={(featureColors[activeKey] ?? LOOK_FEATURE_COLORS[0]) === color}
                        onClick={() => handleSelectFeatureColor(activeKey, color)}
                        title={color}
                      />
                    ))}
                  </LookColorGrid>
                </LookColorSection>
              </>
            )}
          </LookScrollArea>
        </LookContent>
      </LookPanelInner>
    </HubPanelContainer>
  );
}
