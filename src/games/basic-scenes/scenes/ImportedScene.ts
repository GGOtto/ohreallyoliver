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