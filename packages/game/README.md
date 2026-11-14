# @tetris-trainer/game

A single-player Tetris game on TETR.IO's rules, built on the [`@haelp/teto`](https://www.npmjs.com/package/@haelp/teto) engine, with a control surface for driving it from outside: lessons, demonstrations and experiments.

A `Game` exposes the board, falling piece, ghost, hold, next queue, stats and game-over state, and takes key presses and releases from the player.

## Control

- **Setup:** `load` replaces the game with a board built in play order from piece placements, hold steps and garbage, a queue that starts with fixed pieces, and whether hold is allowed. Full lines clear while the board builds. A hold step puts the current piece in hold and brings out the piece held before, which is placed next, or falls first when the board ends there. With `validate` on, each piece must sit where gravity would leave it, and hold steps must follow the game's hold rules. The queue mode decides what follows the fixed pieces: `continue-bag` treats the board's pieces as drawn from the 7-bag in the order its placements and hold steps imply and continues it, `fresh-bag` starts a new bag with the fixed pieces, and `any` accepts any pieces. Normal 7-bags follow in every mode. A setup that breaks its rules throws a `SetupError` naming the item. `settles` runs the gravity check against the current board.
- **Placements:** a placement is a piece, a rotation and the `x`/`y` of the top-left corner of the piece's rotation box, with `y` counting rows up from the bottom of the board. `placementCells` returns the cells a placement fills.
- **Time:** `advance` plays the frames that fit in a span of real time at the current `setSpeed`, `pause` and `resume` stop and restart that clock, `step` plays exact frames whether paused or not, and `setGravity` sets the fall speed.
- **State:** `snapshot` captures the game and `restore` returns to it.
- **Input:** `setUserInput` turns the player's keys on and off, and `input` schedules key presses and releases relative to the current frame. `taps` turns a list of keys into evenly spaced presses and releases.
- **Garbage:** `addGarbage` inserts rows with a gap at a column under the stack immediately, and `removeGarbage` removes garbage rows from the bottom.
- **Events:** `on` subscribes to `spawn`, `hold`, `place` (the placement, the cells it filled, lines, spin, combo and back-to-back), `input` (from the player or a script) and `topout`, and returns an unsubscribe function.

## Config

`parseTetrioConfig` reads a TETR.IO config export (`.ttc`) into its handling settings and key bindings, and `findAction` finds the action bound to a keyboard key.
