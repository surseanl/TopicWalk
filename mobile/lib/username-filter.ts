const RESERVED = new Set([
  "admin",
  "administrator",
  "moderator",
  "mod",
  "staff",
  "support",
  "topicwalk",
  "topic_walk",
  "topicwalk_admin",
  "official",
  "system",
  "root",
  "null",
  "undefined",
  "anonymous",
  "anon",
  "help",
  "info",
  "contact",
  "noreply",
  "no_reply",
  "me",
  "you",
  "them",
  "everyone",
  "all",
]);

const BLOCKED_WORDS = new Set([
  "fuck",
  "fucker",
  "fucked",
  "fucking",
  "fuk",
  "fck",
  "shit",
  "shitter",
  "shitting",
  "sht",
  "ass",
  "asshole",
  "asses",
  "assh0le",
  "bitch",
  "bitches",
  "b1tch",
  "cunt",
  "cunts",
  "dick",
  "dicks",
  "d1ck",
  "cock",
  "cocks",
  "pussy",
  "pussies",
  "whore",
  "whores",
  "slut",
  "sluts",
  "nigger",
  "nigga",
  "n1gger",
  "n1gga",
  "faggot",
  "fag",
  "f4ggot",
  "kike",
  "spic",
  "chink",
  "gook",
  "wetback",
  "beaner",
  "retard",
  "retards",
  "ret4rd",
  "rape",
  "rapist",
  "raping",
  "pedophile",
  "pedo",
  "ped0",
  "nazi",
  "n4zi",
  "hitler",
  "h1tler",
  "kill",
  "killer",
  "killing",
  "suicide",
  "suicidal",
  "bastard",
  "b4stard",
  "damn",
  "damnit",
  "hell",
  "h3ll",
  "crap",
  "porn",
  "p0rn",
  "porno",
  "sex",
  "sexy",
  "sexxx",
  "nude",
  "nudes",
  "boob",
  "boobs",
  "penis",
  "vagina",
  "dildo",
  "horny",
  "jerk",
  "jerks",
  "jackass",
  "motherfucker",
  "mofo",
  "dumbass",
  "dumb_ass",
  "dipshit",
  "bastards",
  "skank",
  "twat",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/6/g, "g")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/9/g, "g")
    .replace(/_+/g, "")
    .replace(/\s+/g, "");
}

export type UsernameValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateUsername(raw: string): UsernameValidationResult {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length < 3)
    return { ok: false, reason: "Username must be at least 3 characters." };
  if (trimmed.length > 30)
    return { ok: false, reason: "Username must be 30 characters or fewer." };
  if (!/^[a-z0-9_]+$/.test(trimmed))
    return { ok: false, reason: "Letters, numbers, and underscores only." };
  if (/^_|_$/.test(trimmed))
    return { ok: false, reason: "Cannot start or end with an underscore." };
  if (/^\d+$/.test(trimmed))
    return { ok: false, reason: "Must contain at least one letter." };
  if (RESERVED.has(trimmed))
    return { ok: false, reason: "That username is reserved." };
  const norm = normalize(trimmed);
  for (const word of BLOCKED_WORDS) {
    if (norm.includes(normalize(word)))
      return { ok: false, reason: "That username isn't allowed." };
  }
  return { ok: true };
}
