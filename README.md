# Tetris Trainer

Tetris Trainer is a desktop Tetris game that plays on TETR.IO's rules and handling. Load your TETR.IO config export (`.ttc`) and the game uses your key bindings and your DAS, ARR, DCD and SDF settings, so it plays like your own setup.

It is the base for a training tool: a playable game first, with control over the game and training experiments to be built on top.

## Playing

The play area sits on the left and a sidebar on the right switches between free play and lessons.

- **Free play:** an endless game. Load a TETR.IO config with "Load TETR.IO config�"; until then the game uses TETR.IO's default bindings and handling. Your config's retry key restarts, and when the stack tops out the game-over screen shows pieces, lines and time with a restart button.
- **TKI:** learn the TKI opener, a first-bag shape that ends in a T-spin double, in three parts.
   - **Rules** walks through the shape, where each piece goes, what it rests on, when to hold and how to tell whether an order can build it.
   - **Watch** deals a first bag and plays it through, explaining each decision. Choose orders that need no hold, orders that need hold, or a mix that includes orders TKI can't be built from.
   - **Practice** deals the same three kinds of order for you to build with your own config. A move that makes TKI unreachable pauses the game, shows your piece in red and the right move in green, and lets you retry from that moment. In the mixed stage, press Impossible when an order can't build TKI.

## License

[MIT](LICENSE)
