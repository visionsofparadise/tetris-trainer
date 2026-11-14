# Tetris Trainer

Tetris Trainer is a desktop Tetris game that plays on TETR.IO's rules and handling. Load your TETR.IO config export (`.ttc`) and the game uses your key bindings and your DAS, ARR, DCD and SDF settings, so it plays like your own setup.

It is the base for a training tool: a playable game first, with control over the game and training experiments to be built on top.

## Playing

The play area sits on the left and a sidebar on the right switches between free play and lessons.

- **Free play:** an endless game. Load a TETR.IO config with "Load TETR.IO config�"; until then the game uses TETR.IO's default bindings and handling. Your config's retry key restarts, and when the stack tops out the game-over screen shows pieces, lines and time with a restart button.
- **Lessons:** each lesson teaches a fixed piece sequence. "Demonstrate" plays it, and "Attempt" lets you try it with your own config. A wrong placement fails the attempt and a full correct sequence clears it; either way the attempt restarts.

## License

[MIT](LICENSE)
