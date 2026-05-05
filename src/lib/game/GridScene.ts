// GridScene — main Phaser scene for the Cangaroo game
import Phaser from 'phaser';
import { eventBus } from './EventBus';
import type { CommandAction } from '$lib/parser/interpreter';
import type { LevelDefinition } from '$lib/stores/levels';

const CELL_SIZE = 52;
const SPRITE_ROWS = 4;
const SPRITE_COLS = 4;

// Direction mapping to spritesheet rows
// Row 0: front (down), Row 1: back (up), Row 2: right, Row 3: left
const DIR_FRAMES: Record<string, { row: number; flip: boolean }> = {
  down:  { row: 0, flip: false },
  up:    { row: 1, flip: false },
  right: { row: 3, flip: false },
  left:  { row: 2, flip: false }
};

export class GridScene extends Phaser.Scene {
  private kangaroo!: Phaser.GameObjects.Sprite;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private paintedGraphics!: Phaser.GameObjects.Graphics;
  private targetGraphics!: Phaser.GameObjects.Graphics;
  private obstacleSprites: Phaser.GameObjects.Image[] = [];

  private gridX: number = 0;
  private gridY: number = 0;
  private direction: 'up' | 'down' | 'left' | 'right' = 'right';
  private gridWidth: number = 6;
  private gridHeight: number = 6;
  private paintedCells: Set<string> = new Set();
  private targetCells: Set<string> = new Set();
  private obstacles: Map<string, { type: string }> = new Map();
  private level: LevelDefinition | null = null;

  private commandQueue: CommandAction[] = [];
  private isExecuting: boolean = false;
  private currentCommandIndex: number = 0;
  private speed: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor() {
    super({ key: 'GridScene' });
  }

  preload() {
    // Load kangaroo spritesheet
    this.load.spritesheet('kangaroo', '/assets/cangoroun.png', {
      frameWidth: 313,
      frameHeight: 313
    });
    // Load obstacole atlas
    this.load.atlas('obstacole', '/assets/obstacole.png', '/assets/obstacole_atlas.json');
    // Load tileset (2816x1536, 4x2 grid = 704x768 per tile)
    this.load.spritesheet('tileset', '/assets/tileset.png', {
      frameWidth: 704,
      frameHeight: 768
    });
  }

  create() {
    // Remove white background from kangaroo spritesheet
    this.removeWhiteBackground('kangaroo');

    this.gridGraphics = this.add.graphics();
    this.targetGraphics = this.add.graphics();
    this.paintedGraphics = this.add.graphics();

    // Create kangaroo sprite (use cleaned texture if available)
    const texKey = this.textures.exists('kangaroo_clean') ? 'kangaroo_clean' : 'kangaroo';
    this.kangaroo = this.add.sprite(0, 0, texKey, 0);
    this.kangaroo.setDisplaySize(CELL_SIZE * 0.85, CELL_SIZE * 0.85);
    this.kangaroo.setDepth(10);

    // Create walk animations for each direction using first 3 columns
    const dirs = ['down', 'up', 'left', 'right'];
    dirs.forEach(dir => {
      const row = DIR_FRAMES[dir].row;
      this.anims.create({
        key: `walk_${dir}`,
        frames: this.anims.generateFrameNumbers(texKey, { 
          frames: [row * SPRITE_COLS, row * SPRITE_COLS + 1, row * SPRITE_COLS + 2] 
        }),
        frameRate: 12,
        repeat: -1
      });
    });

    // Set up event listeners
    eventBus.on('execute-code', (commands: CommandAction[]) => {
      this.startExecution(commands);
    });

    eventBus.on('load-code', (commands: CommandAction[]) => {
      this.resetLevelVisuals();
      this.commandQueue = commands;
      this.currentCommandIndex = 0;
      this.isExecuting = false;
    });

    eventBus.on('resume', () => {
      if (this.commandQueue.length > 0 && this.currentCommandIndex < this.commandQueue.length) {
        this.isExecuting = true;
        eventBus.emit('execution-start');
        this.executeNextCommand();
      }
    });

    eventBus.on('step', () => {
      this.executeStep();
    });

    eventBus.on('stop', () => {
      this.stopExecution();
    });

    eventBus.on('reset', () => {
      this.resetLevel();
    });

    eventBus.on('speed-change', (speed: number) => {
      this.speed = speed;
    });

    eventBus.on('load-level', (level: LevelDefinition) => {
      this.loadLevel(level);
    });

    // Draw initial state
    eventBus.emit('scene-ready');
  }

  loadLevel(level: LevelDefinition) {
    this.level = level;
    this.gridWidth = level.gridWidth;
    this.gridHeight = level.gridHeight;
    this.gridX = level.startX;
    this.gridY = level.startY;
    this.direction = level.startDirection;
    this.paintedCells.clear();
    this.targetCells.clear();
    this.obstacles.clear();
    this.commandQueue = [];
    this.isExecuting = false;
    this.currentCommandIndex = 0;

    // Center grid in canvas
    const canvasW = this.scale.width;
    const canvasH = this.scale.height;
    this.offsetX = Math.floor((canvasW - this.gridWidth * CELL_SIZE) / 2);
    this.offsetY = Math.floor((canvasH - this.gridHeight * CELL_SIZE) / 2);

    // Load targets
    for (const t of level.targets) {
      this.targetCells.add(`${t.x},${t.y}`);
    }

    // Load obstacles
    for (const o of level.obstacles) {
      this.obstacles.set(`${o.x},${o.y}`, { type: o.type });
    }

    // Clear old obstacle sprites
    this.obstacleSprites.forEach(s => s.destroy());
    this.obstacleSprites = [];

    this.drawGrid();
    this.drawTargets();
    this.drawObstacles();
    this.updateKangarooPosition(false);
  }

  private drawGrid() {
    this.gridGraphics.clear();

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const px = this.offsetX + x * CELL_SIZE;
        const py = this.offsetY + y * CELL_SIZE;

        // Cell background
        this.gridGraphics.fillStyle(0x1e293b, 0.6);
        this.gridGraphics.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        // Cell border with subtle cyan
        this.gridGraphics.lineStyle(1, 0x22d3ee, 0.15);
        this.gridGraphics.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }

    // Outer border glow
    this.gridGraphics.lineStyle(2, 0x22d3ee, 0.4);
    this.gridGraphics.strokeRect(
      this.offsetX - 1, this.offsetY - 1,
      this.gridWidth * CELL_SIZE + 2, this.gridHeight * CELL_SIZE + 2
    );
  }

  private drawTargets() {
    this.targetGraphics.clear();
    this.targetCells.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      const px = this.offsetX + x * CELL_SIZE;
      const py = this.offsetY + y * CELL_SIZE;

      // Target cell with pulsing indicator
      this.targetGraphics.fillStyle(0xd946ef, 0.15);
      this.targetGraphics.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);

      // Diamond marker in center
      this.targetGraphics.lineStyle(2, 0xd946ef, 0.6);
      const cx = px + CELL_SIZE / 2;
      const cy = py + CELL_SIZE / 2;
      const s = 8;
      this.targetGraphics.beginPath();
      this.targetGraphics.moveTo(cx, cy - s);
      this.targetGraphics.lineTo(cx + s, cy);
      this.targetGraphics.lineTo(cx, cy + s);
      this.targetGraphics.lineTo(cx - s, cy);
      this.targetGraphics.closePath();
      this.targetGraphics.strokePath();
    });
  }

  private drawObstacles() {
    this.obstacles.forEach((obs, key) => {
      const [x, y] = key.split(',').map(Number);
      const px = this.offsetX + x * CELL_SIZE;
      const py = this.offsetY + y * CELL_SIZE;

      let frame = 'tree'; // default
      if (obs.type === 'rock') frame = 'rock';
      else if (obs.type === 'water') frame = 'water';

      const sprite = this.add.sprite(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 'obstacole', frame);
      sprite.setDisplaySize(CELL_SIZE * 0.9, CELL_SIZE * 0.9);
      sprite.setDepth(5);
      this.obstacleSprites.push(sprite);
    });
  }

  private drawPaintedCells() {
    this.paintedGraphics.clear();
    this.paintedCells.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      const px = this.offsetX + x * CELL_SIZE;
      const py = this.offsetY + y * CELL_SIZE;

      // Neon painted cell
      this.paintedGraphics.fillStyle(0x22d3ee, 0.35);
      this.paintedGraphics.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);

      // Inner glow border
      this.paintedGraphics.lineStyle(1, 0x22d3ee, 0.7);
      this.paintedGraphics.strokeRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);

      // Check if this was a target — show it as completed
      if (this.targetCells.has(key)) {
        this.paintedGraphics.fillStyle(0x84cc16, 0.4);
        this.paintedGraphics.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        this.paintedGraphics.lineStyle(2, 0x84cc16, 0.8);
        this.paintedGraphics.strokeRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);
      }
    });
  }

  private updateKangarooPosition(animate: boolean = true) {
    const targetX = this.offsetX + this.gridX * CELL_SIZE + CELL_SIZE / 2;
    const targetY = this.offsetY + this.gridY * CELL_SIZE + CELL_SIZE / 2;

    const dirInfo = DIR_FRAMES[this.direction];
    this.kangaroo.setFlipX(dirInfo.flip);

    if (animate) {
      this.kangaroo.play(`walk_${this.direction}`);
      const duration = 300 / this.speed;
      this.tweens.add({
        targets: this.kangaroo,
        x: targetX,
        y: targetY,
        duration,
        ease: 'Power2',
        onComplete: () => {
          this.kangaroo.stop();
          this.updateDirectionSprite();
          this.continueExecution();
        }
      });
    } else {
      this.kangaroo.setPosition(targetX, targetY);
      this.updateDirectionSprite();
    }
  }

  private startExecution(commands: CommandAction[]) {
    if (this.isExecuting) return;
    this.resetLevelVisuals();
    this.commandQueue = commands;
    this.currentCommandIndex = 0;
    this.isExecuting = true;
    eventBus.emit('execution-start');
    this.executeNextCommand();
  }

  private executeStep() {
    if (this.commandQueue.length === 0) return;
    if (this.currentCommandIndex >= this.commandQueue.length) {
      this.checkWinCondition();
      eventBus.emit('execution-complete');
      return;
    }
    this.executeSingleCommand(this.commandQueue[this.currentCommandIndex]);
    this.currentCommandIndex++;
  }

  private stopExecution() {
    this.isExecuting = false;
    this.tweens.killAll();
    eventBus.emit('execution-stop');
  }

  private resetLevelVisuals() {
    this.stopExecution();
    if (this.level) {
      this.gridX = this.level.startX;
      this.gridY = this.level.startY;
      this.direction = this.level.startDirection;
      this.paintedCells.clear();
      this.drawPaintedCells();
      this.updateKangarooPosition(false);
    }
  }

  private resetLevel() {
    this.commandQueue = [];
    this.currentCommandIndex = 0;
    this.resetLevelVisuals();
  }

  private executeNextCommand() {
    if (!this.isExecuting) return;
    if (this.currentCommandIndex >= this.commandQueue.length) {
      this.isExecuting = false;
      this.checkWinCondition();
      eventBus.emit('execution-complete');
      return;
    }

    const cmd = this.commandQueue[this.currentCommandIndex];
    this.currentCommandIndex++;
    this.executeSingleCommand(cmd);
  }

  private continueExecution() {
    if (this.isExecuting) {
      // Small delay between commands for visual clarity
      this.time.delayedCall(50 / this.speed, () => {
        this.executeNextCommand();
      });
    }
  }

  private executeSingleCommand(cmd: CommandAction) {
    switch (cmd.type) {
      case 'pas': {
        const next = this.getNextPosition();
        if (this.isValidPosition(next.x, next.y) && !this.obstacles.has(`${next.x},${next.y}`)) {
          this.gridX = next.x;
          this.gridY = next.y;
          this.updateKangarooPosition(true);
        } else {
          // Can't move — flash red and continue
          this.flashError();
          this.continueExecution();
        }
        break;
      }

      case 'rotire_dreapta':
        this.direction = this.turnRight(this.direction);
        this.updateDirectionSprite();
        this.time.delayedCall(150 / this.speed, () => this.continueExecution());
        break;

      case 'rotire_stinga':
        this.direction = this.turnLeft(this.direction);
        this.updateDirectionSprite();
        this.time.delayedCall(150 / this.speed, () => this.continueExecution());
        break;

      case 'vopseste':
        this.paintedCells.add(`${this.gridX},${this.gridY}`);
        this.drawPaintedCells();
        this.flashPaint();
        this.time.delayedCall(200 / this.speed, () => this.continueExecution());
        break;

      case 'sari': {
        const next1 = this.getNextPosition();
        const obsKey = `${next1.x},${next1.y}`;
        const obs = this.obstacles.get(obsKey);
        
        if (obs && obs.type === 'tree') {
          // Cannot jump over a tree
          this.flashError();
          this.continueExecution();
          break;
        }

        const jumpX = next1.x + (next1.x - this.gridX);
        const jumpY = next1.y + (next1.y - this.gridY);
        
        if (this.isValidPosition(jumpX, jumpY) && !this.obstacles.has(`${jumpX},${jumpY}`)) {
          this.gridX = jumpX;
          this.gridY = jumpY;
          // Jump animation — arc
          this.kangaroo.play(`walk_${this.direction}`);
          const targetX = this.offsetX + this.gridX * CELL_SIZE + CELL_SIZE / 2;
          const targetY = this.offsetY + this.gridY * CELL_SIZE + CELL_SIZE / 2;
          const duration = 400 / this.speed;
          this.tweens.add({
            targets: this.kangaroo,
            x: targetX,
            y: targetY,
            duration,
            ease: 'Bounce.easeOut',
            onComplete: () => {
              this.kangaroo.stop();
              this.updateDirectionSprite();
              this.continueExecution();
            }
          });
        } else {
          this.flashError();
          this.continueExecution();
        }
        break;
      }
    }
  }

  private updateDirectionSprite() {
    const dirInfo = DIR_FRAMES[this.direction];
    const frameIndex = dirInfo.row * SPRITE_COLS;
    this.kangaroo.setFrame(frameIndex);
    this.kangaroo.setFlipX(dirInfo.flip);
  }

  private flashPaint() {
    const px = this.offsetX + this.gridX * CELL_SIZE;
    const py = this.offsetY + this.gridY * CELL_SIZE;
    const flash = this.add.graphics();
    flash.fillStyle(0x22d3ee, 0.6);
    flash.fillRect(px, py, CELL_SIZE, CELL_SIZE);
    flash.setDepth(8);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }

  private flashError() {
    const px = this.offsetX + this.gridX * CELL_SIZE;
    const py = this.offsetY + this.gridY * CELL_SIZE;
    const flash = this.add.graphics();
    flash.fillStyle(0xef4444, 0.5);
    flash.fillRect(px, py, CELL_SIZE, CELL_SIZE);
    flash.setDepth(8);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    });
  }

  private getNextPosition(): { x: number; y: number } {
    switch (this.direction) {
      case 'up': return { x: this.gridX, y: this.gridY - 1 };
      case 'down': return { x: this.gridX, y: this.gridY + 1 };
      case 'left': return { x: this.gridX - 1, y: this.gridY };
      case 'right': return { x: this.gridX + 1, y: this.gridY };
    }
  }

  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
  }

  private turnRight(dir: typeof this.direction): typeof this.direction {
    const map = { up: 'right' as const, right: 'down' as const, down: 'left' as const, left: 'up' as const };
    return map[dir];
  }

  private turnLeft(dir: typeof this.direction): typeof this.direction {
    const map = { up: 'left' as const, left: 'down' as const, down: 'right' as const, right: 'up' as const };
    return map[dir];
  }

  private removeWhiteBackground(textureKey: string) {
    try {
      const texture = this.textures.get(textureKey);
      const source = texture.getSourceImage() as HTMLImageElement;

      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(source, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Remove white/near-white pixels (threshold: RGB > 235)
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // Add processed texture
      if (this.textures.exists('kangaroo_clean')) {
        this.textures.remove('kangaroo_clean');
      }
      this.textures.addSpriteSheet('kangaroo_clean', canvas, {
        frameWidth: 313,
        frameHeight: 313
      });
    } catch (e) {
      console.warn('Could not remove white background:', e);
    }
  }

  private checkWinCondition() {
    if (this.targetCells.size === 0) return;

    let allPainted = true;
    this.targetCells.forEach(key => {
      if (!this.paintedCells.has(key)) allPainted = false;
    });

    if (allPainted) {
      eventBus.emit('level-complete', this.level?.id);
      // Victory animation
      this.tweens.add({
        targets: this.kangaroo,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 200,
        yoyo: true,
        repeat: 2,
        ease: 'Bounce'
      });
    }
  }
}
