import * as Phaser from 'phaser';

const tileImages = [
  'tree-1.png',
  'bush.png',
  'grass-tile-1.png',
  'path-tile-1.png',
];

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('Play');
  }

  preload() {
    const folder = '/game-assets/basic-scenes/scene-1';

    this.load.tilemapTiledJSON('level', `${folder}/first-scene.json`);

    for (const filename of tileImages) {
      // Images sit beside the JSON, so its image paths are just filenames.
      this.load.image(filename, `${folder}/${filename}`);
    }
  }

  create() {
    const map = this.make.tilemap({ key: 'level' });

    // Phaser creates one tileset per image in a Tiled image collection.
    const tilesets = tileImages.map((filename) => {
      const tileset = map.addTilesetImage(filename, filename);

      if (!tileset) {
        throw new Error(`Could not connect tile image: ${filename}`);
      }

      return tileset;
    });

    // Draw the ground first, then the trees and bushes above it.
    for (const name of ['Tile Layer 1', 'Tile Layer 2']) {
      if (!map.createLayer(name, tilesets, 0, 0)) {
        throw new Error(`Could not create tile layer: ${name}`);
      }
    }

    this.cameras.main.setBounds(
      0,
      0,
      map.widthInPixels,
      map.heightInPixels,
    );
  }
}
