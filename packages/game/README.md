# @tetris-trainer/game

A single-player Tetris game on TETR.IO's rules, built on the [`@haelp/teto`](https://www.npmjs.com/package/@haelp/teto) engine. A `Game` advances one 60 Hz frame per `tick`, takes key presses and releases, and exposes the board, falling piece, ghost, hold, next queue, stats and game-over state.

It also reads TETR.IO config exports (`.ttc`): `parseTetrioConfig` returns the handling settings and key bindings, and `findAction` finds the action bound to a keyboard key.
