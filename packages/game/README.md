# @tetris-trainer/game

A single-player Tetris game on TETR.IO's rules, built on the [`@haelp/teto`](https://www.npmjs.com/package/@haelp/teto) engine, with a control surface for driving it from outside: lessons, demonstrations and experiments.

A `Game` exposes the board, falling piece, ghost, hold, next queue, stats and game-over state, and takes key presses and releases from the player.

## Control

- **Setup:** `load` replaces the game with a board built in play order from piece placements, hold steps and garbage, a queue that starts with fixed pieces, and whether hold is allowed. Full lines clear while the board builds. A hold step puts the current piece in hold and brings out the piece held before, which is placed next, or falls first when the board ends there. With `validate` on, each piece must sit where gravity would leave it, and hold steps must follow the game's hold rules. The queue mode decides what follows the fixed pieces: `continue-bag` treats the board's pieces as drawn from the 7-bag in the order its placements and hold steps imply and continues it, `fresh-bag` starts a new bag with the fixed pieces, and `any` accepts any pieces. Normal 7-bags follow in every mode. A setup that breaks its rules throws a `SetupError` naming the item. `settles` runs the gravity check against the current board.
- **Placements:** a placement is a piece, an orientation (`spawn`, `right`, `reverse` or `left`), the column of its leftmost cell and the row of its lowest cell, with columns counting from 0 at the left wall and rows from 0 at the floor. `placementCells` returns the cells a placement fills, and `samePlacement` tells whether two placements fill the same cells, so an S, Z or I matches in either of its equivalent orientations.
- **Time:** the game's frame counter is its play time, advancing only when the game is ticked. `advance` plays the frames that fit in a span of real time at the current `setSpeed`, `pause` and `resume` stop and restart that clock, `step` plays exact frames whether paused or not, and `setGravity` sets the fall speed. A game is cheap to create, so separate purposes such as a demonstration and an attempt each get their own game with their own handling.
- **State:** `snapshot` captures the game and `restore` returns to it.
- **Input:** `setUserInput` turns the player's keys on and off, and `input` plays a script of steps starting at the current frame. A step taps a key, holds it for a number of frames, holds a shift long enough to reach the wall at the game's DAS and ARR, presses it or releases it, and starts its `wait` in frames after the previous step ends. `finesseSteps` returns the fewest rotation and shift steps that bring a piece from spawn to a target orientation and column, and `dropSteps` adds the hard drop, for any placement reachable by dropping straight down.
- **Garbage:** `addGarbage` inserts rows with a gap at a column under the stack immediately, and `removeGarbage` removes garbage rows from the bottom.
- **Events:** `on` subscribes to `spawn`, `hold`, `place` (the placement, the cells it filled, lines, spin, combo and back-to-back), `input` (from the player or a script) and `topout`, and returns an unsubscribe function.

## Config

`parseTetrioConfig` reads a TETR.IO config export (`.ttc`) into its handling settings and key bindings, and `findAction` finds the action bound to a keyboard key.
