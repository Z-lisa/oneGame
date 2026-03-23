import React, { useEffect, useRef, useCallback } from 'react';
import type { Cell, Position } from './types';
import { getRotatedConnections } from './types';

interface PipeGameCanvasProps {
  grid: Cell[][];
  size: number;
  connectedCells: Position[];
  onCellClick: (row: number, col: number) => void;
  cellSize?: number;
}

export const PipeGameCanvas: React.FC<PipeGameCanvasProps> = ({
  grid,
  size,
  connectedCells,
  onCellClick,
  cellSize = 60,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padding = 4;
  const canvasSize = size * cellSize + padding * 2;

  const connectedSet = React.useMemo(() => {
    return new Set(connectedCells.map(pos => `${pos.row},${pos.col}`));
  }, [connectedCells]);

  const drawRoundedRect = React.useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | number[]
  ) => {
    const radii = Array.isArray(radius) ? radius : [radius, radius, radius, radius];
    const [topLeft, topRight, bottomRight, bottomLeft] = radii;

    ctx.beginPath();
    ctx.moveTo(x + topLeft, y);
    ctx.lineTo(x + width - topRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
    ctx.lineTo(x + width, y + height - bottomRight);
    ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
    ctx.lineTo(x + bottomLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
    ctx.lineTo(x, y + topLeft);
    ctx.quadraticCurveTo(x, y, x + topLeft, y);
    ctx.closePath();
  }, []);

  const drawCell = useCallback((
    ctx: CanvasRenderingContext2D,
    cell: Cell,
    x: number,
    y: number,
    isConnected: boolean
  ) => {
    const centerX = x + cellSize / 2;
    const centerY = y + cellSize / 2;
    const pipeWidth = 12;
    const pipeRadius = pipeWidth / 2;
    const pipeLength = cellSize / 2 - 4;

    ctx.fillStyle = '#334155';
    drawRoundedRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, 8);
    ctx.fill();

    if (cell.isStart) {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', centerX, centerY);
    } else if (cell.isEnd) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', centerX, centerY);
    }

    if (!cell.pipeType || cell.pipeType.id === 'empty') return;

    const connections = getRotatedConnections(cell.pipeType.connections, cell.rotation);
    const pipeColor = isConnected ? '#06b6d4' : '#64748b';
    const glowColor = isConnected ? 'rgba(6, 182, 212, 0.5)' : 'rgba(100, 116, 139, 0.3)';

    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isConnected ? 10 : 5;

    connections.forEach(dir => {
      ctx.fillStyle = pipeColor;

      switch (dir) {
        case 0:
          drawRoundedRect(ctx, -pipeRadius, -pipeLength - pipeRadius, pipeWidth, pipeLength + pipeRadius, [pipeRadius, pipeRadius, 0, 0]);
          break;
        case 1:
          drawRoundedRect(ctx, 0, -pipeRadius, pipeLength + pipeRadius, pipeWidth, [0, pipeRadius, pipeRadius, 0]);
          break;
        case 2:
          drawRoundedRect(ctx, -pipeRadius, 0, pipeWidth, pipeLength + pipeRadius, [0, 0, pipeRadius, pipeRadius]);
          break;
        case 3:
          drawRoundedRect(ctx, -pipeLength - pipeRadius, -pipeRadius, pipeLength + pipeRadius, pipeWidth, [pipeRadius, 0, 0, pipeRadius]);
          break;
      }
      ctx.fill();
    });

    if (connections.length > 0) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = pipeColor;
      ctx.beginPath();
      ctx.arc(0, 0, pipeRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [cellSize, drawRoundedRect]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    ctx.fillStyle = '#1e293b';
    drawRoundedRect(ctx, 0, 0, canvasSize, canvasSize, 12);
    ctx.fill();

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cell = grid[row][col];
        const x = col * cellSize + padding;
        const y = row * cellSize + padding;
        const isConnected = connectedSet.has(`${row},${col}`);
        drawCell(ctx, cell, x, y, isConnected);
      }
    }

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;

    for (let i = 0; i <= size; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize + padding, padding);
      ctx.lineTo(i * cellSize + padding, size * cellSize + padding);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, i * cellSize + padding);
      ctx.lineTo(size * cellSize + padding, i * cellSize + padding);
      ctx.stroke();
    }
  }, [grid, size, cellSize, canvasSize, connectedSet, drawCell, drawRoundedRect]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX - padding;
    const y = (e.clientY - rect.top) * scaleY - padding;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row >= 0 && row < size && col >= 0 && col < size) {
      onCellClick(row, col);
    }
  }, [cellSize, size, onCellClick, padding]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGrid(ctx);
  }, [drawGrid]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      onClick={handleCanvasClick}
      className="cursor-pointer rounded-xl shadow-2xl transition-transform hover:scale-[1.02]"
      style={{
        maxWidth: '100%',
        height: 'auto',
      }}
    />
  );
};
