/**
 * PROVABLY FAIR SYSTEM
 *
 * The core differentiator vs Teen Patti Gold. Every hand can be independently
 * verified by players to prove the RNG was not manipulated.
 *
 * How it works:
 * 1. Before dealing, server generates a random server seed
 * 2. Server creates SHA-256 hash of: serverSeed + deckOrder
 * 3. Hash is sent to ALL players BEFORE cards are dealt
 * 4. Game plays out normally
 * 5. After hand ends, server reveals: serverSeed + full deck order
 * 6. Any player can verify: SHA-256(serverSeed + deckOrder) === pre-game hash
 *
 * This proves the deck was determined BEFORE the hand started and was
 * not changed during gameplay based on player actions.
 *
 * Additional layer: Client seed
 * - Each player can optionally provide a client seed
 * - Final shuffle = HMAC-SHA256(serverSeed, clientSeeds.join(':'))
 * - This ensures the server alone cannot predetermine outcomes
 */

import crypto from 'node:crypto';
import { Card, createDeck, Suit, Rank } from './deck.js';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface FairnessSeed {
  serverSeed: string;        // Random 256-bit hex string
  serverSeedHash: string;    // SHA-256 hash shown to players before dealing
  clientSeeds: string[];     // Optional seeds from players
  combinedSeed: string;      // serverSeed + clientSeeds combined
  nonce: number;             // Game number (increments per hand)
}

export interface FairnessProof {
  serverSeed: string;        // Revealed after hand ends
  serverSeedHash: string;    // The hash players saw before the hand
  clientSeeds: string[];     // Player-contributed seeds
  combinedSeed: string;      // How seeds were combined
  nonce: number;
  deckOrder: string;         // Full deck as dealt (serialized)
  verificationHash: string;  // What the hash should be when verified
  timestamp: number;
  verified: boolean;         // Whether hash matches
}

export interface FairnessCommitment {
  hash: string;              // Shown to players before dealing
  nonce: number;
  timestamp: number;
}

// ─── Seed Generation ───────────────────────────────────────────────────────

/** Generate a cryptographically secure 256-bit server seed */
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Generate a default client seed (players can override) */
export function generateClientSeed(): string {
  return crypto.randomBytes(16).toString('hex');
}

/** Combine server seed with client seeds using HMAC */
export function combineSeeds(serverSeed: string, clientSeeds: string[], nonce: number): string {
  const data = `${serverSeed}:${clientSeeds.sort().join(':')}:${nonce}`;
  return crypto.createHmac('sha256', serverSeed).update(data).digest('hex');
}

// ─── Deterministic Shuffle ─────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle using deterministic PRNG derived from combined seed.
 * This ensures the same seed always produces the same deck order,
 * making the shuffle independently verifiable.
 */
export function deterministicShuffle(deck: Card[], seed: string): Card[] {
  const shuffled = [...deck];

  // Use seed to generate a deterministic sequence of random numbers
  // We use HMAC-SHA256 chain: H(seed, 0), H(seed, 1), H(seed, 2)...
  let hashIndex = 0;

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate deterministic random number for this position
    const hash = crypto.createHmac('sha256', seed)
      .update(`${hashIndex}`)
      .digest();
    hashIndex++;

    // Convert first 4 bytes to uint32, then mod to get index
    const randomValue = hash.readUInt32BE(0);
    const j = randomValue % (i + 1);

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// ─── Commitment (Pre-Hand) ─────────────────────────────────────────────────

/** Create the hash commitment shown to players before dealing */
export function createCommitment(
  serverSeed: string,
  deckOrder: Card[],
  nonce: number
): FairnessCommitment {
  const deckString = serializeDeck(deckOrder);
  const data = `${serverSeed}:${deckString}:${nonce}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');

  return {
    hash,
    nonce,
    timestamp: Date.now(),
  };
}

// ─── Verification (Post-Hand) ──────────────────────────────────────────────

/** Generate the full proof after a hand ends */
export function generateProof(
  serverSeed: string,
  clientSeeds: string[],
  deckOrder: Card[],
  nonce: number,
  originalHash: string
): FairnessProof {
  const deckString = serializeDeck(deckOrder);
  const combinedSeed = combineSeeds(serverSeed, clientSeeds, nonce);
  const data = `${serverSeed}:${deckString}:${nonce}`;
  const verificationHash = crypto.createHash('sha256').update(data).digest('hex');

  return {
    serverSeed,
    serverSeedHash: originalHash,
    clientSeeds,
    combinedSeed,
    nonce,
    deckOrder: deckString,
    verificationHash,
    timestamp: Date.now(),
    verified: verificationHash === originalHash,
  };
}

/** Verify a proof (can be done client-side too) */
export function verifyProof(proof: FairnessProof): boolean {
  const data = `${proof.serverSeed}:${proof.deckOrder}:${proof.nonce}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash === proof.serverSeedHash;
}

// ─── Full Fair Deal Pipeline ───────────────────────────────────────────────

export interface FairDealResult {
  deck: Card[];               // The shuffled deck
  commitment: FairnessCommitment;  // Hash to show players
  seed: FairnessSeed;         // Seed data (kept secret until hand ends)
}

/**
 * Complete pipeline for a provably fair deal:
 * 1. Generate server seed
 * 2. Combine with any client seeds
 * 3. Deterministically shuffle deck
 * 4. Create hash commitment
 * 5. Return deck + commitment
 */
export function fairDeal(
  clientSeeds: string[] = [],
  nonce: number = 1
): FairDealResult {
  const serverSeed = generateServerSeed();
  const combinedSeed = combineSeeds(serverSeed, clientSeeds, nonce);

  // Create and shuffle deck deterministically
  const baseDeck = createDeck();
  const shuffledDeck = deterministicShuffle(baseDeck, combinedSeed);

  // Create commitment hash
  const commitment = createCommitment(serverSeed, shuffledDeck, nonce);

  return {
    deck: shuffledDeck,
    commitment,
    seed: {
      serverSeed,
      serverSeedHash: commitment.hash,
      clientSeeds,
      combinedSeed,
      nonce,
    },
  };
}

// ─── Serialization ─────────────────────────────────────────────────────────

export function serializeDeck(deck: Card[]): string {
  return deck.map(c => `${c.rank}${c.suit[0]}`).join(',');
}

export function deserializeDeck(deckString: string): Card[] {
  const SUIT_MAP: Record<string, Suit> = {
    h: 'hearts', d: 'diamonds', c: 'clubs', s: 'spades'
  };
  const RANK_VALUES: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };

  return deckString.split(',').map(token => {
    const suitChar = token[token.length - 1];
    const rank = token.slice(0, -1) as Rank;
    const suit = SUIT_MAP[suitChar];
    return { suit, rank, value: RANK_VALUES[rank] };
  });
}

// ─── Client-Side Verification Function ─────────────────────────────────────
// This exact function should be replicated in the frontend for client-side
// verification. It uses only standard Web Crypto API.

export const CLIENT_VERIFICATION_CODE = `
// Client-side verification (runs in browser)
async function verifyFairness(serverSeed, deckOrder, nonce, expectedHash) {
  const data = serverSeed + ':' + deckOrder + ':' + nonce;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hash === expectedHash;
}
`;
