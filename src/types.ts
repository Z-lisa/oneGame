export type Direction = 0 | 1 | 2 | 3; // 0=上, 1=右, 2=下, 3=左

export interface PipeType {
  id: string;
  name: string;
  connections: Direction[]; // 水管连接的方向
}

export interface Cell {
  row: number;
  col: number;
  pipeType: PipeType | null;
  rotation: number; // 0-3, 表示旋转次数
  isPath: boolean; // 是否在连通路径上
  isStart: boolean;
  isEnd: boolean;
}

export interface Level {
  grid: Cell[][];
  startPos: { row: number; col: number };
  endPos: { row: number; col: number };
  size: number;
}

export interface Position {
  row: number;
  col: number;
}

// 6种有效水管类型
export const PIPE_TYPES: PipeType[] = [
  { id: 'vertical', name: '上下通', connections: [0, 2] },
  { id: 'horizontal', name: '左右通', connections: [1, 3] },
  { id: 'top-right', name: '上右通', connections: [0, 1] },
  { id: 'right-bottom', name: '右下同', connections: [1, 2] },
  { id: 'bottom-left', name: '下左通', connections: [2, 3] },
  { id: 'left-top', name: '左上通', connections: [3, 0] },
];

export const EMPTY_PIPE: PipeType = {
  id: 'empty',
  name: '空',
  connections: [],
};

export const getOppositeDirection = (dir: Direction): Direction => {
  return ((dir + 2) % 4) as Direction;
};

export const getRotatedConnections = (connections: Direction[], rotation: number): Direction[] => {
  return connections.map(dir => ((dir + rotation) % 4) as Direction);
};

export const canConnect = (
  cell1: Cell,
  cell2: Cell,
  direction: Direction // direction是从cell1到cell2的方向
): boolean => {
  if (!cell1.pipeType || !cell2.pipeType) return false;
  if (cell1.pipeType.id === 'empty' || cell2.pipeType.id === 'empty') return false;

  const conn1 = getRotatedConnections(cell1.pipeType.connections, cell1.rotation);
  const conn2 = getRotatedConnections(cell2.pipeType.connections, cell2.rotation);
  const oppositeDir = getOppositeDirection(direction);

  return conn1.includes(direction) && conn2.includes(oppositeDir);
};

export const getAdjacentPosition = (pos: Position, dir: Direction): Position => {
  const deltas = [
    { row: -1, col: 0 }, // 上
    { row: 0, col: 1 },  // 右
    { row: 1, col: 0 },  // 下
    { row: 0, col: -1 }, // 左
  ];
  return {
    row: pos.row + deltas[dir].row,
    col: pos.col + deltas[dir].col,
  };
};

export const isValidPosition = (pos: Position, size: number): boolean => {
  return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size;
};
