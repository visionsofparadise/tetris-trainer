# Tetris Trainer

Tetris Trainer is a desktop Tetris game that plays on TETR.IO's rules and handling. Load your TETR.IO config export (`.ttc`) and the game uses your key bindings and your DAS, ARR, DCD and SDF settings, so it plays like your own setup.

It is the base for a training tool: a playable game first, with control over the game and training experiments to be built on top.

## Playing

The play area sits on the left with the hold piece, stats, next queue and the keys you are pressing; the panel on the right lists the lessons, and the settings button in the title bar swaps it for your config.

- **Free play:** an endless game. Open settings and load a TETR.IO config with "Load TETR.IO config�"; until then the game uses TETR.IO's default bindings and handling. The restart button in the title bar or your config's retry key restarts, the pause button or your exit key (Esc by default) pauses, and when the stack tops out a game-over card offers a restart.
- **TKI:** a lesson on the TKI opener, a first-bag shape that ends in a T-spin double, in three sections. Lesson text shows pieces as small coloured glyphs.
   - **Rules** walks through the shape, where each piece goes, what it rests on, when to hold and how to tell whether an order can build it.
   - **Watch** deals a first bag and plays it through, explaining each decision. Choose orders that need no hold, orders that need hold, or a mix that includes orders TKI can't be built from.
   - **Practice** deals the same three kinds of order for you to build with your own config. A move that makes TKI unreachable pauses the game, outlines your piece in pink, hatches where the right move goes and explains the mistake on the board, and lets you retry from that moment. In the "With impossible" stage, press Impossible when an order can't build TKI. Turn on the guide to hatch where each piece goes, and pause from the title bar or with your exit key.

## License

[MIT](LICENSE)
