import assert from 'node:assert/strict';
import test from 'node:test';
import { getPlayerView, initializeGame } from './gameEngine.js';

test('player views identify the viewer and keep opponents cards private', () => {
  const game = initializeGame(
    {
      roomId: '00000000-0000-4000-8000-000000000001',
      variant: 'CLASSIC',
      bootAmount: 50n,
      minBet: 50n,
    },
    [
      { userId: 'host', username: 'Host', chips: 5000n },
      { userId: 'guest', username: 'Guest', chips: 5000n },
    ],
  );

  const guest = game.players[1];
  const view = getPlayerView(game, guest.id) as {
    viewerPlayerId: string;
    players: Array<{ id: string; cards?: unknown[] }>;
  };

  assert.equal(view.viewerPlayerId, guest.id);
  assert.equal(view.players.find(player => player.id === guest.id)?.cards?.length, 3);
  assert.equal(view.players.find(player => player.id !== guest.id)?.cards, undefined);
});
