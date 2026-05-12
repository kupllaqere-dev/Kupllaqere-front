import { useState } from "react";
import { BIO_MAX } from "./constants";
import {
  BBToolbar, BBToolGroup, BBToolBtn, BBToolSep,
  BBColorPanel, BBColorSwatch, BBSizePanel, BBSizeOption, BBTextarea,
} from "./styles";

const COLORS = [
  { label: 'Red',       value: '#e53e3e' },
  { label: 'Orange',    value: '#dd6b20' },
  { label: 'Yellow',    value: '#ecc94b' },
  { label: 'Green',     value: '#38a169' },
  { label: 'Teal',      value: '#319795' },
  { label: 'Blue',      value: '#3182ce' },
  { label: 'Indigo',    value: '#667eea' },
  { label: 'Purple',    value: '#7c3aed' },
  { label: 'Pink',      value: '#d53f8c' },
  { label: 'Hot Pink',  value: '#f687b3' },
  { label: 'White',     value: '#ffffff' },
  { label: 'Light Gray',value: '#a0aec0' },
  { label: 'Gray',      value: '#718096' },
  { label: 'Dark',      value: '#4a5568' },
  { label: 'Black',     value: '#1a202c' },
];

const SIZES = [
  { label: 'Tiny',   value: 9  },
  { label: 'Small',  value: 11 },
  { label: 'Normal', value: 14 },
  { label: 'Large',  value: 18 },
  { label: 'Huge',   value: 24 },
  { label: 'Giant',  value: 32 },
];

function wrap(taEl, open, close, onChangeFn) {
  if (!taEl) return;
  const { selectionStart: ss, selectionEnd: se, value } = taEl;
  const selected = value.substring(ss, se);
  const next = value.substring(0, ss) + open + selected + close + value.substring(se);
  onChangeFn(next);
  setTimeout(() => {
    taEl.focus();
    const cur = ss === se ? ss + open.length : se + open.length;
    taEl.setSelectionRange(ss === se ? cur : ss + open.length, cur);
  }, 0);
}

function wrapUrl(taEl, onChangeFn) {
  if (!taEl) return;
  const { selectionStart: ss, selectionEnd: se, value } = taEl;
  const display = value.substring(ss, se) || 'link text';
  const open = '[url=]';
  const next = value.substring(0, ss) + open + display + '[/url]' + value.substring(se);
  onChangeFn(next);
  // position cursor right before ] so user can type the URL
  const urlCursor = ss + open.length - 1;
  setTimeout(() => { taEl.focus(); taEl.setSelectionRange(urlCursor, urlCursor); }, 0);
}

export default function BBCodeEditor({ value, onChange, textareaRef, disabled }) {
  const [colorOpen, setColorOpen] = useState(false);
  const [sizeOpen,  setSizeOpen]  = useState(false);

  const ta = () => textareaRef?.current;
  const w  = (open, close) => wrap(ta(), open, close, onChange);
  const md = (fn) => (e) => { e.preventDefault(); fn(); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <BBToolbar>

        {/* Formatting */}
        <BBToolGroup>
          <BBToolBtn title="Bold"          onMouseDown={md(() => w('[b]',  '[/b]'))}><b>B</b></BBToolBtn>
          <BBToolBtn title="Italic"        onMouseDown={md(() => w('[i]',  '[/i]'))}><i>I</i></BBToolBtn>
          <BBToolBtn title="Underline"     onMouseDown={md(() => w('[u]',  '[/u]'))}><u>U</u></BBToolBtn>
          <BBToolBtn title="Strikethrough" onMouseDown={md(() => w('[s]',  '[/s]'))}><s>S</s></BBToolBtn>
        </BBToolGroup>

        <BBToolSep />

        {/* Color */}
        <BBToolGroup style={{ position: 'relative' }}>
          <BBToolBtn
            title="Color"
            $active={colorOpen}
            onMouseDown={md(() => { setColorOpen(v => !v); setSizeOpen(false); })}
          >
            🎨
          </BBToolBtn>
          {colorOpen && (
            <BBColorPanel onMouseDown={(e) => e.preventDefault()}>
              {COLORS.map(c => (
                <BBColorSwatch
                  key={c.value}
                  style={{ background: c.value }}
                  title={c.label}
                  onClick={() => { w(`[color=${c.value}]`, '[/color]'); setColorOpen(false); }}
                />
              ))}
            </BBColorPanel>
          )}
        </BBToolGroup>

        {/* Size */}
        <BBToolGroup style={{ position: 'relative' }}>
          <BBToolBtn
            title="Text size"
            $active={sizeOpen}
            onMouseDown={md(() => { setSizeOpen(v => !v); setColorOpen(false); })}
          >
            Aa
          </BBToolBtn>
          {sizeOpen && (
            <BBSizePanel onMouseDown={(e) => e.preventDefault()}>
              {SIZES.map(s => (
                <BBSizeOption
                  key={s.value}
                  style={{ fontSize: Math.min(s.value, 18) }}
                  onClick={() => { w(`[size=${s.value}]`, '[/size]'); setSizeOpen(false); }}
                >
                  {s.label}
                </BBSizeOption>
              ))}
            </BBSizePanel>
          )}
        </BBToolGroup>

        <BBToolSep />

        {/* Alignment */}
        <BBToolGroup>
          <BBToolBtn title="Align left"   onMouseDown={md(() => w('[left]',   '[/left]'))}>⇤</BBToolBtn>
          <BBToolBtn title="Center"       onMouseDown={md(() => w('[center]', '[/center]'))}>⇔</BBToolBtn>
          <BBToolBtn title="Align right"  onMouseDown={md(() => w('[right]',  '[/right]'))}>⇥</BBToolBtn>
        </BBToolGroup>

        <BBToolSep />

        {/* Insert blocks */}
        <BBToolGroup>
          <BBToolBtn title="Image (paste URL between tags)"  onMouseDown={md(() => w('[img]', '[/img]'))}>IMG</BBToolBtn>
          <BBToolBtn title="Link"                            onMouseDown={md(() => wrapUrl(ta(), onChange))}>URL</BBToolBtn>
          <BBToolBtn title="Spoiler"                         onMouseDown={md(() => w('[spoiler]', '[/spoiler]'))}>SPL</BBToolBtn>
          <BBToolBtn title="Quote"                           onMouseDown={md(() => w('[quote]', '[/quote]'))}>❝</BBToolBtn>
          <BBToolBtn title="Code"                            onMouseDown={md(() => w('[code]', '[/code]'))}>{'</>'}</BBToolBtn>
        </BBToolGroup>

      </BBToolbar>

      <BBTextarea
        ref={textareaRef}
        value={value}
        maxLength={BIO_MAX}
        onChange={(e) => onChange(e.target.value)}
        placeholder={[
          'Write your about section using BBCode…',
          '[b]bold[/b]  [i]italic[/i]  [color=#7c3aed]purple[/color]',
          '[img]https://…[/img]  [spoiler]hidden text[/spoiler]',
        ].join('\n')}
        disabled={disabled}
      />
    </div>
  );
}
