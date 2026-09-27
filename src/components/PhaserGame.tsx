"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "phaser";
import "./PhaseGame.scss";

type PhaserGameProps = {
	gameFolder: string;
};

export default function PhaserGame(props: PhaserGameProps) {
	const { gameFolder } = props;
	const hostRef = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;

		let disposed = false;
		let game: Game | undefined;

		async function start() {
			try {
				const { createGame } = await import(
					`../games/${gameFolder}/createGame`
				);
				if (disposed) return;
				game = createGame(host!);
			} catch (cause) {
				if (!disposed) {
					console.error("Game startup failed", cause);
					setError(
						"The game could not start. Please reload the page.",
					);
				}
			}
		}

		void start();

		return () => {
			disposed = true;
			game?.destroy(true);
		};
	}, []);

	return (
		<section aria-label="game box">
			{error && <p role="alert">{error}</p>}
			<div className="game-box" ref={hostRef} />
		</section>
	);
}
