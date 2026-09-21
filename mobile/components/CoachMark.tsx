import { type RefObject, useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../lib/theme";

const { width: SW, height: SH } = Dimensions.get("window");
const PAD = 12;

export type CoachStep = {
  ref: RefObject<View | null>;
  title: string;
  body: string;
};

type Layout = { x: number; y: number; w: number; h: number };

function measureRef(ref: RefObject<View | null>, cb: (l: Layout) => void) {
  setTimeout(() => {
    // biome-ignore lint/suspicious/noExplicitAny: RN measureInWindow not typed on View
    (ref.current as any)?.measureInWindow(
      (x: number, y: number, w: number, h: number) => {
        cb({ x: x - PAD, y: y - PAD, w: w + PAD * 2, h: h + PAD * 2 });
      },
    );
  }, 250);
}

export function CoachMark({
  steps,
  onDone,
}: {
  steps: CoachStep[];
  onDone: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [layout, setLayout] = useState<Layout | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only measures on mount
  useEffect(() => {
    measureRef(steps[0].ref, setLayout);
  }, []);

  function advance() {
    const next = idx + 1;
    if (next < steps.length) {
      setIdx(next);
      measureRef(steps[next].ref, setLayout);
    } else {
      onDone();
    }
  }

  if (!layout) return null;

  const sx = Math.max(0, layout.x);
  const sy = Math.max(0, layout.y);
  const sw = Math.min(layout.w, SW - sx);
  const sh = Math.min(layout.h, SH - sy);
  const showAbove = sy + sh > SH * 0.55;
  const ttLeft = Math.max(16, Math.min(sx, SW - 268));
  const step = steps[idx];

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      {/* Dark overlay — 4 pieces surrounding the spotlight */}
      <View style={[s.dark, { top: 0, left: 0, right: 0, height: sy }]} />
      <View style={[s.dark, { top: sy, left: 0, width: sx, height: sh }]} />
      <View
        style={[s.dark, { top: sy, left: sx + sw, right: 0, height: sh }]}
      />
      <View style={[s.dark, { top: sy + sh, left: 0, right: 0, bottom: 0 }]} />

      {/* Spotlight ring */}
      <View
        pointerEvents="none"
        style={[s.spotlight, { top: sy, left: sx, width: sw, height: sh }]}
      />

      {/* Tapping the spotlight also advances */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: sy,
          left: sx,
          width: sw,
          height: sh,
        }}
        onPress={advance}
        activeOpacity={1}
      />

      {/* Tooltip card */}
      <View
        style={[
          s.tooltip,
          showAbove ? { bottom: SH - sy + 14 } : { top: sy + sh + 14 },
          { left: ttLeft },
        ]}
      >
        <Text style={s.ttTitle}>{step.title}</Text>
        <Text style={s.ttBody}>{step.body}</Text>
        <View style={s.ttRow}>
          <Text style={s.ttCount}>
            {idx + 1} / {steps.length}
          </Text>
          <TouchableOpacity
            style={s.nextBtn}
            onPress={advance}
            activeOpacity={0.85}
          >
            <Text style={s.nextText}>
              {idx < steps.length - 1 ? "Next →" : "Got it!"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  dark: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  spotlight: {
    position: "absolute",
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  tooltip: {
    position: "absolute",
    width: 252,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ttTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  ttBody: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 19,
    marginBottom: 12,
  },
  ttRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ttCount: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  nextText: { fontSize: 13, fontWeight: "700", color: "#fff" },
});
