import PhaserGame from "@/components/PhaserGame";

export default function GamePage() {
	return (
		<main className="game-page">
			<PhaserGame gameFolder="snake" />
		</main>
	);
}
