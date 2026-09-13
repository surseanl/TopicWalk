import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  Anchor,
  Armchair,
  Bike,
  Bird,
  Birdhouse,
  BrickWall,
  Bug,
  Building2,
  Camera,
  Castle,
  ChevronLeft,
  Church,
  Cloud,
  CloudFog,
  Clover,
  Dog,
  DoorOpen,
  Droplet,
  Droplets,
  Dumbbell,
  Feather,
  Fish,
  Flower,
  Flower2,
  Footprints,
  Grid3x3,
  Landmark,
  Leaf,
  LeafyGreen,
  Moon,
  Mountain,
  Network,
  Rainbow,
  Route,
  Shell,
  SignpostBig,
  Snail,
  Squirrel,
  Sunrise,
  TreeDeciduous,
  TreePalm,
  TreePine,
  Trophy,
  Turtle,
  WavesArrowDown,
  WavesArrowUp,
  WavesHorizontal,
  Wheat,
} from "lucide-react-native";
import { type ComponentType, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { LEAFLET_HTML } from "../../lib/leaflet-html";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";

// ── Constants ─────────────────────────────────────────────────────────────────

const _CAPTURE_RADIUS = 100;
const TILE_WALK_METERS = 300;
const AUTO_TILE_MS = 5 * 60 * 1000;
const TOTAL_TILES = 9;
const _MIN_TILES_CAPTURE = 3;
const MILES_TO_METERS = 1609.34;
const TILE_SIZE = (Dimensions.get("window").width - 32) / 3;
const MAP_H = 420;
const SLOT_ITEM_H = 88;
const SOLO_DAILY_KEY = "tw_solo_object_v1";

type SoloObj = {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
};

const SOLO_OBJECTS: SoloObj[] = [
  // Animals
  { icon: Bug, label: "Insect" },
  { icon: Snail, label: "Amphibian" },
  { icon: Bird, label: "Bird" },
  { icon: Turtle, label: "Reptile" },
  { icon: Squirrel, label: "Small mammal" },
  { icon: Dog, label: "Large mammal" },
  { icon: Fish, label: "Fish" },
  { icon: Grid3x3, label: "Spider web" },
  { icon: Feather, label: "Feather" },
  { icon: Shell, label: "Shell" },
  { icon: Birdhouse, label: "Water bird" },
  { icon: Footprints, label: "Animal tracks" },
  { icon: Network, label: "Ant colony" },
  // Sky & Weather
  { icon: Cloud, label: "Cloud" },
  { icon: Rainbow, label: "Rainbow" },
  { icon: Moon, label: "Moon" },
  { icon: CloudFog, label: "Fog" },
  { icon: Sunrise, label: "Sunrise or sunset" },
  { icon: Droplets, label: "Rain puddle" },
  // Plants
  { icon: Flower, label: "Flower" },
  { icon: TreePalm, label: "Cactus" },
  { icon: Leaf, label: "Fallen leaves" },
  { icon: Wheat, label: "Tall grass" },
  { icon: TreeDeciduous, label: "Tree" },
  { icon: TreePine, label: "Acorn or pinecone" },
  { icon: LeafyGreen, label: "Vine" },
  { icon: Clover, label: "Moss" },
  { icon: Flower2, label: "Mushroom" },
  // Water
  { icon: WavesHorizontal, label: "Reflection in water" },
  { icon: WavesArrowDown, label: "Waterfall" },
  { icon: Droplet, label: "Rock in water" },
  // Structures
  { icon: WavesArrowUp, label: "Fountain" },
  { icon: Armchair, label: "Bench" },
  { icon: Landmark, label: "Bridge" },
  { icon: Castle, label: "Statue" },
  { icon: Anchor, label: "Boat or anchor" },
  { icon: BrickWall, label: "Stone wall" },
  { icon: DoorOpen, label: "Colorful door" },
  { icon: Building2, label: "Old building" },
  { icon: Church, label: "Stained glass" },
  { icon: Route, label: "Trail or path" },
  { icon: SignpostBig, label: "Street sign" },
  // Sports & Activity
  { icon: Trophy, label: "Sports field or court" },
  { icon: Dumbbell, label: "Gym equipment" },
  { icon: Bike, label: "Bike rack or cyclist" },
  { icon: Mountain, label: "Climbing structure" },
];

const SOLO_DRUM = Array.from({ length: 6 }, () => SOLO_OBJECTS).flat();

// ── Types ─────────────────────────────────────────────────────────────────────

type Pos = { lat: number; lng: number };

type Mascot = {
  id: string;
  hider_user_id: string;
  hider_name: string;
  photo_path: string;
  lat: number;
  lng: number;
  hidden_at: string;
  found_at: string | null;
  finder_user_id: string | null;
  finder_name: string | null;
  radius_miles: number | null;
  center_lat: number | null;
  center_lng: number | null;
};

type TileProgress = {
  revealed: number;
  metersSinceTile: number;
  totalWalked: number;
  lastAutoMs: number;
};

type HuntGroup = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  radius_miles: number | null;
  center_lat: number | null;
  center_lng: number | null;
};

type HuntMember = {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
};

type HuntInvite = {
  id: string;
  group_id: string;
  from_display_name: string;
  group_name: string;
};

// ── Geo helpers ───────────────────────────────────────────────────────────────

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function _bearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function _bearingArrow(deg: number): string {
  const dirs = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  return dirs[Math.round(deg / 45) % 8] ?? "↑";
}

function _formatDist(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

function _elapsed(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

function survivalStr(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

function todaySoloStr(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

function dailySoloObjIndices(): [number, number] {
  const d = new Date();
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  const a = dayOfYear % SOLO_OBJECTS.length;
  const b =
    (dayOfYear + Math.floor(SOLO_OBJECTS.length / 2) + 1) % SOLO_OBJECTS.length;
  return [a, b === a ? (b + 1) % SOLO_OBJECTS.length : b];
}

// ── Tile helpers ──────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

const tileKey = (mascotId: string, uid: string) => `tw_tile_${mascotId}_${uid}`;

async function loadTileProgress(
  mascotId: string,
  uid: string,
): Promise<TileProgress> {
  try {
    const raw = await AsyncStorage.getItem(tileKey(mascotId, uid));
    if (raw) return JSON.parse(raw) as TileProgress;
  } catch {}
  return {
    revealed: 0,
    metersSinceTile: 0,
    totalWalked: 0,
    lastAutoMs: Date.now(),
  };
}

function saveTileProgress(mascotId: string, uid: string, p: TileProgress) {
  AsyncStorage.setItem(tileKey(mascotId, uid), JSON.stringify(p)).catch(
    () => {},
  );
}

// ── Play area map ─────────────────────────────────────────────────────────────

function PlayMap({
  myPos,
  center,
  radiusMiles,
  markersJson = "[]",
}: {
  myPos: Pos | null;
  center: Pos | null;
  radiusMiles: number;
  markersJson?: string;
}) {
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!readyRef.current || !myPos || !center) return;
    webRef.current?.injectJavaScript(
      `updateMap(${myPos.lat},${myPos.lng},${center.lat},${center.lng},${radiusMiles});true;`,
    );
  }, [myPos, center, radiusMiles]);

  useEffect(() => {
    if (!readyRef.current) return;
    webRef.current?.injectJavaScript(`setMarkers(${markersJson});true;`);
  }, [markersJson]);

  function onReady() {
    readyRef.current = true;
    setTimeout(() => {
      if (myPos && center) {
        webRef.current?.injectJavaScript(
          `updateMap(${myPos.lat},${myPos.lng},${center.lat},${center.lng},${radiusMiles});true;`,
        );
      }
      if (markersJson !== "[]") {
        webRef.current?.injectJavaScript(`setMarkers(${markersJson});true;`);
      }
    }, 200);
  }

  return (
    <View style={s.mapBox}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: LEAFLET_HTML }}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={onReady}
        style={{ flex: 1 }}
      />
    </View>
  );
}

// ── Area picker map (pan to position circle, tap chips to resize, lock) ──────

function AreaPickerMap({
  initialPos,
  initialRadiusMiles,
  onConfirm,
  onCancel,
}: {
  initialPos: Pos | null;
  initialRadiusMiles: 2 | 4 | 6 | 8 | 10;
  onConfirm: (center: Pos, radius: 2 | 4 | 6 | 8 | 10) => void;
  onCancel?: () => void;
}) {
  const webRef = useRef<WebView>(null);
  const [radius, setRadius] = useState<2 | 4 | 6 | 8 | 10>(initialRadiusMiles);
  const lat = initialPos?.lat ?? 37;
  const lng = initialPos?.lng ?? -95;

  return (
    <View style={{ gap: 12 }}>
      <View style={s.mapBox}>
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html: LEAFLET_HTML }}
          javaScriptEnabled
          domStorageEnabled
          onLoadEnd={() =>
            setTimeout(
              () =>
                webRef.current?.injectJavaScript(
                  `enterPickMode(${lat},${lng},${radius});true;`,
                ),
              200,
            )
          }
          onMessage={(e) => {
            try {
              const pos = JSON.parse(e.nativeEvent.data) as Pos;
              onConfirm(pos, radius);
            } catch {}
          }}
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Text style={s.crosshairText}>⊕</Text>
        </View>
      </View>

      {/* Radius chips — tap to resize the circle live */}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {([2, 4, 6, 8, 10] as const).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => {
              setRadius(r);
              webRef.current?.injectJavaScript(
                `if(ac)ac.setRadius(${r}*1609.34);true;`,
              );
            }}
            style={[s.radiusChip, radius === r && s.radiusChipActive]}
          >
            <Text
              style={[s.radiusChipText, radius === r && s.radiusChipTextActive]}
            >
              {r} mi
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[s.muted, { textAlign: "center" }]}>
        Pan the map to position the circle, then lock it.
      </Text>
      <TouchableOpacity
        onPress={() => webRef.current?.injectJavaScript("confirmPick();true;")}
        style={s.primaryBtn}
      >
        <Text style={s.primaryBtnText}>Lock Play Area</Text>
      </TouchableOpacity>
      {onCancel && (
        <TouchableOpacity onPress={onCancel} style={s.outlineBtn}>
          <Text style={s.outlineBtnText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Mascot hunt detail ────────────────────────────────────────────────────────

function MascotHuntModal({
  mascot,
  myPos,
  onClose,
  onCapture,
}: {
  mascot: Mascot;
  myPos: Pos | null;
  onClose: () => void;
  onCapture: (id: string) => void;
}) {
  const [tilesRevealed, setTilesRevealed] = useState<Set<number>>(new Set());
  const [lettersRevealed, setLettersRevealed] = useState(0);
  const [address, setAddress] = useState<string | null>(null);
  const SCREEN_W = Dimensions.get("window").width;
  const PHOTO_SIZE = SCREEN_W - 48;
  const TILE_SIZE = PHOTO_SIZE / 3;
  const photoUrl = supabase.storage
    .from("game-photos")
    .getPublicUrl(mascot.photo_path).data.publicUrl;

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per mascot
  useEffect(() => {
    async function init() {
      const key = `tw_hunt_${mascot.id}`;
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        try {
          const p = JSON.parse(saved) as { tiles: number[]; letters: number };
          setTilesRevealed(new Set(p.tiles));
          setLettersRevealed(p.letters);
        } catch {}
      }
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: mascot.lat,
          longitude: mascot.lng,
        });
        const r = results[0];
        if (r) {
          const parts = [r.streetNumber, r.street, r.city].filter(Boolean);
          setAddress(parts.join(" "));
        }
      } catch {}
    }
    void init();
  }, [mascot.id]);

  async function save(tiles: Set<number>, letters: number) {
    await AsyncStorage.setItem(
      `tw_hunt_${mascot.id}`,
      JSON.stringify({ tiles: [...tiles], letters }),
    );
  }

  function flipRandomTile() {
    const remaining = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(
      (i) => !tilesRevealed.has(i),
    );
    if (remaining.length === 0) return;
    const pick = remaining[Math.floor(Math.random() * remaining.length)] ?? 0;
    const next = new Set(tilesRevealed);
    next.add(pick);
    setTilesRevealed(next);
    void save(next, lettersRevealed);
  }

  function revealLetters() {
    const next = lettersRevealed + 2;
    setLettersRevealed(next);
    void save(tilesRevealed, next);
  }

  function maskedAddress(addr: string, revealed: number): string {
    let count = 0;
    return addr
      .split("")
      .map((c) => {
        if (/[a-zA-Z0-9]/.test(c)) {
          count++;
          return count <= revealed ? c : "_";
        }
        return c;
      })
      .join("");
  }

  const CAPTURE_RADIUS_M = 100;
  const allRevealed = tilesRevealed.size === 9;
  const distanceMeters =
    myPos != null
      ? haversineDistance(myPos.lat, myPos.lng, mascot.lat, mascot.lng)
      : null;
  const inRange = distanceMeters != null && distanceMeters <= CAPTURE_RADIUS_M;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        edges={["top", "bottom"]}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View style={ms.header}>
          <TouchableOpacity onPress={onClose} style={ms.backBtn}>
            <ChevronLeft size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={ms.title}>{mascot.hider_name}'s Mascot</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={ms.content}
          showsVerticalScrollIndicator={false}
        >
          {/* 3×3 tiled photo */}
          <View
            style={{
              width: PHOTO_SIZE,
              height: PHOTO_SIZE,
              borderRadius: 18,
              overflow: "hidden",
              alignSelf: "center",
              backgroundColor: colors.muted,
            }}
          >
            <Image
              source={{ uri: photoUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { flexDirection: "row", flexWrap: "wrap" },
              ]}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
                tilesRevealed.has(i) ? (
                  <View
                    key={i}
                    style={{ width: TILE_SIZE, height: TILE_SIZE }}
                  />
                ) : (
                  <View
                    key={i}
                    style={{
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      backgroundColor: colors.card,
                      borderWidth: 2,
                      borderColor: colors.background,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 24,
                        color: colors.mutedForeground,
                      }}
                    >
                      ?
                    </Text>
                  </View>
                ),
              )}
            </View>
          </View>

          {/* Address clue */}
          <View style={ms.addressCard}>
            <Text style={ms.addressLabel}>LOCATION</Text>
            <Text style={ms.addressText} numberOfLines={2}>
              {address === null
                ? "Fetching address…"
                : lettersRevealed === 0
                  ? "_ _ _ _ _ _ _ _ _"
                  : maskedAddress(address, lettersRevealed)}
            </Text>
          </View>

          {/* Clue actions */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={flipRandomTile}
              disabled={allRevealed}
              style={[ms.actionBtn, { opacity: allRevealed ? 0.4 : 1 }]}
            >
              <Text style={ms.actionBtnEmoji}>🎲</Text>
              <Text style={ms.actionBtnLabel}>Flip a Tile</Text>
              <Text style={ms.actionBtnSub}>{9 - tilesRevealed.size} left</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={revealLetters} style={ms.actionBtn}>
              <Text style={ms.actionBtnEmoji}>🔤</Text>
              <Text style={ms.actionBtnLabel}>Show 2 Letters</Text>
              <Text style={ms.actionBtnSub}>of address</Text>
            </TouchableOpacity>
          </View>

          {inRange && (
            <TouchableOpacity
              onPress={() => onCapture(mascot.id)}
              style={ms.captureBtn}
            >
              <Camera color="#fff" size={20} />
              <Text style={ms.captureBtnText}>Found It! Take Photo</Text>
            </TouchableOpacity>
          )}

          <Text style={[ms.hint, { textAlign: "center" }]}>
            Hidden{" "}
            {new Date(mascot.hidden_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {distanceMeters != null
              ? distanceMeters <= CAPTURE_RADIUS_M
                ? " · You're here! Take the photo."
                : ` · ${Math.round(distanceMeters)} m away (need < 100 m)`
              : " · Getting your location…"}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const ms = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 20,
  },
  addressCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.mutedForeground,
    letterSpacing: 1.2,
  },
  addressText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: 2,
    lineHeight: 30,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    gap: 4,
  },
  actionBtnEmoji: { fontSize: 28 },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.foreground,
  },
  actionBtnSub: { fontSize: 11, color: colors.mutedForeground },
  hint: { fontSize: 12, color: colors.mutedForeground },
  captureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    borderRadius: 16,
    paddingVertical: 16,
  },
  captureBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HuntScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [snappyColor, setSnappyColor] = useState("#22c55e");
  const [snappyAccessory, setSnappyAccessory] = useState("");
  const [tab, setTab] = useState<"hunt" | "solo">("solo");
  const [mascots, setMascots] = useState<Mascot[]>([]);
  const [myPos, setMyPos] = useState<Pos | null>(null);
  const [posError, setPosError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [_captureTarget, setCaptureTarget] = useState<string | null>(null);
  const [_progress, setProgress] = useState<Record<string, TileProgress>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [celebrationMascot, setCelebrationMascot] = useState<Mascot | null>(
    null,
  );
  const [pendingHidePhoto, setPendingHidePhoto] = useState<{
    uri: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [huntGroup, setHuntGroup] = useState<HuntGroup | null>(null);
  const [huntMembers, setHuntMembers] = useState<HuntMember[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<"create" | "invite">(
    "create",
  );
  const [groupName, setGroupName] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<HuntInvite[]>([]);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [soloRadius, setSoloRadius] = useState<2 | 4 | 6 | 8 | 10 | null>(null);
  const [soloCenter, setSoloCenter] = useState<Pos | null>(null);
  const [isOutsideGroupArea, setIsOutsideGroupArea] = useState(false);
  const [isOutsideSoloArea, setIsOutsideSoloArea] = useState(false);
  const [newGroupRadius, setNewGroupRadius] = useState<2 | 4 | 6 | 8 | 10>(2);
  const [showMembersSheet, setShowMembersSheet] = useState(false);
  const [showSoloPicker, setShowSoloPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [selectedMascot, setSelectedMascot] = useState<Mascot | null>(null);
  const [soloObjIndices, setSoloObjIndices] = useState<[number, number] | null>(
    null,
  );
  const [soloObjRevealed, setSoloObjRevealed] = useState(false);
  const [soloObjSpinning, setSoloObjSpinning] = useState(false);
  const [soloPhotoDone, setSoloPhotoDone] = useState<[boolean, boolean]>([
    false,
    false,
  ]);
  const [soloFoundLocs, setSoloFoundLocs] = useState<Pos[]>([]);
  const [soloPhotoUploading, setSoloPhotoUploading] = useState<0 | 1 | null>(
    null,
  );
  const [showHideTutorial, setShowHideTutorial] = useState(false);
  const [hideTutorialStep, setHideTutorialStep] = useState(0);

  const soloSlotY0 = useRef(new Animated.Value(0)).current;
  const soloSlotY1 = useRef(new Animated.Value(0)).current;
  const prevPosRef = useRef<Pos | null>(null);
  const mascotsRef = useRef<Mascot[]>([]);
  const userIdRef = useRef<string | null>(null);
  const progressRef = useRef<Record<string, TileProgress>>({});
  const huntGroupRef = useRef<HuntGroup | null>(null);
  const soloCenterRef = useRef<Pos | null>(null);
  const soloRadiusRef = useRef<2 | 4 | 6 | 8 | 10 | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    void loadUser();
    void startGps();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void loadUser();
      else {
        setUserId(null);
        setMascots([]);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Auto-unlock tiles on a 30s interval
  useEffect(() => {
    const interval = setInterval(() => {
      const uid = userIdRef.current;
      if (!uid) return;
      const now = Date.now();
      let changed = false;
      for (const m of mascotsRef.current.filter(
        (m) => !m.found_at && m.hider_user_id !== uid,
      )) {
        const p = progressRef.current[m.id];
        if (!p) continue;
        const auto = Math.floor((now - p.lastAutoMs) / AUTO_TILE_MS);
        if (auto > 0 && p.revealed < TOTAL_TILES) {
          const updated = {
            ...p,
            revealed: Math.min(TOTAL_TILES, p.revealed + auto),
            lastAutoMs: p.lastAutoMs + auto * AUTO_TILE_MS,
          };
          progressRef.current[m.id] = updated;
          saveTileProgress(m.id, uid, updated);
          changed = true;
        }
      }
      if (changed) setProgress({ ...progressRef.current });
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadSoloSettings() {
      const r = await AsyncStorage.getItem("tw_solo_radius");
      const c = await AsyncStorage.getItem("tw_solo_center");
      if (["2", "4", "6", "8", "10"].includes(r ?? "")) {
        const rad = Number(r) as 2 | 4 | 6 | 8 | 10;
        setSoloRadius(rad);
        soloRadiusRef.current = rad;
      }
      if (c) {
        try {
          const pos = JSON.parse(c) as Pos;
          setSoloCenter(pos);
          soloCenterRef.current = pos;
        } catch {}
      }
    }
    async function restoreSoloObject() {
      try {
        const raw = await AsyncStorage.getItem(SOLO_DAILY_KEY);
        if (!raw) return;
        const p = JSON.parse(raw) as {
          date: string;
          indices: [number, number];
          done: [boolean, boolean];
          foundLocs?: Pos[];
        };
        if (p.date !== todaySoloStr()) return;
        setSoloObjIndices(p.indices);
        setSoloObjRevealed(true);
        setSoloPhotoDone(p.done ?? [false, false]);
        if (p.foundLocs) setSoloFoundLocs(p.foundLocs);
        soloSlotY0.setValue(
          -((3 * SOLO_OBJECTS.length + p.indices[0]) * SLOT_ITEM_H),
        );
        soloSlotY1.setValue(
          -((3 * SOLO_OBJECTS.length + p.indices[1]) * SLOT_ITEM_H),
        );
      } catch {}
    }
    void loadSoloSettings();
    void restoreSoloObject();
  }, [soloSlotY0, soloSlotY1]);

  async function startGps() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setPosError("Location permission denied");
      return;
    }
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 2 },
      (loc: Location.LocationObject) => {
        const pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setMyPos(pos);
        onNewPosition(pos);
      },
    );
    return () => sub.remove();
  }

  function onNewPosition(pos: Pos) {
    const prev = prevPosRef.current;
    if (prev) {
      const delta = haversineDistance(prev.lat, prev.lng, pos.lat, pos.lng);
      if (delta > 2 && delta < 500) {
        const uid = userIdRef.current;
        if (uid) {
          let changed = false;
          for (const m of mascotsRef.current.filter(
            (m) => !m.found_at && m.hider_user_id !== uid,
          )) {
            const cur = progressRef.current[m.id] ?? {
              revealed: 0,
              metersSinceTile: 0,
              totalWalked: 0,
              lastAutoMs: Date.now(),
            };
            let { revealed, metersSinceTile, totalWalked } = cur;
            totalWalked += delta;
            metersSinceTile += delta;
            while (
              metersSinceTile >= TILE_WALK_METERS &&
              revealed < TOTAL_TILES
            ) {
              revealed++;
              metersSinceTile -= TILE_WALK_METERS;
            }
            const updated = { ...cur, revealed, metersSinceTile, totalWalked };
            progressRef.current[m.id] = updated;
            saveTileProgress(m.id, uid, updated);
            changed = true;
          }
          if (changed) setProgress({ ...progressRef.current });
        }
      }
    }
    const g = huntGroupRef.current;
    if (g?.center_lat != null && g?.center_lng != null) {
      const dist = haversineDistance(
        pos.lat,
        pos.lng,
        g.center_lat,
        g.center_lng,
      );
      setIsOutsideGroupArea(dist > (g.radius_miles ?? 5) * MILES_TO_METERS);
    }
    const sc = soloCenterRef.current;
    const sr = soloRadiusRef.current;
    if (sc && sr) {
      const dist = haversineDistance(pos.lat, pos.lng, sc.lat, sc.lng);
      setIsOutsideSoloArea(dist > sr * MILES_TO_METERS);
    }

    prevPosRef.current = pos;
  }

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }
    setUserId(session.user.id);
    userIdRef.current = session.user.id;
    const { data } = await supabase
      .from("tw_users")
      .select("username, snappy_color, snappy_accessory")
      .eq("id", session.user.id)
      .maybeSingle();
    setDisplayName(data?.username ?? "");
    setSnappyColor(data?.snappy_color ?? "#22c55e");
    setSnappyAccessory(data?.snappy_accessory ?? "");
    void loadInvites(session.user.id);
    const group = await loadHuntGroup(session.user.id);
    await fetchMascots(session.user.id, group);
  }

  async function loadHuntGroup(uid: string): Promise<HuntGroup | null> {
    const { data: member } = await supabase
      .from("tw_hunt_members")
      .select("group_id")
      .eq("user_id", uid)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!member) return null;
    const { data: group } = await supabase
      .from("tw_hunt_groups")
      .select("*")
      .eq("id", member.group_id)
      .maybeSingle();
    if (group) {
      const g = group as HuntGroup;
      setHuntGroup(g);
      huntGroupRef.current = g;
      void loadMembers(member.group_id);
      return g;
    }
    return null;
  }

  async function loadMembers(groupId: string) {
    const { data } = await supabase
      .from("tw_hunt_members")
      .select("*")
      .eq("group_id", groupId)
      .order("joined_at");
    if (data) setHuntMembers(data as HuntMember[]);
  }

  async function createGroup() {
    if (!userId || !groupName.trim()) return;
    setGroupLoading(true);
    const invite_code = generateInviteCode();
    const { data: group, error: ge } = await supabase
      .from("tw_hunt_groups")
      .insert({
        name: groupName.trim(),
        invite_code,
        created_by: userId,
        radius_miles: newGroupRadius,
        center_lat: null,
        center_lng: null,
      })
      .select()
      .single();
    if (ge || !group) {
      Alert.alert("Error", ge?.message ?? "Failed to create group.");
      setGroupLoading(false);
      return;
    }
    const { error: me } = await supabase.from("tw_hunt_members").insert({
      group_id: group.id,
      user_id: userId,
      display_name: displayName,
    });
    if (me) {
      Alert.alert("Error", me.message);
      setGroupLoading(false);
      return;
    }
    const g = group as HuntGroup;
    setHuntGroup(g);
    huntGroupRef.current = g;
    setHuntMembers([
      {
        id: "",
        group_id: group.id,
        user_id: userId,
        display_name: displayName,
        joined_at: new Date().toISOString(),
      },
    ]);
    setGroupName("");
    setShowGroupModal(false);
    setGroupLoading(false);
    setShowGroupPicker(true);
    await fetchMascots(userId, g);
  }

  function leaveGroup() {
    if (!huntGroup || !userId) return;
    Alert.alert(
      "Leave group?",
      `You'll leave "${huntGroup.name}". You can rejoin with the invite code.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("tw_hunt_members")
              .delete()
              .eq("group_id", huntGroup.id)
              .eq("user_id", userId);
            setHuntGroup(null);
            huntGroupRef.current = null;
            setHuntMembers([]);
            setMascots([]);
          },
        },
      ],
    );
  }

  async function loadInvites(uid: string) {
    const { data } = await supabase
      .from("tw_invites")
      .select("id, group_id, from_display_name, group_name")
      .eq("to_user_id", uid);
    if (data) setPendingInvites(data as HuntInvite[]);
  }

  async function acceptInvite(invite: HuntInvite) {
    if (!userId) return;
    if (huntGroupRef.current) {
      await supabase
        .from("tw_hunt_members")
        .delete()
        .eq("group_id", huntGroupRef.current.id)
        .eq("user_id", userId);
      setHuntGroup(null);
      huntGroupRef.current = null;
      setHuntMembers([]);
      setMascots([]);
    }
    const { error } = await supabase.from("tw_hunt_members").upsert(
      {
        group_id: invite.group_id,
        user_id: userId,
        display_name: displayName,
      },
      { onConflict: "group_id,user_id" },
    );
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    await supabase.from("tw_invites").delete().eq("id", invite.id);
    setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
    const group = await loadHuntGroup(userId);
    await fetchMascots(userId, group);
  }

  async function declineInvite(inviteId: string) {
    await supabase.from("tw_invites").delete().eq("id", inviteId);
    setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
  }

  async function sendInvite() {
    if (!huntGroup || !userId || !inviteUsername.trim()) return;
    setInviteLoading(true);
    const username = inviteUsername.trim().toLowerCase();
    if (username === displayName.toLowerCase()) {
      Alert.alert("That's you!", "You can't invite yourself.");
      setInviteLoading(false);
      return;
    }
    const { data: target } = await supabase
      .from("tw_users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!target) {
      Alert.alert("Not found", `No account with username "${username}".`);
      setInviteLoading(false);
      return;
    }
    const alreadyMember = huntMembers.some((m) => m.user_id === target.id);
    if (alreadyMember) {
      Alert.alert("Already in group", "That person is already in your group.");
      setInviteLoading(false);
      return;
    }
    const { error } = await supabase.from("tw_invites").upsert(
      {
        group_id: huntGroup.id,
        from_user_id: userId,
        from_display_name: displayName,
        group_name: huntGroup.name,
        to_user_id: target.id,
      },
      { onConflict: "group_id,to_user_id" },
    );
    if (error) {
      Alert.alert("Error", error.message);
      setInviteLoading(false);
      return;
    }
    setInviteUsername("");
    setShowGroupModal(false);
    Alert.alert(
      "Invite sent!",
      `${inviteUsername} will see it in their Hunt tab.`,
    );
    setInviteLoading(false);
  }

  function spinSoloObject() {
    if (soloObjSpinning || soloObjRevealed) return;
    const indices = dailySoloObjIndices();
    setSoloObjSpinning(true);
    soloSlotY0.setValue(0);
    soloSlotY1.setValue(0);
    Animated.parallel([
      Animated.timing(soloSlotY0, {
        toValue: -((3 * SOLO_OBJECTS.length + indices[0]) * SLOT_ITEM_H),
        duration: 3400,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(soloSlotY1, {
        toValue: -((3 * SOLO_OBJECTS.length + indices[1]) * SLOT_ITEM_H),
        duration: 3900,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSoloObjSpinning(false);
      setSoloObjIndices(indices);
      setSoloObjRevealed(true);
      void AsyncStorage.setItem(
        SOLO_DAILY_KEY,
        JSON.stringify({
          date: todaySoloStr(),
          indices,
          done: [false, false],
        }),
      );
    });
  }

  async function takeSoloPhoto(which: 0 | 1) {
    if (!userId || !soloObjIndices) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    setSoloPhotoUploading(which);
    try {
      const ext = asset.mimeType?.split("/")[1] ?? "jpg";
      const path = `${userId}/solo-${Date.now()}.${ext}`;
      const bin = atob(asset.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const { error } = await supabase.storage
        .from("game-photos")
        .upload(path, bytes, { contentType: asset.mimeType ?? "image/jpeg" });
      if (error) {
        Alert.alert("Upload failed", error.message);
        return;
      }
      const next: [boolean, boolean] = [soloPhotoDone[0], soloPhotoDone[1]];
      next[which] = true;
      setSoloPhotoDone(next);
      const nextLocs = myPos ? [...soloFoundLocs, myPos] : soloFoundLocs;
      setSoloFoundLocs(nextLocs);
      await AsyncStorage.setItem(
        SOLO_DAILY_KEY,
        JSON.stringify({
          date: todaySoloStr(),
          indices: soloObjIndices,
          done: next,
          foundLocs: nextLocs,
        }),
      );
      showAlert(
        next[0] && next[1]
          ? "Both objects found! Great hunt!"
          : "Nice find! One more to go.",
      );
    } finally {
      setSoloPhotoUploading(null);
    }
  }

  async function fetchMascots(uid: string, group: HuntGroup | null) {
    if (!group) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("tw_mascots")
      .select("*")
      .eq("hunt_group_id", group.id)
      .order("hidden_at", { ascending: false });
    if (data) {
      const rows = data as Mascot[];
      mascotsRef.current = rows;
      setMascots(rows);
      const now = Date.now();
      const pMap: Record<string, TileProgress> = {};
      for (const m of rows.filter((r) => !r.found_at)) {
        const saved = await loadTileProgress(m.id, uid);
        const auto = Math.floor((now - saved.lastAutoMs) / AUTO_TILE_MS);
        if (auto > 0 && saved.revealed < TOTAL_TILES) {
          saved.revealed = Math.min(TOTAL_TILES, saved.revealed + auto);
          saved.lastAutoMs += auto * AUTO_TILE_MS;
          saveTileProgress(m.id, uid, saved);
        }
        pMap[m.id] = saved;
      }
      progressRef.current = pMap;
      setProgress(pMap);
    }
    setLoading(false);
  }

  function showAlert(msg: string) {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 4000);
  }

  async function setSoloPlayArea(radius: 2 | 4 | 6 | 8 | 10, center: Pos) {
    setSoloRadius(radius);
    setSoloCenter(center);
    soloRadiusRef.current = radius;
    soloCenterRef.current = center;
    setIsOutsideSoloArea(false);
    await AsyncStorage.setItem("tw_solo_radius", String(radius));
    await AsyncStorage.setItem("tw_solo_center", JSON.stringify(center));
  }

  async function updateGroupPlayArea(radius: 2 | 4 | 6 | 8 | 10, center: Pos) {
    if (!huntGroup || !userId || huntGroup.created_by !== userId) return;
    const { error } = await supabase
      .from("tw_hunt_groups")
      .update({
        radius_miles: radius,
        center_lat: center.lat,
        center_lng: center.lng,
      })
      .eq("id", huntGroup.id);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    const updated = {
      ...huntGroup,
      radius_miles: radius,
      center_lat: center.lat,
      center_lng: center.lng,
    };
    setHuntGroup(updated);
    huntGroupRef.current = updated;
    setIsOutsideGroupArea(false);
    setShowGroupPicker(false);
  }

  function startHideMascot() {
    if (!myPos || !userId || !huntGroupRef.current) return;
    setHideTutorialStep(0);
    setShowHideTutorial(true);
  }

  async function launchHideMascotCamera() {
    setShowHideTutorial(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    setPendingHidePhoto({
      uri: asset.uri,
      base64: asset.base64,
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  }

  async function confirmHideMascot() {
    if (!pendingHidePhoto || !myPos || !userId || !huntGroupRef.current) return;
    const radius = huntGroupRef.current.radius_miles ?? 5;
    setUploading(true);
    setPendingHidePhoto(null);
    try {
      const ext = pendingHidePhoto.mimeType.split("/")[1] ?? "jpg";
      const path = `${userId}/mascot-${Date.now()}.${ext}`;
      const binaryString = atob(pendingHidePhoto.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const { error } = await supabase.storage
        .from("game-photos")
        .upload(path, bytes, { contentType: pendingHidePhoto.mimeType });
      if (error) {
        Alert.alert("Upload failed", error.message);
        return;
      }
      await supabase.from("tw_mascots").insert({
        hunt_group_id: huntGroupRef.current.id,
        hider_user_id: userId,
        hider_name: displayName,
        photo_path: path,
        lat: myPos.lat,
        lng: myPos.lng,
        radius_miles: radius,
        center_lat: myPos.lat,
        center_lng: myPos.lng,
      });
      await fetchMascots(userId, huntGroupRef.current);
      showAlert(`📍 Mascot hidden! Friends search within ${radius} miles.`);
    } finally {
      setUploading(false);
    }
  }

  async function captureMascot(mascotId: string) {
    if (!userId) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access required.");
      return;
    }
    setCaptureTarget(mascotId);
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) {
      setCaptureTarget(null);
      return;
    }
    const asset = result.assets[0];
    if (!asset.base64) {
      setCaptureTarget(null);
      return;
    }
    const ext = asset.mimeType?.split("/")[1] ?? "jpg";
    const path = `${userId}/capture-${Date.now()}.${ext}`;
    const binaryString = atob(asset.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const { error } = await supabase.storage
      .from("game-photos")
      .upload(path, bytes, { contentType: asset.mimeType ?? "image/jpeg" });
    if (error) {
      Alert.alert("Upload failed", error.message);
      setCaptureTarget(null);
      return;
    }
    const foundAt = new Date().toISOString();
    const captured = mascotsRef.current.find((m) => m.id === mascotId) ?? null;
    await supabase
      .from("tw_mascots")
      .update({
        found_at: foundAt,
        finder_user_id: userId,
        finder_name: displayName,
      })
      .eq("id", mascotId);
    await fetchMascots(userId, huntGroupRef.current);
    if (captured) setCelebrationMascot({ ...captured, found_at: foundAt });
    setCaptureTarget(null);
  }

  const active = mascots.filter((m) => !m.found_at);
  const found = mascots.filter((m) => m.found_at);

  if (!loading && !userId) {
    return (
      <SafeAreaView edges={["bottom"]} style={[s.safe, s.centered]}>
        <Text style={s.pageTitle}>Mascot Hunt</Text>
        <Text style={[s.muted, { textAlign: "center", marginBottom: 24 }]}>
          Sign in to hide and hunt mascots with friends.
        </Text>
        <Text style={s.muted}>Go to Profile to sign in →</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={s.safe}>
      {alertMsg && (
        <View pointerEvents="none" style={s.toast}>
          <Text style={s.toastText}>{alertMsg}</Text>
        </View>
      )}

      {/* ── Capture celebration ─────────────────────────────────────────── */}
      <Modal
        visible={!!celebrationMascot}
        transparent
        animationType="fade"
        onRequestClose={() => setCelebrationMascot(null)}
      >
        <View style={s.celebOverlay}>
          <View style={s.celebCard}>
            <Text style={{ fontSize: 56 }}>🎯</Text>
            <Text style={s.celebTitle}>Mascot Captured!</Text>
            {celebrationMascot && (
              <>
                <Image
                  source={{
                    uri: supabase.storage
                      .from("game-photos")
                      .getPublicUrl(celebrationMascot.photo_path).data
                      .publicUrl,
                  }}
                  style={s.celebPhoto}
                  resizeMode="cover"
                />
                <Text style={s.celebHider}>
                  Hidden by {celebrationMascot.hider_name}
                </Text>
                <Text style={s.celebSurvival}>
                  Survived{" "}
                  {survivalStr(
                    new Date(celebrationMascot.found_at ?? "").getTime() -
                      new Date(celebrationMascot.hidden_at).getTime(),
                  )}
                </Text>
              </>
            )}
            <TouchableOpacity
              onPress={() => setCelebrationMascot(null)}
              style={s.celebBtn}
            >
              <Text style={s.celebBtnText}>Awesome! 🎉</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!pendingHidePhoto}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPendingHidePhoto(null)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {pendingHidePhoto && (
            <>
              {/* Full-bleed photo */}
              <Image
                source={{ uri: pendingHidePhoto.uri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />

              {/* Close button */}
              <SafeAreaView edges={["top"]} style={s.photoTopBar}>
                <TouchableOpacity
                  onPress={() => setPendingHidePhoto(null)}
                  style={s.photoCloseBtn}
                >
                  <Text style={s.photoCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </SafeAreaView>

              {/* Bottom sheet */}
              <SafeAreaView edges={["bottom"]} style={s.photoBottomSafe}>
                <View style={s.photoBottomSheet}>
                  {/* Handle */}
                  <View style={s.photoHandle} />

                  {/* Criteria chips */}
                  <View style={s.photoCriteriaRow}>
                    {[
                      { icon: Cloud, label: "Sky" },
                      { icon: Leaf, label: "Ground" },
                      { icon: Landmark, label: "Landmark" },
                    ].map(({ icon: Icon, label }) => (
                      <View key={label} style={s.photoCriteriaChip}>
                        <Icon size={13} color="rgba(255,255,255,0.9)" />
                        <Text style={s.photoCriteriaText}>{label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Hide button */}
                  <TouchableOpacity
                    onPress={() => void confirmHideMascot()}
                    style={s.photoHideBtn}
                  >
                    <Text style={s.photoHideBtnText}>Hide Mascot Here</Text>
                  </TouchableOpacity>

                  {/* Retake */}
                  <TouchableOpacity
                    onPress={() => {
                      setPendingHidePhoto(null);
                      void launchHideMascotCamera();
                    }}
                    style={s.photoRetakeBtn}
                  >
                    <Camera size={14} color="rgba(255,255,255,0.6)" />
                    <Text style={s.photoRetakeText}>Retake Photo</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </>
          )}
        </View>
      </Modal>

      {/* ── Members sheet ───────────────────────────────────────────────────── */}
      <Modal
        visible={showMembersSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMembersSheet(false)}
      >
        <TouchableOpacity
          style={s.backdrop}
          activeOpacity={1}
          onPress={() => setShowMembersSheet(false)}
        >
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text
              style={[s.pageTitle, { textAlign: "center", marginBottom: 16 }]}
            >
              {huntGroup?.name ?? "Group"}
            </Text>
            {huntMembers.map((m) => {
              const isFounder = m.user_id === huntGroup?.created_by;
              return (
                <View key={m.id || m.user_id} style={s.memberRow}>
                  <Text style={s.memberName}>{m.display_name}</Text>
                  {isFounder && (
                    <View style={s.founderBadge}>
                      <Text style={s.founderBadgeText}>Founder</Text>
                    </View>
                  )}
                </View>
              );
            })}
            <View style={{ gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowMembersSheet(false);
                  setGroupModalMode("invite");
                  setShowGroupModal(true);
                }}
                style={s.primaryBtn}
              >
                <Text style={s.primaryBtnText}>+ Invite Member</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowMembersSheet(false);
                  leaveGroup();
                }}
                style={[s.outlineBtn, { borderColor: colors.destructive }]}
              >
                <Text style={[s.outlineBtnText, { color: colors.destructive }]}>
                  Leave Group
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Hide mascot tutorial ────────────────────────────────────────────── */}
      <Modal
        visible={showHideTutorial}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowHideTutorial(false)}
      >
        <TouchableOpacity
          style={s.tutorialOverlay}
          activeOpacity={1}
          onPress={() => {
            if (hideTutorialStep < 2) {
              setHideTutorialStep((p) => p + 1);
            } else {
              void launchHideMascotCamera();
            }
          }}
        >
          <View style={s.tutorialCard}>
            <Text style={s.tutorialPre}>Before you take a picture…</Text>

            {/* Scene illustration */}
            <View style={s.tutorialScene}>
              {/* Sky */}
              <View style={s.tutorialSkyLayer}>
                <View style={s.tutorialCloud1} />
                <View style={s.tutorialCloud2} />
                <View style={s.tutorialSun} />
                {hideTutorialStep !== 0 && <View style={s.tutorialDimLayer} />}
              </View>

              {/* Landmark */}
              <View style={s.tutorialLandmarkLayer}>
                <View style={s.tutorialBuildingA} />
                <View style={s.tutorialBuildingB} />
                <View style={s.tutorialBuildingC} />
                {hideTutorialStep !== 2 && <View style={s.tutorialDimLayer} />}
              </View>

              {/* Ground */}
              <View style={s.tutorialGroundLayer}>
                <View style={s.tutorialGroundStripe} />
                {hideTutorialStep !== 1 && <View style={s.tutorialDimLayer} />}
              </View>
            </View>

            {/* Step label */}
            <Text style={s.tutorialStepText}>
              {hideTutorialStep + 1}.{" "}
              {
                [
                  "The sky is in the picture",
                  "The ground is visible",
                  "A distinctive landmark is in the shot",
                ][hideTutorialStep]
              }
            </Text>

            {/* Progress dots */}
            <View style={s.tutorialDots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    s.tutorialDot,
                    i === hideTutorialStep && s.tutorialDotActive,
                  ]}
                />
              ))}
            </View>

            <Text style={s.tutorialHint}>
              {hideTutorialStep < 2 ? "Tap to continue" : "Tap to open camera"}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Group modal ─────────────────────────────────────────────────────── */}
      <Modal
        visible={showGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={s.backdrop}
            activeOpacity={1}
            onPress={() => setShowGroupModal(false)}
          >
            <View style={s.sheet}>
              <View style={s.sheetHandle} />

              {groupModalMode === "create" && (
                <>
                  <Text
                    style={[
                      s.pageTitle,
                      { textAlign: "center", marginBottom: 4 },
                    ]}
                  >
                    Create Group
                  </Text>
                  <Text
                    style={[s.muted, { textAlign: "center", marginBottom: 16 }]}
                  >
                    Give your hunt group a name. Invite friends by username once
                    it's created.
                  </Text>
                  <TextInput
                    style={s.textInput}
                    placeholder="Group name (e.g. Weekend Crew)"
                    placeholderTextColor={colors.mutedForeground}
                    value={groupName}
                    onChangeText={setGroupName}
                    maxLength={30}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={createGroup}
                  />
                  <Text
                    style={[s.sectionLabel, { marginTop: 12, marginBottom: 8 }]}
                  >
                    Play area radius
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    {([2, 4, 6, 8, 10] as const).map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setNewGroupRadius(r)}
                        style={[
                          s.radiusCard,
                          { flexBasis: "28%", flexGrow: 1 },
                          newGroupRadius === r && {
                            borderColor: colors.primary,
                            backgroundColor: `${colors.primary}1A`,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 24,
                            fontWeight: "900",
                            color:
                              newGroupRadius === r
                                ? colors.primary
                                : colors.mutedForeground,
                          }}
                        >
                          {r}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: colors.foreground,
                          }}
                        >
                          mi
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={createGroup}
                    disabled={!groupName.trim() || groupLoading}
                    style={[
                      s.primaryBtn,
                      {
                        opacity: !groupName.trim() || groupLoading ? 0.5 : 1,
                        marginTop: 8,
                      },
                    ]}
                  >
                    <Text style={s.primaryBtnText}>
                      {groupLoading ? "Creating…" : "Create Group"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {groupModalMode === "invite" && huntGroup && (
                <>
                  <Text
                    style={[
                      s.pageTitle,
                      { textAlign: "center", marginBottom: 4 },
                    ]}
                  >
                    Invite to {huntGroup.name}
                  </Text>
                  <Text
                    style={[s.muted, { textAlign: "center", marginBottom: 16 }]}
                  >
                    Enter a friend's username and they'll see the invite in
                    their Hunt tab.
                  </Text>
                  <TextInput
                    style={s.textInput}
                    placeholder="username"
                    placeholderTextColor={colors.mutedForeground}
                    value={inviteUsername}
                    onChangeText={setInviteUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    returnKeyType="send"
                    onSubmitEditing={sendInvite}
                  />
                  <TouchableOpacity
                    onPress={sendInvite}
                    disabled={!inviteUsername.trim() || inviteLoading}
                    style={[
                      s.primaryBtn,
                      {
                        opacity:
                          !inviteUsername.trim() || inviteLoading ? 0.5 : 1,
                        marginTop: 8,
                      },
                    ]}
                  >
                    <Text style={s.primaryBtnText}>
                      {inviteLoading ? "Sending…" : "Send Invite"}
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={[s.muted, { textAlign: "center", marginTop: 12 }]}
                  >
                    Or share the code manually:{" "}
                    <Text
                      style={{ fontWeight: "800", color: colors.foreground }}
                    >
                      {huntGroup.invite_code}
                    </Text>
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        <View>
          <Text style={s.pageTitle}>Mascot Hunt</Text>
          {myPos ? (
            <Text style={{ fontSize: 12, color: colors.primary }}>
              📍 GPS active
            </Text>
          ) : posError ? (
            <Text style={{ fontSize: 12, color: colors.destructive }}>
              {posError}
            </Text>
          ) : (
            <Text style={s.muted}>Getting location…</Text>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["solo", "hunt"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[s.subTab, tab === t && s.subTabActive]}
            >
              <Text style={[s.subTabText, tab === t && s.subTabTextActive]}>
                {t === "hunt" ? "Group" : "Solo"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── HUNT ─────────────────────────────────────────────────────────── */}

        {tab === "hunt" &&
          pendingInvites.map((invite) => (
            <View key={invite.id} style={s.inviteCard}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.foreground,
                  }}
                >
                  {invite.from_display_name} invited you
                </Text>
                <Text style={s.muted}>{invite.group_name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => acceptInvite(invite)}
                style={s.acceptBtn}
              >
                <Text style={s.acceptBtnText}>Join</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => declineInvite(invite.id)}>
                <Text style={{ fontSize: 18, color: colors.mutedForeground }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          ))}

        {tab === "hunt" &&
          (!huntGroup ? (
            <TouchableOpacity
              onPress={() => {
                setGroupModalMode("create");
                setShowGroupModal(true);
              }}
              style={s.createGroupBtn}
              activeOpacity={0.8}
            >
              <Text style={s.createGroupBtnTitle}>Start a Group Hunt</Text>
              <Text style={s.createGroupBtnSub}>
                Create a group and invite friends to hide & find mascots
                together
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* ── Group row ── */}
              <View style={s.huntGroupRow}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => setShowMembersSheet(true)}
                  activeOpacity={0.7}
                >
                  <Text style={s.huntGroupName}>{huntGroup.name}</Text>
                  <Text style={s.huntGroupSub}>
                    {huntMembers.length}{" "}
                    {huntMembers.length === 1 ? "member" : "members"} ·{" "}
                    {huntGroup.invite_code}
                  </Text>
                </TouchableOpacity>
                <View style={s.groupAvatarStack}>
                  {huntMembers.slice(0, 3).map((m, i) => (
                    <View
                      key={m.id || m.user_id}
                      style={[
                        s.groupAvatar,
                        { zIndex: 3 - i, marginLeft: i > 0 ? -10 : 0 },
                      ]}
                    >
                      <Text style={s.groupAvatarLetter}>
                        {m.display_name[0]?.toUpperCase() ?? "?"}
                      </Text>
                    </View>
                  ))}
                  {huntMembers.length > 3 && (
                    <View
                      style={[
                        s.groupAvatar,
                        { marginLeft: -10, backgroundColor: colors.muted },
                      ]}
                    >
                      <Text
                        style={[
                          s.groupAvatarLetter,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        +{huntMembers.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={s.inlineInviteBtn}
                  onPress={() => {
                    setGroupModalMode("invite");
                    setShowGroupModal(true);
                  }}
                >
                  <Text style={s.inlineInviteBtnText}>+ Invite</Text>
                </TouchableOpacity>
              </View>

              {showGroupPicker ? (
                <AreaPickerMap
                  initialPos={myPos}
                  initialRadiusMiles={
                    (huntGroup.radius_miles as 2 | 4 | 6 | 8 | 10) ?? 2
                  }
                  onConfirm={async (center, radius) => {
                    await updateGroupPlayArea(radius, center);
                  }}
                  onCancel={() => setShowGroupPicker(false)}
                />
              ) : (
                <>
                  {/* Play area map */}
                  {myPos && (
                    <>
                      <View style={s.soloAreaHeader}>
                        <Text style={s.sectionLabel}>
                          {huntGroup.radius_miles ?? 2}-mile play area
                        </Text>
                        {userId === huntGroup.created_by && (
                          <TouchableOpacity
                            onPress={() => setShowGroupPicker(true)}
                          >
                            <Text style={s.changeLink}>Edit</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <PlayMap
                        myPos={myPos}
                        center={
                          huntGroup.center_lat != null &&
                          huntGroup.center_lng != null
                            ? {
                                lat: huntGroup.center_lat,
                                lng: huntGroup.center_lng,
                              }
                            : myPos
                        }
                        radiusMiles={huntGroup.radius_miles ?? 2}
                        markersJson={JSON.stringify(
                          active
                            .filter((m) => m.hider_user_id === userId)
                            .map((m) => ({
                              lat: m.lat,
                              lng: m.lng,
                              c: snappyColor,
                              e: snappyAccessory,
                            })),
                        )}
                      />
                    </>
                  )}

                  {isOutsideGroupArea && (
                    <View style={s.outsideWarning}>
                      <Text style={s.outsideWarningText}>
                        ⚠ Outside play area — move back inside to hide.
                      </Text>
                    </View>
                  )}

                  {/* ── Hide Here button ── */}
                  <TouchableOpacity
                    onPress={() => void startHideMascot()}
                    disabled={uploading || !myPos || isOutsideGroupArea}
                    style={[
                      s.hideHereBtn,
                      {
                        opacity:
                          uploading || !myPos || isOutsideGroupArea ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Camera color="#fff" size={20} />
                    <Text style={s.hideHereBtnText}>
                      {uploading ? "Saving…" : "Hide Here"}
                    </Text>
                  </TouchableOpacity>

                  {/* Active section */}
                  <Text style={s.huntSectionLabel}>
                    Hunting{active.length > 0 ? ` (${active.length})` : ""}
                  </Text>

                  {loading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : active.length === 0 ? (
                    <View style={s.emptyHunt}>
                      <Text style={s.emptyHuntTitle}>Nothing hiding yet</Text>
                      <Text style={s.emptyHuntSub}>
                        Hide a mascot to get the hunt started!
                      </Text>
                    </View>
                  ) : (
                    active.map((m) => {
                      const hiddenDt = new Date(m.hidden_at);
                      const hiddenDate = hiddenDt.toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      });
                      const hiddenTime = hiddenDt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const photoUrl = supabase.storage
                        .from("game-photos")
                        .getPublicUrl(m.photo_path).data.publicUrl;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => setSelectedMascot(m)}
                          style={s.huntCard}
                          activeOpacity={0.72}
                        >
                          <Image
                            source={{ uri: photoUrl }}
                            style={s.huntThumb}
                            resizeMode="cover"
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={s.huntCardName}>
                              {m.hider_name}'s Mascot
                            </Text>
                            <Text style={s.huntCardMeta}>
                              {hiddenDate} · {hiddenTime}
                            </Text>
                          </View>
                          <Text style={s.huntChevron}>›</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}

                  {/* Captured section */}
                  {found.length > 0 && (
                    <>
                      <Text style={s.huntSectionLabel}>
                        Captured ({found.length})
                      </Text>
                      {found.map((m) => {
                        const url = supabase.storage
                          .from("game-photos")
                          .getPublicUrl(m.photo_path).data.publicUrl;
                        const elapsed =
                          new Date(m.found_at ?? "").getTime() -
                          new Date(m.hidden_at).getTime();
                        return (
                          <View
                            key={m.id}
                            style={[s.huntCard, s.huntCardFound]}
                          >
                            <Image
                              source={{ uri: url }}
                              style={s.huntThumb}
                              resizeMode="cover"
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={s.huntCardName}>
                                {m.hider_name}'s Mascot
                              </Text>
                              <Text style={s.huntCardMeta}>
                                Found by {m.finder_name} ·{" "}
                                {survivalStr(elapsed)}
                              </Text>
                            </View>
                            <Text style={s.huntFoundBadge}>✓</Text>
                          </View>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </>
          ))}

        {/* ── SOLO ─────────────────────────────────────────────────────────── */}
        {tab === "solo" && (
          <>
            {/* Daily object slot machine */}
            <View style={s.slotCard}>
              <Text style={s.sectionLabel}>Today's Hunt</Text>

              {/* Two side-by-side drums */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                {([soloSlotY0, soloSlotY1] as const).map((anim, col) => {
                  const idx = soloObjIndices?.[col as 0 | 1] ?? null;
                  const done = soloPhotoDone[col as 0 | 1];
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: two fixed drum columns never reorder
                    <View key={col} style={{ flex: 1, gap: 10 }}>
                      <View style={s.slotWindow}>
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            s.slotFadeTop,
                            { zIndex: 2 },
                          ]}
                        />
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            s.slotFadeBottom,
                            { zIndex: 2 },
                          ]}
                        />
                        <Animated.View
                          style={{
                            transform: [{ translateY: anim }],
                            width: "100%",
                          }}
                        >
                          {SOLO_DRUM.map((obj, i) => (
                            <View
                              // biome-ignore lint/suspicious/noArrayIndexKey: stable drum
                              key={i}
                              style={s.slotItem}
                            >
                              <obj.icon size={32} color={colors.foreground} />
                              <Text style={s.slotLabel} numberOfLines={1}>
                                {obj.label}
                              </Text>
                            </View>
                          ))}
                        </Animated.View>
                      </View>

                      {soloObjRevealed && idx !== null && !done && (
                        <TouchableOpacity
                          onPress={() => void takeSoloPhoto(col as 0 | 1)}
                          disabled={soloPhotoUploading !== null}
                          style={[
                            s.primaryBtn,
                            { opacity: soloPhotoUploading === col ? 0.5 : 1 },
                          ]}
                        >
                          {soloPhotoUploading === col ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <>
                              <Camera color="#fff" size={15} />
                              <Text
                                style={[s.primaryBtnText, { fontSize: 13 }]}
                              >
                                Found it!
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {done && (
                        <View style={s.slotDoneChip}>
                          <Text style={s.slotDoneText}>✓ Found</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {!soloObjRevealed && (
                <TouchableOpacity
                  onPress={spinSoloObject}
                  disabled={soloObjSpinning}
                  style={[s.primaryBtn, { opacity: soloObjSpinning ? 0.5 : 1 }]}
                >
                  {soloObjSpinning ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.primaryBtnText}>Spin</Text>
                  )}
                </TouchableOpacity>
              )}

              {soloPhotoDone[0] && soloPhotoDone[1] && (
                <View style={s.slotAllDone}>
                  <Text style={s.slotAllDoneText}>
                    Both found! Great hunt today.
                  </Text>
                </View>
              )}
            </View>

            {/* Play area picker or map */}
            {showSoloPicker || !soloRadius ? (
              <AreaPickerMap
                initialPos={myPos}
                initialRadiusMiles={
                  (soloRadius as 2 | 4 | 6 | 8 | 10 | null) ?? 2
                }
                onConfirm={async (center, radius) => {
                  await setSoloPlayArea(radius, center);
                  setShowSoloPicker(false);
                }}
                onCancel={
                  soloRadius ? () => setShowSoloPicker(false) : undefined
                }
              />
            ) : (
              <>
                <View style={s.soloAreaHeader}>
                  <Text style={s.sectionLabel}>
                    {soloRadius}-mile play area
                  </Text>
                  <TouchableOpacity onPress={() => setShowSoloPicker(true)}>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.primary,
                        fontWeight: "600",
                      }}
                    >
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
                <PlayMap
                  myPos={myPos}
                  center={soloCenter}
                  radiusMiles={soloRadius}
                  markersJson={JSON.stringify(
                    soloFoundLocs.map((p) => ({
                      lat: p.lat,
                      lng: p.lng,
                      c: "#16a34a",
                    })),
                  )}
                />
                {isOutsideSoloArea && (
                  <View style={s.outsideWarning}>
                    <Text style={s.outsideWarningText}>
                      You're outside your play area!
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {selectedMascot && (
        <MascotHuntModal
          mascot={selectedMascot}
          myPos={myPos}
          onClose={() => setSelectedMascot(null)}
          onCapture={async (id) => {
            await captureMascot(id);
            setSelectedMascot(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 20,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: colors.foreground,
  },
  muted: { fontSize: 14, color: colors.mutedForeground },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: "#fff",
  },
  outlineBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  emptyState: {
    backgroundColor: colors.muted,
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
  },
  toast: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: "center",
  },
  toastText: {
    backgroundColor: colors.foreground,
    color: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  radiusCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.muted,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  subTab: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
    alignItems: "center",
  },
  subTabActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  subTabTextActive: { color: "#fff" },
  mascotCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
  },
  mascotCardActive: { borderColor: colors.primary },
  mascotInfo: { padding: 14, gap: 8 },
  badgeRight: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLeft: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.muted,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  foundCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    overflow: "hidden",
    opacity: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  th: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.mutedForeground,
    textTransform: "uppercase",
  },
  td: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  tileDots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  tileDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.muted,
  },
  tileDotFilled: {
    backgroundColor: colors.primary,
  },
  tileDotThreshold: {
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  captureBtn: {
    backgroundColor: "#16a34a",
  },
  tileFlipCovered: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: "rgba(28,25,23,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileFlipQuestion: {
    fontSize: 22,
    fontWeight: "900",
    color: "rgba(255,255,255,0.3)",
  },
  addressClue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.muted,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  addressClueIcon: { fontSize: 13 },
  addressClueText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
    flex: 1,
  },
  inviteCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  groupHeader: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: colors.foreground,
  },
  codeChip: {
    backgroundColor: colors.primary,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  codeChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1.5,
  },
  leaveBtn: {
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: colors.destructive,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leaveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.destructive,
  },
  textInput: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.muted,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.foreground,
  },
  celebOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  celebCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 360,
  },
  celebTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
    color: colors.foreground,
  },
  celebPhoto: {
    width: 160,
    height: 160,
    borderRadius: 16,
    marginVertical: 4,
  },
  celebHider: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  celebSurvival: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  celebBtn: {
    marginTop: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#16a34a",
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  celebBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
  soloProgressCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  soloProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  soloProgressLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  soloProgressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.muted,
    overflow: "hidden",
  },
  soloProgressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  soloGrid: { gap: 8 },
  soloRow: { flexDirection: "row", gap: 8 },
  soloTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: colors.muted,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  soloTileCovered: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.mutedForeground,
  },
  soloStat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  soloStatDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  soloStatValue: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: colors.foreground,
  },
  soloStatUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.mutedForeground,
  },
  mapBox: {
    height: MAP_H,
    borderRadius: 24,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 8,
  },
  memberName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  founderBadge: {
    backgroundColor: `${colors.primary}1A`,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
  },
  founderBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  outsideWarning: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  outsideWarningText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
    textAlign: "center",
  },
  soloAreaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  crosshairText: {
    fontSize: 36,
    color: "#007AFF",
    lineHeight: 36,
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  radiusChip: {
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.muted,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  radiusChipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}1A`,
  },
  radiusChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.mutedForeground,
  },
  radiusChipTextActive: {
    color: colors.primary,
  },
  slotCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 16,
  },
  slotWindow: {
    height: SLOT_ITEM_H,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: colors.muted,
    position: "relative",
  },
  slotItem: {
    height: SLOT_ITEM_H,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  slotLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  slotFadeTop: {
    height: "15%",
    top: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: `${colors.muted}BB`,
  },
  slotFadeBottom: {
    height: "15%",
    bottom: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: `${colors.muted}BB`,
  },
  slotDoneChip: {
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  slotDoneText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16a34a",
  },
  slotAllDone: {
    backgroundColor: "#dcfce7",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  slotAllDoneText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#16a34a",
  },
  // ── Hide mascot tutorial ───────────────────────────────────────────────────
  tutorialOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  tutorialCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 24,
    width: "100%",
    gap: 18,
    alignItems: "center",
  },
  tutorialPre: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.foreground,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  tutorialScene: {
    width: "100%",
    height: 210,
    borderRadius: 18,
    overflow: "hidden",
  },
  tutorialSkyLayer: {
    flex: 4,
    backgroundColor: "#4A90C4",
    overflow: "hidden",
  },
  tutorialCloud1: {
    position: "absolute",
    top: 16,
    left: 18,
    width: 58,
    height: 22,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 11,
  },
  tutorialCloud2: {
    position: "absolute",
    top: 26,
    right: 24,
    width: 44,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 9,
  },
  tutorialSun: {
    position: "absolute",
    top: 10,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFD166",
  },
  tutorialLandmarkLayer: {
    flex: 3,
    backgroundColor: "#8C7B6B",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    gap: 6,
  },
  tutorialBuildingA: {
    width: 36,
    height: 52,
    backgroundColor: "#5C4F42",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tutorialBuildingB: {
    width: 28,
    height: 68,
    backgroundColor: "#4A3F34",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tutorialBuildingC: {
    width: 48,
    height: 40,
    backgroundColor: "#6B5C4E",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tutorialGroundLayer: {
    flex: 3,
    backgroundColor: "#4D7C35",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  tutorialGroundStripe: {
    height: 10,
    backgroundColor: "#3D6428",
  },
  tutorialDimLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.60)",
  },
  tutorialStepText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  tutorialDots: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  tutorialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  tutorialDotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  tutorialHint: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: "500",
  },

  // ── Create group CTA ──────────────────────────────────────────────────────
  createGroupBtn: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    padding: 24,
    gap: 8,
    alignItems: "center",
  },
  createGroupBtnTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  createGroupBtnSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 20,
  },

  // ── Group row ─────────────────────────────────────────────────────────────
  huntGroupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  huntGroupName: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  huntGroupSub: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: "500",
    marginTop: 2,
  },
  inlineInviteBtn: {
    backgroundColor: `${colors.primary}18`,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  inlineInviteBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },

  // ── Hide Here button ───────────────────────────────────────────────────────
  hideHereBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    borderRadius: 16,
    paddingVertical: 16,
  },
  hideHereBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  groupAvatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  groupAvatarLetter: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },

  // ── Hunt list ─────────────────────────────────────────────────────────────
  huntSectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.mutedForeground,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 4,
  },

  huntCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  huntThumb: {
    width: 78,
    height: 78,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.muted,
  },
  huntCardName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  huntCardMeta: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  huntCardFound: {
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },
  huntFoundBadge: {
    fontSize: 18,
    fontWeight: "900",
    color: "#16a34a",
  },
  huntChevron: {
    fontSize: 22,
    color: colors.mutedForeground,
    fontWeight: "300",
  },
  changeLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },

  // ── Empty hunt state ───────────────────────────────────────────────────────
  emptyHunt: {
    backgroundColor: colors.muted,
    borderRadius: 18,
    paddingVertical: 36,
    alignItems: "center",
    gap: 8,
  },
  emptyHuntTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
  },
  emptyHuntSub: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: "center",
  },

  // ── Photo review screen ────────────────────────────────────────────────────
  photoTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  photoCloseBtn: {
    margin: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCloseBtnText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    lineHeight: 22,
  },
  photoBottomSafe: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  photoBottomSheet: {
    backgroundColor: "rgba(8,8,8,0.82)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 14,
    alignItems: "center",
  },
  photoHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 4,
  },
  photoCriteriaRow: {
    flexDirection: "row",
    gap: 10,
  },
  photoCriteriaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  photoCriteriaText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    fontWeight: "600",
  },
  photoHideBtn: {
    width: "100%",
    height: 60,
    borderRadius: 22,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
  },
  photoHideBtnText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  photoRetakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  photoRetakeText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },

  activeMascotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
  },
  activeMascotPreview: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.muted,
  },
  activeMascotTile: {
    width: 20,
    height: 20,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.background,
  },
  activeMascotName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: -0.2,
  },
});
