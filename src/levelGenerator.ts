import type {
  Cell,
  Level,
  Position,
  Direction,
  PipeType,
} from './types';
import {
  PIPE_TYPES,
  EMPTY_PIPE,
  getAdjacentPosition,
  isValidPosition,
} from './types';

export class LevelGenerator {
  private size: number;
  private grid: Cell[][];
  private startPos!: Position;
  private endPos!: Position;
  private path!: Position[];

  constructor(size: number = 8) {
    this.size = size;
    this.grid = this.createEmptyGrid();
  }

  private createEmptyGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let row = 0; row < this.size; row++) {
      grid[row] = [];
      for (let col = 0; col < this.size; col++) {
        grid[row][col] = {
          row,
          col,
          pipeType: null,
          rotation: 0,
          isPath: false,
          isStart: false,
          isEnd: false,
        };
      }
    }
    return grid;
  }

  private selectStartAndEnd(): void {
    const edges: Direction[] = [0, 1, 2, 3]; // 上、右、下、左
    const startEdge = edges[Math.floor(Math.random() * edges.length)];
    let endEdge = edges[Math.floor(Math.random() * edges.length)];
    while (endEdge === startEdge) {
      endEdge = edges[Math.floor(Math.random() * edges.length)];
    }

    this.startPos = this.getEdgePosition(startEdge);
    this.endPos = this.getEdgePosition(endEdge);

    this.grid[this.startPos.row][this.startPos.col].isStart = true;
    this.grid[this.endPos.row][this.endPos.col].isEnd = true;
  }

  private getEdgePosition(edge: Direction): Position {
    const offset = Math.floor(Math.random() * (this.size - 2)) + 1;
    switch (edge) {
      case 0: // 上边缘
        return { row: 0, col: offset };
      case 1: // 右边缘
        return { row: offset, col: this.size - 1 };
      case 2: // 下边缘
        return { row: this.size - 1, col: offset };
      case 3: // 左边缘
        return { row: offset, col: 0 };
    }
  }

  private generatePath(): boolean {
    const visited = new Set<string>();
    const path: Position[] = [];

    const dfs = (current: Position): boolean => {
      const key = `${current.row},${current.col}`;
      if (visited.has(key)) return false;
      visited.add(key);
      path.push(current);

      if (current.row === this.endPos.row && current.col === this.endPos.col) {
        return true;
      }

      const directions: Direction[] = [0, 1, 2, 3].sort(() => Math.random() - 0.5) as Direction[];
      for (const dir of directions) {
        const next = getAdjacentPosition(current, dir);
        if (isValidPosition(next, this.size) && !visited.has(`${next.row},${next.col}`)) {
          if (dfs(next)) return true;
        }
      }

      path.pop();
      return false;
    };

    const success = dfs(this.startPos);
    if (success) {
      this.path = path;
      path.forEach(pos => {
        this.grid[pos.row][pos.col].isPath = true;
      });
    }
    return success;
  }

  private assignPipes(): void {
    for (let i = 0; i < this.path.length; i++) {
      const current = this.path[i];
      const prev = i > 0 ? this.path[i - 1] : null;
      const next = i < this.path.length - 1 ? this.path[i + 1] : null;

      const connections: Direction[] = [];

      if (prev) {
        connections.push(this.getDirection(current, prev));
      } else {
        connections.push(this.getEdgeDirection(current));
      }

      if (next) {
        connections.push(this.getDirection(current, next));
      } else {
        connections.push(this.getEdgeDirection(current));
      }

      const pipeType = this.findMatchingPipeType(connections);
      if (pipeType) {
        const rotation = this.calculateRotation(pipeType, connections);
        this.grid[current.row][current.col].pipeType = pipeType;
        this.grid[current.row][current.col].rotation = rotation;
      }
    }

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (!this.grid[row][col].isPath) {
          this.grid[row][col].pipeType = EMPTY_PIPE;
          this.grid[row][col].rotation = 0;
        }
      }
    }
  }

  private getDirection(from: Position, to: Position): Direction {
    const deltaRow = to.row - from.row;
    const deltaCol = to.col - from.col;
    if (deltaRow === -1) return 0;
    if (deltaCol === 1) return 1;
    if (deltaRow === 1) return 2;
    return 3;
  }

  private getEdgeDirection(pos: Position): Direction {
    if (pos.row === 0) return 0;
    if (pos.col === this.size - 1) return 1;
    if (pos.row === this.size - 1) return 2;
    return 3;
  }

  private findMatchingPipeType(connections: Direction[]): PipeType | null {
    const sorted = [...connections].sort().join(',');
    for (const pipeType of PIPE_TYPES) {
      const pipeSorted = [...pipeType.connections].sort().join(',');
      if (sorted === pipeSorted) {
        return pipeType;
      }
    }
    return null;
  }

  private calculateRotation(pipeType: PipeType, targetConnections: Direction[]): number {
    for (let rotation = 0; rotation < 4; rotation++) {
      const rotated = pipeType.connections.map(dir => ((dir + rotation) % 4) as Direction).sort();
      const target = [...targetConnections].sort();
      if (rotated.join(',') === target.join(',')) {
        return rotation;
      }
    }
    return 0;
  }

  private rotatePathPipes(): void {
    for (const pos of this.path) {
      const cell = this.grid[pos.row][pos.col];
      if (cell.pipeType && cell.pipeType.id !== 'empty') {
        const randomRotation = Math.floor(Math.random() * 4);
        cell.rotation = randomRotation;
      }
    }
  }

  public generate(): Level {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      this.grid = this.createEmptyGrid();
      this.selectStartAndEnd();

      if (this.generatePath()) {
        this.assignPipes();
        this.rotatePathPipes();
        return {
          grid: this.grid,
          startPos: this.startPos,
          endPos: this.endPos,
          size: this.size,
        };
      }
      attempts++;
    }

    throw new Error('Failed to generate level after maximum attempts');
  }
}

export const generateLevel = (size: number = 8): Level => {
  const generator = new LevelGenerator(size);
  return generator.generate();
};
