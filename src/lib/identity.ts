export type Identity = {
  userId: string;
  displayName: string;
  groupCode: string;
  groupId: string;
  isGuest?: boolean;
};

const KEY = "tw_identity";

export function getIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Identity;
  } catch {
    return null;
  }
}

export function saveIdentity(identity: Identity): void {
  localStorage.setItem(KEY, JSON.stringify(identity));
}

export function clearIdentity(): void {
  localStorage.removeItem(KEY);
}

export function saveGuestIdentity(): Identity {
  const identity: Identity = {
    userId: crypto.randomUUID(),
    displayName: "Guest",
    groupCode: "",
    groupId: "",
    isGuest: true,
  };
  saveIdentity(identity);
  return identity;
}
