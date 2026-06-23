"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngineService = void 0;
const common_1 = require("@nestjs/common");
let GameEngineService = class GameEngineService {
    /**
     * Generate a real Russian Lotto card (билет)
     * - 3 rows x 9 columns
     * - 5 numbers per row, 4 blank cells per row (15 numbers total)
     * - Column 1: 1-9, Columns 2-8: (col)*10 to (col)*10+9, Column 9: 80-90
     * - No number repeats anywhere on the card
     */
    generateCard() {
        const columnRanges = [];
        for (let col = 0; col < 9; col++) {
            const min = col === 0 ? 1 : col * 10;
            const max = col === 8 ? 90 : col * 10 + 9;
            const range = [];
            for (let n = min; n <= max; n++)
                range.push(n);
            columnRanges.push(range);
        }
        const columnFillCounts = this.generateColumnFillCounts();
        const rowFilledColumns = this.assignColumnsToRows(columnFillCounts);
        const grid = [
            new Array(9).fill(null),
            new Array(9).fill(null),
            new Array(9).fill(null),
        ];
        for (let col = 0; col < 9; col++) {
            const need = columnFillCounts[col];
            if (need === 0)
                continue;
            const pool = [...columnRanges[col]];
            const chosen = this.pickRandomUnique(pool, need).sort((a, b) => a - b);
            const rowsForColumn = [0, 1, 2].filter((row) => rowFilledColumns[row].includes(col));
            rowsForColumn.forEach((row, idx) => {
                grid[row][col] = chosen[idx];
            });
        }
        return grid.map((row, index) => ({
            row: index,
            numbers: row.filter((n) => n !== null),
        }));
    }
    /**
     * Distribute 15 filled cells across 9 columns (1-3 per column).
     */
    generateColumnFillCounts() {
        const counts = new Array(9).fill(1); // 9 filled
        let remaining = 15 - 9; // 6 more to distribute, capped at 3 per column
        while (remaining > 0) {
            const col = Math.floor(Math.random() * 9);
            if (counts[col] < 3) {
                counts[col] += 1;
                remaining -= 1;
            }
        }
        return counts;
    }
    /**
     * Assign which columns are filled in each row (5 per row),
     * respecting each column's total fill count.
     */
    assignColumnsToRows(columnFillCounts) {
        const remainingPerColumn = [...columnFillCounts];
        const rows = [[], [], []];
        for (let row = 0; row < 3; row++) {
            const availableColumns = remainingPerColumn
                .map((count, col) => ({ col, count }))
                .filter((c) => c.count > 0)
                .map((c) => c.col);
            const chosen = this.pickRandomUnique(availableColumns, 5);
            chosen.forEach((col) => {
                rows[row].push(col);
                remainingPerColumn[col] -= 1;
            });
        }
        const totalAssigned = rows.reduce((sum, r) => sum + r.length, 0);
        if (totalAssigned !== 15 || remainingPerColumn.some((c) => c !== 0)) {
            // Rare edge case where greedy assignment can't balance perfectly; retry.
            return this.assignColumnsToRows(this.generateColumnFillCounts());
        }
        return rows.map((row) => row.sort((a, b) => a - b));
    }
    /**
     * Pick `count` unique random items from an array.
     */
    pickRandomUnique(items, count) {
        const pool = [...items];
        const result = [];
        const n = Math.min(count, pool.length);
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            result.push(pool.splice(idx, 1)[0]);
        }
        return result;
    }
    /**
     * Draw random numbers for the game
     * Returns array of 90 numbers shuffled
     */
    generateDrawSequence() {
        const numbers = Array.from({ length: 90 }, (_, i) => i + 1);
        return this.shuffleArray(numbers);
    }
    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    /**
     * Mark a number on the card
     */
    markNumber(ticket, drawnNumber) {
        const markedNumbers = [...ticket.markedNumbers];
        // Check if number exists in card
        const numberExists = ticket.card.some((row) => row.numbers.includes(drawnNumber));
        if (numberExists && !markedNumbers.includes(drawnNumber)) {
            markedNumbers.push(drawnNumber);
            return { marked: true, markedNumbers };
        }
        return { marked: false, markedNumbers };
    }
    /**
     * Check if first row is completed
     */
    isFirstRowCompleted(ticket) {
        const firstRow = ticket.card[0];
        return firstRow.numbers.every((num) => ticket.markedNumbers.includes(num));
    }
    /**
     * Check if any row is completed
     */
    isAnyRowCompleted(ticket) {
        return ticket.card.some((row) => row.numbers.every((num) => ticket.markedNumbers.includes(num)));
    }
    /**
     * Check if full card is completed
     */
    isFullCardCompleted(ticket) {
        const allNumbers = ticket.card.flatMap((row) => row.numbers);
        return allNumbers.every((num) => ticket.markedNumbers.includes(num));
    }
    /**
     * Get completion status of all rows
     */
    getRowStatus(ticket) {
        return ticket.card.map((row) => row.numbers.every((num) => ticket.markedNumbers.includes(num)));
    }
    /**
     * Calculate prize distribution for multiple winners
     */
    distributePrizes(totalPool, winnerCounts) {
        const stage1Prize = winnerCounts.stage1 > 0 ? totalPool * 0.15 / winnerCounts.stage1 : 0;
        const stage2Prize = winnerCounts.stage2 > 0 ? totalPool * 0.35 / winnerCounts.stage2 : 0;
        const stage3Prize = winnerCounts.stage3 > 0 ? totalPool * 0.50 / winnerCounts.stage3 : 0;
        return {
            stage1Prize: Math.floor(stage1Prize),
            stage2Prize: Math.floor(stage2Prize),
            stage3Prize: Math.floor(stage3Prize),
        };
    }
    /**
     * Validate ticket structure
     */
    validateTicket(ticket) {
        if (!ticket.card || !Array.isArray(ticket.card)) {
            return false;
        }
        if (ticket.card.length !== 3) {
            return false;
        }
        return ticket.card.every((row) => row.row !== undefined &&
            Array.isArray(row.numbers) &&
            row.numbers.length === 5 &&
            row.numbers.every((num) => typeof num === 'number' && num >= 1 && num <= 90));
    }
    /**
     * Get card completion percentage
     */
    getCompletionPercentage(ticket) {
        const totalNumbers = 15;
        const marked = ticket.markedNumbers.length;
        return Math.round((marked / totalNumbers) * 100);
    }
};
exports.GameEngineService = GameEngineService;
exports.GameEngineService = GameEngineService = __decorate([
    (0, common_1.Injectable)()
], GameEngineService);
//# sourceMappingURL=game-engine.service.js.map