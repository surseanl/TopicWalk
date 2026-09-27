import Purchases, { LOG_LEVEL } from "react-native-purchases";

// TODO: Replace with your real RevenueCat API key from app.revenuecat.com
// iOS key starts with "appl_"
const RC_API_KEY = "appl_REPLACE_WITH_YOUR_KEY";

// Product IDs — must match exactly what you create in App Store Connect
// and in your RevenueCat dashboard
export const TIP_PRODUCTS = {
  coffee: "topicwalk_tip_coffee", // $0.99
  snack: "topicwalk_tip_snack", // $1.99
  meal: "topicwalk_tip_meal", // $4.99
} as const;

export type TipProductId = (typeof TIP_PRODUCTS)[keyof typeof TIP_PRODUCTS];

let initialized = false;

export function initPurchases() {
  if (initialized) return;
  initialized = true;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: RC_API_KEY });
}

export async function fetchTipProducts() {
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return [];
  return current.availablePackages;
}

export async function purchaseTip(packageToPurchase: {
  identifier: string;
  // biome-ignore lint/suspicious/noExplicitAny: RevenueCat type
  product: any;
}) {
  const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
  return customerInfo;
}
