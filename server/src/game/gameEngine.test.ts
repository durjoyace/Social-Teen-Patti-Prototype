import assert from "node:assert/strict";
import test from "node:test";
import {
  getPlayerView,
  initializeGame,
  processAction,
  processTimeout,
  getAvailableActions,
  removeFromHand,
} from "./gameEngine.js";
const make = (n = 3) =>
  initializeGame(
    { roomId: "room", variant: "CLASSIC", bootAmount: 50n, minBet: 50n },
    Array.from({ length: n }, (_, i) => ({
      userId: `u${i}`,
      username: `Player ${i}`,
      chips: 5000n,
    })),
  );
test("blind cards stay private; seeing cards is irreversible and preserves the deadline", () => {
  const game = make();
  const p = game.players[1];
  const blind = getPlayerView(game, p.id) as any;
  assert.equal(blind.viewerPlayerId, p.id);
  assert.equal(blind.players[1].cards, undefined);
  assert.equal(blind.players[1].handResult, undefined);
  const seen = processAction(game, p.id, "see_cards");
  assert.equal(seen.turnStartedAt, game.turnStartedAt);
  assert.equal(game.players[1].isBlind, true);
  const view = getPlayerView(seen, p.id) as any;
  assert.equal(view.players[1].cards.length, 3);
  assert.equal(view.players[0].cards, undefined);
  assert.equal(
    (getPlayerView(seen, game.players[0].id) as any).players[1].handResult,
    undefined,
  );
});
test("exact legal bets, blind raises and internal timeout conserve chips", () => {
  let game = make();
  const p = game.players[game.currentPlayerIndex];
  assert.throws(() => processAction(game, p.id, "blind", 1n));
  assert.throws(() => processAction(game, p.id, "timeout"));
  game = processAction(game, p.id, "raise", 100n);
  assert.equal(game.currentBet, 100n);
  assert.equal(game.players.find((x) => x.id === p.id)!.isBlind, true);
  while (game.status === "playing") game = processTimeout(game);
  assert.equal(
    game.players.reduce((s, p) => s + p.chipsInPlay, 0n),
    15000n,
  );
  assert.equal(game.winners.length, 1);
  assert.ok(
    !(getPlayerView(game, p.id) as any).players.some((p: any) => p.cards),
  );
});
test("sideshow responds through the target view and timeout rejects without revealing hands", () => {
  let game = make();
  for (const p of game.players) game = processAction(game, p.id, "see_cards");
  game = processAction(
    game,
    game.players[game.currentPlayerIndex].id,
    "sideshow",
  );
  const target = game.sideshowPending!.targetId;
  assert.deepEqual(getAvailableActions(game, target), [
    "sideshow_accept",
    "sideshow_reject",
  ]);
  assert.deepEqual(
    getAvailableActions(game, game.sideshowPending!.requesterId),
    [],
  );
  game = processTimeout(game);
  assert.equal(game.sideshowPending, undefined);
  assert.equal(game.status, "playing");
});
test("off-turn leaving folds once without extending another player deadline", () => {
  let game = make();
  const p = game.players.find((p) => !p.isTurn)!;
  const deadline = game.turnStartedAt;
  game = removeFromHand(game, p.id);
  assert.equal(game.turnStartedAt, deadline);
  assert.equal(game.players.find((x) => x.id === p.id)!.status, "folded");
  assert.equal(removeFromHand(game, p.id), game);
});
test("unimplemented variants cannot start a misleading game", () => {
  assert.throws(() =>
    initializeGame(
      { roomId: "x", variant: "BEST_OF_FOUR", bootAmount: 1n, minBet: 1n },
      [
        { userId: "a", username: "A", chips: 100n },
        { userId: "b", username: "B", chips: 100n },
      ],
    ),
  );
});

test("legal mixed-action games terminate, preserve stacks, and reject post-hand changes", () => {
  for (let run = 0; run < 100; run++) {
    let game = make(2 + (run % 5));
    const bankroll = BigInt(game.players.length) * 5000n;
    let step = 0;
    while (game.status === "playing" && step++ < 1000) {
      const actor =
        game.players.find((p) => p.id === game.sideshowPending?.targetId) ??
        game.players[game.currentPlayerIndex];
      if (actor.isBlind && step % 3 === 0 && !game.sideshowPending)
        game = processAction(game, actor.id, "see_cards");
      else {
        const actions = getAvailableActions(game, actor.id);
        const action = actions[(run + step) % actions.length];
        game = processAction(game, actor.id, action);
      }
      assert.ok(game.players.every((p) => p.chipsInPlay >= 0n));
      assert.equal(
        game.players.reduce((s, p) => s + p.chipsInPlay, 0n) +
          (game.status === "finished" ? 0n : game.pot),
        bankroll,
      );
    }
    assert.equal(game.status, "finished");
    assert.ok(game.winners.length);
    assert.throws(() => processAction(game, game.winners[0], "pack"));
  }
});
