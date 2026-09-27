import * as Phaser from "phaser";
import { PlayScene } from "./scenes/MainMenu";

export function createGame(parent: HTMLElement): Phaser.Game {
	return new Phaser.Game({
		type: Phaser.AUTO,
		parent,
		width: 800,
		height: 800,
		backgroundColor: "#111827",
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.NO_CENTER,
		},
		scene: [PlayScene],
	});
}
