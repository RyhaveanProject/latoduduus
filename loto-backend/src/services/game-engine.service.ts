import { Injectable } from '@nestjs/common';

export interface LottoCardRow {
  row: number;
  numbers: number[];
  cells: number[];
}

export interface GameTicketLike {
  card: LottoCardRow[];
  markedNumbers: number[];
}

@Injectable()
export class GameEngineService {
  generateCard(): LottoCardRow[] {
    const columnRanges: number[][] = [];
    for (let col = 0; col < 9; col++) {
      const min = col === 0 ? 1 : col * 10;
      const max = col === 8 ? 90 : col * 10 + 9;
      const range: number[] = [];
      for (let n = min; n <= max; n++) range.push(n);
      columnRanges.push(range);
    }

    const columnFillCounts = this.generateColumnFillCounts();
    const mask = this.buildMask(columnFillCounts);

    const grid: number[][] = [
      new Array(9).fill(0),
      new Array(9).fill(0),
      new Array(9).fill(0),
    ];

    for (let col = 0; col < 9; col++) {
      const selectedRows = [0, 1, 2].filter((row) => mask[row][col] === 1);
      const chosen = this.pickRandomUnique(columnRanges[col], selectedRows.length).sort((a, b) => a - b);

      selectedRows.forEach((row, index) => {
        grid[row][col] = chosen[index];
      });
    }

    return grid.map((row, index) => ({
      row: index,
      cells: row,
      numbers: row.filter((n) => n !== 0),
    }));
  }

  private generateColumnFillCounts(): number[] {
    const counts = new Array(9).fill(1);
    let remaining = 6;
    while (remaining > 0) {
      const col = Math.floor(Math.random() * 9);
      if (counts[col] < 3) {
        counts[col] += 1;
        remaining -= 1;
      }
    }
    return counts;
  }

  private buildMask(columnFillCounts: number[]): number[][] {
    const matrix = [
      new Array(9).fill(0),
      new Array(9).fill(0),
      new Array(9).fill(0),
    ];

    const success = this.assignColumnMask(0, columnFillCounts, [0, 0, 0], matrix);
    if (!success) {
      return this.buildMask(this.generateColumnFillCounts());
    }

    return matrix;
  }

  private assignColumnMask(
    columnIndex: number,
    columnFillCounts: number[],
    rowFillCounts: number[],
    matrix: number[][],
  ): boolean {
    if (columnIndex === columnFillCounts.length) {
      return rowFillCounts.every((count) => count === 5);
    }

    const need = columnFillCounts[columnIndex];
    const combinations = this.shuffleArray(this.rowCombinations(need));
    const remainingColumns = columnFillCounts.length - columnIndex - 1;

    for (const rows of combinations) {
      const nextCounts = [...rowFillCounts];
      let valid = true;

      for (const row of rows) {
        nextCounts[row] += 1;
        if (nextCounts[row] > 5) {
          valid = false;
          break;
        }
      }

      if (!valid) continue;

      if (nextCounts.some((count) => 5 - count > remainingColumns)) {
        continue;
      }

      rows.forEach((row) => {
        matrix[row][columnIndex] = 1;
      });

      if (this.assignColumnMask(columnIndex + 1, columnFillCounts, nextCounts, matrix)) {
        return true;
      }

      rows.forEach((row) => {
        matrix[row][columnIndex] = 0;
      });
    }

    return false;
  }

  private rowCombinations(count: number): number[][] {
    const rows = [0, 1, 2];
    if (count === 1) return rows.map((row) => [row]);
    if (count === 2) return [[0, 1], [0, 2], [1, 2]];
    return [[0, 1, 2]];
  }

  private pickRandomUnique<T>(items: T[], count: number): T[] {
    const pool = [...items];
    const result: T[] = [];
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }
    return result;
  }

  generateDrawSequence(): number[] {
    const numbers = Array.from({ length: 90 }, (_, i) => i + 1);
    return this.shuffleArray(numbers);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  canMarkNumber(ticket: GameTicketLike, drawnNumber: number): boolean {
    return ticket.card.some((row) => row.numbers.includes(drawnNumber)) && !ticket.markedNumbers.includes(drawnNumber);
  }

  markNumber(ticket: GameTicketLike, drawnNumber: number): { marked: boolean; markedNumbers: number[] } {
    if (!this.canMarkNumber(ticket, drawnNumber)) {
      return { marked: false, markedNumbers: [...ticket.markedNumbers] };
    }

    return {
      marked: true,
      markedNumbers: [...ticket.markedNumbers, drawnNumber].sort((a, b) => a - b),
    };
  }

  isFullCardCompleted(ticket: GameTicketLike): boolean {
    const allNumbers = ticket.card.flatMap((row) => row.numbers);
    return allNumbers.every((num) => ticket.markedNumbers.includes(num));
  }

  getCompletionPercentage(ticket: GameTicketLike): number {
    const totalNumbers = ticket.card.flatMap((row) => row.numbers).length;
    const marked = ticket.markedNumbers.length;
    return Math.round((marked / totalNumbers) * 100);
  }
}
