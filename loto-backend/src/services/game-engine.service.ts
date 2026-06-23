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
    const rowFilledColumns = this.assignColumnsToRows(columnFillCounts);

    const grid: (number | null)[][] = [
      new Array(9).fill(null),
      new Array(9).fill(null),
      new Array(9).fill(null),
    ];

    for (let col = 0; col < 9; col++) {
      const need = columnFillCounts[col];
      if (need === 0) continue;

      const pool = [...columnRanges[col]];
      const chosen = this.pickRandomUnique(pool, need).sort((a, b) => a - b);

      const rowsForColumn = [0, 1, 2].filter((row) => rowFilledColumns[row].includes(col));
      rowsForColumn.forEach((row, idx) => {
        grid[row][col] = chosen[idx];
      });
    }

    return grid.map((row, index) => ({
      row: index,
      cells: row.map((n) => n ?? 0),
      numbers: row.filter((n): n is number => n !== null),
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

  private assignColumnsToRows(columnFillCounts: number[]): number[][] {
    const remainingPerColumn = [...columnFillCounts];
    const rows: number[][] = [[], [], []];

    for (let row = 0; row < 3; row++) {
      const availableColumns = remainingPerColumn
        .map((count, col) => ({ col, count }))
        .filter((entry) => entry.count > 0)
        .map((entry) => entry.col);

      const chosen = this.pickRandomUnique(availableColumns, 5);
      chosen.forEach((col) => {
        rows[row].push(col);
        remainingPerColumn[col] -= 1;
      });
    }

    const totalAssigned = rows.reduce((sum, item) => sum + item.length, 0);
    if (totalAssigned !== 15 || remainingPerColumn.some((count) => count !== 0)) {
      return this.assignColumnsToRows(this.generateColumnFillCounts());
    }

    return rows.map((row) => row.sort((a, b) => a - b));
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

  private shuffleArray(array: number[]): number[] {
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
