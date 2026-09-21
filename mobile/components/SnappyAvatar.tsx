import { Image, View } from "react-native";
import { SNAPPY_BACKGROUNDS } from "./SnappyBgs";

const MASCOT_FRAME_W = 496;
const MASCOT_FRAME_H = 498;
const MASCOT_CONTENT_CX = 222;
const MASCOT_CONTENT_CY = 234;
const MASCOT_CONTENT_H = 349;

export function SnappyAvatar({
  bgId,
  size = 120,
  mascotSize,
  tintColor,
}: {
  bgId?: string;
  size?: number;
  mascotSize?: number;
  tintColor?: string;
}) {
  const circleSize = Math.round(size * 1.18);
  const contentH = mascotSize ?? size;
  const scale = contentH / MASCOT_CONTENT_H;
  const imgW = Math.round(MASCOT_FRAME_W * scale);
  const imgH = Math.round(MASCOT_FRAME_H * scale);
  const left = Math.round(circleSize / 2 - MASCOT_CONTENT_CX * scale);
  const top = Math.round(circleSize / 2 - MASCOT_CONTENT_CY * scale);
  const bgDef =
    SNAPPY_BACKGROUNDS.find((b) => b.id === bgId) ?? SNAPPY_BACKGROUNDS[0];
  return (
    <View
      style={{
        width: circleSize,
        height: circleSize,
        borderRadius: circleSize / 2,
        overflow: "hidden",
      }}
    >
      {bgDef.render(circleSize)}
      <Image
        source={require("../assets/mascot.png")}
        style={{
          position: "absolute",
          top,
          left,
          width: imgW,
          height: imgH,
          tintColor,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
