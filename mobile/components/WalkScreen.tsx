import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { LEAFLET_HTML } from "../lib/leaflet-html";
import { colors } from "../lib/theme";

type Pos = { lat: number; lng: number };

function haversineMeters(a: Pos, b: Pos): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function fmtDist(m: number) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(2)}km`;
}

function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export type WalkObj = {
  img: number;
  label: string;
  done: boolean;
};

type Props = {
  visible: boolean;
  objects: [WalkObj, WalkObj];
  onEnd: (path: Pos[], distanceMeters: number, durationSeconds: number) => void;
  onCancel: () => void;
};

export default function WalkScreen({
  visible,
  objects,
  onEnd,
  onCancel,
}: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [myPos, setMyPos] = useState<Pos | null>(null);
  const [ending, setEnding] = useState(false);

  const startMs = useRef(Date.now());
  const pathRef = useRef<Pos[]>([]);
  const distRef = useRef(0);
  const gpsRef = useRef<Location.LocationSubscription | null>(null);
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    startMs.current = Date.now();
    pathRef.current = [];
    distRef.current = 0;
    setElapsed(0);
    setDistance(0);
    setMyPos(null);
    setEnding(false);

    void Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== "granted") return;
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 3 },
        (loc) => {
          const pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setMyPos(pos);
          const prev = pathRef.current[pathRef.current.length - 1];
          if (prev) {
            const d = haversineMeters(prev, pos);
            if (d > 1 && d < 500) {
              distRef.current += d;
              setDistance(Math.round(distRef.current));
            }
          }
          pathRef.current = [...pathRef.current, pos];
          if (readyRef.current) {
            webRef.current?.injectJavaScript(
              `updatePos(${pos.lat},${pos.lng});true;`,
            );
          }
        },
      ).then((sub) => {
        gpsRef.current = sub;
      });
    });

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(timer);
      gpsRef.current?.remove();
      gpsRef.current = null;
      readyRef.current = false;
    };
  }, [visible]);

  function onMapReady() {
    readyRef.current = true;
    if (myPos) {
      setTimeout(() => {
        webRef.current?.injectJavaScript(
          `updatePos(${myPos.lat},${myPos.lng});true;`,
        );
      }, 200);
    }
  }

  async function handleEnd() {
    setEnding(true);
    gpsRef.current?.remove();
    gpsRef.current = null;
    const durationSeconds = Math.floor((Date.now() - startMs.current) / 1000);
    onEnd(pathRef.current, Math.round(distRef.current), durationSeconds);
  }

  // Build a minimal leaflet page that shows user position with a blue dot + path
  const mapHtml = LEAFLET_HTML.replace(
    "</body>",
    `<script>
      function updatePos(lat,lng){
        if(!map) return;
        if(!dot){ dot=L.circleMarker([lat,lng],{radius:10,color:'#5CA3FF',fillColor:'#5CA3FF',fillOpacity:1,weight:2}).addTo(map); }
        dot.setLatLng([lat,lng]);
        if(path){ path.addLatLng([lat,lng]); } else { path=L.polyline([[lat,lng]],{color:'#5CA3FF',weight:4,opacity:0.8}).addTo(map); }
        map.setView([lat,lng],17,{animate:true});
      }
      var dot=null,path=null;
    </script></body>`,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView edges={["top", "bottom"]} style={s.root}>
        {/* Stats bar */}
        <View style={s.statsBar}>
          <View style={s.stat}>
            <Text style={s.statVal}>{fmtTime(elapsed)}</Text>
            <Text style={s.statLbl}>Time</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statVal}>{fmtDist(distance)}</Text>
            <Text style={s.statLbl}>Distance</Text>
          </View>
        </View>

        {/* Live map */}
        <View style={s.mapWrap}>
          <WebView
            ref={webRef}
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
            javaScriptEnabled
            domStorageEnabled
            onLoadEnd={onMapReady}
            style={StyleSheet.absoluteFill}
          />
          {!myPos && (
            <View style={s.locatingOverlay}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={s.locatingText}>Getting location…</Text>
            </View>
          )}
        </View>

        {/* Object cards */}
        <View style={s.objRow}>
          {objects.map((obj, _i) => (
            <View
              key={obj.label}
              style={[s.objCard, obj.done && s.objCardDone]}
            >
              <Image
                source={obj.img}
                style={s.objIconCircle}
                resizeMode="contain"
              />
              <Text style={s.objLabel} numberOfLines={2}>
                {obj.label}
              </Text>
              {obj.done && <Text style={s.objDoneTag}>✓ Found</Text>}
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.endBtn, ending && { opacity: 0.5 }]}
            onPress={() => void handleEnd()}
            disabled={ending}
          >
            {ending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={s.endBtnText}>End Walk</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },
  statVal: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.foreground,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  statLbl: { fontSize: 11, fontWeight: "600", color: colors.mutedForeground },
  mapWrap: { flex: 1, position: "relative" },
  locatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  locatingText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.mutedForeground,
  },
  objRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  objCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  objCardDone: {
    borderColor: "#86efac",
    backgroundColor: "#f0fdf4",
  },
  objIconCircle: {
    width: 64,
    height: 64,
  },
  objLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  objDoneTag: {
    fontSize: 11,
    fontWeight: "800",
    color: "#16a34a",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.muted,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.mutedForeground,
  },
  endBtn: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  endBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});
