import { PALETTES } from "../themes";
import {
  HubPanelContainer, ThemePanelInner,
  ThemeGrid, ThemeSwatch, ThemeSwatchTop, ThemeSwatchDot,
  ThemeSwatchBottom, ThemeSwatchName, ThemeSwatchBar,
} from "../styles";

export default function ThemesTab({ themeIdx, setThemeIdx }) {
  return (
    <HubPanelContainer>
      <ThemePanelInner>
        <ThemeGrid>
          {PALETTES.map((palette, i) => (
            <ThemeSwatch
              key={palette.name}
              $active={themeIdx === i}
              $bg={palette.bg}
              $accent={palette.accent}
              onClick={() => setThemeIdx(i)}
              title={palette.name}
            >
              <ThemeSwatchTop $card={palette.card}>
                <ThemeSwatchDot $color={palette.accent} />
                <ThemeSwatchDot $color={palette.accentLt} />
                <ThemeSwatchDot $color={palette.txt3} />
              </ThemeSwatchTop>
              <ThemeSwatchBottom $bg={palette.bg}>
                <ThemeSwatchName $txt={palette.txt}>{palette.name}</ThemeSwatchName>
                <ThemeSwatchBar $accent={palette.accent} $w="70%" />
                <ThemeSwatchBar $accent={palette.txt3} $w="45%" />
              </ThemeSwatchBottom>
            </ThemeSwatch>
          ))}
        </ThemeGrid>
      </ThemePanelInner>
    </HubPanelContainer>
  );
}
