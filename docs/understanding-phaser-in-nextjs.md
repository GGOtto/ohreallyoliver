# Understanding a Phaser project inside Next.js

This guide is written for this repository: Next.js **16.3.6**, React **19.2.8**, TypeScript, the App Router, and pnpm. Phaser is not installed here yet. The example targets **Phaser 3.90.0** explicitly so its APIs have a clear version; this is not a claim that it is the newest release.

The goal is to understand an existing Phaser project and know where each part belongs when you put it on a Next.js page. Basic familiarity with components, imports, and JavaScript objects is enough to start.

## 1. Start with ownership

**Next.js serves the page. React owns the surrounding interface. Phaser owns the game running inside a canvas.**

Think of a page containing a playable game, a title, instructions, and a leaderboard:

| Responsibility | Where it belongs |
| --- | --- |
| URL, page layout, initial server data | Next.js |
| Instructions, settings forms, leaderboard display | React components |
| Characters, movement, collisions, game camera | Phaser |
| Keeping the game alive while its component is mounted | A small React wrapper |
| Persistent saves and authoritative score validation | Your backend |

React renders an empty container. Phaser inserts a canvas into it and manages the things drawn there. A sprite is usually not an HTML element, and moving it does not require a React render.

```text
Next.js route: /game
└── Page
    ├── Heading and instructions
    └── React game wrapper
        └── Container element
            └── Phaser canvas
                └── Active scenes and their game objects
```

This division gives you a useful debugging question: **Is the problem in the page, in the bridge, or inside the game?**

## 2. The vocabulary you need to read a project

### Game: the running engine

`new Phaser.Game(config)` starts an engine instance. The configuration connects the renderer, dimensions, parent element, scenes, and optional systems such as physics. Generally, one embedded game needs one instance, even if it has many levels. See [Phaser's game overview](https://docs.phaser.io/phaser/concepts/game).

Look for that constructor first when exploring an unfamiliar project. It tells you how the game starts.

### Scene: a unit of game behavior

A scene might be a loading screen, menu, level, or heads-up display. It is not a Next.js route. Switching scenes can happen entirely inside the same page and canvas.

The main lifecycle is:

```text
init(data) → preload() → create(data) → update(time, delta), repeatedly
```

| Method | Your job |
| --- | --- |
| `init` | Reset per-run state and receive scene startup data |
| `preload` | Queue assets that this scene needs |
| `create` | Build objects and register interactions |
| `update` | Apply behavior that must run each frame |

Phaser waits for assets queued in `preload` before calling `create`. A scene can omit lifecycle methods it does not need. Restarting a scene runs its startup lifecycle again, so reset run-specific fields in `init` or `create`; do not rely on its constructor running again. See [scene lifecycle](https://docs.phaser.io/phaser/concepts/scenes).

### Game objects: what exists in a scene

An image displays a texture; a sprite can also play frame animations; text displays a label; a container groups objects and transforms. A physics sprite adds a physics body to a visual object.

When you see `this.add.rectangle(...)`, `this` is the current scene and `add` is its object factory. The returned object is something you can move or change later. See [game objects](https://docs.phaser.io/phaser/concepts/gameobjects).

### Assets: files become named resources

```ts
// Inside preload(): load a file under a key.
this.load.image('player', '/game-assets/player.png');

// Inside create(): retrieve the texture by that key.
this.add.image(400, 225, 'player');
```

`player` is a lookup key. `/game-assets/player.png` is a URL. Following keys from their load calls to their uses is one of the fastest ways to understand unfamiliar game code. See [the loader](https://docs.phaser.io/phaser/concepts/loader).

## 3. How to explore an existing Phaser repository

Read it in this order, following one visible behavior all the way through:

1. **Package file:** Which Phaser version is installed? Which build tool runs it? Are there plugins or an editor involved?
2. **Entry point:** Find `new Phaser.Game`. Inspect its configuration and parent container.
3. **Scene registration:** Follow the `scene` array to the starting scene, then look for calls such as `this.scene.start('Play')`.
4. **Asset loading:** Find the texture keys, audio keys, tilemaps, and animation definitions used by that scene.
5. **Object creation:** Find where the player or another visible object is created.
6. **Behavior:** Follow its input handler, `update` logic, tween, or collision callback.
7. **State and cleanup:** Find score changes, scene transitions, save requests, and external event subscriptions.

For example, trace “clicking a coin increases the score”:

```text
coin texture loaded → coin object created → interaction enabled
→ click handler → score changes → score display updates
```

You do not need to understand every utility before you understand that path. Repeat with movement, losing, and restarting.

An existing Vite Phaser project may have its own `index.html` and entry script. When integrating its source into Next.js, Next takes over the page and bundling responsibilities. Move the game modules and assets, then connect the game constructor to a React wrapper. Review any Vite-specific environment variables, asset imports, or plugins separately.

The [official Phaser Next.js template](https://github.com/phaserjs/template-nextjs) is useful for comparison, especially its React bridge. Check its dependency versions before copying it into an existing application.

## 4. The Next.js boundary that matters

Phaser needs browser features such as the DOM and canvas. Server rendering cannot run the game.

`'use client'` enables React hooks and client behavior, but Client Components can still be prerendered on the server. Consequently, putting a top-level Phaser import into any client file is not a sufficient isolation strategy.

For this example, **import the game module inside `useEffect`**. Effects run in the browser, so the module that imports Phaser is evaluated there. The page can remain a Server Component.

```text
Server renders heading + empty game container
→ browser mounts the wrapper
→ effect imports the game module
→ module constructs Phaser in the container
→ leaving the page cleans up the game
```

Another valid pattern is `next/dynamic` with `ssr: false` around the game component. With the App Router, that call must live in a Client Component. You do not need both patterns for this example.

These boundaries were checked against this project's installed Next.js guides: `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` and `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`.

## 5. A complete small example

This example adds a `/game` page containing a rotating square. Clicking or tapping the square changes its color. It uses generated geometry so you can establish the integration before debugging asset files.

The snippets below are instructions to implement; the guide itself does not install Phaser or modify application code.

### Install the dependency

```sh
pnpm add phaser@3.90.0
```

### Use this file structure

```text
src/
  app/
    game/
      page.tsx
  components/
    PhaserGame.tsx
  game/
    createGame.ts
    scenes/
      PlayScene.ts
public/
  game-assets/          ← add when you start using image/audio files
```

`app/game` defines the website route. `src/game` contains the game implementation. Keeping these separate makes each easier to navigate.

### A. Define the scene

Create `src/game/scenes/PlayScene.ts`:

```ts
import Phaser from 'phaser';

export class PlayScene extends Phaser.Scene {
  private square?: Phaser.GameObjects.Rectangle;

  constructor() {
    super('Play');
  }

  create() {
    this.add.text(24, 24, 'Click or tap the square', {
      fontSize: '24px',
      color: '#ffffff',
    });

    const square = this.add.rectangle(400, 225, 96, 96, 0x60a5fa);
    this.square = square;
    square.setInteractive({ useHandCursor: true });

    square.on('pointerdown', () => {
      square.setFillStyle(Phaser.Display.Color.RandomRGB().color);
    });
  }

  update(_time: number, delta: number) {
    if (this.square) {
      this.square.rotation += (Math.PI / 2) * (delta / 1000);
    }
  }
}
```

`super('Play')` assigns the scene's key. `create` puts objects into it. `setInteractive` makes the square receive pointer events; Phaser's pointer system supports mouse and touch. See [input](https://docs.phaser.io/phaser/concepts/input).

The square rotates at roughly 90 degrees per second. `delta` is elapsed frame time in milliseconds, so multiplying a per-second speed by `delta / 1000` makes movement time-based. A fixed increment per frame would produce different speeds at different frame rates.

There is no physics system here because rotation and pointer interaction do not need one.

### B. Define the game factory

Create `src/game/createGame.ts`:

```ts
import Phaser from 'phaser';
import { PlayScene } from './scenes/PlayScene';

export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 800,
    height: 450,
    backgroundColor: '#111827',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [PlayScene],
  });
}
```

The factory creates a game only when called. `parent` tells Phaser exactly where to insert the canvas. Passing an element avoids collisions between hard-coded container IDs.

The 800 × 450 dimensions define the logical game area. `FIT` scales its display to fit the parent while preserving its proportions; it does not rewrite your scene coordinates. See [scale management](https://docs.phaser.io/phaser/concepts/scale-manager).

### C. Connect the game to React

Create `src/components/PhaserGame.tsx`:

```tsx
'use client';

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
        const { createGame } = await import('@/game/createGame');
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
```

Each part solves a specific problem:

| Part | Purpose |
| --- | --- |
| `'use client'` | Allows hooks in this component |
| `import type` | Uses Phaser's TypeScript type without a runtime import |
| `hostRef` | Gives Phaser a real DOM element after mounting |
| Dynamic `import()` in the effect | Keeps Phaser module evaluation in the browser |
| `disposed` flag | Prevents a late import from creating a game after unmount |
| Local `game` variable | Associates cleanup with this exact effect instance |
| `destroy(true)` | Requests engine destruction and removal of its canvas |
| Explicit aspect ratio | Reserves visible space before the game starts |

React development Strict Mode can run an extra effect setup/cleanup cycle. The cancellation check and cleanup are needed for that lifecycle and for ordinary navigation. See [React's effect reference](https://react.dev/reference/react/useEffect).

Phaser schedules destruction for a subsequent game step. Do not use the second `noReturn` argument to permanently disable recreation when the user might return to this page. See [Phaser 3.90 Game API](https://docs.phaser.io/api-documentation/3.90.0/class/game).

The error message catches module-loading and synchronous construction failures. Later scene exceptions still need the browser console; a larger game should also provide its own asset-loading progress and failure UI.

### D. Add the route

Create `src/app/game/page.tsx`:

```tsx
import PhaserGame from '@/components/PhaserGame';

export default function GamePage() {
  return (
    <main>
      <h1>My first Phaser scene</h1>
      <p>Click or tap the rotating square to change its color.</p>
      <PhaserGame />
    </main>
  );
}
```

Start the site with `pnpm dev`, then visit `/game` on the development server. The page imports only the React wrapper; the wrapper loads the engine after mounting.

## 6. Add assets, physics, and communication deliberately

### Images and animation

Put `player.png` in `public/game-assets/player.png`, then use `/game-assets/player.png` in `preload`. The public folder name does not appear in the URL. This follows the installed Next.js `public-folder.md` guide.

Replace the square with an image first. Introduce a sprite sheet or atlas when you need animation. A sprite sheet is a grid of frames; an atlas pairs an image with metadata identifying frames. Trace both loading and animation creation when reading a project that uses them.

The root-relative URLs here assume the site is deployed at `/`. If you configure a Next.js `basePath`, include that prefix in the URLs passed to Phaser's loader.

### Physics

Add physics when objects need physical movement or collision rules. For example, a platformer might use Arcade Physics for a moving player and static platforms. Inspect the project's configured physics engine before interpreting its collision code; Arcade and Matter use different APIs.

Keep manual movement and physics movement distinct. A manually moved object needs your coordinate updates; a physics body usually receives a velocity and the physics engine advances it. Do not multiply an engine velocity by frame delta a second time.

### React and Phaser communication

Use a small, explicit boundary:

```text
Phaser: player collects an item
→ callback or event: score changed to 12
→ React: update the score label

React: user clicks restart
→ game command
→ Phaser: restart the current scene
```

My recommendation is to keep position, velocity, and collision state inside Phaser. Send meaningful changes such as score, pause state, or level completion to React. Updating React state for every object on every frame creates unnecessary work.

A callback passed into the game factory is enough for a small project. Larger projects can use a typed event interface or controller. Keep callbacks stable so adding them as effect dependencies does not accidentally restart the engine on each render. Register listeners before events can fire, and remove external subscriptions when their owner stops.

This example owns the game inside an effect. To add a React restart button later, expose a narrow controller or store the game in a ref; do not construct another game on button clicks.

### Cleanup beyond the canvas

Phaser manages scene-owned objects, but subscriptions to an application-wide emitter, `window`, or your own timers need explicit cleanup. A scene can shut down without the entire game being destroyed. Tie those subscriptions to scene shutdown and re-register them when the scene starts again.

Keep database credentials on the server. If scores or rewards have real consequences, treat browser-submitted results as untrusted and validate them on the backend.

## 7. Common symptoms and where to look

| Symptom | First thing to inspect |
| --- | --- |
| `window` or `document` is undefined | A runtime Phaser import is reaching server evaluation |
| More than one canvas, repeated audio, duplicate callbacks | Repeated construction or missing cleanup |
| Blank space with no visible game | Container dimensions, scene startup, browser console |
| Missing texture | Asset request status, URL, spelling, and texture key |
| Clicking does nothing | Whether the object has `setInteractive()` and an input handler |
| Movement changes with frame rate | Fixed per-frame changes rather than elapsed-time-based motion |
| Game restarts when surrounding UI changes | Changing effect dependencies or a changing React `key` |
| Score doubles after restarting | External listeners accumulating across scene runs |
| Game looks stretched | CSS sizing fighting Phaser's scale mode |
| Controls interfere with page forms | Keyboard capture/focus policy needs to account for surrounding UI |

For responsive layouts, begin with the fixed logical size and `FIT` example. `RESIZE` changes the game dimensions with the parent and requires scene layout logic. If the parent changes size independently of the window, inspect whether you need a `ResizeObserver` and a scale refresh.

## 8. Verify the integration before adding a larger game

After implementing the example:

1. Load `/game` directly and reload it. The heading and exactly one playable canvas should appear.
2. Click or tap the square. Its color should change while it keeps rotating.
3. Navigate away and back through the site. Check for duplicate canvases or lingering game behavior.
4. Resize the browser. Confirm the square stays proportional and the game stays inside its container.
5. Run `pnpm lint` and `pnpm build`, then test the production server with `pnpm start`.
6. When adding real assets, inspect failed requests and test on a touch device as well as a desktop.

Canvas content does not automatically become accessible HTML. Keep instructions and useful controls in the surrounding page, and design keyboard alternatives as you extend the demo.

This guide was checked against the repository configuration, installed Next.js documentation, and linked primary sources. The example has not been installed, type-checked, or browser-tested in this repository.

## 9. A useful learning sequence

Work through these changes individually, observing which file owns each change:

1. Change the square's size and color: learn object creation.
2. Change rotation speed: learn the update loop and delta.
3. Replace it with a loaded image: learn asset URLs and texture keys.
4. Add a second scene and a transition: learn scene keys and lifecycle.
5. Show a click counter in React: learn communication across the boundary.
6. Add a restart control: learn lifecycle and cleanup.
7. Add physics only when your game needs collisions or physical movement.

You understand the foundation when you can explain where the game starts, why Phaser loads only in the browser, how a scene creates and updates its objects, how data crosses into React, and what happens when the user leaves the page.
