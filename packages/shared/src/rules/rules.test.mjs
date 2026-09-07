import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { rankHand, compareRankedHands, HAND_ORDER } from "./ranking.js";
import { requestAck, PLAYER_ACTIONS } from "./protocol.js";
const suits = ["hearts", "diamonds", "clubs", "spades"];
const ranks = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
const deck = suits.flatMap((suit) =>
  ranks.map((rank, i) => ({ rank, suit, value: i + 2 })),
);
test("all 22,100 hands have known category counts and ordered category boundaries", () => {
  const counts = Object.fromEntries(HAND_ORDER.map((r) => [r, 0]));
  const groups = HAND_ORDER.map(() => []);
  for (let a = 0; a < 50; a++)
    for (let b = a + 1; b < 51; b++)
      for (let c = b + 1; c < 52; c++) {
        const h = rankHand([deck[a], deck[b], deck[c]]);
        counts[h.rank]++;
        groups[HAND_ORDER.indexOf(h.rank)].push(h);
      }
  assert.deepEqual(counts, {
    high_card: 16440,
    pair: 3744,
    color: 1096,
    sequence: 720,
    pure_sequence: 48,
    trail: 52,
  });
  for (const group of groups) group.sort((a, b) => compareRankedHands(a, b));
  for (let i = 1; i < groups.length; i++) {
    const lower = groups[i - 1].at(-1),
      higher = groups[i][0];
    assert.ok(compareRankedHands(higher, lower) > 0);
    assert.ok(compareRankedHands(higher, lower, "MUFLIS") < 0);
  }
  const all = groups.flat();
  for (let i = 1; i < all.length; i++) {
    assert.ok(compareRankedHands(all[i], all[i - 1]) >= 0);
    assert.ok(compareRankedHands(all[i - 1], all[i]) <= 0);
  }
});
class FakeSocket extends EventEmitter {
  connected = true;
  sent = [];
  emit(event, ...args) {
    if (event === "disconnect") return super.emit(event, ...args);
    this.sent.push([event, ...args]);
    return true;
  }
}
test("no-data acknowledgements keep the callback in the first argument", async () => {
  const socket = new FakeSocket();
  const pending = requestAck(socket, "room:list");
  assert.equal(socket.sent[0].length, 2);
  socket.sent[0][1]({ rooms: [] });
  assert.deepEqual(await pending, { rooms: [] });
  assert.equal(socket.listenerCount("disconnect"), 0);
  assert.ok(!PLAYER_ACTIONS.includes("timeout"));
});
test("lost connections and missing acknowledgements reject and remove listeners", async () => {
  const socket = new FakeSocket();
  const pending = requestAck(socket, "room:leave", undefined, 20);
  await assert.rejects(pending, /No confirmation/);
  assert.equal(socket.listenerCount("disconnect"), 0);
  const lost = requestAck(socket, "room:ready", { ready: true });
  socket.emit("disconnect");
  await assert.rejects(lost, /Connection lost/);
  assert.equal(socket.listenerCount("disconnect"), 0);
});
