// Canonical, environment-independent Teen Patti ranking. No randomness or I/O.
export const HAND_ORDER = [
  "high_card",
  "pair",
  "color",
  "sequence",
  "pure_sequence",
  "trail",
];
export const SUPPORTED_VARIANTS = ["CLASSIC", "MUFLIS", "LOWBALL"];
export function rankHand(cards) {
  if (
    cards.length !== 3 ||
    new Set(cards.map((c) => `${c.rank}:${c.suit}`)).size !== 3
  )
    throw new Error("Three distinct cards required");
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map((c) => c.value);
  if (values.some((v) => !Number.isInteger(v) || v < 2 || v > 14))
    throw new Error("Invalid card value");
  const [a, b, c] = values;
  const flush = sorted.every((c) => c.suit === sorted[0].suit);
  const straight =
    a === 14 && b === 3 && c === 2 ? 3 : a - b === 1 && b - c === 1 ? a : 0;
  let rank, kickers;
  if (a === c) {
    rank = "trail";
    kickers = [a];
  } else if (straight) {
    rank = flush ? "pure_sequence" : "sequence";
    kickers = [straight];
  } else if (flush) {
    rank = "color";
    kickers = values;
  } else if (a === b || b === c) {
    rank = "pair";
    kickers = a === b ? [a, c] : [b, a];
  } else {
    rank = "high_card";
    kickers = values;
  }
  return {
    rank,
    cards: sorted,
    highCard: kickers[0],
    tuple: [HAND_ORDER.indexOf(rank), ...kickers],
  };
}
export function compareRankedHands(a, b, variant = "CLASSIC") {
  const direction = ["MUFLIS", "LOWBALL"].includes(variant.toUpperCase())
    ? -1
    : 1;
  for (let i = 0; i < Math.max(a.tuple.length, b.tuple.length); i++) {
    const diff = (a.tuple[i] ?? 0) - (b.tuple[i] ?? 0);
    if (diff) return Math.sign(diff) * direction;
  }
  return 0;
}
export function handConfidence(hand, variant = "CLASSIC") {
  const score = (hand.tuple[0] + hand.highCard / 15) / 6;
  return ["MUFLIS", "LOWBALL"].includes(variant.toUpperCase())
    ? 1 - score
    : score;
}
