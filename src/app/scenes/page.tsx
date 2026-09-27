import PhaserGame from "@/components/PhaserGame";

export default function GamePage() {
	return (
		<main className="game-page" aria-label="Terrain scenes">
			<PhaserGame gameFolder="basic-scenes" />
		</main>
	);
}
