import type { Level, Position, Direction } from './types';
import { getAdjacentPosition, canConnect } from './types';

export class ConnectionChecker {
  private level: Level;
  private visited: Set<string>;
  private connectedCells: Set<string>;

  constructor(level: Level) {
    this.level = level;
    this.visited = new Set();
    this.connectedCells = new Set();
  }

  public checkConnection(): boolean {
    this.visited.clear();
    this.connectedCells.clear();

    const queue: Position[] = [this.level.startPos];
    this.visited.add(this.getKey(this.level.startPos));
    this.connectedCells.add(this.getKey(this.level.startPos));

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentCell = this.level.grid[current.row][current.col];

      if (current.row === this.level.endPos.row && current.col === this.level.endPos.col) {
        return true;
      }

      const directions: Direction[] = [0, 1, 2, 3];
      for (const dir of directions) {
        const nextPos = getAdjacentPosition(current, dir);
        const nextKey = this.getKey(nextPos);

        if (!this.visited.has(nextKey) && this.isValidPosition(nextPos)) {
          const nextCell = this.level.grid[nextPos.row][nextPos.col];
          if (canConnect(currentCell, nextCell, dir)) {
            this.visited.add(nextKey);
            this.connectedCells.add(nextKey);
            queue.push(nextPos);
          }
        }
      }
    }

    return false;
  }

  public getConnectedPath(): Position[] {
    const path: Position[] = [];
    this.connectedCells.forEach(key => {
      const [row, col] = key.split(',').map(Number);
      path.push({ row, col });
    });
    return path;
  }

  private getKey(pos: Position): string {
    return `${pos.row},${pos.col}`;
  }

  private isValidPosition(pos: Position): boolean {
    return (
      pos.row >= 0 &&
      pos.row < this.level.size &&
      pos.col >= 0 &&
      pos.col < this.level.size
    );
  }
}

export const checkLevelConnection = (level: Level): boolean => {
  const checker = new ConnectionChecker(level);
  return checker.checkConnection();
};

export const getConnectedCells = (level: Level): Position[] => {
  const checker = new ConnectionChecker(level);
  checker.checkConnection();
  return checker.getConnectedPath();
};
