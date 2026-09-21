import { useRef, useState } from "react";
import {
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

// ── Color math ───────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rn) h = 60 * (((gn - bn) / d + 6) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  return [h, max === 0 ? 0 : d / max, max];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function pureHueHex(h: number) {
  const [r, g, b] = hsvToRgb(h, 1, 1);
  return rgbToHex(r, g, b);
}

// ── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");
const MODAL_PAD = 20;
const PREVIEW_W = 48;
const GAP = 12;
const CANVAS = Math.floor(SCREEN_W - MODAL_PAD * 2 - GAP - PREVIEW_W);
const THUMB_R = 10;
const SLIDER_H = 18;

// ── Component ────────────────────────────────────────────────────────────────

type Props = { value: string; onChange: (hex: string) => void };

export function ColorPicker({ value, onChange }: Props) {
  const init = (() => {
    const rgb = hexToRgb(value);
    if (!rgb) return { h: 200, s: 0.6, v: 1 };
    const [h, s, v] = rgbToHsv(...rgb);
    return { h, s, v };
  })();

  const [h, setH] = useState(init.h);
  const [s, setS] = useState(init.s);
  const [v, setV] = useState(init.v);

  const [sliderW, setSliderW] = useState(CANVAS + GAP + PREVIEW_W);

  const [cr, cg, cb] = hsvToRgb(h, s, v);
  const currentHex = rgbToHex(cr, cg, cb);

  const [hexText, setHexText] = useState(currentHex.slice(1));
  const [rText, setRText] = useState(String(cr));
  const [gText, setGText] = useState(String(cg));
  const [bText, setBText] = useState(String(cb));

  // Refs so PanResponder closures stay fresh
  const hRef = useRef(h);
  hRef.current = h;
  const sRef = useRef(s);
  sRef.current = s;
  const vRef = useRef(v);
  vRef.current = v;
  const sliderWRef = useRef(sliderW);
  sliderWRef.current = sliderW;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function applyColor(nh: number, ns: number, nv: number) {
    const [nr, ng, nb] = hsvToRgb(nh, ns, nv);
    const hex = rgbToHex(nr, ng, nb);
    setHexText(hex.slice(1));
    setRText(String(nr));
    setGText(String(ng));
    setBText(String(nb));
    onChangeRef.current(hex);
  }

  const canvasPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const ns = clamp(e.nativeEvent.locationX / CANVAS, 0, 1);
        const nv = clamp(1 - e.nativeEvent.locationY / CANVAS, 0, 1);
        setS(ns);
        setV(nv);
        applyColor(hRef.current, ns, nv);
      },
      onPanResponderMove: (e) => {
        const ns = clamp(e.nativeEvent.locationX / CANVAS, 0, 1);
        const nv = clamp(1 - e.nativeEvent.locationY / CANVAS, 0, 1);
        setS(ns);
        setV(nv);
        applyColor(hRef.current, ns, nv);
      },
    }),
  ).current;

  const huePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const nh = clamp(
          (e.nativeEvent.locationX / sliderWRef.current) * 360,
          0,
          359.99,
        );
        setH(nh);
        applyColor(nh, sRef.current, vRef.current);
      },
      onPanResponderMove: (e) => {
        const nh = clamp(
          (e.nativeEvent.locationX / sliderWRef.current) * 360,
          0,
          359.99,
        );
        setH(nh);
        applyColor(nh, sRef.current, vRef.current);
      },
    }),
  ).current;

  // Cursor/thumb positions
  const cursorX = s * CANVAS;
  const cursorY = (1 - v) * CANVAS;
  const hueThumbX = (h / 360) * sliderW;

  // ── Hex input ─────────────────────────────────────────────────────────────
  function onHexChange(t: string) {
    const clean = t.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setHexText(clean.toUpperCase());
    if (clean.length === 6) {
      const rgb = hexToRgb(`#${clean}`);
      if (rgb) {
        const [nh, ns, nv] = rgbToHsv(...rgb);
        setH(nh);
        setS(ns);
        setV(nv);
        const [nr, ng, nb] = rgb;
        setRText(String(nr));
        setGText(String(ng));
        setBText(String(nb));
        onChangeRef.current(`#${clean.toUpperCase()}`);
      }
    }
  }

  // ── RGB inputs ────────────────────────────────────────────────────────────
  function onRgbChange(channel: "r" | "g" | "b", t: string) {
    const clean = t.replace(/[^0-9]/g, "").slice(0, 3);
    if (channel === "r") setRText(clean);
    else if (channel === "g") setGText(clean);
    else setBText(clean);
    const parsed = Number.parseInt(clean, 10);
    if (!Number.isNaN(parsed) && clean.length > 0) {
      const nr2 = channel === "r" ? clamp(parsed, 0, 255) : cr;
      const ng2 = channel === "g" ? clamp(parsed, 0, 255) : cg;
      const nb2 = channel === "b" ? clamp(parsed, 0, 255) : cb;
      const [nh, ns, nv] = rgbToHsv(nr2, ng2, nb2);
      setH(nh);
      setS(ns);
      setV(nv);
      const hex = rgbToHex(nr2, ng2, nb2);
      setHexText(hex.slice(1));
      onChangeRef.current(hex);
    }
  }

  return (
    <View style={styles.root}>
      {/* Canvas + preview strip */}
      <View style={styles.canvasRow}>
        <View style={styles.canvas} {...canvasPan.panHandlers}>
          <Svg
            pointerEvents="none"
            width={CANVAS}
            height={CANVAS}
            style={StyleSheet.absoluteFill}
          >
            <Rect
              x="0"
              y="0"
              width={CANVAS}
              height={CANVAS}
              fill={pureHueHex(h)}
            />
            <Defs>
              <LinearGradient id="cpW" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="white" stopOpacity="1" />
                <Stop offset="1" stopColor="white" stopOpacity="0" />
              </LinearGradient>
              <LinearGradient id="cpB" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="black" stopOpacity="0" />
                <Stop offset="1" stopColor="black" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={CANVAS} height={CANVAS} fill="url(#cpW)" />
            <Rect x="0" y="0" width={CANVAS} height={CANVAS} fill="url(#cpB)" />
          </Svg>
          <View
            pointerEvents="none"
            style={[
              styles.cursor,
              { left: cursorX - THUMB_R, top: cursorY - THUMB_R },
            ]}
          />
        </View>

        {/* Current color preview */}
        <View style={[styles.preview, { backgroundColor: currentHex }]} />
      </View>

      {/* Hue slider */}
      <View
        style={styles.slider}
        onLayout={(e) => {
          sliderWRef.current = e.nativeEvent.layout.width;
          setSliderW(e.nativeEvent.layout.width);
        }}
        {...huePan.panHandlers}
      >
        <Svg
          pointerEvents="none"
          width="100%"
          height={SLIDER_H}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id="cpHue" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#ff0000" />
              <Stop offset="0.17" stopColor="#ffff00" />
              <Stop offset="0.33" stopColor="#00ff00" />
              <Stop offset="0.5" stopColor="#00ffff" />
              <Stop offset="0.67" stopColor="#0000ff" />
              <Stop offset="0.83" stopColor="#ff00ff" />
              <Stop offset="1" stopColor="#ff0000" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height={SLIDER_H} fill="url(#cpHue)" />
        </Svg>
        <View
          pointerEvents="none"
          style={[
            styles.hueThumb,
            {
              left: hueThumbX - SLIDER_H / 2,
              backgroundColor: pureHueHex(h),
            },
          ]}
        />
      </View>

      {/* Color inputs */}
      <View style={styles.inputRow}>
        <View style={styles.modeBox}>
          <Text style={styles.modeText}>RGB</Text>
        </View>
        <View style={styles.hexBox}>
          <Text style={styles.hashText}>#</Text>
          <TextInput
            value={hexText}
            onChangeText={onHexChange}
            style={styles.hexInput}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>
      </View>

      {(
        [
          { label: "Red", ch: "r" as const, text: rText },
          { label: "Green", ch: "g" as const, text: gText },
          { label: "Blue", ch: "b" as const, text: bText },
        ] satisfies { label: string; ch: "r" | "g" | "b"; text: string }[]
      ).map(({ label, ch, text }) => (
        <View key={label} style={styles.rgbRow}>
          <TextInput
            value={text}
            onChangeText={(t) => onRgbChange(ch, t)}
            style={styles.rgbInput}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text style={styles.rgbLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: "100%" },
  canvasRow: { flexDirection: "row", gap: GAP },
  canvas: {
    width: CANVAS,
    height: CANVAS,
    borderRadius: 10,
    overflow: "hidden",
  },
  cursor: {
    position: "absolute",
    width: THUMB_R * 2,
    height: THUMB_R * 2,
    borderRadius: THUMB_R,
    borderWidth: 2.5,
    borderColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  preview: {
    flex: 1,
    borderRadius: 10,
  },
  slider: {
    marginTop: 14,
    height: SLIDER_H,
    borderRadius: SLIDER_H / 2,
    overflow: "hidden",
  },
  hueThumb: {
    position: "absolute",
    top: 0,
    width: SLIDER_H,
    height: SLIDER_H,
    borderRadius: SLIDER_H / 2,
    borderWidth: 2.5,
    borderColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  modeBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  modeText: { fontSize: 14, color: "#374151" },
  hexBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 10,
  },
  hashText: { fontSize: 14, color: "#9ca3af", marginRight: 2 },
  hexInput: { flex: 1, fontSize: 14, paddingVertical: 8, color: "#111827" },
  rgbRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rgbInput: {
    width: 48,
    fontSize: 14,
    color: "#111827",
    textAlign: "right",
  },
  rgbLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#374151",
  },
});
