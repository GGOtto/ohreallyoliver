"use client";

import { useEffect, useRef, useState } from 'react';
import type { Game } from 'phaser';

export default function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let game: Game | undefined;

    async function start() {
      try {
        const { createGame } = await import("../games/basic-scenes/createGame");
        if (disposed) return;
        game = createGame(host!);
      } catch (cause) {
        if (!disposed) {
          console.error('Game startup failed', cause);
          setError('The game could not start. Please reload the page.');
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
    <section aria-label="Interactive game demo">
      {error && <p role="alert">{error}</p>}
      <div
        ref={hostRef}
        style={{
          width: '100%',
          maxWidth: 800,
          aspectRatio: '16 / 9',
          marginInline: 'auto',
          overflow: 'hidden',
        }}
      />
    </section>
  );
}